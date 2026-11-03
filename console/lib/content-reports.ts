export type ContentReportItem = {
  id: string;
  target: "PHOTONET" | "WEBTOON";
  reason: string;
  detail?: string;
  resolution?: string | null;
  createdAt?: string;
  resolvedAt?: string | null;
  reporter: { displayName: string };
  missing: boolean;
  label: string;
  rating: string;
  characterName: string;
  owner: { id: string; displayName: string; email: string } | null;
  panels: number[];
  ownerSuspended: boolean;
};

export type ContentReportsView = {
  reasons: { value: string; label: string }[];
  open: ContentReportItem[];
  blocked: ContentReportItem[];
};

export const targetLabel = (target: ContentReportItem["target"]) => (target === "PHOTONET" ? "코디포토넷" : "웹툰");
