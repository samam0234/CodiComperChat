// 엑스트라 등장 조건 판정. 모델에게 "알아서 등장시켜"라고 맡기면 작은 모델은 아무 때나 끌어들이거나
// 없는 사실을 지어낸다. 그래서 서버가 조건 단어로 먼저 고르고, 고른 엑스트라만 정보를 넘긴다.

export const TRIGGERS = ['relation', 'situation', 'place'] as const;
export type Trigger = (typeof TRIGGERS)[number];

export const TRIGGER_LABELS: Record<Trigger, string> = {
  relation: '인물 관계',
  situation: '상황',
  place: '장소',
};

export type ExtraFields = {
  name: string;
  summary: string;
  personality: string;
  relation: string;
  situation: string;
  place: string;
};

// 한 턴에 넘기는 엑스트라 수. 많으면 장면이 산만해지고 컨텍스트를 잡아먹는다
export const MAX_ACTIVE_PER_TURN = 2;
// 조건 단어를 찾는 범위: 이번 유저 말 + 최근 몇 턴
const RECENT_TURNS = 3;
// 한 번 등장한 엑스트라는 이 턴 수 안에서는 이름만으로도 계속 이어서 나온다(갑자기 사라지지 않게)
const CONTINUITY_TURNS = 4;

// 낱말 끝에 붙은 조사 하나를 뗀다 ("도서관에서" → "도서관")
const JOSA =
  /(에서는|에서|에게|한테|으로|이랑|하고|까지|부터|처럼|보다|이나|이라|은|는|이|가|을|를|에|의|와|과|도|만|로|랑|나)$/;

// 어디에나 나오는 말은 조건 단어로 쓰지 않는다 (아무 때나 등장하지 않게)
const STOP = new Set([
  '그리고', '그런', '이런', '저런', '하는', '있는', '없는', '되는', '같은', '때', '때문', '상황', '장소',
  '관계', '사람', '유저', '주인공', '캐릭터', '같이', '함께', '자주', '가끔', '항상', '주로', '보통',
  '곳', '것', '중', '앞', '뒤', '안', '밖', '근처', '주변', '이야기', '얘기', '대화', '사이', '정도',
  '조금', '많이', '아주', '매우', '서로', '나', '너', '우리', '저', '제', '내', '그', '이', '저기', '여기',
]);

const MAX_KEYWORDS = 8;

export function keywords(text: string, exclude: string[] = []): string[] {
  const out: string[] = [];
  const excluded = new Set(exclude.filter(Boolean));
  for (const raw of text.split(/[\s,.·/!?~()[\]'"“”‘’…:;]+/)) {
    let word = raw.trim();
    if (word.length > 2) word = word.replace(JOSA, '');
    if (word.length < 2 || STOP.has(word) || excluded.has(word)) continue;
    if (!out.includes(word)) out.push(word);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}

// 조건별 단어. 인물 관계에서는 주인공 캐릭터 이름을 뺀다 — 주인공 이름은 대화에 늘 나오기 때문
export function triggerKeywords(extra: ExtraFields, characterName: string): Record<Trigger, string[]> {
  return {
    relation: keywords(extra.relation, [characterName, extra.name]),
    situation: keywords(extra.situation, [characterName, extra.name]),
    place: keywords(extra.place, [characterName, extra.name]),
  };
}

export type AppliedExtra = { id: string; triggers: Trigger[]; fields: ExtraFields };

// 왜 이번 턴에 나오는지. FastAPI가 이것으로 "이번 답에서 할 일"(이름으로 소개 / 장면에 등장 / 이어 가기)을 정한다
export type Cue = 'name' | Trigger | 'continuity';

export type ActiveExtra = ExtraFields & { reason: string; cue: Cue };

type Turn = { role: 'user' | 'character'; text: string };

// 이번 턴에 넘길 엑스트라를 고른다. 이름이 나오면 조건과 상관없이 등장한다(유저가 직접 부른 것)
export function selectActive(
  applied: AppliedExtra[],
  history: Turn[],
  userTurn: string,
  characterName: string,
): ActiveExtra[] {
  const recent = [userTurn, ...history.slice(-RECENT_TURNS).map((t) => t.text)].join('\n');
  const continuity = history.slice(-CONTINUITY_TURNS).map((t) => t.text).join('\n');
  const picked: { extra: AppliedExtra; reason: string; cue: Cue; score: number }[] = [];

  for (const extra of applied) {
    const name = extra.fields.name;
    if (name && userTurn.includes(name)) {
      picked.push({ extra, reason: `유저가 '${name}'을(를) 언급했다`, cue: 'name', score: 3 });
      continue;
    }
    const words = triggerKeywords(extra.fields, characterName);
    // 이번 유저 말에 걸린 조건을 먼저 본다 — 앞 턴에 남은 단어 때문에 엉뚱한 등장 방식이 고르지 않게
    const find = (text: string) =>
      extra.triggers
        .map((t) => ({ t, word: words[t].find((w) => text.includes(w)) }))
        .find((h) => h.word !== undefined);
    const now = find(userTurn);
    const hit = now ?? find(recent);
    if (hit) {
      picked.push({
        extra,
        reason: `${TRIGGER_LABELS[hit.t]} 조건: '${hit.word}' 이야기가 나왔다`,
        cue: hit.t,
        score: now ? 2.5 : 2,
      });
      continue;
    }
    if (name && continuity.includes(name)) {
      picked.push({ extra, reason: `방금 장면에 '${name}'이(가) 등장해 있다`, cue: 'continuity', score: 1 });
    }
  }

  return picked
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ACTIVE_PER_TURN)
    .map(({ extra, reason, cue }) => ({ ...extra.fields, reason, cue }));
}
