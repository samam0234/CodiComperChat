import { NextResponse, type NextRequest } from "next/server";

// apps/api/src/security/https.ts 와 같은 규칙. 공개 호스트의 운영 서버는 https만 받는다.
export const HSTS_VALUE = "max-age=15552000; includeSubDomains";

export function isLoopbackHost(host: string): boolean {
  const name = host.split(":")[0].replace(/^\[|\]$/g, "").toLowerCase();
  return name === "localhost" || name === "127.0.0.1" || name === "::1";
}

function protoOf(request: NextRequest): string {
  return (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
}

export function enforceHttps(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const local = isLoopbackHost(host);
  const proto = protoOf(request);
  if (process.env.NODE_ENV === "production" && process.env.REQUIRE_HTTPS !== "1" && !local) {
    return new NextResponse("운영 서버는 REQUIRE_HTTPS=1 이 있어야 합니다.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (process.env.REQUIRE_HTTPS === "1" && !local && proto !== "https") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  return null;
}

export function applyTransport(response: NextResponse, request: NextRequest): void {
  if (protoOf(request) === "https") response.headers.set("Strict-Transport-Security", HSTS_VALUE);
}
