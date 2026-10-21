"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL, CONSOLE_COOKIE, CONSOLE_MAX_AGE, safeNextPath } from "@/lib/api";

export type FormState = { error?: string; email?: string } | undefined;

// 요청 한도가 사람마다 세어지도록 실제 IP를 넘긴다 (이용자 사이트와 같은 방식)
async function forwardedFor(): Promise<Record<string, string>> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  return ip ? { "X-Forwarded-For": ip } : {};
}

// 운영자 로그인: 이용자와 같은 계정으로 로그인하되, 운영자(ADMIN)가 아니면 들이지 않는다
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await forwardedFor()) },
      body: JSON.stringify({ email, password: formData.get("password") }),
      cache: "no-store",
    });
  } catch {
    return { error: "서버에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요.", email };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.message ?? `로그인에 실패했습니다 (HTTP ${res.status}).`, email };
  if (data?.user?.role !== "ADMIN") return { error: "운영자 계정이 아닙니다.", email };

  (await cookies()).set(CONSOLE_COOKIE, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // 운영 화면은 다른 사이트에서 넘어온 요청에 쿠키를 싣지 않는다
    sameSite: "strict",
    path: "/",
    maxAge: CONSOLE_MAX_AGE,
  });
  redirect(safeNextPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  (await cookies()).delete(CONSOLE_COOKIE);
  redirect("/login");
}
