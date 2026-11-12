import { RULES, RateLimiter, formatWait } from './rate-limit.js';

describe('요청 한도 카운터', () => {
  const rule = { limit: 3, windowMs: 60_000 };

  it('한도까지는 통과하고 넘으면 다시 시도할 초를 알려 준다', () => {
    let t = 1_000_000;
    const limiter = new RateLimiter(() => t);
    expect(limiter.hit('a', rule).ok).toBe(true);
    expect(limiter.hit('a', rule).ok).toBe(true);
    expect(limiter.hit('a', rule).ok).toBe(true);
    t += 10_000;
    const blocked = limiter.hit('a', rule);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(50);
  });

  it('창이 끝나면 처음부터 센다', () => {
    let t = 0;
    const limiter = new RateLimiter(() => t);
    for (let i = 0; i < 3; i++) limiter.hit('a', rule);
    expect(limiter.hit('a', rule).ok).toBe(false);
    t += 60_001;
    expect(limiter.hit('a', rule).ok).toBe(true);
  });

  it('키가 다르면 서로 세지 않는다 (남이 막혀도 나는 된다)', () => {
    const limiter = new RateLimiter(() => 0);
    for (let i = 0; i < 3; i++) limiter.hit('user:a', rule);
    expect(limiter.hit('user:a', rule).ok).toBe(false);
    expect(limiter.hit('user:b', rule).ok).toBe(true);
  });

  it('막힌 요청은 창을 늘리지 않는다 (계속 두드려도 정해진 시각에 풀린다)', () => {
    let t = 0;
    const limiter = new RateLimiter(() => t);
    for (let i = 0; i < 3; i++) limiter.hit('a', rule);
    for (let i = 0; i < 50; i++) limiter.hit('a', rule);
    t = 60_001;
    expect(limiter.hit('a', rule).ok).toBe(true);
  });

  it('만료된 카운터를 지운다', () => {
    let t = 0;
    const limiter = new RateLimiter(() => t);
    limiter.hit('a', rule);
    limiter.hit('b', rule);
    t = 120_000;
    expect(limiter.prune()).toBe(2);
    expect(limiter.size).toBe(0);
  });
});

describe('규칙 표', () => {
  it('로그인은 이메일 기준과 IP 기준이 따로 있고 창이 15분이다', () => {
    expect(RULES.login).toMatchObject({ by: 'ip+email', windowMs: 15 * 60_000 });
    expect(RULES.loginIp.limit).toBeGreaterThan(RULES.login.limit);
  });
  it('LLM을 부르는 요청은 사람(user) 기준이고 안내 도우미(로그인 없음)만 IP 기준이다', () => {
    for (const name of ['chat', 'suggest', 'studioLlm', 'memory'] as const) expect(RULES[name].by).toBe('user');
    expect(RULES.agent.by).toBe('ip');
  });
  it('기다릴 시간을 사람이 읽게 말한다', () => {
    expect(formatWait(30)).toBe('30초 뒤에');
    expect(formatWait(600)).toBe('10분 뒤에');
  });
});
