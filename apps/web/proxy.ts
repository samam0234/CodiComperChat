import { NextResponse, type NextRequest } from "next/server";

const MEMBER_ONLY = ["/library", "/studio", "/me"];
// 캐릭터 채팅은 내 프로필 캐릭터가 있어야 하므로 로그인 전용이다. 캐릭터 상세는 누구나 본다
const MEMBER_ONLY_PATTERN = /^\/characters\/[^/]+\/chat(\/|$)/;

// 쿠키 유무만 보는 빠른 1차 거름망이다. 토큰이 진짜인지는 각 페이지의 requireUser()가 Nest에 확인한다
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const memberOnly =
    MEMBER_ONLY.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    MEMBER_ONLY_PATTERN.test(pathname);

  if (memberOnly && !request.cookies.has("session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/studio/:path*", "/me/:path*", "/characters/:id/chat", "/characters/:id/chat/:path*"],
};
