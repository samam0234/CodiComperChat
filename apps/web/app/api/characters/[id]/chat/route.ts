import { NextResponse } from "next/server";

// Nest로 넘기기만 하는 얇은 중계다. 추론은 하지 않는다 (계획서 §7.1).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";
  const body = await request.json();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/characters/${id}/chat`, {
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
