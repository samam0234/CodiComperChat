import { relayImage } from "@/lib/relay";

// 세계관 장면 그림 (검수 대기·막힌 것까지 운영자가 본다)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  return relayImage(`/admin/worlds/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`);
}
