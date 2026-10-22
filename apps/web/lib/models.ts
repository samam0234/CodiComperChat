import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";

// 대화에서 고를 수 있는 모델 (정본은 apps/api/src/models/models.ts, 화면은 이 목록만 그린다)
export type ModelLock = "NOT_READY" | "DAILY_LIMIT" | "NO_CREDITS";

export type ModelOption = {
  id: string;
  label: string;
  group: "무료" | "Claude" | "Grok";
  tier: "BASIC" | "ENHANCED" | "PREMIUM";
  note: string;
  // 답 1번에 드는 코레딧 (프리미엄만)
  credits: number | null;
  // 지금 못 쓰는 이유 (쓸 수 있으면 null)
  locked: ModelLock | null;
  // 하루 한도가 있는 모델만
  limit: number | null;
  used: number | null;
};

// 모델 목록과 내 코레딧 잔액. 못 불러오면 null → 화면은 모델 고르기를 숨기고 기본 모델로 대화한다
export async function getModels(): Promise<{ balance: number; models: ModelOption[] } | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as { balance: number; models: ModelOption[] };
  } catch {
    return null;
  }
}
