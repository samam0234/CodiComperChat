// 토스 시크릿 키가 맞는지, 결제 승인 API에 닿는지 확인한다 (돈은 오가지 않는다).
// 없는 결제 키로 승인을 요청해 "결제 데이터 없음"이 오면 키·연결이 정상이고, "인증되지 않은 키"면 키가 틀렸다.
//   npm run billing:check --workspace api      (apps/api/.env의 TOSS_SECRET_KEY를 읽는다. 키 값은 출력하지 않는다)
import 'dotenv/config';

const secret = process.env.TOSS_SECRET_KEY;
if (!secret) {
  console.error('TOSS_SECRET_KEY가 없다. apps/api/.env에 넣는다 (.env.example 참고).');
  process.exit(1);
}

const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${Buffer.from(`${secret}:`).toString('base64')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ paymentKey: 'billing-check-not-a-real-payment', orderId: `billing-check-${Date.now()}`, amount: 100 }),
});
const data = await res.json().catch(() => ({}));
const mode = secret.startsWith('test_') ? '테스트 키' : '라이브 키';
if (data.code === 'UNAUTHORIZED_KEY' || data.code === 'INVALID_API_KEY') {
  console.error(`✗ ${mode}가 토스에서 거절됐다 (${data.code}). 개발자센터의 키 쌍을 다시 확인한다.`);
  process.exit(1);
}
if (data.code?.startsWith('NOT_FOUND_PAYMENT')) {
  console.log(`✓ ${mode} 인증·연결 정상 (없는 결제라 ${data.code} — 예상한 응답)`);
} else {
  console.log(`? 예상과 다른 응답 HTTP ${res.status} ${data.code ?? ''} ${data.message ?? ''}`);
  process.exitCode = 1;
}
