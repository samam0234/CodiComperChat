// 결제사 연결. 설정에 따라 둘 중 하나:
//  - toss: 토스페이먼츠. TOSS_SECRET_KEY(서버, 승인용)·TOSS_CLIENT_KEY(웹 결제창용)가 있어야 한다
//  - mock: 실제 돈이 오가지 않는 가짜 결제. 개발·자동 테스트용이라 운영(NODE_ENV=production)에서는
//          BILLING_PROVIDER=mock을 직접 적어야만 켜진다
// 둘 다 아니면 결제를 열지 않는다(503)

export type ProviderName = 'toss' | 'mock';

export type ConfirmInput = { paymentKey: string; orderId: string; amount: number };
export type ConfirmResult = { ok: true; amount: number; receiptUrl: string | null } | { ok: false; reason: string };
export type CancelResult = { ok: true } | { ok: false; reason: string };

export function activeProvider(): ProviderName | null {
  const chosen = process.env.BILLING_PROVIDER;
  if (chosen === 'toss') return process.env.TOSS_SECRET_KEY && process.env.TOSS_CLIENT_KEY ? 'toss' : null;
  if (chosen === 'mock') return 'mock';
  if (chosen) return null;
  // 아무것도 정하지 않았으면: 토스 키가 있으면 토스, 개발 중이면 가짜 결제
  if (process.env.TOSS_SECRET_KEY && process.env.TOSS_CLIENT_KEY) return 'toss';
  return process.env.NODE_ENV === 'production' ? null : 'mock';
}

// 웹 결제창에 넘길 공개 키 (비밀 키는 절대 내보내지 않는다)
export function clientKey(provider: ProviderName): string | null {
  return provider === 'toss' ? (process.env.TOSS_CLIENT_KEY ?? null) : null;
}

const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

// 결제창에서 돌아온 결제를 결제사에 "승인"받는다. 승인 전에는 돈이 빠져나가지 않는다
export async function confirmPayment(provider: ProviderName, input: ConfirmInput): Promise<ConfirmResult> {
  if (provider === 'mock') {
    // 가짜 결제는 웹의 가짜 결제창이 만든 키만 받는다
    return input.paymentKey.startsWith('mock_')
      ? { ok: true, amount: input.amount, receiptUrl: null }
      : { ok: false, reason: '가짜 결제 키가 아닙니다.' };
  }

  let res: Response;
  try {
    res = await fetch(TOSS_CONFIRM_URL, {
      method: 'POST',
      headers: {
        Authorization: tossAuth(),
        'Content-Type': 'application/json',
        // 같은 결제를 두 번 승인하지 않게 (네트워크 재시도 대비)
        'Idempotency-Key': input.orderId,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { ok: false, reason: '결제사에 연결하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.' };
  }
  const data = (await res.json().catch(() => null)) as {
    totalAmount?: number;
    status?: string;
    message?: string;
    receipt?: { url?: string } | null;
  } | null;
  if (!res.ok || data?.status !== 'DONE') {
    return { ok: false, reason: data?.message ?? `결제 승인에 실패했습니다 (HTTP ${res.status}).` };
  }
  const receipt = data.receipt?.url;
  return { ok: true, amount: Number(data.totalAmount), receiptUrl: typeof receipt === 'string' && receipt.startsWith('https://') ? receipt : null };
}

function tossAuth(): string {
  return `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY ?? ''}:`).toString('base64')}`;
}

// 결제 취소(전액 환불). 토스: POST /v1/payments/{paymentKey}/cancel
export async function cancelPayment(provider: ProviderName, paymentKey: string, reason: string): Promise<CancelResult> {
  if (provider === 'mock') return { ok: true };
  let res: Response;
  try {
    res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: tossAuth(),
        'Content-Type': 'application/json',
        // 같은 환불을 두 번 하지 않게
        'Idempotency-Key': `cancel-${paymentKey}`,
      },
      body: JSON.stringify({ cancelReason: reason }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { ok: false, reason: '결제사에 연결하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.' };
  }
  const data = (await res.json().catch(() => null)) as { status?: string; message?: string } | null;
  if (!res.ok || (data?.status !== 'CANCELED' && data?.status !== 'PARTIAL_CANCELED')) {
    return { ok: false, reason: data?.message ?? `환불에 실패했습니다 (HTTP ${res.status}).` };
  }
  return { ok: true };
}
