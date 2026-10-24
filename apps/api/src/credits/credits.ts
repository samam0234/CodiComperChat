import type { Plan } from '../plan/plan.js';

// 코레딧: 코디컴퍼챗 크레딧. 프리미엄 모델(Claude·Grok)의 답 1번마다 쓴다 (2026-10-21 사용자 결정)
//  - 하루 한 번 출석하면 무료 등급 1000, 프로 등급 5000 (한국 시각 자정에 다시 출석할 수 있다)
//  - 값어치: 100 코레딧 = 350원 (판매는 결제와 함께 보류 중이라 아직 살 수 없다)
export const ATTENDANCE_CREDITS: Record<Plan, number> = { FREE: 1000, PRO: 5000 };

export const KRW_PER_100_CREDITS = 350;

export const attendanceReward = (plan: Plan): number => ATTENDANCE_CREDITS[plan];

// 오퍼레이션(대화 플러그인) 값 (2026-10-23 사용자 결정: 모델이 글을 새로 쓰는 기능은 코레딧으로).
// 로컬 기본 모델로 돌지만, 대기열을 아끼고 출석 코레딧의 쓸 곳을 만든다. 메시지는 대화와 같아 받지 않는다
export const OPERATION_COSTS = {
  mind: 30, // 심리 탐구 1번
  diary: 20, // 일기 1편
  boardRefresh: 20, // 커뮤니티 새 글 불러오기 (주민 글 3개)
  boardPost: 10, // 커뮤니티에 내 글 쓰기 (주민 댓글 포함)
  photonet: 50, // 코디포토넷 그림 1장 (엔진 준비 중)
  webtoon: 45, // 웹툰 한 컷 (콘티는 무료, 2026-10-24 사용자 결정)
} as const;

export type OperationName = keyof typeof OPERATION_COSTS;

export const OPERATION_LABELS: Record<OperationName, string> = {
  mind: "심리 탐구",
  diary: "일기",
  boardRefresh: "커뮤니티 새 글",
  boardPost: "커뮤니티 글쓰기",
  photonet: "코디포토넷",
  webtoon: "웹툰 한 컷",
};

// 코레딧을 원으로 (화면 안내용, 원 단위 반올림)
export const creditsToKrw = (credits: number): number => Math.round((credits * KRW_PER_100_CREDITS) / 100);
