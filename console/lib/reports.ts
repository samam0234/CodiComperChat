// 신고·운영자 화면의 웹 쪽 모양. 정본(사유 목록·검증)은 Nest(apps/api/src/reports)다

export const REPORT_REASONS = [
  { value: "SEXUAL", label: "선정적·성적인 내용" },
  { value: "VIOLENCE", label: "폭력·자해·위험한 내용" },
  { value: "HATE", label: "혐오·차별·괴롭힘" },
  { value: "PRIVACY", label: "실존 인물·개인정보" },
  { value: "COPYRIGHT", label: "저작권·도용" },
  { value: "SPAM", label: "광고·스팸" },
  { value: "OTHER", label: "기타" },
] as const;

export const reasonLabel = (value: string) => REPORT_REASONS.find((r) => r.value === value)?.label ?? value;

export type OpenGroup = {
  character: {
    id: string;
    name: string;
    oneLiner: string;
    visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
    takenDownAt: string | null;
    owner: { id: string; displayName: string; email: string } | null;
  };
  reports: { id: string; reason: string; detail: string; createdAt: string; reporter: { displayName: string } }[];
};

export type TakenDown = {
  id: string;
  name: string;
  takenDownAt: string;
  takedownReason: string | null;
  owner: { displayName: string } | null;
};

export type AdminReportsView = { open: OpenGroup[]; takenDown: TakenDown[] };
