"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";

export type AttendResult = { ok: true; credited: number; balance: number } | { ok: false; error: string };

// 출석: 하루(한국 시각) 한 번 코레딧을 받는다. Nest로 넘기기만 한다
export async function attend(): Promise<AttendResult> {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=%2Fme");

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/me/attendance`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (res.status === 401) redirect("/login?next=%2Fme");
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message ?? `출석하지 못했습니다 (HTTP ${res.status}).` };
  revalidatePath("/me");
  return { ok: true, credited: data.credited, balance: data.balance };
}
