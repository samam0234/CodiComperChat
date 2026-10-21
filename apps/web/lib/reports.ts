// 신고 사유 목록의 웹 쪽 모양. 정본(사유 목록·검증)은 Nest(apps/api/src/reports)다. 운영자 신고함은 console/

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
