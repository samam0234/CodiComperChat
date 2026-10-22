"use server";

import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import type { ExtraFields, ExtrasView, Trigger } from "@/lib/extras";

// 엑스트라 설정. Nest로 넘기기만 한다 (토큰은 httpOnly 쿠키에서 서버가 붙인다)

export type ExtrasResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, method: string, returnTo: string, body?: unknown): Promise<ExtrasResult<T>> {
  const token = await getSessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(returnTo)}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
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
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
    return { ok: false, error: message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
  }
  return { ok: true, data: data as T };
}

const chatPath = (characterId: string) => `/characters/${encodeURIComponent(characterId)}/chat`;

export async function loadExtras(characterId: string) {
  return call<ExtrasView>(`${chatPath(characterId)}/extras`, "GET", chatPath(characterId));
}

export async function createExtra(characterId: string, fields: ExtraFields) {
  return call<{ id: string }>("/me/extras", "POST", chatPath(characterId), fields);
}

export async function updateExtra(characterId: string, extraId: string, fields: ExtraFields) {
  return call<{ id: string }>(`/me/extras/${encodeURIComponent(extraId)}`, "PATCH", chatPath(characterId), fields);
}

export async function deleteExtra(characterId: string, extraId: string) {
  return call<null>(`/me/extras/${encodeURIComponent(extraId)}`, "DELETE", chatPath(characterId));
}

export async function applyExtra(characterId: string, extraId: string, triggers: Trigger[]) {
  return call<ExtrasView>(`${chatPath(characterId)}/extras/${encodeURIComponent(extraId)}`, "PUT", chatPath(characterId), {
    triggers,
  });
}

export async function unapplyExtra(characterId: string, extraId: string) {
  return call<ExtrasView>(`${chatPath(characterId)}/extras/${encodeURIComponent(extraId)}`, "DELETE", chatPath(characterId));
}
