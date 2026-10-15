import "server-only";

import { API_BASE_URL, getSessionToken } from "./auth";

export type Product = { id: string; name: string; amount: number; days: number };
export type BillingInfo = { products: Product[]; provider: "toss" | "mock" | null; clientKey: string | null };
export type PaidOrder = { id: string; name: string; amount: number; days: number; paidAt: string };

export async function getBillingInfo(): Promise<BillingInfo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/billing/products`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as BillingInfo) : null;
  } catch {
    return null;
  }
}

export async function getMyOrders(): Promise<{ orders: PaidOrder[]; planUntil: string | null } | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/billing/orders`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
