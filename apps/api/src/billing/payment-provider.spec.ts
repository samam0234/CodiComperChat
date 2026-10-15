import { afterEach, describe, expect, it, vi } from 'vitest';
import { activeProvider, clientKey, confirmPayment } from './payment-provider.js';

const ENV = ['BILLING_PROVIDER', 'TOSS_SECRET_KEY', 'TOSS_CLIENT_KEY', 'NODE_ENV'] as const;
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
});

function env(values: Partial<Record<(typeof ENV)[number], string>>) {
  for (const k of ENV) delete process.env[k];
  Object.assign(process.env, values);
}

describe('결제사 고르기', () => {
  it('개발 중 설정이 없으면 가짜 결제, 운영에서는 결제를 열지 않는다', () => {
    env({ NODE_ENV: 'development' });
    expect(activeProvider()).toBe('mock');
    env({ NODE_ENV: 'production' });
    expect(activeProvider()).toBeNull();
  });

  it('토스 키가 둘 다 있어야 토스. 웹에는 공개 키만 준다', () => {
    env({ NODE_ENV: 'production', TOSS_SECRET_KEY: 'test_sk_x', TOSS_CLIENT_KEY: 'test_ck_y' });
    expect(activeProvider()).toBe('toss');
    expect(clientKey('toss')).toBe('test_ck_y');
    env({ NODE_ENV: 'production', BILLING_PROVIDER: 'toss', TOSS_SECRET_KEY: 'test_sk_x' });
    expect(activeProvider()).toBeNull();
  });
});

describe('토스 결제 승인', () => {
  it('비밀 키로 승인을 요청하고, DONE이면 승인 금액을 돌려준다', async () => {
    env({ TOSS_SECRET_KEY: 'test_sk_x', TOSS_CLIENT_KEY: 'test_ck_y' });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: 'DONE', totalAmount: 4900 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await confirmPayment('toss', { paymentKey: 'pk', orderId: 'o1', amount: 4900 });
    expect(result).toEqual({ ok: true, amount: 4900 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.tosspayments.com/v1/payments/confirm');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from('test_sk_x:').toString('base64')}`);
    expect(JSON.parse(String(init.body))).toEqual({ paymentKey: 'pk', orderId: 'o1', amount: 4900 });
  });

  it('결제사가 거절하면 그 사유를 돌려준다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: 'REJECT_CARD_PAYMENT', message: '한도 초과' }), { status: 400 })));
    expect(await confirmPayment('toss', { paymentKey: 'pk', orderId: 'o1', amount: 4900 })).toEqual({ ok: false, reason: '한도 초과' });
  });

  it('가짜 결제는 가짜 결제창이 만든 키만 받는다', async () => {
    expect((await confirmPayment('mock', { paymentKey: 'mock_abc', orderId: 'o', amount: 1 })).ok).toBe(true);
    expect((await confirmPayment('mock', { paymentKey: 'real', orderId: 'o', amount: 1 })).ok).toBe(false);
  });
});
