// 비밀 퀘스트 (2026-10-24 사용자 요청: 캐릭터가 건네는 숨은 미션, 내용은 직접 쓰거나 AI로 자동 제작).
// 캐릭터 카드의 한 단계이고, 친밀도가 문턱을 넘으면 캐릭터가 대화 중에 부탁(offer)을 건네며,
// 이야기 정리 단계에서 "건넸는지·달성했는지"를 판정해 진행을 기록한다. 순수 함수만 둔다 — 모델이 돌려준 판정은
// 여기서 한 번 더 제한한다(친밀도 문턱 아래의 판정은 무시, 건네기 전에는 달성할 수 없다)

export type Quest = {
  // 유저에게 보이는 이름 (건넨 뒤에만 보인다)
  title: string;
  // 캐릭터가 어떤 부탁을 어떻게 건네는지 — 모델이 이 뜻으로 말을 꺼낸다
  offer: string;
  // 달성 조건: 유저가 대화에서 무엇을 하면 해낸 것으로 보는지. 판정 모델만 읽고 캐릭터에게는 알리지 않는다
  objective: string;
  // 달성했을 때 보여 줄 장면·변화(캐릭터의 반응). 비어 있어도 된다
  reward: string;
  // 이 친밀도(0~100) 이상이 돼야 캐릭터가 부탁을 꺼낼 수 있다
  unlockAt: number;
};

export const EMPTY_QUEST: Quest = { title: '', offer: '', objective: '', reward: '', unlockAt: 30 };

export const QUEST_TITLE_MAX = 30;
// 공식 캐릭터에서 달성하면 주는 코레딧 (계정×캐릭터당 한 번). 유저가 만든 캐릭터는 보상 장면만 있다 — 직접 만들어 깨는 방식의 코레딧 파밍을 막는다
export const QUEST_REWARD_CREDITS = 100;

export type QuestState = { status: 'offered' | 'done'; at: string; staged?: boolean } | null;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// 퀘스트로 쓸 수 있나: 제목·부탁·달성 조건이 모두 있어야 한다(보상 장면은 선택)
export function isComplete(q: Quest): boolean {
  return q.title !== '' && q.offer !== '' && q.objective !== '';
}

export function isEmptyQuest(q: Quest): boolean {
  return q.title === '' && q.offer === '' && q.objective === '' && q.reward === '' && q.unlockAt === EMPTY_QUEST.unlockAt;
}

// 저장된 값(Character.quest JSON)을 읽는다. 모양이 틀렸거나 덜 쓴 퀘스트는 없는 것으로 본다
export function parseQuest(raw: unknown): Quest | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const unlockAt = typeof o.unlockAt === 'number' && Number.isFinite(o.unlockAt) ? Math.max(0, Math.min(100, Math.round(o.unlockAt))) : EMPTY_QUEST.unlockAt;
  const quest: Quest = {
    title: str(o.title, QUEST_TITLE_MAX),
    offer: str(o.offer, 4000),
    objective: str(o.objective, 4000),
    reward: str(o.reward, 4000),
    unlockAt,
  };
  return isComplete(quest) ? quest : null;
}

export function parseQuestState(raw: unknown): QuestState {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.status !== 'offered' && o.status !== 'done') return null;
  return { status: o.status, at: typeof o.at === 'string' ? o.at : '', ...(o.staged === true ? { staged: true } : {}) };
}

// 이 대화에서 퀘스트가 열렸나 (친밀도가 문턱 이상)
export const unlocked = (q: Quest, value: number) => value >= q.unlockAt;

// 캐릭터에게 주는 지시 (directorNote 끝에 붙는다). 달성 조건(objective)은 절대 넣지 않는다 — 캐릭터가 유저를 그쪽으로 몰고 가면 판정이 무의미해진다.
// 아무 말도 붙이지 않을 때는 null
export function questNote(q: Quest, value: number, state: QuestState): string | null {
  if (state?.status === 'done') {
    // 달성한 직후 첫 답에서만 보상 장면을 보여 준다 (그 뒤에는 이미 일어난 일로 자연스럽게)
    if (state.staged || q.reward === '') return null;
    return [
      '[이야기 속 부탁이 이루어졌다] 유저가 네 부탁에 제대로 응했다. 이번 답에서 이 변화를 네 말투 그대로 보여 준다:',
      q.reward,
      '- 게임·퀘스트·보상 같은 말은 쓰지 않는다. 이야기 속 마음의 변화로만 드러낸다',
    ].join('\n');
  }
  if (!unlocked(q, value)) return null;
  if (state?.status === 'offered') {
    return [
      '[이미 건넨 부탁] 네가 유저에게 이미 이 부탁을 했다. 유저가 응하면 자연스럽게 이어 가고, 같은 부탁을 되풀이해 조르지 않는다:',
      q.offer,
      '- 퀘스트·보상·달성 조건 같은 말은 쓰지 않는다',
    ].join('\n');
  }
  return [
    '[때가 됐다] 두 사람이 충분히 가까워져 마음속에 둔 부탁을 꺼낼 수 있다. 대화 흐름에 맞는 순간에 한 번만, 네 말투 그대로 건넨다:',
    q.offer,
    '- 억지로 끼워 넣지 않는다. 지금 이야기와 이어지지 않으면 조금 더 기다린다',
    '- 유저가 응하지 않아도 강요하지 않고, 거절하면 존중하고 넘어간다',
    '- 퀘스트·보상·달성 조건 같은 말은 쓰지 않는다',
  ].join('\n');
}

// 이야기 정리 때 판정 모델에게 보여 줄 것. 건네기 전에는 "건넸는지"만, 건넨 뒤에는 달성 조건도 함께 본다
export type QuestCheck = { offered: boolean; done: boolean };

// 판정 결과 → 다음 상태.
//  - 친밀도가 문턱 아래였으면 판정을 무시한다 (그때는 부탁이 꺼내질 수 없었다)
//  - 건넨 적이 없으면(이번에 건넨 것도 아니면) 달성할 수 없다
//  - 이미 달성했으면 그대로
// completedNow: 이번 정리에서 처음 달성했다 (보상을 줄 때)
export function nextQuestState(
  q: Quest,
  state: QuestState,
  valueBefore: number,
  check: QuestCheck,
  now: Date,
): { state: QuestState; completedNow: boolean } {
  if (state?.status === 'done') return { state, completedNow: false };
  if (!unlocked(q, valueBefore)) return { state, completedNow: false };
  const offered = state?.status === 'offered' || check.offered;
  if (!offered) return { state, completedNow: false };
  if (check.done) return { state: { status: 'done', at: now.toISOString() }, completedNow: true };
  if (state?.status === 'offered') return { state, completedNow: false };
  return { state: { status: 'offered', at: now.toISOString() }, completedNow: false };
}

// 보상 장면을 한 번 보여 줬다고 표시
export const stage = (state: QuestState): QuestState => (state?.status === 'done' ? { ...state, staged: true } : state);
