import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';

// 공방 카드 = 기획서 §4.1의 7층. "프롬프트 메모장"이 아니라 구조화된 필드다.
// 초안 저장은 언제든(빈칸 허용), 발행은 필수 단계가 차 있어야 한다 (§6.1)

export const ROLES = ['companion', 'rival', 'client', 'guide', 'wildcard'] as const;
export const HONORIFICS = ['banmal', 'jondae', 'mix'] as const;
export type Role = (typeof ROLES)[number];
export type Honorific = (typeof HONORIFICS)[number];

export type Card = {
  identity: {
    name: string;
    oneLiner: string;
    role: Role | '';
    occupation: string;
    apparentAge: string;
    tags: string[];
  };
  appearance: { description: string; keywords: string[] };
  personality: {
    warmth: number;
    directness: number;
    impulse: number;
    protectiveness: number;
    honorific: Honorific | '';
    addressing: string;
    habits: string[];
    forbidden: string[];
    summary: string;
  };
  campaign: {
    scene: string;
    knows: string;
    unknown: string;
    goal: string;
    stance: string;
    conflictSeed: string;
  };
  boundary: {
    secret: string;
    unlockCondition: string;
    neverDo: string[];
    breakers: string;
  };
  greeting: {
    firstMessage: string;
    alternates: string[];
    examples: { user: string; character: string }[];
  };
  lore: {
    world: string;
    person: string;
    taboo: string;
    extra: { title: string; text: string }[];
  };
};

// 글자 수 상한. 길면 매 턴 컨텍스트를 잡아먹어 최근 대화가 밀려난다 (§6.3)
const L = {
  name: 20,
  oneLiner: 40, // §6.2 "한 줄 소개 40자 제한"
  short: 40,
  tag: 12,
  tags: 5,
  keyword: 12,
  keywords: 8,
  description: 300,
  addressing: 120,
  item: 80,
  habits: 3, // §4.1 "습관 3개"
  forbidden: 5,
  summary: 200,
  field: 400,
  neverDo: 6,
  firstMessage: 400,
  alternates: 2, // §4.1 "대체 인사 2개"
  examples: 2, // §4.1 "짧은 예시 대화 2세트"
  exampleLine: 160,
  lore: 500,
  extra: 5,
  extraTitle: 30,
} as const;

export const EMPTY_CARD: Card = {
  identity: { name: '', oneLiner: '', role: '', occupation: '', apparentAge: '', tags: [] },
  appearance: { description: '', keywords: [] },
  personality: {
    warmth: 50,
    directness: 50,
    impulse: 50,
    protectiveness: 50,
    honorific: '',
    addressing: '',
    habits: [],
    forbidden: [],
    summary: '',
  },
  campaign: { scene: '', knows: '', unknown: '', goal: '', stance: '', conflictSeed: '' },
  boundary: { secret: '', unlockCondition: '', neverDo: [], breakers: '' },
  greeting: { firstMessage: '', alternates: [], examples: [] },
  lore: { world: '', person: '', taboo: '', extra: [] },
};

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : {});

function text(v: unknown, max: number, label: string): string {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') throw new BadRequestException(`${label}은(는) 글이어야 합니다.`);
  const t = v.trim();
  if (t.length > max) throw new BadRequestException(`${label}은(는) ${max}자 이하로 써 주세요 (지금 ${t.length}자).`);
  return t;
}

function list(v: unknown, maxItems: number, maxLen: number, label: string): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new BadRequestException(`${label}은(는) 목록이어야 합니다.`);
  const items = v.map((x, i) => text(x, maxLen, `${label} ${i + 1}번`)).filter(Boolean);
  if (items.length > maxItems) throw new BadRequestException(`${label}은(는) ${maxItems}개까지입니다.`);
  return [...new Set(items)];
}

function axis(v: unknown, label: string): number {
  if (v === undefined || v === null) return 50;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 100) {
    throw new BadRequestException(`${label}은(는) 0~100 사이의 정수여야 합니다.`);
  }
  return v;
}

function oneOf<T extends string>(v: unknown, options: readonly T[], label: string): T | '' {
  if (v === undefined || v === null || v === '') return '';
  if (!options.includes(v as T)) throw new BadRequestException(`${label} 값이 올바르지 않습니다.`);
  return v as T;
}

