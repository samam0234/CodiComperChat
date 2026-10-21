import type { Plan } from '../plan/plan.js';

// 대화에서 고를 수 있는 모델 목록과 쓸 수 있는 조건 (2026-10-21 사용자 결정).
//  - 기본 무료: gemma4:e4b — 누구나, 횟수 제한 없음 (services/ai의 기본 모델)
//  - 강화 무료: gemma4:12b — 무료 등급은 하루 30번(한국 시각 자정 초기화), 프로 등급은 무제한
//  - 프리미엄(Claude·Grok): 캐릭터 답 1번마다 코레딧을 쓴다 (값은 아래 표, 근거는 docs/plan/AI_MODEL_STRATEGY.md).
//    외부 API 연동이 아직 없어 "준비 중"으로 잠가 둔다
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
): ChatModel => ({
  id,
  label,
  group,
  tier: 'PREMIUM',
  provider: group === 'Claude' ? 'anthropic' : 'xai',
  runtime: id,
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
  // Grok 값은 공개 가격을 확인하지 못해 Sonnet급 원가로 잡은 임시값이다 (연동할 때 다시 잰다)
  premium('grok-4-5', 'Grok 4.5', 'Grok', 'xAI', 30),
  premium('grok-4-6', 'Grok 4.6', 'Grok', 'xAI', 38),
  premium('grok-4-7', 'Grok 4.7', 'Grok', 'xAI', 45),
];

export function findModel(id: string): ChatModel | undefined {
  return MODELS.find((m) => m.id === id);
}

// 호출 어댑터가 있는 공급자. Claude·Grok은 API 연동을 붙일 때 true로 바꾼다.
// MODEL_PREMIUM_FAKE=1은 e2e 전용: 프리미엄 호출을 가짜 LLM 쪽 services/ai로 보내 코레딧 경로를 시험한다 (운영에서 켜지 않는다)
const PROVIDER_READY: Record<ModelProvider, boolean> = { ollama: true, anthropic: false, xai: false };

export const isProviderReady = (provider: ModelProvider, env: NodeJS.ProcessEnv = process.env): boolean =>
  PROVIDER_READY[provider] || env.MODEL_PREMIUM_FAKE === '1';

// 하루 한도가 있으면 그 횟수, 없으면 null (강화 무료를 무료 등급이 쓸 때만)
export function dailyLimitOf(model: ChatModel, plan: Plan, env: NodeJS.ProcessEnv = process.env): number | null {
  return model.tier === 'ENHANCED' && plan !== 'PRO' ? enhancedDailyLimit(env) : null;
}

// 지금 쓸 수 있나. 잠긴 이유는 화면이 안내 문구를 고를 수 있게 코드로 준다
export type ModelLock = 'NOT_READY' | 'DAILY_LIMIT' | 'NO_CREDITS';

export type Wallet = { plan: Plan; usedToday: number; balance: number };

export function lockOf(model: ChatModel, wallet: Wallet, env: NodeJS.ProcessEnv = process.env): ModelLock | null {
  if (model.tier === 'PREMIUM') {
    if (!isProviderReady(model.provider, env)) return 'NOT_READY';
    if (wallet.balance < (model.credits ?? 0)) return 'NO_CREDITS';
    return null;
  }
  const limit = dailyLimitOf(model, wallet.plan, env);
  if (limit !== null && wallet.usedToday >= limit) return 'DAILY_LIMIT';
  return null;
}

export const LOCK_MESSAGE: Record<ModelLock, string> = {
  NOT_READY: '이 모델은 아직 준비 중이에요.',
  DAILY_LIMIT: '오늘 쓸 수 있는 횟수를 모두 썼어요. 한국 시각 자정에 다시 채워집니다. 프로 등급은 무제한이에요.',
  NO_CREDITS: '코레딧이 모자라요. 출석하면 코레딧을 받을 수 있어요.',
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 하루를 세는 날짜: 한국 시각 기준 YYYY-MM-DD
export function kstDay(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}
