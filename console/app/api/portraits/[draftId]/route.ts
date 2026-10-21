import { relayImage } from "@/lib/relay";

// 초상 검수 대기 그림
export async function GET(_request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  return relayImage(`/admin/portraits/${encodeURIComponent(draftId)}/image`);
}
