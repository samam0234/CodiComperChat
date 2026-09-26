import { NextResponse } from "next/server";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

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
