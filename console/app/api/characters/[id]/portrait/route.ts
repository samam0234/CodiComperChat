import { relayImage } from "@/lib/relay";

// 캐릭터 초상 (비공개·내려간 캐릭터 포함)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return relayImage(`/admin/characters/${encodeURIComponent(id)}/portrait`);
}
