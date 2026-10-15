import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// 운영자 초상 검수용 그림 중계. 권한은 Nest(AdminGuard)가 DB의 role로 확인한다
export async function GET(_request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const token = await getSessionToken();
  if (!token) return new Response(null, { status: 401 });

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/admin/portraits/${encodeURIComponent(draftId)}/image`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return new Response(null, { status: 502 });
  }
  if (!res.ok || !res.body) return new Response(null, { status: [401, 403, 404].includes(res.status) ? res.status : 502 });

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
