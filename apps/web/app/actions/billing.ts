"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, getSessionToken } from "@/lib/auth";
import { forwardedFor } from "@/lib/client-ip";

export type Checkout = {
  orderId: string;
  orderName: string;
  amount: number;
  provider: "toss" | "mock";
  clientKey: string | null;
  customerKey: string;
  customerEmail: string;
  customerName: string;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function post<T>(path: string, body: unknown): Promise<Result<T>> {
  const token = await getSessionToken();
  if (!token) redirect("/login?next=/pricing");
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(await forwardedFor()) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "서버에 연결할 수 없습니다. 잠시 뒤에 다시 시도해 주세요." };
  }
  if (res.status === 401) redirect("/login?next=/pricing");
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message ?? `요청이 실패했습니다 (HTTP ${res.status}).` };
  return { ok: true, data: data as T };
}

// 주문을 만든다(금액은 서버가 정한다). 결제창은 브라우저가 연다
export async function startCheckout(productId: string) {
  return post<Checkout>("/billing/checkout", { productId });
}

// 결제창에서 돌아온 결제를 승인받는다. 성공하면 등급이 바로 바뀌므로 화면을 새로 그린다
export async function confirmPayment(input: { orderId: string; paymentKey: string; amount: number }) {
  const result = await post<{ paid: true; planUntil: string | null; days: number }>("/billing/confirm", input);
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
