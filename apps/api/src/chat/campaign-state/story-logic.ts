// 캠페인 이야기 상태(요약·친밀도 자동 변화·복선) 갱신 규칙. 순수 함수만 둔다 — 모델이 돌려준 값을 믿고 그대로
// 쓰지 않고, 한 번에 바뀌는 폭과 개수를 여기서 한 번 더 제한한다 (기획서 §4.2: 숫자가 대사를 바꾸는 만큼 함부로 움직이면 안 된다)

export type Hook = { id: string; text: string };
export type LogEntry = { at: string; delta: number; value: number; reason: string };

export type StoryState = {
  brief: string;
  openHooks: Hook[];
  closedEvents: string[];
  relationshipLog: LogEntry[];
};

export const EMPTY_STORY: StoryState = { brief: '', openHooks: [], closedEvents: [], relationshipLog: [] };

export const MAX_OPEN_HOOKS = 5;
export const MAX_CLOSED_EVENTS = 20;
export const MAX_LOG = 10;
// 한 번 정리할 때 오르내릴 수 있는 폭 (FastAPI도 같은 값으로 자른다)
export const MAX_DELTA = 8;
// 비슷한 복선으로 보는 기준 (글자 쌍 겹침 Dice 계수)
const SAME_HOOK = 0.45;

export type DigestResult = {
  brief: string;
  relationDelta: { delta: number; reason: string }[];
  hooksOpen: { text: string }[];
  hooksClosed: { id: string }[];
};

function bigrams(text: string): Set<string> {
  const letters = text.replace(/[^가-힣a-zA-Z0-9]/g, '');
  const out = new Set<string>();
  for (let i = 0; i < letters.length - 1; i++) out.add(letters.slice(i, i + 2));
  return out;
}

// 표현만 다른 같은 복선을 걸러 내는 용도. 조사·어미가 달라도 낱말 조각이 겹치면 비슷하다고 본다
export function similar(a: string, b: string): boolean {
  const x = bigrams(a);
  const y = bigrams(b);
  if (x.size === 0 || y.size === 0) return false;
  let hit = 0;
  for (const g of x) if (y.has(g)) hit++;
  return (2 * hit) / (x.size + y.size) >= SAME_HOOK;
}

export const clampValue = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function applyDigest(
  story: StoryState,
  relationshipValue: number,
  auto: boolean,
  result: DigestResult,
  now: Date,
  newId: () => string,
): { story: StoryState; relationshipValue: number; relationshipReason: string | null } {
  // 친밀도: 자동 변화를 껐으면 값은 두고, 켰으면 폭을 제한해 반영한다
  const raw = result.relationDelta[0];
  const delta = raw ? Math.max(-MAX_DELTA, Math.min(MAX_DELTA, Math.trunc(raw.delta))) : 0;
  const reason = raw?.reason?.trim() ? raw.reason.trim().slice(0, 80) : null;
  let value = relationshipValue;
  const log = [...story.relationshipLog];
  if (auto && delta !== 0) {
    value = clampValue(relationshipValue + delta);
    // 이미 0이나 100이라 값이 안 바뀌면 기록하지 않는다
    if (value !== relationshipValue) {
      log.push({ at: now.toISOString(), delta: value - relationshipValue, value, reason: reason ?? '' });
    }
  }

  // 복선: 회수된 것은 "끝난 일"로 옮기고, 새 것은 이미 있는 것·끝난 것과 비슷하면 버린다
  const closedIds = new Set(result.hooksClosed.map((h) => h.id));
  const closedNow = story.openHooks.filter((h) => closedIds.has(h.id)).map((h) => h.text);
  let open = story.openHooks.filter((h) => !closedIds.has(h.id));
  const closed = [...story.closedEvents, ...closedNow];
  for (const hook of result.hooksOpen) {
    const text = hook.text.trim().slice(0, 80);
    if (text === '') continue;
    if ([...open.map((h) => h.text), ...closed].some((t) => similar(t, text))) continue;
    open = [...open, { id: newId(), text }];
  }

  return {
    story: {
      brief: result.brief.trim() ? result.brief.trim().slice(0, 400) : story.brief,
      openHooks: open.slice(-MAX_OPEN_HOOKS),
      closedEvents: closed.slice(-MAX_CLOSED_EVENTS),
      relationshipLog: log.slice(-MAX_LOG),
    },
    relationshipValue: value,
    relationshipReason: auto ? reason : null,
  };
}
