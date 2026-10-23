import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// 코디포토넷 그림 중계. 브라우저의 <img>는 Authorization 헤더를 못 붙이므로 로그인 쿠키의 토큰을 서버가 꺼내 붙인다 —
// 그 대화를 하는 사람에게만 보인다 (Nest가 확인한다)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  const token = await getSessionToken();
  if (!token) return new Response(null, { status: 401 });

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id)}/chat/ops/photonet/${encodeURIComponent(imageId)}`, {
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
