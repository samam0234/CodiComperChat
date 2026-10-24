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
// rating: sfw(전체 이용가) · nsfw(성인). 성인 확인이 없으면 Nest가 nsfw 그림을 아예 싣지 않는다
export type PhotonetRating = "sfw" | "nsfw";
export type PhotonetImage = {
  id: string;
  prompt: string;
  style: string;
  ratio: string;
  rating: PhotonetRating;
  width: number;
  height: number;
  createdAt: string;
};
export type PhotonetView = OpsBase & {
  ready: boolean;
  styles: string[];
  ratios: string[];
  // 성인 모드를 쓸 수 있나. 안 되면 message가 이유 (설정에서 성인 확인), blockedStyles는 성인 모드에서 못 고르는 화풍
  nsfw: { allowed: boolean; reason: string | null; message: string | null; blockedStyles: string[] };
  images: PhotonetImage[];
};

// 비밀 퀘스트: 퀘스트가 없으면 exists false. 건네기 전(locked)에는 제목·내용을 주지 않는다
export type QuestView =
  | { exists: false }
  | { exists: true; started: boolean; credits: number; rewarded: boolean; status: "locked" }
  | {
      exists: true;
      started: boolean;
      credits: number;
      rewarded: boolean;
      status: "offered" | "done";
      title: string;
      offer: string;
      objective: string;
      // 달성한 뒤에만
      reward: string | null;
    };

export const getQuest = (characterId: string) => authedGet<QuestView>(`/characters/${encodeURIComponent(characterId)}/chat/quest`);

// 웹툰: 콘티(컷마다 해설·대사)와 그린 컷. 그림 본문은 /api/characters/:id/webtoon/:webtoonId/:index 중계로
export type WebtoonLine = { speaker: string; text: string };
export type WebtoonPanel = { index: number; caption: string; lines: WebtoonLine[]; drawn: boolean; width: number | null; height: number | null };
export type Webtoon = { id: string; title: string; prompt: string; rating: PhotonetRating; createdAt: string; panels: WebtoonPanel[] };
export type WebtoonView = OpsBase & {
  ready: boolean;
  minPanels: number;
  maxPanels: number;
  nsfw: { allowed: boolean; reason: string | null; message: string | null };
  webtoons: Webtoon[];
};

export const getWebtoons = (characterId: string) => authedGet<WebtoonView>(ops(characterId, "webtoon"));

export const photonetSrc = (characterId: string, imageId: string) =>
  `/api/characters/${encodeURIComponent(characterId)}/photonet/${encodeURIComponent(imageId)}`;
