import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";

// 코레딧(코디컴퍼챗 크레딧): 프리미엄 모델의 답 1번마다 쓴다. 하루 한 번 출석하면 받는다 (정본: apps/api/src/credits/credits.ts)
export type CreditEntry = {
  delta: number;
  balance: number;
  reason: "ATTENDANCE" | "MODEL_USE" | "REFUND" | "ADMIN";
  modelId: string | null;
  createdAt: string;
};

export type CreditSummary = {
  balance: number;
  attendedToday: boolean;
  // 오늘 출석하면 받을 양 (무료 1000, 프로 5000)
  attendanceReward: number;
  krwPer100: number;
  history: CreditEntry[];
};

export async function getCredits(): Promise<CreditSummary | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/me/credits`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return res.ok ? ((await res.json()) as CreditSummary) : null;
  } catch {
    return null;
  }
}
