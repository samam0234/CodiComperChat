import { NextResponse } from "next/server";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

export const maxDuration = 300;

export async function POST(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const { id, messageId } = await params;
  const body = await request.json().catch(() => ({}));
  const token = await getSessionToken();
  let res: Response;
  try {
    res = await fetch(
      `${API_BASE_URL}/characters/${encodeURIComponent(id)}/chat/messages/${encodeURIComponent(messageId)}/rewrite`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ direction: body.direction, personaId: body.personaId, model: body.model }),
      },
    );
  } catch {
    return NextResponse.json({ message: "API에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요." }, { status: 502 });
  }
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