// 초안 저장용: 형식·길이만 검사하고 빈칸은 허용한다. 모르는 필드는 버린다
export function normalizeCard(raw: unknown): Card {
  const c = obj(raw);
  const id = obj(c.identity);
  const ap = obj(c.appearance);
  const pe = obj(c.personality);
  const ca = obj(c.campaign);
  const bo = obj(c.boundary);
  const gr = obj(c.greeting);
  const lo = obj(c.lore);

  const examples = Array.isArray(gr.examples) ? gr.examples : [];
  if (examples.length > L.examples) throw new BadRequestException(`예시 대화는 ${L.examples}세트까지입니다.`);
  const extra = Array.isArray(lo.extra) ? lo.extra : [];
  if (extra.length > L.extra) throw new BadRequestException(`추가 로어는 ${L.extra}개까지입니다.`);

  return {
    identity: {
      name: text(id.name, L.name, '이름'),
      oneLiner: text(id.oneLiner, L.oneLiner, '한 줄 소개'),
      role: oneOf(id.role, ROLES, '캠페인 역할'),
      occupation: text(id.occupation, L.short, '종족/직업'),
      apparentAge: text(id.apparentAge, L.short, '겉보기 나이'),
      tags: list(id.tags, L.tags, L.tag, '태그'),
    },
    appearance: {
      description: text(ap.description, L.description, '외형 서술'),
      keywords: list(ap.keywords, L.keywords, L.keyword, '분위기 키워드'),
    },
    personality: {
      warmth: axis(pe.warmth, '온기'),
      directness: axis(pe.directness, '직설'),
      impulse: axis(pe.impulse, '충동'),
      protectiveness: axis(pe.protectiveness, '보호'),
      honorific: oneOf(pe.honorific, HONORIFICS, '말투(반말/존댓말)'),
      addressing: text(pe.addressing, L.addressing, '호칭 규칙'),
      habits: list(pe.habits, L.habits, L.item, '말투 습관'),
      forbidden: list(pe.forbidden, L.forbidden, L.item, '금지 말투'),
      summary: text(pe.summary, L.summary, '성격 요약'),
    },
    campaign: {
      scene: text(ca.scene, L.field, '시작 장면'),
      knows: text(ca.knows, L.field, '아는 것'),
      unknown: text(ca.unknown, L.field, '모르는 것'),
      goal: text(ca.goal, L.field, '목표'),
      stance: text(ca.stance, L.field, '유저에게 거는 태도'),
      conflictSeed: text(ca.conflictSeed, L.field, '갈등 씨앗'),
    },
    boundary: {
      secret: text(bo.secret, L.field, '비밀'),
      unlockCondition: text(bo.unlockCondition, L.field, '해금 조건'),
      neverDo: list(bo.neverDo, L.neverDo, L.item, '절대 하지 않는 것'),
      breakers: text(bo.breakers, L.field, '관계가 깨지는 것'),
    },
    greeting: {
      firstMessage: text(gr.firstMessage, L.firstMessage, '첫 메시지'),
      alternates: list(gr.alternates, L.alternates, L.firstMessage, '대체 인사'),
      examples: examples
        .map((e, i) => {
          const pair = obj(e);
          return {
            user: text(pair.user, L.exampleLine, `예시 ${i + 1} 유저 말`),
            character: text(pair.character, L.exampleLine, `예시 ${i + 1} 캐릭터 말`),
          };
        })
        .filter((e) => e.user || e.character),
    },
    lore: {
      world: text(lo.world, L.lore, '세계 규칙'),
      person: text(lo.person, L.lore, '중요 인물'),
      taboo: text(lo.taboo, L.lore, '금기'),
      extra: extra
        .map((e, i) => {
          const item = obj(e);
          return {
            title: text(item.title, L.extraTitle, `추가 로어 ${i + 1} 제목`),
            text: text(item.text, L.lore, `추가 로어 ${i + 1} 본문`),
          };
        })
        .filter((e) => e.title || e.text),
    },
  };
}

// ---- 발행 준비 상태 (§6.1 "발행은 필수 단계(3, 4, 6)와 테스트 통과 후") ----

