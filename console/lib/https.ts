import { NextResponse, type NextRequest } from "next/server";

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

// 운영 콘솔은 공개 호스트에서 허용 목록이 없으면 열지 않는다. 앞단이 X-Forwarded-For를 덮어써야 한다.
export function enforceConsoleNetwork(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? "";
  if (process.env.NODE_ENV !== "production" || isLoopbackHost(host) || process.env.CONSOLE_ALLOW_PUBLIC === "1") return null;
  const ip = (request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "").split(",")[0].trim();
  const allowed = (process.env.CONSOLE_IP_ALLOWLIST ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (ip && allowed.includes(ip)) return null;
  return new NextResponse("운영 콘솔은 허용된 네트워크에서만 열 수 있습니다.", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
