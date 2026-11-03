import type { Plan } from '../plan/plan.js';

// 대화에서 고를 수 있는 모델 목록과 쓸 수 있는 조건 (2026-10-21 사용자 결정).
//  - 기본 무료: gemma4:e4b — 누구나, 횟수 제한 없음 (services/ai의 기본 모델)
//  - 강화 무료: gemma4:12b — 무료 등급은 하루 30번(한국 시각 자정 초기화), 프로 등급은 무제한.
//    무료 등급이 30번을 다 쓰면 자정까지는 1번에 10 코레딧으로 계속 쓴다 (2026-10-24 사용자 결정 — 예전에는 잠겼다)
//  - 프리미엄(Claude·Grok): 캐릭터 답 1번마다 코레딧을 쓴다 (값은 아래 표, 근거는 docs/plan/AI_MODEL_STRATEGY.md).
//    PREMIUM_PROVIDERS로 연 공급자만 쓸 수 있고, 나머지는 "준비 중"으로 잠긴다.
//    만 18세 미만은 쓸 수 없다 (2026-11-03 사용자 결정. Anthropic 정책이 18세 미만 제공에 추가 지침을 요구한다). 나이는 자기 신고 생년월일로 본다
export type ModelTier = 'BASIC' | 'ENHANCED' | 'PREMIUM';
export type ModelProvider = 'ollama' | 'anthropic' | 'xai';

export type ChatModel = {
  id: string;
  label: string;
  // 화면에서 묶어 보여 줄 이름
  group: '무료' | 'Claude' | 'Grok';
  tier: ModelTier;
  provider: ModelProvider;
  // 공급자에게 보낼 모델 이름. 기본 모델은 비워 services/ai가 자기 기본값을 쓰게 한다
  runtime: string | null;
  note: string;
  // 캐릭터 답 1번에 드는 코레딧 (프리미엄만)
  credits: number | null;
};

export const DEFAULT_MODEL_ID = 'basic';

export const ENHANCED_DAILY_LIMIT_DEFAULT = 30;
// 하루 무료 횟수를 다 쓴 뒤 강화 무료 1번에 드는 코레딧
export const ENHANCED_OVERAGE_CREDITS = 10;
// 프리미엄 모델을 쓸 수 있는 만 나이
export const PREMIUM_MIN_AGE = 18;

// 하루 한도는 환경변수로 줄일 수 있다 (e2e에서 한도에 닿는 경로를 짧게 시험하려고)
export function enhancedDailyLimit(env: NodeJS.ProcessEnv = process.env): number {
  const raw = Number(env.MODEL_ENHANCED_DAILY_LIMIT);
  return Number.isInteger(raw) && raw >= 1 ? raw : ENHANCED_DAILY_LIMIT_DEFAULT;
}

const premium = (
  id: string,
  label: string,
  group: 'Claude' | 'Grok',
  note: string,
  credits: number,
  // 공급자에게 보낼 이름이 id와 다를 때 (Grok은 grok-4.5처럼 점을 쓴다. id는 대화에 저장돼 있어 그대로 둔다)
  runtime: string = id,
): ChatModel => ({
  id,
  label,
  group,
  tier: 'PREMIUM',
  provider: group === 'Claude' ? 'anthropic' : 'xai',
  runtime,
  note,
  credits,
});

export const MODELS: readonly ChatModel[] = [
  {
    id: DEFAULT_MODEL_ID,
    label: '기본 무료 모델',
    group: '무료',
    tier: 'BASIC',
    provider: 'ollama',
    runtime: null,
    note: 'gemma4:e4b · 횟수 제한 없음',
    credits: null,
  },
  {
    id: 'enhanced',
    label: '강화 무료 모델',
    group: '무료',
    tier: 'ENHANCED',
    provider: 'ollama',
    runtime: 'gemma4:12b',
    note: 'gemma4:12b · 무료 등급은 하루 횟수 제한, 프로는 무제한',
    credits: null,
  },
  // 값: 답 1번(입력 약 6천·출력 약 500토큰)의 API 원가를 3배 넘게 덮고(처음 값의 1.5배, 소수는 올림), 같은 줄에서는 성능 순으로 오르게
  premium('claude-haiku-5-5', 'Claude Haiku 5.5', 'Claude', '빠르고 가벼운 답', 8),
  premium('claude-haiku-4-5', 'Claude Haiku 4.5', 'Claude', '빠르고 가벼운 답', 15),
  premium('claude-sonnet-5', 'Claude Sonnet 5', 'Claude', '균형 잡힌 답', 30),
  premium('claude-sonnet-5-5', 'Claude Sonnet 5.5', 'Claude', '균형 잡힌 답', 38),
  premium('claude-opus-4-8', 'Claude Opus 4.8', 'Claude', '깊이 있는 답', 60),
  premium('claude-opus-5', 'Claude Opus 5', 'Claude', '깊이 있는 답', 68),
  premium('claude-opus-5-5', 'Claude Opus 5.5', 'Claude', '깊이 있는 답', 75),
  premium('claude-fable-5-1', 'Claude Fable 5.1', 'Claude', '가장 풍부한 이야기', 120),
  // Grok 값: 공개 가격($2/$6, 2026-11-03 확인) 기준 답 1번 원가 약 22원이라 처음 잡은 값이 원가의 3배를 덮는다
  premium('grok-4-5', 'Grok 4.5', 'Grok', 'xAI', 30, 'grok-4.5'),
  premium('grok-4-6', 'Grok 4.6', 'Grok', 'xAI', 38, 'grok-4.6'),
  premium('grok-4-7', 'Grok 4.7', 'Grok', 'xAI', 45, 'grok-4.7'),
];

