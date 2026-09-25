import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/auth";

// Nest로 넘기기만 하는 얇은 중계다. 추론을 여기서 하지 않는다 (계획서 §7.1).
// 브라우저에 API 주소를 노출하지 않으려고 둔 것이다.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/agent-chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: body.message, history: body.history }),
    });
  } catch {
    return NextResponse.json(
      { message: "API에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요." },
      { status: 502 },
    );
  }

  return NextResponse.json(await res.json(), { status: res.status });
}
