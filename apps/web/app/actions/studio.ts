"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import type { Card, DraftView, Quest, Verdict, Visibility } from "@/lib/studio-card";

// 공방 화면(클라이언트)이 부르는 서버 액션. Nest로 넘기기만 하고 판단은 Nest가 한다 (FastAPI 직접 호출 없음).
// 토큰은 httpOnly 쿠키에서 서버가 꺼내 붙인다.

export type StudioResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(id: string, path: string, method: string, body?: unknown): Promise<StudioResult<T>> {
  const token = await getSessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/studio/${id}`)}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/studio/characters/${encodeURIComponent(id)}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요." };
  }
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(`/studio/${id}`)}`);
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
    return { ok: false, error: message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
  }
  return { ok: true, data: data as T };
}

export async function createDraft(): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=/studio");
  let id: string | null = null;
  try {
    const res = await fetch(`${API_BASE_URL}/studio/characters`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) id = ((await res.json()) as { id: string }).id;
  } catch {
    // 아래에서 목록으로 돌려보낸다
  }
  redirect(id ? `/studio/${id}` : "/studio?error=create");
}

export async function saveDraft(id: string, card: Card) {
  return call<DraftView>(id, "", "PATCH", { card });
}

export async function sendTestTurn(id: string, message: string, personaId?: string) {
  return call<{ reply: string; turnsUsed: number; turnsTotal: number }>(id, "/test/chat", "POST", {
    message,
    ...(personaId ? { personaId } : {}),
  });
}

export async function draftField(id: string, field: string) {
  return call<{ field: string; kind: "text" | "list"; value: string | string[] }>(id, "/draft-field", "POST", { field });
}

// 비밀 퀘스트를 카드 설정을 읽고 한 번에 AI로 제안받는다 (저장하지 않는다)
export async function draftQuest(id: string) {
  return call<Quest>(id, "/draft-quest", "POST");
}

// 흉상 초상. 브라우저가 줄여 보낸 이미지 파일을 Nest에 원본 그대로 넘긴다 (Nest가 형식·크기를 다시 검사한다)
export async function uploadPortrait(id: string, formData: FormData): Promise<StudioResult<DraftView>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "이미지가 비어 있습니다." };
  const token = await getSessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(`/studio/${id}`)}`);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/studio/characters/${encodeURIComponent(id)}/portrait`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": file.type },
      body: Buffer.from(await file.arrayBuffer()),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요." };
  }
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(`/studio/${id}`)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message ?? `이미지를 올리지 못했습니다 (HTTP ${res.status}).` };
  // 발행 중이면 홈·상세의 초상도 바로 바뀐다
  revalidatePath("/", "layout");
  return { ok: true, data: data as DraftView };
}

// AI로 초상 만들기 (25 코레딧). 만든 그림은 올린 그림과 같이 자동 검수를 거쳐 초상으로 저장된다
export async function generatePortrait(
  id: string,
  input: { style: string; options: Record<string, string>; extra: string; useCard: boolean },
) {
  const result = await call<{ draft: DraftView; balance: number; cost: number }>(id, "/portrait/generate", "POST", input);
  if (result.ok) {
    revalidatePath("/", "layout");
    revalidatePath("/me");
  }
  return result;
}

export async function removePortrait(id: string) {
  const result = await call<DraftView>(id, "/portrait", "DELETE");
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function sampleReplies(id: string) {
  return call<{ question: string; replies: string[] }>(id, "/samples", "POST");
}

export async function runCritique(id: string) {
  return call<Verdict>(id, "/test/critique", "POST");
}

export async function resetTest(id: string) {
  return call<null>(id, "/test/reset", "POST");
}

export async function publishDraft(id: string) {
  const result = await call<DraftView>(id, "/publish", "POST");
  // 홈·인기의 캐릭터 목록이 바로 바뀌게
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function setDraftVisibility(id: string, visibility: Visibility) {
  const result = await call<DraftView>(id, "/visibility", "PATCH", { visibility });
  // 발행 중이면 홈·인기 목록이 바뀐다
  if (result.ok && result.data.published) revalidatePath("/", "layout");
  return result;
}

export async function unpublishDraft(id: string) {
  const result = await call<DraftView>(id, "/unpublish", "POST");
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function deleteDraft(id: string): Promise<StudioResult<null>> {
  const result = await call<null>(id, "", "DELETE");
  if (!result.ok) return result;
  revalidatePath("/studio");
  redirect("/studio");
}

// 테스트 한 턴·판정 뒤 서버가 들고 있는 테스트 상태를 다시 받는다 (카드를 고쳐 무효가 됐는지도 서버가 판단)
export async function loadDraft(id: string) {
  return call<DraftView>(id, "", "GET");
}
