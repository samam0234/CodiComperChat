import { afterEach, describe, expect, it } from 'vitest';
import { findProduct, priceFrom, products } from './products.js';

afterEach(() => {
  delete process.env.BILLING_PRICE_PRO_30;
});

describe('상품 가격', () => {
  it('설정이 없으면 기본값, 있으면 그 값', () => {
    expect(findProduct('pro-30')?.amount).toBe(4900);
    process.env.BILLING_PRICE_PRO_30 = '5900';
    expect(findProduct('pro-30')?.amount).toBe(5900);
    expect(products().find((p) => p.id === 'pro-365')?.amount).toBe(49000);
  });

  it('잘못 적은 값(0원·음수·소수·글자)은 쓰지 않는다', () => {
    for (const bad of ['0', '-100', '99', '4900.5', 'free', '99999999']) expect(priceFrom(bad, 4900)).toBe(4900);
    expect(priceFrom(' ', 4900)).toBe(4900);
    expect(priceFrom('100', 4900)).toBe(100);
  });
});