export function findModel(id: string): ChatModel | undefined {
  return MODELS.find((m) => m.id === id);
}

// 프리미엄 공급자는 PREMIUM_PROVIDERS(예: "anthropic,xai")에 적은 것만 연다. 키는 services/ai에만 둔다.
// 실제 돈이 나가는 호출이라 기본은 닫혀 있다.
// MODEL_PREMIUM_FAKE=1은 e2e 전용: 프리미엄 호출을 가짜 LLM 쪽 services/ai로 보내 코레딧 경로를 시험한다 (운영에서 켜지 않는다)
export const isProviderReady = (provider: ModelProvider, env: NodeJS.ProcessEnv = process.env): boolean =>
  provider === 'ollama' ||
  env.MODEL_PREMIUM_FAKE === '1' ||
  (env.PREMIUM_PROVIDERS ?? '')
    .split(',')
    .map((p) => p.trim())
    .includes(provider);

// 서비스 전체가 한 달(한국 시각)에 프리미엄으로 쓸 수 있는 코레딧. 코레딧 판매 전이라 출석 코레딧이 곧 실제 지출이다.
// 운영에서 값을 넣지 않으면 0으로 보아 열리지 않는다: 키만 넣고 한도를 잊는 사고를 막는다. 개발·시험은 한도 없음(null)
export function premiumMonthlyCap(env: NodeJS.ProcessEnv = process.env): number | null {
  const raw = env.PREMIUM_MONTHLY_CREDITS?.trim();
  const value = raw ? Number(raw) : NaN;
  if (Number.isInteger(value) && value >= 0) return value;
  return env.NODE_ENV === 'production' ? 0 : null;
}

// 하루 한도가 있으면 그 횟수, 없으면 null (강화 무료를 무료 등급이 쓸 때만)
export function dailyLimitOf(model: ChatModel, plan: Plan, env: NodeJS.ProcessEnv = process.env): number | null {
  return model.tier === 'ENHANCED' && plan !== 'PRO' ? enhancedDailyLimit(env) : null;
}

// 지금 쓸 수 있나. 잠긴 이유는 화면이 안내 문구를 고를 수 있게 코드로 준다
export type ModelLock = 'NOT_READY' | 'NEEDS_BIRTHDATE' | 'UNDER_AGE' | 'SPEND_CAP' | 'DAILY_LIMIT' | 'NO_CREDITS';

// age: 생년월일로 계산한 만 나이. 입력하지 않았으면 null
// premiumSpent: 이번 달 서비스 전체가 프리미엄에 쓴 코레딧
export type Wallet = { plan: Plan; usedToday: number; balance: number; age: number | null; premiumSpent?: number };

export function lockOf(model: ChatModel, wallet: Wallet, env: NodeJS.ProcessEnv = process.env): ModelLock | null {
  if (model.tier === 'PREMIUM') {
    if (!isProviderReady(model.provider, env)) return 'NOT_READY';
    if (wallet.age === null) return 'NEEDS_BIRTHDATE';
    if (wallet.age < PREMIUM_MIN_AGE) return 'UNDER_AGE';
    const cap = premiumMonthlyCap(env);
    if (cap !== null && (wallet.premiumSpent ?? 0) + (model.credits ?? 0) > cap) return 'SPEND_CAP';
    if (wallet.balance < (model.credits ?? 0)) return 'NO_CREDITS';
    return null;
  }
  const limit = dailyLimitOf(model, wallet.plan, env);
  // 무료 횟수를 다 썼으면 코레딧으로 이어 쓴다 — 코레딧도 모자랄 때만 잠긴다
  if (limit !== null && wallet.usedToday >= limit && wallet.balance < ENHANCED_OVERAGE_CREDITS) return 'NO_CREDITS';
  return null;
}

export const LOCK_MESSAGE: Record<ModelLock, string> = {
  NOT_READY: '이 모델은 아직 준비 중이에요.',
  NEEDS_BIRTHDATE: '프리미엄 모델은 만 18세 이상만 쓸 수 있어요. 설정에서 생년월일을 입력해 주세요.',
  UNDER_AGE: '프리미엄 모델은 만 18세 이상만 쓸 수 있어요.',
  SPEND_CAP: '이번 달 프리미엄 모델 제공량을 모두 썼어요. 다음 달 1일(한국 시각)에 다시 열립니다.',
  DAILY_LIMIT: '오늘 쓸 수 있는 횟수를 모두 썼어요. 한국 시각 자정에 다시 채워집니다. 프로 등급은 무제한이에요.',
  // (강화 무료는 이제 한도에서 잠기지 않고 코레딧으로 넘어간다. 화면 호환을 위해 코드는 남긴다)
  NO_CREDITS: '코레딧이 모자라요. 출석하면 코레딧을 받을 수 있어요.',
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 이번 달 1일 0시(한국 시각)
export function kstMonthStart(now: Date = new Date()): Date {
  return new Date(`${kstDay(now).slice(0, 7)}-01T00:00:00+09:00`);
}

// 하루를 세는 날짜: 한국 시각 기준 YYYY-MM-DD
export function kstDay(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}
