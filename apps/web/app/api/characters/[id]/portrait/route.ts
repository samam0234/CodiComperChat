import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// 캐릭터 초상 이미지 중계. 브라우저의 <img>는 Authorization 헤더를 못 붙이므로, 로그인 쿠키의 토큰을
// 서버가 꺼내 Nest에 붙인다 — 그래서 비공개 캐릭터의 초상도 만든 사람에게만 보인다.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getSessionToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/characters/${encodeURIComponent(id)}/portrait`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
  } catch {
    return new Response(null, { status: 502 });
  }
  if (!res.ok || !res.body) return new Response(null, { status: res.status === 404 ? 404 : 502 });

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/webp",
      // Nest가 정한 값을 그대로 쓴다: 공개·링크 공개는 잠깐 캐시, 비공개는 캐시 금지
      "Cache-Control": res.headers.get("cache-control") ?? "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
