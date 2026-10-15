// CSP 위반 보고 받기. 브라우저가 CSP 때문에 막은 스크립트·이미지·연결을 알려 주면 서버 로그에 한 줄로 남긴다.
// 새 외부 자원을 붙였는데 proxy.ts의 CSP에 출처를 더하지 않았을 때, 이용자 화면에서 조용히 깨지는 것을 로그로 알 수 있다.
// 누구나 보낼 수 있는 주소라: 본문 크기를 제한하고, 필요한 칸만 잘라 남기며(주소의 쿼리는 버림), 1분에 남기는 줄 수를 제한한다

const MAX_BODY = 16 * 1024;
const MAX_LINES_PER_MINUTE = 30;
let windowStart = 0;
let linesInWindow = 0;

type Violation = { directive: string; blocked: string; page: string };

// 쿼리·조각은 버린다 (토큰 같은 값이 로그에 남지 않게)
function clean(url: unknown): string {
  if (typeof url !== "string" || !url) return "";
  if (!/^[a-z]+:/i.test(url)) return url.slice(0, 40); // inline, eval 같은 키워드
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.slice(0, 200);
  } catch {
    return "";
  }
}

function fromLegacy(body: Record<string, unknown>): Violation | null {
  const r = body["csp-report"] as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    directive: String(r["effective-directive"] ?? r["violated-directive"] ?? "").slice(0, 60),
    blocked: clean(r["blocked-uri"]),
    page: clean(r["document-uri"]),
  };
}

function fromReportingApi(item: Record<string, unknown>): Violation | null {
  if (item.type !== "csp-violation") return null;
  const b = (item.body ?? {}) as Record<string, unknown>;
  return {
    directive: String(b.effectiveDirective ?? "").slice(0, 60),
    blocked: clean(b.blockedURL),
    page: clean(b.documentURL ?? item.url),
  };
}

export async function POST(request: Request) {
  const text = await request.text().catch(() => "");
  if (text.length === 0 || text.length > MAX_BODY) return new Response(null, { status: 204 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204 });
  }
  const items = Array.isArray(parsed) ? parsed : [parsed];
  const violations = items
    .map((item) => (item && typeof item === "object" ? (fromLegacy(item as Record<string, unknown>) ?? fromReportingApi(item as Record<string, unknown>)) : null))
    .filter((v): v is Violation => !!v && !!v.directive)
    .slice(0, 10);

  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    linesInWindow = 0;
  }
  for (const v of violations) {
    if (linesInWindow >= MAX_LINES_PER_MINUTE) break;
    linesInWindow++;
    console.warn(`[CSP 위반] ${v.directive} 막음: ${v.blocked || "(알 수 없음)"} · 화면: ${v.page}`);
  }
  // 보내는 쪽(브라우저)에는 결과를 알려 줄 필요가 없다
  return new Response(null, { status: 204 });
}
