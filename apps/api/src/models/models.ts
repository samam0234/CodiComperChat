import type { Plan } from '../plan/plan.js';

// 대화에서 고를 수 있는 모델 목록과 쓸 수 있는 조건 (2026-10-21 사용자 결정).
//  - 기본 무료: gemma4:e4b — 누구나, 횟수 제한 없음 (services/ai의 기본 모델)
//  - 강화 무료: gemma4:12b — 누구나, 하루 30번 (한국 시각 자정에 초기화)
//  - 프리미엄(Claude·Grok): 프로 등급만. 외부 API 연동이 아직 없어 "준비 중"으로 잠가 둔다
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
): ChatModel => ({
  id,
  label,
  group,
  tier: 'PREMIUM',
  provider: group === 'Claude' ? 'anthropic' : 'xai',
  runtime: id,
  note,
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
  },
  {
    id: 'enhanced',
    label: '강화 무료 모델',
    group: '무료',
    tier: 'ENHANCED',
    provider: 'ollama',
    runtime: 'gemma4:12b',
    note: 'gemma4:12b · 하루 횟수 제한',
  },
  premium('claude-haiku-4-5', 'Claude Haiku 4.5', 'Claude', '빠르고 가벼운 답'),
  premium('claude-haiku-5-5', 'Claude Haiku 5.5', 'Claude', '빠르고 가벼운 답'),
  premium('claude-sonnet-5', 'Claude Sonnet 5', 'Claude', '균형 잡힌 답'),
  premium('claude-sonnet-5-5', 'Claude Sonnet 5.5', 'Claude', '균형 잡힌 답'),
  premium('claude-opus-4-8', 'Claude Opus 4.8', 'Claude', '깊이 있는 답'),
  premium('claude-opus-5', 'Claude Opus 5', 'Claude', '깊이 있는 답'),
  premium('claude-opus-5-5', 'Claude Opus 5.5', 'Claude', '깊이 있는 답'),
  premium('claude-fable-5-1', 'Claude Fable 5.1', 'Claude', '가장 풍부한 이야기'),
  premium('grok-4-5', 'Grok 4.5', 'Grok', 'xAI'),
  premium('grok-4-6', 'Grok 4.6', 'Grok', 'xAI'),
  premium('grok-4-7', 'Grok 4.7', 'Grok', 'xAI'),
];

export function findModel(id: string): ChatModel | undefined {
  return MODELS.find((m) => m.id === id);
}

// 호출 어댑터가 있는 공급자. Claude·Grok은 API 연동을 붙일 때 true로 바꾼다
const PROVIDER_READY: Record<ModelProvider, boolean> = { ollama: true, anthropic: false, xai: false };

export const isProviderReady = (provider: ModelProvider): boolean => PROVIDER_READY[provider];

// 하루 한도가 있는 모델이면 그 횟수, 없으면 null
export function dailyLimitOf(model: ChatModel, env: NodeJS.ProcessEnv = process.env): number | null {
  return model.tier === 'ENHANCED' ? enhancedDailyLimit(env) : null;
}

// 지금 쓸 수 있나. 잠긴 이유는 화면이 안내 문구를 고를 수 있게 코드로 준다
export type ModelLock = 'PRO_ONLY' | 'NOT_READY' | 'DAILY_LIMIT';

export function lockOf(model: ChatModel, plan: Plan, usedToday: number, env: NodeJS.ProcessEnv = process.env): ModelLock | null {
  if (model.tier === 'PREMIUM') {
    if (plan !== 'PRO') return 'PRO_ONLY';
    if (!isProviderReady(model.provider)) return 'NOT_READY';
    return null;
  }
  const limit = dailyLimitOf(model, env);
  if (limit !== null && usedToday >= limit) return 'DAILY_LIMIT';
  return null;
}

export const LOCK_MESSAGE: Record<ModelLock, string> = {
  PRO_ONLY: '프리미엄 모델은 프로 등급에서 쓸 수 있어요.',
  NOT_READY: '이 모델은 아직 준비 중이에요.',
  DAILY_LIMIT: '오늘 쓸 수 있는 횟수를 모두 썼어요. 한국 시각 자정에 다시 채워집니다.',
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 하루 횟수를 세는 날짜: 한국 시각 기준 YYYY-MM-DD
export function kstDay(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}
