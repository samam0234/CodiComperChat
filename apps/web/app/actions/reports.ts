"use server";

import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// 신고하기. 운영자 처리(내리기·기각·복구)는 운영 콘솔(console/)로 옮겼다

export type ReportResult = { ok: true } | { ok: false; error: string };

async function call(path: string, body: unknown, returnTo: string): Promise<ReportResult> {
  const token = await getSessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => null);
  const message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
  return { ok: false, error: message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
}

export async function reportCharacter(characterId: string, reason: string, detail: string) {
  return call(`/characters/${encodeURIComponent(characterId)}/report`, { reason, detail }, `/characters/${characterId}`);
}

export async function reportContent(
  characterId: string,
  target: "PHOTONET" | "WEBTOON",
  targetId: string,
  reason: string,
  detail: string,
  returnTo: string,
) {
  return call(`/characters/${encodeURIComponent(characterId)}/content-reports`, { target, targetId, reason, detail }, returnTo);
}

