import type { Plan } from '../plan/plan.js';

// 코레딧: 코디컴퍼챗 크레딧. 프리미엄 모델(Claude·Grok)의 답 1번마다 쓴다 (2026-10-21 사용자 결정)
//  - 하루 한 번 출석하면 무료 등급 1000, 프로 등급 5000 (한국 시각 자정에 다시 출석할 수 있다)
//  - 값어치: 100 코레딧 = 350원 (판매는 결제와 함께 보류 중이라 아직 살 수 없다)
export const ATTENDANCE_CREDITS: Record<Plan, number> = { FREE: 1000, PRO: 5000 };

export const KRW_PER_100_CREDITS = 350;

export const attendanceReward = (plan: Plan): number => ATTENDANCE_CREDITS[plan];

// 코레딧을 원으로 (화면 안내용, 원 단위 반올림)
export const creditsToKrw = (credits: number): number => Math.round((credits * KRW_PER_100_CREDITS) / 100);
