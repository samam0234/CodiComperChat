// 요금 등급. 결제(apps/api/src/billing)로 사거나, 운영자가 부여한다(/admin/users, scripts/user-plan.mjs).
// 등급이 바꾸는 것: (1) 공방 카드의 "긴 글 칸" 글자 수 상한 3배 (기획서 §6.3 컨텍스트 예산은 그대로 지킨다 — 항상 들어가는 칸은 늘리지 않는다), (2) 프리미엄 대화 모델(Claude·Grok)을 고를 수 있음 (src/models/models.ts, 연동 전이라 아직 잠김).
export type Plan = 'FREE' | 'PRO';

export const PRO_MULTIPLIER = 3;

type PlanFields = { plan: Plan; planUntil: Date | null };

// 지금 이 사용자에게 적용되는 등급. PRO라도 만료 시각이 지났으면 FREE
export function effectivePlan(user: PlanFields, now: Date = new Date()): Plan {
  return user.plan === 'PRO' && (user.planUntil === null || user.planUntil > now) ? 'PRO' : 'FREE';
}

export const multiplierFor = (plan: Plan): number => (plan === 'PRO' ? PRO_MULTIPLIER : 1);

const DAY_MS = 86_400_000;

// 프로 기간을 days일 늘린 새 만료 시각. 아직 남은 프로 기간이 있으면 그 뒤에 붙이고(남은 날을 잃지 않게),
// 만료 없는 프로(운영자 부여)면 그대로 만료 없음, 프로가 아니거나 끝났으면 지금부터 센다
export function extendPro(user: PlanFields, days: number, now: Date = new Date()): Date | null {
  if (effectivePlan(user, now) === 'PRO') {
    if (user.planUntil === null) return null;
    return new Date(user.planUntil.getTime() + days * DAY_MS);
  }
  return new Date(now.getTime() + days * DAY_MS);
}
