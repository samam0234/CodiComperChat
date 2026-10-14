"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import type { ChatHistory } from "@/lib/conversations";

// 새로하기·이어하기. Nest로 넘기기만 한다 (토큰은 httpOnly 쿠키에서 서버가 붙인다)

export type ConversationResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(characterId: string, path: string, method: string, body?: unknown): Promise<ConversationResult<T>> {
  const base = `/characters/${encodeURIComponent(characterId)}/chat`;
  const token = await getSessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(base)}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(base)}`);
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };

  // 지금 대화가 바뀌면 메모리·상태설정·대화 목록도 바뀐다
  revalidatePath(base, "layout");
  revalidatePath("/library");
  return { ok: true, data: data as T };
}

export async function startNewConversation(characterId: string, save: boolean) {
  return call<ChatHistory & { saved: boolean }>(characterId, "/new", "POST", { save });
}

export async function resumeConversation(characterId: string, campaignId: string, saveCurrent: boolean) {
  return call<ChatHistory>(characterId, `/saved/${encodeURIComponent(campaignId)}/resume`, "POST", { saveCurrent });
}

export async function deleteSavedConversation(characterId: string, campaignId: string) {
  return call<null>(characterId, `/saved/${encodeURIComponent(campaignId)}`, "DELETE");
}
