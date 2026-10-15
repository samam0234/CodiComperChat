"use server";

import { revalidatePath } from "next/cache";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

// 운영자: 초상 승인·반려. 권한은 Nest(AdminGuard)가 확인한다
export async function decidePortrait(
  draftId: string,
  decision: "approve" | "reject",
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await getSessionToken();
  if (!token) return { ok: false, error: "로그인이 필요합니다." };
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/admin/portraits/${encodeURIComponent(draftId)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다." };
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, error: data?.message ?? `처리하지 못했습니다 (HTTP ${res.status}).` };
  }
  // 승인하면 홈·상세의 초상이 바로 보이게
  revalidatePath("/", "layout");
  return { ok: true };
}
