// 요금 등급. 결제 연동은 아직 없고, 운영자가 부여한다(scripts/user-plan.mjs).
// 등급이 바꾸는 것은 지금은 하나: 공방 카드의 "긴 글 칸" 글자 수 상한 3배 (기획서 §6.3 컨텍스트 예산은 그대로 지킨다 — 항상 들어가는 칸은 늘리지 않는다).
export type Plan = 'FREE' | 'PRO';

export const PRO_MULTIPLIER = 3;

type PlanFields = { plan: Plan; planUntil: Date | null };

// 지금 이 사용자에게 적용되는 등급. PRO라도 만료 시각이 지났으면 FREE
export function effectivePlan(user: PlanFields, now: Date = new Date()): Plan {
  return user.plan === 'PRO' && (user.planUntil === null || user.planUntil > now) ? 'PRO' : 'FREE';
}

export const multiplierFor = (plan: Plan): number => (plan === 'PRO' ? PRO_MULTIPLIER : 1);
