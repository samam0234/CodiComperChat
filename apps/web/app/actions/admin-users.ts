"use server";

import { API_BASE_URL, getSessionToken } from "@/lib/auth";

export type AdminUser = {
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  plan: "FREE" | "PRO";
  effectivePlan: "FREE" | "PRO";
  planUntil: string | null;
  createdAt: string;
  orders: { productId: string; amount: number; paidAt: string }[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// 운영자 도구. 권한은 Nest(AdminGuard)가 DB의 role로 확인한다
async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<Result<T>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: "로그인이 필요합니다." };
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다." };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
  return { ok: true, data: data as T };
}

export async function findUser(email: string) {
  return call<AdminUser>(`/admin/users?email=${encodeURIComponent(email)}`);
}

export async function setUserPlan(email: string, plan: "PRO" | "FREE", days: string) {
  return call<unknown>("/admin/users/plan", { method: "POST", body: { email, plan, days: days.trim() || null } });
}
