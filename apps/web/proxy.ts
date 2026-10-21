import { NextResponse, type NextRequest } from "next/server";

const MEMBER_ONLY = ["/library", "/studio", "/me", "/billing"];
// 캐릭터 채팅은 내 프로필 캐릭터가 있어야 하므로 로그인 전용이다. 캐릭터 상세는 누구나 본다
const MEMBER_ONLY_PATTERN = /^\/characters\/[^/]+\/chat(\/|$)/;

// 토스페이먼츠 결제창(요금 안내에서 결제할 때만 스크립트를 받는다)
const TOSS = "https://*.tosspayments.com";

// 엄격한 CSP: 요청마다 새 nonce를 만들고, 그 nonce가 붙은 스크립트(Next가 자동으로 붙인다)와
// 그 스크립트가 불러온 스크립트('strict-dynamic')만 실행한다. 사용자가 쓴 글에 <script>가 섞여 들어가도 실행되지 않는다.
// 개발 서버는 HMR·React 새로 고침이 eval과 웹소켓을 써서 그것만 더 연다
export function contentSecurityPolicy(nonce: string, dev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.tosspayments.com${dev ? " 'unsafe-eval'" : ""}`,
    // Next·React가 style 속성을 쓰므로 스타일만은 인라인을 허용한다 (스크립트 실행과는 무관)
    "style-src 'self' 'unsafe-inline'",
    // 초상 미리보기(blob:), 작은 아이콘(data:)
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${TOSS}${dev ? " ws: wss:" : ""}`,
    `frame-src ${TOSS}`,
    "object-src 'none'",
    "base-uri 'self'",
    `form-action 'self' ${TOSS}`,
    "frame-ancestors 'none'",
    // 막은 내용을 /api/csp-report로 바로 알려 준다. report-to(Reporting API)를 함께 쓰면 크롬이 report-uri를 무시하는데,
    // report-to는 모아서 늦게 보내고 http 개발 환경에서는 전달되지 않아 확인할 수 없었다 — 바로 보내는 report-uri만 쓴다
    "report-uri /api/csp-report",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

// 쿠키 유무만 보는 빠른 1차 거름망이다. 토큰이 진짜인지는 각 페이지의 requireUser()가 Nest에 확인한다
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy(nonce, process.env.NODE_ENV !== "production");

  const memberOnly =
    MEMBER_ONLY.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    MEMBER_ONLY_PATTERN.test(pathname);

  let response: NextResponse;
  if (memberOnly && !request.cookies.has("session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    response = NextResponse.redirect(loginUrl);
  } else {
    // Next는 요청 헤더의 CSP에서 nonce를 읽어 자기 스크립트에 붙인다
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", policy);
    response = NextResponse.next({ request: { headers } });
  }
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  // 화면 요청에만 (정적 파일·이미지 최적화·초상 중계 같은 API 라우트는 뺀다). 미리 가져오기(prefetch)도 뺀다
  matcher: [
    {
      source: "/((?!_next/static|_next/image|api/|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
