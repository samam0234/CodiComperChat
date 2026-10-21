// 대화 글 꾸미기(마크다운 비슷한 표기)를 읽는다. HTML을 만들지 않고 "무엇을 어떻게 그릴지"만 돌려준다 —
// 그리는 쪽(components/chat-text.tsx)이 React 요소로만 만들기 때문에 글 속 태그가 실행될 수 없다.
//
// 인라인: `코드` · ***굵은 기울임*** · **굵게** · *기울임(상황 설명)* · ~취소선~ · {{user}}(내 이름으로)
// 블록:   # 제목(1~3개) · --- / *** 구분선 · > 선 있는 인용 · >붙여쓰기 = 위아래 여백 · * 목록
//         ``` 상자 ``` · ```InfoBox 제목 ... ``` 접고 펴는 정보창 · @이름 말한 사람 표시 · @ 서술(내레이터)

export type Inline =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "em"; children: Inline[] }
  | { type: "strong"; children: Inline[] }
  | { type: "strongEm"; children: Inline[] }
  | { type: "del"; children: Inline[] };

export type Block =
  | { type: "paragraph"; lines: Inline[][] }
  | { type: "spaced"; lines: Inline[][] }
  | { type: "heading"; level: 1 | 2 | 3; content: Inline[] }
  | { type: "rule" }
  | { type: "quote"; lines: Inline[][] }
  | { type: "list"; items: Inline[][] }
  | { type: "codeBlock"; text: string }
  | { type: "infoBox"; title: string; body: Block[] }
  // 말한 사람을 밝힌 글(@이름) 또는 서술(@만, who가 null)
  | { type: "speech"; who: string | null; lines: Inline[][] };

const MAX_DEPTH = 4;
// 한 글에서 꾸밀 수 있는 양의 한도 (아주 긴 글이 화면을 얼리지 않게)
const MAX_BLOCKS = 400;

// 글자·숫자 바로 옆의 ~는 꾸밈이 아니라 "안녕~" 같은 말투다
// 정규식 깃발 s·u와 뒤돌아보기는 ES2018이라, 타입 검사 설정(target)에 걸리지 않게 문자열로 만든다 (브라우저는 모두 지원)
const INLINE = new RegExp(String.raw`\x60([^\x60\n]+)\x60|\*\*\*(?!\s)(.+?)(?<!\s)\*\*\*|\*\*(?!\s)(.+?)(?<!\s)\*\*|\*(?![\s*])(.+?)(?<![\s*])\*|(?<![\p{L}\p{N}])~(?![\s~])(.+?)(?<![\s~])~(?![\p{L}\p{N}])`, "gsu");

export function parseInline(source: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of source.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ type: "text", text: source.slice(last, at) });
    const [, code, strongEm, strong, em, del] = m;
    const nest = (s: string) => (depth + 1 >= MAX_DEPTH ? [{ type: "text", text: s } as Inline] : parseInline(s, depth + 1));
    if (code !== undefined) out.push({ type: "code", text: code });
    else if (strongEm !== undefined) out.push({ type: "strongEm", children: nest(strongEm) });
    else if (strong !== undefined) out.push({ type: "strong", children: nest(strong) });
    else if (em !== undefined) out.push({ type: "em", children: nest(em) });
    else if (del !== undefined) out.push({ type: "del", children: nest(del) });
    last = at + m[0].length;
  }
  if (last < source.length) out.push({ type: "text", text: source.slice(last) });
  return out;
}

// {{user}}를 내 이름으로. 이름 안에 또 {{user}}가 있어도 한 번만 바꾼다
export function fillUser(text: string, userName: string): string {
  return text.replace(/\{\{\s*user\s*\}\}/gi, () => userName);
}

