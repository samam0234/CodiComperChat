import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:4000";
// 운영 콘솔 주소 (운영자에게만 링크를 보인다)
export const CONSOLE_BASE_URL = process.env.CONSOLE_BASE_URL ?? "http://localhost:3001";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  // 공방 발행 버튼 표시용. 권한 판단은 Nest가 다시 한다
  role: "USER" | "ADMIN";
  // 지금 적용되는 요금 등급 (PRO는 공방 긴 글 칸 글자 수 3배)
  plan: "FREE" | "PRO";
  // 이메일 인증을 마쳤는지 (캐릭터 발행은 인증 뒤에만)
  emailVerified: boolean;
  // 성인 확인(이메일 인증·만 19세·동의)을 마쳤는지 — 코디포토넷 성인 모드. 생년월일 자체는 받지 않는다
  adult: boolean;
  createdAt: string;
};

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

// 쿠키가 있다는 것만으로 믿지 않고 매 요청 Nest에 토큰을 검증받는다 (proxy.ts는 빠른 1차 거름망일 뿐)
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as CurrentUser) : null;
  } catch {
    return null;
  }
});

export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

// 외부 주소로 튕기는 오픈 리다이렉트를 막는다 — 같은 사이트의 절대 경로만 허용
export function safeNextPath(value: unknown): string {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : "/";
}
