// 공방 카드(기획서 §4.1 7층)의 웹 쪽 모양. 정본 검증은 Nest(apps/api/src/studio/card.ts)가 하고,
// 여기 상한은 입력칸이 미리 막아 주는 용도다. 둘이 어긋나면 Nest가 어느 칸인지 알려 주며 거절한다.

export type Role = "companion" | "rival" | "client" | "guide" | "wildcard";
export type Honorific = "banmal" | "jondae" | "mix";

export type Card = {
  identity: { name: string; oneLiner: string; role: Role | ""; occupation: string; apparentAge: string; tags: string[] };
  appearance: { description: string; keywords: string[] };
  personality: {
    warmth: number;
    directness: number;
    impulse: number;
    protectiveness: number;
    honorific: Honorific | "";
    addressing: string;
    habits: string[];
    forbidden: string[];
    summary: string;
  };
  campaign: { scene: string; knows: string; unknown: string; goal: string; stance: string; conflictSeed: string };
  boundary: { secret: string; unlockCondition: string; neverDo: string[]; breakers: string };
  greeting: { firstMessage: string; alternates: string[]; examples: { user: string; character: string }[] };
  lore: { world: string; person: string; taboo: string; extra: { title: string; text: string }[] };
  // 비밀 퀘스트(선택): 친밀도가 unlockAt을 넘으면 캐릭터가 offer를 건네고, objective를 해내면 달성 (정본: apps/api/src/quests/quest.ts)
  quest: Quest;
};

export type Quest = { title: string; offer: string; objective: string; reward: string; unlockAt: number };
export const QUEST_TITLE_MAX = 30;

export type StepKey = keyof Card;

export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: "PUBLIC", label: "공개", hint: "홈·인기 목록에 올라가 누구나 대화할 수 있어요." },
  { value: "UNLISTED", label: "링크 공개", hint: "목록에는 나오지 않고, 링크를 받은 사람만 대화할 수 있어요." },
  { value: "PRIVATE", label: "비공개", hint: "나만 대화할 수 있어요." },
];

export type Readiness = {
  steps: { key: StepKey; label: string; required: boolean; missing: string[]; done: boolean }[];
  warnings: string[];
  tokens: number;
  complete: boolean;
};

export type Turn = { role: "user" | "character"; text: string };

export type Verdict = {
  passed: boolean;
  toneBroken: boolean;
  overExplaining: boolean;
  metaLeak: boolean;
  secretLeak: boolean;
  inventedFacts: boolean;
  notes: string[];
  at: string;
};

export type TestState = {
  turns: Turn[];
  turnsUsed: number;
  turnsTotal: number;
  verdict: Verdict | null;
  passed: boolean;
  stale: boolean;
};

export type DraftView = {
  id: string;
  // 지금 적용되는 요금 등급과 긴 글 칸 글자 수 배수(무료 1, 프로 3)
  plan: "FREE" | "PRO";
  limitMultiplier: number;
  card: Card;
  test: TestState;
  characterId: string | null;
  published: boolean;
  visibility: Visibility;
  hasPortrait: boolean;
  // 초상 검수: APPROVED(남에게 보임) / PENDING(운영자 확인 중, 남에게 안 보임) / REJECTED(반려, 사유는 note)
  portraitReview: PortraitReview | null;
  portraitReviewNote: string | null;
  // 운영자가 내렸으면 시각과 사유 (다시 발행할 수 없다)
  takedown: { at: string; reason: string } | null;
  updatedAt: string;
  readiness: Readiness;
};

export type PortraitReview = "APPROVED" | "PENDING" | "REJECTED";

export type DraftSummary = {
  id: string;
  name: string;
  oneLiner: string;
  published: boolean;
  takenDown?: boolean;
  hasPortrait?: boolean;
  visibility: Visibility;
  characterId: string | null;
  updatedAt: string;
  complete: boolean;
};

// 무료 기준 글자 수 상한. 서버(apps/api/src/studio/card.ts)와 같아야 하고, 정본은 서버다
const BASE_LIMITS = {
  name: 20,
  oneLiner: 40,
  short: 40,
  tag: 12,
  tags: 5,
  keyword: 12,
  keywords: 8,
  description: 300,
  addressing: 120,
  item: 80,
  habits: 3,
  forbidden: 5,
  summary: 200,
  field: 400,
  neverDo: 6,
  firstMessage: 400,
  alternates: 2,
  examples: 2,
  exampleLine: 160,
  lore: 500,
  extra: 5,
  extraTitle: 30,
} as const;

// 프로 등급은 "이름·호칭을 뺀 긴 글 칸"만 배수로 늘어난다 (서버의 limitsFor와 같은 칸)
export function limitsFor(multiplier: number) {
  return {
    ...BASE_LIMITS,
    description: BASE_LIMITS.description * multiplier,
    summary: BASE_LIMITS.summary * multiplier,
    field: BASE_LIMITS.field * multiplier,
    firstMessage: BASE_LIMITS.firstMessage * multiplier,
    lore: BASE_LIMITS.lore * multiplier,
  };
}

export const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  { value: "companion", label: "동료", hint: "곁에서 함께 움직인다" },
  { value: "rival", label: "라이벌", hint: "부딪히며 자극한다" },
  { value: "client", label: "의뢰인", hint: "일을 맡기고 결과를 기다린다" },
  { value: "guide", label: "가이드", hint: "길을 알려 주지만 다 말하지 않는다" },
  { value: "wildcard", label: "와일드카드", hint: "어느 편일지 모른다" },
];

export const HONORIFIC_OPTIONS: { value: Honorific; label: string }[] = [
  { value: "jondae", label: "존댓말" },
  { value: "banmal", label: "반말" },
  { value: "mix", label: "섞어 씀" },
];

// 기획서 §4.1 "성격 축(온기, 직설, 충동, 보호)". 양 끝 이름을 같이 보여 숫자가 무슨 뜻인지 알게 한다
export const AXES: { key: "warmth" | "directness" | "impulse" | "protectiveness"; label: string; low: string; high: string }[] = [
  { key: "warmth", label: "온기", low: "냉정", high: "다정" },
  { key: "directness", label: "직설", low: "돌려 말함", high: "직설적" },
  { key: "impulse", label: "충동", low: "계획적", high: "충동적" },
  { key: "protectiveness", label: "보호", low: "거리를 둠", high: "지켜 줌" },
];

// 판정 항목의 화면 이름
export const VERDICT_LABELS: { key: "toneBroken" | "overExplaining" | "metaLeak" | "secretLeak" | "inventedFacts"; label: string }[] = [
  { key: "toneBroken", label: "말투·성격 붕괴" },
  { key: "overExplaining", label: "설명충(강의식 답)" },
  { key: "metaLeak", label: "메타 발언(AI·설정 언급)" },
  { key: "secretLeak", label: "비밀 누설" },
  { key: "inventedFacts", label: "설정에 없는 개인사 지어냄" },
];
