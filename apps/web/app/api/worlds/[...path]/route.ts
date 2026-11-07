import { NextResponse } from "next/server";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// AI 답을 기다리는 중계라 함수 시간을 최대로 둔다 (app/layout.tsx의 maxDuration과 같은 이유)
export const maxDuration = 300;

// 월드코퍼챗 중계 (Nest /worlds/*). 로그인 토큰은 httpOnly 쿠키에서 서버가 꺼내 붙인다 — 브라우저 JS는 토큰을 모른다.
// 그림(장면 그림·코퍼맵)은 본문을 그대로 흘려보내고, 올릴 때는 그림 원본을 그대로 넘긴다. 추론은 하지 않는다(계획서 §7.1)
type Ctx = { params: Promise<{ path: string[] }> };
const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"];

async function forward(request: Request, { params }: Ctx, method: string) {
  const { path } = await params;
  // 경로 조각마다 다시 인코딩해 "../" 같은 조작으로 다른 Nest 경로에 닿지 못하게 한다
  if (path.some((p) => p === "." || p === ".." || p === "")) return NextResponse.json({ message: "잘못된 경로예요." }, { status: 400 });
  const url = new URL(request.url);
  const target = `${API_BASE_URL}/worlds/${path.map(encodeURIComponent).join("/")}${url.search}`;
  const token = await getSessionToken();
  const contentType = request.headers.get("content-type") ?? "";
  const isImageUpload = IMAGE_TYPES.some((t) => contentType.startsWith(t));

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "DELETE") body = isImageUpload ? await request.arrayBuffer() : await request.text();

  let res: Response;
  try {
    res = await fetch(target, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": isImageUpload ? contentType : "application/json" } : {}),
      },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "API에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요." }, { status: 502 });
  }

  const resType = res.headers.get("content-type") ?? "";
  if (IMAGE_TYPES.some((t) => resType.startsWith(t)) && res.body) {
    return new Response(res.body, {
      headers: {
        "Content-Type": resType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  }
  if (res.status === 204) return new Response(null, { status: 204 });
  const data = await res.json().catch(() => ({ message: "응답을 읽지 못했어요." }));
  return NextResponse.json(data, { status: res.status });
}

export const GET = (request: Request, ctx: Ctx) => forward(request, ctx, "GET");
export const POST = (request: Request, ctx: Ctx) => forward(request, ctx, "POST");
export const PUT = (request: Request, ctx: Ctx) => forward(request, ctx, "PUT");
export const DELETE = (request: Request, ctx: Ctx) => forward(request, ctx, "DELETE");
