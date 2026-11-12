// 판매하는 상품. 금액은 서버만 정한다 — 브라우저가 보낸 금액은 믿지 않고 주문과 결제사 응답을 맞춰 본다.
// 금액은 코드를 고치지 않고 운영 설정으로 정한다: BILLING_PRICE_PRO_30, BILLING_PRICE_PRO_365 (원, 100 이상 정수).
// 설정이 없으면 아래 기본값(출시 전 임시값)을 쓴다 (docs/API_DOCUMENTATION.md "결제")
export type Product = { id: string; name: string; amount: number; days: number };

const BASE: readonly (Product & { env: string })[] = [
  { id: 'pro-30', name: '프로 30일', amount: 4900, days: 30, env: 'BILLING_PRICE_PRO_30' },
  { id: 'pro-365', name: '프로 1년', amount: 49000, days: 365, env: 'BILLING_PRICE_PRO_365' },
];

// 잘못 적은 값(숫자 아님·100원 미만·소수)은 쓰지 않고 기본값으로 둔다 — 0원·음수 결제가 생기지 않게
export function priceFrom(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n >= 100 && n <= 10_000_000 ? n : fallback;
}

export function products(): Product[] {
  return BASE.map(({ env, ...p }) => ({ ...p, amount: priceFrom(process.env[env], p.amount) }));
}

export function findProduct(id: unknown): Product | undefined {
  return products().find((p) => p.id === id);
}
