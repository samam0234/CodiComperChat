import { NextResponse } from "next/server";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// 대화 명령어(/다시·/계속·/되돌리기)를 Nest로 넘기기만 하는 얇은 중계다. 정해 둔 이름만 받는다
const ACTIONS = new Set(["regenerate", "continue", "undo"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params;
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ message: "알 수 없는 명령어입니다." }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const token = await getSessionToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id)}/chat/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ personaId: body.personaId, model: body.model }),
    });
  } catch {
    return NextResponse.json(
      { message: "API에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요." },
      { status: 502 },
    );
  }

  return NextResponse.json(await res.json(), { status: res.status });
}
