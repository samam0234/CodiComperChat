import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";

// 오퍼레이션(대화 플러그인) 화면용 조회. 만들기·쓰기는 app/actions/operations.ts
async function authedGet<T>(path: string): Promise<T | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const ops = (characterId: string, path: string) => `/characters/${encodeURIComponent(characterId)}/chat/ops/${path}`;

// 모든 오퍼레이션 화면에 공통: 캐릭터, 진행 중인 대화가 있는지, 이번 일의 값, 내 코레딧
export type OpsBase = { character: { id: string; name: string }; started: boolean; cost: number; balance: number };

export type MindReading = { id: string; innerVoice: string; feeling: string; aboutUser: string; createdAt: string };
export type MindView = OpsBase & { readings: MindReading[] };

export const getMind = (characterId: string) => authedGet<MindView>(ops(characterId, "mind"));

export type DiaryEntry = { id: string; title: string; mood: string; body: string; createdAt: string };
export type DiaryView = OpsBase & { entries: DiaryEntry[] };

export const getDiary = (characterId: string) => authedGet<DiaryView>(ops(characterId, "diary"));

export type DirectMessage = { id: string; role: "user" | "character"; text: string; createdAt: string };
export type MessagesView = OpsBase & { messages: DirectMessage[] };

export const getMessages = (characterId: string) => authedGet<MessagesView>(ops(characterId, "messages"));

export type BoardAuthorKind = "USER" | "RESIDENT";
export type BoardComment = { id: string; authorKind: BoardAuthorKind; authorName: string; body: string; createdAt: string };
export type BoardPost = {
  id: string;
  authorKind: BoardAuthorKind;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  comments: BoardComment[];
};
// cost: 새 글 불러오기, postCost: 내 글 쓰기. persona: 실명으로 쓸 때의 내 주인공 이름
export type BoardView = OpsBase & { postCost: number; persona: string | null; posts: BoardPost[] };

export const getBoard = (characterId: string) => authedGet<BoardView>(ops(characterId, "board"));

// 코디포토넷: ready는 그림 엔진(Stable Diffusion WebUI)이 켜져 있는지. 그림 본문은 /api/characters/:id/photonet/:imageId
export type PhotonetImage = { id: string; prompt: string; style: string; ratio: string; width: number; height: number; createdAt: string };
export type PhotonetView = OpsBase & { ready: boolean; styles: string[]; ratios: string[]; images: PhotonetImage[] };

export const photonetSrc = (characterId: string, imageId: string) =>
  `/api/characters/${encodeURIComponent(characterId)}/photonet/${encodeURIComponent(imageId)}`;
