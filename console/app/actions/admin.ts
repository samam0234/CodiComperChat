"use server";

import { redirect } from "next/navigation";
import { API_BASE_URL, getToken } from "@/lib/api";

// 운영자 처리. Nest로 넘기기만 하고 권한은 Nest(AdminGuard)가 DB의 role로 판단한다
export type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<Result<T>> {
  const token = await getToken();
  if (!token) redirect("/login");
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다." };
  }
  if (res.status === 401) redirect("/login");
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
    return { ok: false, error: message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
  }
  return { ok: true, data: data as T };
}

// ---- 신고·캐릭터 ----

export async function takeDownCharacter(id: string, note: string) {
  return call(`/admin/characters/${encodeURIComponent(id)}/take-down`, { method: "POST", body: { note } });
}

export async function dismissReports(id: string, note: string) {
  return call(`/admin/characters/${encodeURIComponent(id)}/dismiss-reports`, { method: "POST", body: { note } });
}

export async function restoreCharacter(id: string) {
  return call(`/admin/characters/${encodeURIComponent(id)}/restore`, { method: "POST", body: {} });
}

// ---- 초상 검수 ----

export async function decidePortrait(draftId: string, decision: "approve" | "reject", note: string) {
  return call(`/admin/portraits/${encodeURIComponent(draftId)}`, { method: "POST", body: { decision, note } });
}

// ---- 계정 등급·결제 ----

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

export type AdminOrder = {
  id: string;
  name: string;
  amount: number;
  days: number;
  provider: string;
  status: "PAID" | "REFUNDED";
  paidAt: string;
  refundedAt: string | null;
  refundReason: string | null;
};

export async function findUser(email: string) {
  return call<AdminUser>(`/admin/users?email=${encodeURIComponent(email)}`);
}

export async function setUserPlan(email: string, plan: "PRO" | "FREE", days: string) {
  return call("/admin/users/plan", { method: "POST", body: { email, plan, days: days.trim() || null } });
}

export async function findOrders(email: string) {
  return call<AdminOrder[]>(`/admin/orders?email=${encodeURIComponent(email)}`);
}

// 결제사 환불이 먼저 되고, 그 결제로 늘어난 프로 기간이 되돌아간다
export async function refundOrder(orderId: string, reason: string) {
  return call(`/admin/orders/${encodeURIComponent(orderId)}/refund`, { method: "POST", body: { reason } });
}
