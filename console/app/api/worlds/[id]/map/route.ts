import { relayImage } from "@/lib/relay";

// 세계관 코퍼맵 지도 (검수 대기까지 운영자가 본다)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return relayImage(`/admin/worlds/${encodeURIComponent(id)}/map`);
}
