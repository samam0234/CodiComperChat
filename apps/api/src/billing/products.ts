// 판매하는 상품. 금액은 서버만 정한다 — 브라우저가 보낸 금액은 믿지 않고 주문과 결제사 응답을 맞춰 본다.
// 금액은 운영 전 확정이 필요한 임시값이다 (docs/API_DOCUMENTATION.md "결제")
export type Product = { id: string; name: string; amount: number; days: number };

export const PRODUCTS: readonly Product[] = [
  { id: 'pro-30', name: '프로 30일', amount: 4900, days: 30 },
  { id: 'pro-365', name: '프로 1년', amount: 49000, days: 365 },
] as const;

export function findProduct(id: unknown): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
