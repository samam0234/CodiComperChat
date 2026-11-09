import { NextResponse } from "next/server";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

export const maxDuration = 60;

function socketUrl(base: string): string {
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/chat";
  url.search = "";
  return url.toString();
}

// 추론은 하지 않는다. 로그인한 요청으로 일회용 표를 받아 브라우저가 API 웹소켓에 붙게 한다
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const token = await getSessionToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id)}/chat/live`, {
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

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json({ ticket: data.ticket, wsUrl: socketUrl(API_BASE_URL) });
}
