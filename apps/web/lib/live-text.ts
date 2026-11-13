// 첫 글자는 즉시 표시하고, 큰 토큰 조각도 몇 프레임 안에 따라잡는다.
export function liveText(
  show: (text: string) => void,
  schedule: (callback: () => void) => number,
  cancel: (id: number) => void,
) {
  let text = "";
  let pending: string[] = [];
  let frame: number | null = null;

  const tick = () => {
    frame = null;
    const count = Math.max(1, Math.ceil(pending.length / 3));
    text += pending.splice(0, count).join("");
    show(text);
    if (pending.length) frame = schedule(tick);
  };
  const clear = () => {
    if (frame !== null) cancel(frame);
    frame = null;
    pending = [];
  };
  return {
    append(chunk: string) {
      pending.push(...Array.from(chunk));
      if (frame === null && pending.length) {
        text += pending.shift();
        show(text);
        if (pending.length) frame = schedule(tick);
      }
    },
    replace(value: string) {
      clear();
      text = value;
      show(text);
    },
    finish() {
      text += pending.join("");
      clear();
      show(text);
    },
    dispose: clear,
  };
}
