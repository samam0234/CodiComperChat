import "server-only";

import { API_BASE_URL } from "./auth";

// 인기 순위 (GET /characters/popular). 공개 캐릭터만, 대화한 사람 수 → 최근 7일 말 수 순
export type PopularCharacter = {
  id: string;
  name: string;
  oneLiner: string;
  role: string;
  portraitMime?: string | null;
  updatedAt?: string;
  official: boolean;
  rank: number;
  stats: { players: number; messages7d: number };
};

export type PopularResult = { ok: true; characters: PopularCharacter[] } | { ok: false; message: string };

export async function getPopular(): Promise<PopularResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/characters/popular`, { cache: "no-store" });
    if (!res.ok) return { ok: false, message: `인기 순위를 불러오지 못했습니다 (HTTP ${res.status}).` };
    return { ok: true, characters: (await res.json()) as PopularCharacter[] };
  } catch {
    return { ok: false, message: "API에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
}
