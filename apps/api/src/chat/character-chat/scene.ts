// 대화 한 턴에서 때와 곳을 고른다. 이미 있는 값은 이번 글에 단서가 있을 때만 바꾼다.

export type Scene = { time: string | null; place: string | null };

// 긴 말을 먼저 본다. "아침"이 "이른 아침"보다 앞에 있으면 짧은 쪽이 이긴다.
const TIME_WORDS = ["이른 아침", "새벽", "오전", "점심", "한낮", "아침", "오후", "저녁", "한밤", "심야", "낮", "밤"];

function clip(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 24);
}

export function noticeScene(text: string, prev: Scene): Scene {
  let time = prev.time;
  let place = prev.place;

  const labeledTime = text.match(/(?:시간|시각)\s*[:：]\s*([^\n]{1,24})/);
  const labeledPlace = text.match(/(?:장소|위치)\s*[:：]\s*([^\n]{1,24})/);
  if (labeledTime?.[1]) time = clip(labeledTime[1]);
  if (labeledPlace?.[1]) place = clip(labeledPlace[1]);

  if (!labeledTime) {
    const clock = text.match(/([0-1]?\d|2[0-4])\s*시(?:\s*([0-5]?\d)\s*분)?/);
    if (clock) {
      const hour = Number(clock[1]);
      time = clock[2] !== undefined ? `${hour}시 ${Number(clock[2])}분` : `${hour}시`;
    } else {
      const found = TIME_WORDS.find((word) => text.includes(word));
      if (found) time = found;
    }
  }

  if (!labeledPlace) {
    const moved = text.match(/([가-힣A-Za-z0-9]{2,16})(?:에서|에 도착|으로 갔다|로 갔다|에 왔다|으로 향했다|로 향했다)/);
    if (moved?.[1]) place = clip(moved[1]);
  }

  return { time, place };
}
