// Nest 운영자 경로의 응답 모양 (정본은 apps/api)

export type PendingPortrait = {
  draftId: string;
  name: string;
  note: string;
  updatedAt: string;
  published: boolean;
  owner: string;
  ownerEmail: string;
};

export type AdminCharacter = {
  id: string;
  name: string;
  oneLiner: string;
  published: boolean;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  hasPortrait: boolean;
  takenDownAt: string | null;
  takedownReason: string | null;
  createdAt: string;
  updatedAt: string;
  official: boolean;
  owner: { displayName: string; email: string } | null;
  conversations: number;
  openReports: number;
};
