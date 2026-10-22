import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// 공방 초안의 초상 미리보기 중계 (만든 사람만). 아직 발행하지 않은 초안의 그림도 볼 수 있어야 해서 따로 둔다
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getSessionToken();
  if (!token) return new Response(null, { status: 401 });

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/studio/characters/${encodeURIComponent(id)}/portrait`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return new Response(null, { status: 502 });
  }
  if (!res.ok || !res.body) return new Response(null, { status: res.status === 404 ? 404 : 502 });

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
