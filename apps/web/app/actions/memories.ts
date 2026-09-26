"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import type { FormState } from "./auth";

async function call(characterId: string, path: string, method: string): Promise<FormState & { data?: unknown }> {
  const token = await getSessionToken();
  const base = `/characters/${encodeURIComponent(characterId)}/chat/memories`;
  if (!token) redirect(`/login?next=${encodeURIComponent(base)}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) return { error: data?.message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };

  revalidatePath(base);
  return { data };
}

export async function deleteMemory(_prev: FormState, formData: FormData): Promise<FormState> {
  const characterId = String(formData.get("characterId") ?? "");
  const memoryId = encodeURIComponent(String(formData.get("memoryId") ?? ""));
  const result = await call(characterId, `/${memoryId}`, "DELETE");
  return result.error ? { error: result.error } : { success: "기억을 지웠습니다." };
}

export async function refreshMemories(_prev: FormState, formData: FormData): Promise<FormState> {
  const characterId = String(formData.get("characterId") ?? "");
  const result = await call(characterId, "/refresh", "POST");
  if (result.error) return { error: result.error };
  const created = (result.data as { created?: number } | null)?.created ?? 0;
  return {
    success: created > 0 ? `새 기억 ${created}개를 정리했습니다.` : "새로 기억할 만한 내용이 없었습니다.",
  };
}
