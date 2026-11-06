import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";
import type { PlayState, WorldDetail, WorldEdit, WorldSummary } from "./world-types";

// 서버 컴포넌트용 조회. 로그인 쿠키가 있으면 토큰을 붙인다 (공개 세계관은 없어도 된다)
async function get<T>(path: string, { auth }: { auth: "optional" | "required" }): Promise<T | null> {
  const token = await getSessionToken();
  if (auth === "required" && !token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export const getPublicWorlds = (q?: string) =>
  get<WorldSummary[]>(`/worlds${q ? `?q=${encodeURIComponent(q)}` : ""}`, { auth: "optional" });
export const getMyWorlds = () => get<WorldSummary[]>("/worlds/mine", { auth: "required" });
export const getWorld = (id: string) => get<WorldDetail>(`/worlds/${encodeURIComponent(id)}`, { auth: "optional" });
export const getWorldForEdit = (id: string) => get<WorldEdit>(`/worlds/${encodeURIComponent(id)}/edit`, { auth: "required" });
export const getPlayState = (id: string) => get<PlayState>(`/worlds/${encodeURIComponent(id)}/play`, { auth: "required" });
