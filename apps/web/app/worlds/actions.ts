"use server";

import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

export type CreateState = { error?: string } | undefined;

// 새 세계관을 만들고 편집기로 보낸다
export async function createWorld(): Promise<CreateState> {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=/worlds");
  let id: string | null = null;
  try {
    const res = await fetch(`${API_BASE_URL}/worlds`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!res.ok || !data?.id) return { error: data?.message ?? "세계관을 만들지 못했어요." };
    id = data.id;
  } catch {
    return { error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  redirect(`/worlds/${id}/edit`);
}
