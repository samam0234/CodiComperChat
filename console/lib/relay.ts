import "server-only";

import { API_BASE_URL, getToken } from "./api";

// 운영자 전용 그림 중계. 권한은 Nest(AdminGuard)가 확인하고, 그림 안의 스크립트가 실행되지 않게 헤더를 붙인다
export async function relayImage(path: string): Promise<Response> {
  const token = await getToken();
  if (!token) return new Response(null, { status: 401 });
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
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
