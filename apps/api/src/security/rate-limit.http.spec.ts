import { Controller, Get, Post, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { signToken } from '../auth/token.js';
import { RateLimit, RateLimitGuard } from './rate-limit.js';

// 가드를 실제 HTTP로 확인한다: 한도를 넘으면 429와 Retry-After, 사용자·IP별로 따로 센다
@Controller('probe')
class ProbeController {
  @Post('login')
  @RateLimit('login', 'loginIp')
  login() {
    return { ok: true };
  }

  @Post('chat')
  @RateLimit('chat')
  chat() {
    return { ok: true };
  }

  @Get('free')
  free() {
    return { ok: true };
  }
}

describe('요청 한도 (HTTP)', () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    process.env.AUTH_SECRET = 'test-secret-test-secret-test-secret-123456';
    delete process.env.RATE_LIMIT;
    delete process.env.RATE_LIMIT_SCALE;
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
    }).compile();
    app = moduleRef.createNestApplication();
    // main.ts와 같은 설정: 사설·루프백에서 온 X-Forwarded-For만 믿는다
    (app as unknown as { set(k: string, v: string): void }).set('trust proxy', 'loopback, linklocal, uniquelocal');
    await app.listen(0);
    base = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (path: string, init: { token?: string; body?: unknown } = {}) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}) },
      body: JSON.stringify(init.body ?? {}),
    });

  it('한도를 붙이지 않은 라우트는 얼마든지 부를 수 있다', async () => {
    for (let i = 0; i < 100; i++) expect((await fetch(`${base}/probe/free`)).status).toBe(200);
  });

  it('같은 이메일로 로그인을 10번 넘게 두드리면 429와 Retry-After', async () => {
    const body = { email: 'victim@example.com' };
    for (let i = 0; i < 10; i++) expect((await post('/probe/login', { body })).status).toBe(201);
    const blocked = await post('/probe/login', { body });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    const data = (await blocked.json()) as { message: string };
    expect(data.message).toContain('로그인 시도가 너무 많습니다');
    expect(data.message).toMatch(/뒤에 다시 시도해 주세요/);
  });

  it('이메일을 바꿔 가며 두드려도 같은 곳(IP)에서 40번을 넘으면 막힌다', async () => {
    // 위 시험에서 이미 11번 썼다. 다른 이메일로 29번 더 → 40번째까지 통과, 그다음부터 429
    let blockedAt = 0;
    for (let i = 0; i < 40; i++) {
      const res = await post('/probe/login', { body: { email: `user${i}@example.com` } });
      if (res.status === 429) {
        blockedAt = i;
        break;
      }
    }
    expect(blockedAt).toBeGreaterThan(0);
    expect(blockedAt).toBeLessThan(40);
  });

  it('웹 서버가 넘긴 이용자 IP별로 따로 센다: 한 사람이 막혀도 다른 사람은 된다', async () => {
    const as = (ip: string, email: string) =>
      fetch(`${base}/probe/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify({ email }) });
    // 이용자 A: IP 기준 한도(40)를 채운다
    let last = 201;
    for (let i = 0; i < 45; i++) last = (await as('203.0.113.7', `a${i}@example.com`)).status;
    expect(last).toBe(429);
    // 이용자 B(다른 IP)는 영향이 없다
    expect((await as('203.0.113.99', 'b@example.com')).status).toBe(201);
  });

  it('LLM 호출 한도는 사용자별로 따로 센다: 한 사람이 막혀도 다른 사람은 된다', async () => {
    const a = await signToken('user-a');
    const b = await signToken('user-b');
    for (let i = 0; i < 20; i++) expect((await post('/probe/chat', { token: a })).status).toBe(201);
    expect((await post('/probe/chat', { token: a })).status).toBe(429);
    expect((await post('/probe/chat', { token: b })).status).toBe(201);
  });
});
