"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import type { FormState } from "./auth";

export async function saveChatState(_prev: FormState, formData: FormData): Promise<FormState> {
  const characterId = String(formData.get("characterId") ?? "");
  const base = `/characters/${encodeURIComponent(characterId)}/chat/state`;
  const token = await getSessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/characters/${characterId}/chat/settings`)}`);

  const values = {
    relationshipValue: String(formData.get("relationshipValue") ?? "0"),
    relationshipNote: String(formData.get("relationshipNote") ?? ""),
    userNickname: String(formData.get("userNickname") ?? ""),
  };
  // 체크 칸은 꺼져 있으면 아예 안 온다
  const autoRelationship = formData.get("autoRelationship") === "on";

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${base}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        relationshipValue: Number.parseInt(values.relationshipValue, 10),
        relationshipNote: values.relationshipNote,
        userNickname: values.userNickname,
        autoRelationship,
      }),
      cache: "no-store",
    });
  } catch {
    return { error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.", values };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { error: data?.message ?? `저장하지 못했습니다 (HTTP ${res.status}).`, values };
  }

  revalidatePath(`/characters/${characterId}/chat/settings`);
  return { success: "저장했습니다. 다음 대화부터 반영됩니다." };
}
