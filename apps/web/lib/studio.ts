import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";
import type { DraftSummary, DraftView } from "./studio-card";

async function authedGet<T>(path: string): Promise<T | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function getMyDrafts(): Promise<DraftSummary[] | null> {
  return authedGet<DraftSummary[]>("/studio/characters");
}

// 남의 초안이거나 없으면 null (Nest가 404)
export async function getDraft(id: string): Promise<DraftView | null> {
  return authedGet<DraftView>(`/studio/characters/${encodeURIComponent(id)}`);
}
