import { NextResponse } from "next/server";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// AI 답을 기다리는 중계라 함수 시간을 최대로 둔다 (app/layout.tsx의 maxDuration과 같은 이유)
export const maxDuration = 300;

// Nest로 넘기기만 하는 얇은 중계다. 추론은 하지 않는다 (계획서 §7.1).
// 로그인 토큰은 httpOnly 쿠키에서 서버가 꺼내 붙인다 — 브라우저 JS는 토큰을 모른다.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const token = await getSessionToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id)}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: body.message,
        personaId: body.personaId,
        model: body.model,
      }),
    });
  } catch {
    return NextResponse.json(
      { message: "API에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요." },
      { status: 502 },
    );
  }

  return NextResponse.json(await res.json(), { status: res.status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getSessionToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id)}/chat`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return NextResponse.json(
      { message: "대화를 다시 읽지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
  return NextResponse.json(await res.json().catch(() => ({ message: "대화를 읽지 못했어요." })), { status: res.status });
}
