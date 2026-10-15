"use server";

import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import type { StoryView } from "@/lib/conversations";

// 지난 이야기 패널용. Nest로 넘기기만 한다 (토큰은 httpOnly 쿠키에서 서버가 붙인다)

export type StoryResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(characterId: string, path: string, method: string): Promise<StoryResult<T>> {
  const base = `/characters/${encodeURIComponent(characterId)}/chat`;
  const token = await getSessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(base)}`);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${base}/story${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(base)}`);
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
  return { ok: true, data: data as T };
}

export async function loadStory(characterId: string) {
  return call<StoryView>(characterId, "", "GET");
}

export async function removeStoryHook(characterId: string, hookId: string) {
  return call<null>(characterId, `/hooks/${encodeURIComponent(hookId)}`, "DELETE");
}
