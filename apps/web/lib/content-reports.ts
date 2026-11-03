// 그림 신고 사유. 정본은 Nest(apps/api/src/content-reports)다.
export const CONTENT_REPORT_REASONS = [
  { value: "MINOR", label: "미성년자로 보임" },
  { value: "PHOTOREAL", label: "실사와 너무 비슷함" },
  { value: "NONCONSENT", label: "동의 없는 성적 묘사" },
  { value: "REAL_PERSON", label: "실존 인물" },
  { value: "OTHER", label: "기타" },
] as const;
