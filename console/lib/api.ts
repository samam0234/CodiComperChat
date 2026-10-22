import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

// 콘솔은 Nest만 부른다 (FastAPI는 모른다). 권한 판단은 늘 Nest(AdminGuard가 DB의 role로)가 한다
export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000";
// 이용자 사이트 주소 (캐릭터를 실제 화면에서 열어 볼 때)
export const WEB_BASE_URL = process.env.WEB_BASE_URL ?? "http://localhost:3000";

// 이용자 사이트의 session 쿠키와 이름을 달리 해 서로 덮어쓰지 않게 한다
export const CONSOLE_COOKIE = "console_session";
// 운영자 로그인은 짧게: 12시간
export const CONSOLE_MAX_AGE = 60 * 60 * 12;

export type Admin = { id: string; email: string; displayName: string; role: "USER" | "ADMIN" };

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(CONSOLE_COOKIE)?.value;
}

// 쿠키만 믿지 않고 매 요청 Nest에 토큰을 확인한다. 운영자가 아니면 null
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return null;
    const user = (await res.json()) as Admin;
    return user.role === "ADMIN" ? user : null;
  } catch {
    return null;
  }
});

export async function requireAdmin(returnTo: string): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return admin;
}

// 운영자 경로 읽기. 실패하면 null (화면이 "불러오지 못했습니다"를 보인다)
export async function adminGet<T>(path: string): Promise<T | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// 외부 주소로 튕기는 오픈 리다이렉트를 막는다 — 콘솔 안의 절대 경로만
export function safeNextPath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";
}
