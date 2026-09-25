import { NextResponse, type NextRequest } from "next/server";

const MEMBER_ONLY = ["/library", "/studio", "/me"];

// 쿠키 유무만 보는 빠른 1차 거름망이다. 토큰이 진짜인지는 각 페이지의 requireUser()가 Nest에 확인한다
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const memberOnly = MEMBER_ONLY.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (memberOnly && !request.cookies.has("session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/studio/:path*", "/me/:path*"],
};
