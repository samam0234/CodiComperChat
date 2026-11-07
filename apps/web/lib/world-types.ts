// 월드코퍼챗 (2026-11-06) 화면에서 쓰는 모양. Nest(apps/api/src/worlds)의 응답과 맞춘다
export type WorldMode = "CHAT" | "VISUAL_NOVEL" | "NOVEL" | "MESSENGER";
export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
export type Review = "APPROVED" | "PENDING" | "REJECTED";

export const MODE_LABELS: Record<WorldMode, { label: string; hint: string }> = {
  CHAT: { label: "기본 채팅형", hint: "말풍선 대화. 올린 장면 그림이 상황에 맞게 함께 나와요." },
  VISUAL_NOVEL: { label: "비주얼노벨형", hint: "그림 위 대사 상자를 한 줄씩 넘기며 읽어요." },
  NOVEL: { label: "소설형", hint: "3인칭 산문으로 이야기가 이어져요." },
  MESSENGER: { label: "메신저형", hint: "단체 대화방처럼 짧은 메시지가 오가요." },
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  PUBLIC: "공개 — 월드 목록에 나와요",
  UNLISTED: "링크 공개 — 주소를 아는 사람만",
  PRIVATE: "비공개 — 나만",
};

export type WorldSummary = {
  id: string;
  title: string;
  oneLiner: string;
  mode: WorldMode;
  visibility: Visibility;
  published: boolean;
  takenDown: boolean;
  updatedAt: string;
  hasMap: boolean;
  castCount: number;
  partCount: number;
  playCount: number;
};

export type Place = { name: string; x: number; y: number; note: string };
export type CastEdit = { name: string; summary: string; speech: string; startPlace: string; homePlace: string; characterId: string | null };
export type PartEdit = { title: string; goal: string; opening: string };
export type ImageMeta = { id: string; label: string; character: string; review: Review; reviewNote: string | null; blocked: boolean };

export type WorldEdit = {
  id: string;
  title: string;
  oneLiner: string;
  setting: string;
  rules: string;
  opening: string;
  mode: WorldMode;
  visibility: Visibility;
  published: boolean;
  takenDown: boolean;
  takedownReason: string | null;
  hasMap: boolean;
  mapReview: Review;
  updatedAt: string;
  cast: CastEdit[];
  places: Place[];
  parts: PartEdit[];
  images: ImageMeta[];
  problems: string[];
};

export type WorldDetail = {
  id: string;
  title: string;
  oneLiner: string;
  setting: string;
  mode: WorldMode;
  visibility: Visibility;
  published: boolean;
  mine: boolean;
  author: string;
  hasMap: boolean;
  imageCount: number;
  playCount: number;
  takenDown: { reason: string | null } | null;
  cast: { name: string; summary: string; homePlace: string; characterId: string | null }[];
  places: Place[];
  parts: { title: string }[];
};

export type Segment = { kind: "narration" | "line"; speaker: string | null; text: string };
export type PlayMessage = {
  id: string;
  role: "USER" | "CHARACTER" | "SYSTEM";
  content: string;
  imageId: string | null;
  createdAt: string;
  segments: Segment[] | null;
};

export type EventKind = "LADDER" | "DICE" | "BOWLING" | "LOTTERY" | "MAZE";
export type OpenEvent = {
  id: string;
  kind: EventKind;
  label: string;
  status: "OPEN";
  view: { lanes?: number; straws?: number; hint?: string; size?: number; cells?: number[]; timeLimitS?: number };
  expiresAt: string;
};
export type EventResult = {
  id: string;
  kind: EventKind;
  label: string;
  won: boolean;
  outcome: Record<string, unknown>;
  reward: number;
  rewarded: boolean;
  balance: number | null;
  rewardedToday: number;
  dailyRewardCap: number;
};

export type PlayState = {
  world: {
    id: string;
    title: string;
    mode: WorldMode;
    modeLabel: string;
    cast: { name: string; summary: string; homePlace: string }[];
    places: Place[];
    partTitles: string[];
    images: { id: string; label: string; character: string }[];
    hasMap: boolean;
    mine: boolean;
  };
  dailyRewardCap: number;
  rewardedToday?: number;
  play: null | {
    id: string;
    persona: { name: string; description: string };
    partIndex: number;
    finished: boolean;
    turns: number;
    locations: Record<string, string>;
    sceneTime?: string | null;
    scenePlace?: string | null;
    messages: PlayMessage[];
    event: OpenEvent | null;
  };
};

export const worldImageUrl = (worldId: string, imageId: string) => `/api/worlds/${encodeURIComponent(worldId)}/images/${encodeURIComponent(imageId)}`;
export const worldMapUrl = (worldId: string, version?: string) =>
  `/api/worlds/${encodeURIComponent(worldId)}/map${version ? `?v=${encodeURIComponent(version)}` : ""}`;
