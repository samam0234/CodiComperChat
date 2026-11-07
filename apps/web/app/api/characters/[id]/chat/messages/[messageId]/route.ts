import { NextResponse } from "next/server";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

export const maxDuration = 300;

async function forward(request: Request, id: string, messageId: string, method: "PATCH" | "DELETE") {
  const token = await getSessionToken();
  const body = method === "PATCH" ? await request.json().catch(() => ({})) : undefined;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id)}/chat/messages/${encodeURIComponent(messageId)}`, {
      method,
      headers: {
        ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify({ content: body.content }) : undefined,
    });
  } catch {
    return NextResponse.json({ message: "API에 연결할 수 없습니다. apps/api가 켜져 있는지 확인하세요." }, { status: 502 });
  }
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const { id, messageId } = await params;
  return forward(request, id, messageId, "PATCH");
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const { id, messageId } = await params;
  return forward(request, id, messageId, "DELETE");
}
