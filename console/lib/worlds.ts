// 월드코퍼챗 운영 화면의 모양 (Nest apps/api/src/worlds/admin-worlds.service.ts 응답)
export type Review = "APPROVED" | "PENDING" | "REJECTED";
export type WorldMode = "CHAT" | "VISUAL_NOVEL" | "NOVEL" | "MESSENGER";
export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type Owner = { id: string; email: string; displayName: string } | null;

export type WorldStats = {
  worlds: number;
  published: number;
  takenDown: number;
  plays: number;
  pendingReview: number;
  today: { day: string; events: number; rewarded: number; credits: number };
};

export type AdminWorldRow = {
  id: string;
  title: string;
  oneLiner: string;
  mode: WorldMode;
  modeLabel: string;
  visibility: Visibility;
  published: boolean;
  takenDownAt: string | null;
  takedownReason: string | null;
  updatedAt: string;
  owner: Owner;
  counts: { cast: number; parts: number; plays: number; images: number };
  pendingImages: number;
};

export type AdminWorldDetail = {
  id: string;
  title: string;
  oneLiner: string;
  setting: string;
  rules: string;
  opening: string;
  mode: WorldMode;
  modeLabel: string;
  visibility: Visibility;
  published: boolean;
  takenDownAt: string | null;
  takedownReason: string | null;
  hasMap: boolean;
  mapReview: Review;
  createdAt: string;
  updatedAt: string;
  owner: Owner;
  cast: { name: string; summary: string; speech: string; startPlace: string; homePlace: string; characterId: string | null }[];
  places: { name: string; x: number; y: number; note: string }[];
  parts: { title: string; goal: string; opening: string }[];
  images: { id: string; label: string; character: string; review: Review; reviewNote: string | null; blockedAt: string | null; createdAt: string }[];
  plays: { total: number; finished: number };
  events: Partial<Record<"OPEN" | "WON" | "LOST" | "EXPIRED", number>>;
};

export type ReviewQueue = {
  images: { id: string; label: string; character: string; reviewNote: string | null; createdAt: string; world: { id: string; title: string; owner: { email: string } | null } }[];
  maps: { id: string; title: string; updatedAt: string; owner: { email: string } | null }[];
};

export type AdminWorldEvent = {
  id: string;
  kind: string;
  label: string;
  status: "OPEN" | "WON" | "LOST" | "EXPIRED";
  reward: number;
  rewarded: boolean;
  rewardDay: string | null;
  createdAt: string;
  resolvedAt: string | null;
  play: { personaName: string; user: { id: string; email: string }; world: { id: string; title: string } };
};

export const VISIBILITY_LABEL: Record<Visibility, string> = { PUBLIC: "공개", UNLISTED: "링크 공개", PRIVATE: "비공개" };
export const REVIEW_LABEL: Record<Review, string> = { APPROVED: "통과", PENDING: "검수 대기", REJECTED: "거절" };
export const EVENT_STATUS_LABEL = { OPEN: "진행 중", WON: "승리", LOST: "패배", EXPIRED: "만료" } as const;
