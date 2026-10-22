"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import type { BoardPost, DiaryEntry, DirectMessage, MindReading, PhotonetView } from "@/lib/operations";

// 오퍼레이션(대화 플러그인) 만들기·쓰기. Nest로 넘기기만 한다 (토큰은 httpOnly 쿠키에서 서버가 붙인다)
export type OpsResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(characterId: string, path: string, body?: unknown): Promise<OpsResult<T>> {
  const base = `/characters/${encodeURIComponent(characterId)}/chat`;
  const token = await getSessionToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(base)}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${base}/ops/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(base)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
  // 코레딧이 줄었으니 마이페이지 잔액도 새로
  revalidatePath("/me");
  return { ok: true, data: data as T };
}

export async function readMind(characterId: string) {
  return call<{ reading: MindReading; balance: number }>(characterId, "mind");
}

export async function writeDiary(characterId: string) {
  return call<{ entry: DiaryEntry; balance: number }>(characterId, "diary");
}

export async function sendDirectMessage(characterId: string, text: string) {
  return call<{ sent: DirectMessage; reply: DirectMessage }>(characterId, "messages", { text });
}

// 코디포토넷 창을 열 때 상태를 읽는다 (채팅 화면 안의 창이라 서버 컴포넌트가 아니라 여기서)
export async function loadPhotonet(characterId: string): Promise<OpsResult<PhotonetView>> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: "로그인이 필요합니다." };
  try {
    const res = await fetch(`${API_BASE_URL}/characters/${encodeURIComponent(characterId)}/chat/ops/photonet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    return res.ok ? { ok: true, data: data as PhotonetView } : { ok: false, error: data?.message ?? `HTTP ${res.status}` };
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function createPhotonet(characterId: string, input: { prompt: string; style: string; ratio: string }) {
  return call<{ image: { id: string; url: string }; balance: number }>(characterId, "photonet", input);
}

export async function refreshBoard(characterId: string) {
  return call<{ posts: BoardPost[]; balance: number }>(characterId, "board/refresh");
}

export async function writeBoardPost(characterId: string, post: { title: string; body: string; anonymous: boolean }) {
  return call<{ post: BoardPost; balance: number }>(characterId, "board/posts", post);
}
