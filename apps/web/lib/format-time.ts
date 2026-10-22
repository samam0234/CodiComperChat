// 서버(Node)와 브라우저가 같은 글자를 그리도록 한국 시간으로 직접 만든다.
// toLocaleString("ko-KR")은 서버가 "AM", 브라우저가 "오전"으로 달라 하이드레이션 불일치가 난다 (클라이언트 컴포넌트에서 쓰는 날짜용)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kst(iso: string) {
  const d = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

// 10월 15일
export function formatDay(iso: string): string {
  const t = kst(iso);
  return `${t.month}월 ${t.day}일`;
}

// 오전 1:12 (문자 시각처럼 시각만)
export function formatTime(iso: string): string {
  const t = kst(iso);
  return `${t.hour < 12 ? "오전" : "오후"} ${t.hour % 12 === 0 ? 12 : t.hour % 12}:${String(t.minute).padStart(2, "0")}`;
}

// 10월 15일 10:56
export function formatDayTime(iso: string): string {
  const t = kst(iso);
  return `${t.month}월 ${t.day}일 ${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}
