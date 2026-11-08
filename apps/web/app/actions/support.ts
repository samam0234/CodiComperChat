"use server";

import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

export type Inquiry = {
  id: string;
  category: string;
  subject: string;
  body: string;
  status: "OPEN" | "ANSWERED";
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export type SupportResult = { ok: true } | { ok: false; error: string };

async function authed(path: string, init: { method?: string; body?: unknown } = {}) {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=/support");
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) redirect("/login?next=/support");
  return res;
}

export async function myInquiries(): Promise<Inquiry[]> {
  try {
    const res = await authed("/support/inquiries");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function sendInquiry(category: string, subject: string, body: string): Promise<SupportResult> {
  let res: Response;
  try {
    res = await authed("/support/inquiries", { method: "POST", body: { category, subject, body } });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => null);
  const message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
  return { ok: false, error: message ?? `문의를 보내지 못했습니다 (HTTP ${res.status}).` };
}