const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const HEADING = /^(#{1,3})\s+(.+)$/;
const QUOTE = /^>\s+(.*)$/;
const SPACED = /^>(\S.*)$/;
const LIST = /^\*\s+(.*)$/;
const SPEECH = /^@(\S+)(?:\s+(.*))?$/;
const NARRATION = /^@(?:\s+(.*))?$/;

// 빈 줄이 아닌 일반 줄을 문단으로 묶는다
type Pending = { kind: "paragraph" | "spaced" | "quote" | "speech"; who?: string | null; lines: Inline[][] } | { kind: "list"; items: Inline[][] };

function parseLines(text: string, depth: number): Block[] {
  const blocks: Block[] = [];
  let pending: Pending | null = null;
  const flush = () => {
    if (!pending) return;
    if (pending.kind === "list") blocks.push({ type: "list", items: pending.items });
    else if (pending.kind === "speech") blocks.push({ type: "speech", who: pending.who ?? null, lines: pending.lines });
    else blocks.push({ type: pending.kind, lines: pending.lines });
    pending = null;
  };

  for (const line of text.split("\n")) {
    if (blocks.length >= MAX_BLOCKS) break;
    if (line.trim() === "") {
      flush();
      continue;
    }
    let m: RegExpMatchArray | null;
    if (RULE.test(line)) {
      flush();
      blocks.push({ type: "rule" });
    } else if ((m = line.match(HEADING))) {
      flush();
      blocks.push({ type: "heading", level: m[1].length as 1 | 2 | 3, content: parseInline(m[2], depth) });
    } else if ((m = line.match(QUOTE))) {
      if (pending?.kind !== "quote") {
        flush();
        pending = { kind: "quote", lines: [] };
      }
      pending.lines.push(parseInline(m[1], depth));
    } else if ((m = line.match(SPACED))) {
      if (pending?.kind !== "spaced") {
        flush();
        pending = { kind: "spaced", lines: [] };
      }
      pending.lines.push(parseInline(m[1], depth));
    } else if ((m = line.match(LIST))) {
      if (pending?.kind !== "list") {
        flush();
        pending = { kind: "list", items: [] };
      }
      pending.items.push(parseInline(m[1], depth));
    } else if ((m = line.match(SPEECH))) {
      // @이름 뒤에 이어지는 줄들은 빈 줄이나 다른 표기가 나올 때까지 그 사람의 말이다
      flush();
      pending = { kind: "speech", who: m[1], lines: m[2] ? [parseInline(m[2], depth)] : [] };
    } else if ((m = line.match(NARRATION))) {
      flush();
      pending = { kind: "speech", who: null, lines: m[1] ? [parseInline(m[1], depth)] : [] };
    } else {
      if (!pending || pending.kind === "list" || pending.kind === "quote" || pending.kind === "spaced") {
        flush();
        pending = { kind: "paragraph", lines: [] };
      }
      pending.lines.push(parseInline(line, depth));
    }
  }
  flush();
  return blocks;
}

// ``` 로 감싼 부분을 먼저 떼어 내고, 나머지를 줄 단위로 읽는다. 닫히지 않은 ```는 그냥 글자로 둔다
export function parseChat(source: string, depth = 0): Block[] {
  const text = source.replace(/\r\n/g, "\n");
  const blocks: Block[] = [];
  const fence = /```([\s\S]*?)```/g;
  let last = 0;
  for (const m of text.matchAll(fence)) {
    const at = m.index ?? 0;
    blocks.push(...parseLines(text.slice(last, at), depth));
    const inner = m[1];
    const info = inner.match(/^\s*infobox\b[ \t]*([\s\S]*)$/i);
    if (info && depth === 0) {
      const rest = info[1].replace(/^\n/, "");
      const newline = rest.indexOf("\n");
      // 첫 줄은 제목, 나머지가 내용. 한 줄뿐이면 제목은 "정보"
      const title = newline === -1 ? "정보" : rest.slice(0, newline).trim() || "정보";
      const body = newline === -1 ? rest : rest.slice(newline + 1);
      blocks.push({ type: "infoBox", title, body: parseChat(body, depth + 1).filter((b) => b.type !== "infoBox") });
    } else {
      blocks.push({ type: "codeBlock", text: inner.replace(/^\n/, "").replace(/\n$/, "") });
    }
    last = at + m[0].length;
  }
  blocks.push(...parseLines(text.slice(last), depth));
  return blocks.slice(0, MAX_BLOCKS);
}
