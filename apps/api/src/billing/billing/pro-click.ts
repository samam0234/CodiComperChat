import { activeProvider, type ProviderName } from './payment-provider.js';

// 결제 없이 눌러서 프로로 바꾸기 (2026-11-03 사용자 결정: 배포해도 아직 정식 서비스가 아니라 실제 결제를 받지 않는다).
// 개발 환경은 기본으로 열리고, 운영은 PRO_CLICK=on일 때만 열린다.
// 토스 결제를 켜면 닫힌다: 돈을 받는 상품을 공짜로 받는 길이 남지 않게
export const PRO_CLICK_DAYS = 30;

export function proClickOpen(env: NodeJS.ProcessEnv = process.env, provider: ProviderName | null = activeProvider()): boolean {
  if (provider === 'toss') return false;
  if (env.PRO_CLICK === 'on') return true;
  return env.PRO_CLICK === undefined && env.NODE_ENV !== 'production';
}