export const STEPS = [
  { key: 'identity', label: '정체성', required: true },
  { key: 'appearance', label: '외형', required: false },
  { key: 'personality', label: '성격·말투', required: true },
  { key: 'campaign', label: '캠페인 역할', required: true },
  { key: 'boundary', label: '비밀·경계', required: false },
  { key: 'greeting', label: '첫인사', required: true },
  { key: 'lore', label: '로어북', required: false },
] as const;
export type StepKey = (typeof STEPS)[number]['key'];

// 각 단계에서 아직 비어 있는 필수 칸 (안내용 이름)
export function missingByStep(card: Card): Record<StepKey, string[]> {
  const miss = (pairs: [boolean, string][]) => pairs.filter(([ok]) => !ok).map(([, name]) => name);
  return {
    identity: miss([
      [card.identity.name !== '', '이름'],
      [card.identity.oneLiner !== '', '한 줄 소개'],
      [card.identity.role !== '', '캠페인 역할'],
    ]),
    appearance: [],
    personality: miss([
      [card.personality.honorific !== '', '반말/존댓말'],
      [card.personality.addressing !== '', '호칭 규칙'],
      [card.personality.summary !== '', '성격 요약'],
      [card.personality.habits.length > 0, '말투 습관 1개 이상'],
    ]),
    campaign: miss([
      [card.campaign.scene !== '', '시작 장면'],
      [card.campaign.knows !== '', '아는 것'],
      [card.campaign.goal !== '', '목표'],
    ]),
    // 비밀은 선택이지만, 쓰면 해금 조건과 반드시 쌍이어야 한다 (§6.2 "조건 없는 비밀은 언젠가 먼저 말해진다")
    boundary: card.boundary.secret !== '' && card.boundary.unlockCondition === '' ? ['비밀의 해금 조건'] : [],
    greeting: miss([[card.greeting.firstMessage !== '', '첫 메시지']]),
    lore: [],
  };
}

// 한국어는 대략 글자 2개에 토큰 1개꼴이다. 정확한 값이 아니라 "얼마나 무거운지" 감을 주는 용도 (§6.3)
export function estimateTokens(card: Card): number {
  const always = [
    card.identity.name,
    card.identity.oneLiner,
    card.personality.addressing,
    card.personality.summary,
    ...card.personality.habits,
    ...card.personality.forbidden,
    ...card.boundary.neverDo,
  ].join(' ');
  return Math.ceil(always.length / 2) + 120; // 고정 지시문 몫
}

export type Readiness = {
  steps: { key: StepKey; label: string; required: boolean; missing: string[]; done: boolean }[];
  warnings: string[];
  tokens: number;
  complete: boolean;
};

export function readiness(card: Card): Readiness {
  const missing = missingByStep(card);
  const steps = STEPS.map((s) => ({
    ...s,
    missing: missing[s.key],
    done: missing[s.key].length === 0 && (s.required || stepTouched(card, s.key)),
  }));
  const warnings: string[] = [];
  if (card.boundary.secret === '' && card.campaign.conflictSeed === '') {
    warnings.push('캠페인 밀도 부족: 비밀과 갈등 씨앗이 둘 다 비어 있습니다.'); // §6.3
  }
  if (card.greeting.firstMessage.startsWith('안녕') && card.greeting.firstMessage.includes('저는')) {
    warnings.push('첫 메시지가 자기소개로 시작합니다. 상황 2~4줄 + 대사 1~2줄로 써 보세요.'); // §6.2
  }
  const tokens = estimateTokens(card);
  if (tokens > 600) warnings.push(`항상 들어가는 설정이 무겁습니다(약 ${tokens} 토큰). 최근 대화가 밀려날 수 있어요.`);
  return {
    steps,
    warnings,
    tokens,
    complete: STEPS.every((s) => missing[s.key].length === 0),
  };
}

function stepTouched(card: Card, key: StepKey): boolean {
  const v = card[key] as unknown;
  return JSON.stringify(v) !== JSON.stringify(EMPTY_CARD[key]);
}

// 카드 지문: 테스트 뒤 카드를 고치면 달라져서 다시 테스트해야 발행된다
export function cardHash(card: Card): string {
  return createHash('sha256').update(JSON.stringify(card)).digest('hex').slice(0, 16);
}
