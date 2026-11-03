import { relayImage } from "@/lib/relay";

// 성인 그림 신고 본문. 운영자만 (Nest AdminGuard)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const panel = new URL(request.url).searchParams.get("panel");
  const query = panel ? `?panel=${encodeURIComponent(panel)}` : "";
  return relayImage(`/admin/content-reports/${encodeURIComponent(id)}/image${query}`);
}
