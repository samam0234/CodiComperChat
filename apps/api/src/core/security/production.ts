// 운영(NODE_ENV=production)에서 개발용 스위치·빈 비밀값으로 뜨지 않게 한다.
// 개발 서버는 NODE_ENV가 production이 아니므로 여기 검사를 지나간다.

const DEV_FLAGS = ['LLM_FAKE', 'IMAGE_FAKE', 'MODEL_PREMIUM_FAKE', 'MAIL_OUTBOX_DIR'] as const;

export function assertProductionSafety(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  const problems: string[] = [];
  if (env.REQUIRE_HTTPS !== '1') problems.push('REQUIRE_HTTPS=1 이 필요하다 (HTTPS·HSTS).');
  for (const key of DEV_FLAGS) {
    if (env[key]) problems.push(`${key} 는 운영에서 켤 수 없다.`);
  }
  if (env.BILLING_PROVIDER === 'mock') problems.push('BILLING_PROVIDER=mock 은 운영에서 켤 수 없다.');
  if (!env.AI_SERVICE_TOKEN || env.AI_SERVICE_TOKEN.length < 32) {
    problems.push('AI_SERVICE_TOKEN 이 없거나 32자보다 짧다. FastAPI는 이 값 없이 바깥에서 막히지 않는다.');
  }
  if (problems.length > 0) {
    throw new Error(`운영 안전 검사를 통과하지 못했다.\n- ${problems.join('\n- ')}`);
  }
}
