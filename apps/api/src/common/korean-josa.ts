// 은/는·이/가처럼 받침에 따라 갈리는 조사를 붙인다.
// "이(가)"처럼 두 조사를 괄호로 나란히 두지 않는다.

export type JosaPair = "이/가" | "은/는" | "을/를" | "과/와" | "으로/로" | "이라고/라고";

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

function lastHangul(word: string): string | null {
  for (let i = word.length - 1; i >= 0; i -= 1) {
    const code = word.charCodeAt(i);
    if (code >= HANGUL_BASE && code <= HANGUL_LAST) return word[i];
  }
  return null;
}

// 받침이 있으면 true. 한글이 없으면 받침 없음으로 본다 (가·는·를·와·라고).
export function hasBatchim(word: string): boolean {
  const ch = lastHangul(word);
  if (!ch) return false;
  return (ch.charCodeAt(0) - HANGUL_BASE) % 28 !== 0;
}

// ㄹ 받침은 "으로"가 아니라 "로"다.
function rieulBatchim(word: string): boolean {
  const ch = lastHangul(word);
  if (!ch) return false;
  return (ch.charCodeAt(0) - HANGUL_BASE) % 28 === 8;
}

export function particle(word: string, pair: JosaPair): string {
  const batchim = hasBatchim(word);
  switch (pair) {
    case "이/가":
      return batchim ? "이" : "가";
    case "은/는":
      return batchim ? "은" : "는";
    case "을/를":
      return batchim ? "을" : "를";
    case "과/와":
      return batchim ? "과" : "와";
    case "으로/로":
      return batchim && !rieulBatchim(word) ? "으로" : "로";
    case "이라고/라고":
      return batchim ? "이라고" : "라고";
    default: {
      const _never: never = pair;
      return _never;
    }
  }
}

export function josa(word: string, pair: JosaPair): string {
  return `${word}${particle(word, pair)}`;
}

const MARK: Record<string, JosaPair> = {
  "이(가)": "이/가",
  "가(이)": "이/가",
  "(이)가": "이/가",
  "은(는)": "은/는",
  "는(은)": "은/는",
  "(은)는": "은/는",
  "을(를)": "을/를",
  "를(을)": "을/를",
  "(을)를": "을/를",
  "와(과)": "과/와",
  "과(와)": "과/와",
  "(와)과": "과/와",
  "(이)라고": "이라고/라고",
  "(으)로": "으로/로",
};

// 모델이 "유지성이(가)"처럼 조사를 괄호로 남겨 둔 문장을 고친다.
const PAREN = /([0-9A-Za-z가-힣][0-9A-Za-z가-힣 _'’-]{0,40}?)(이\(가\)|가\(이\)|\(이\)가|은\(는\)|는\(은\)|\(은\)는|을\(를\)|를\(을\)|\(을\)를|와\(과\)|과\(와\)|\(와\)과|\(이\)라고|\(으\)로)/g;

export function fixParentheticalJosa(text: string): string {
  return text.replace(PAREN, (whole, name: string, mark: string) => {
    const pair = MARK[mark];
    if (!pair) return whole;
    const trimmed = name.trimEnd();
    const gap = name.slice(trimmed.length);
    return `${josa(trimmed, pair)}${gap}`;
  });
}
