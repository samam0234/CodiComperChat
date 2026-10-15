import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { PostgresRateStore } from './rate-store.js';

// 실제 PostgreSQL로 확인한다 (apps/api/.env의 DATABASE_URL, 마이그레이션 적용된 DB). 없으면 건너뛴다.
// 시험용 키(test:로 시작)만 쓰고 끝나면 지운다
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('요청 한도 DB 저장소', () => {
  // 서버 두 대 = PrismaClient 두 개가 같은 DB를 본다
  const serverA = new PrismaService();
  const serverB = new PrismaService();
  const a = new PostgresRateStore(serverA);
  const b = new PostgresRateStore(serverB);
  const prefix = `test:${Date.now()}:${Math.random().toString(36).slice(2)}`;

  // 연결을 미리 열어 둔다. 첫 연결 시간(수백 ms)이 짧은 창을 잡아먹어 시험이 흔들리지 않게
  beforeAll(async () => {
    await Promise.all([serverA.$queryRaw`SELECT 1`, serverB.$queryRaw`SELECT 1`]);
  });

  afterAll(async () => {
    await serverA.$executeRaw`DELETE FROM rate_limit_buckets WHERE key LIKE ${prefix + '%'}`;
    await serverA.$disconnect();
    await serverB.$disconnect();
  });

  it('서버 두 대가 동시에 50번 세도 한도 10번만 통과한다', async () => {
    const key = `${prefix}:shared`;
    const rule = { limit: 10, windowMs: 60_000 };
    const results = await Promise.all(Array.from({ length: 50 }, (_, i) => (i % 2 ? a : b).hit(key, rule)));
    expect(results.filter((r) => r.ok)).toHaveLength(10);
    const blocked = results.find((r) => !r.ok)!;
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it('창이 끝나면 처음부터 센다', async () => {
    const key = `${prefix}:window`;
    const rule = { limit: 1, windowMs: 60_000 };
    expect((await a.hit(key, rule)).ok).toBe(true);
    expect((await b.hit(key, rule)).ok).toBe(false);
    // 기다리지 않고 창을 끝낸다 (시간에 기대는 시험은 느린 PC에서 흔들린다)
    await serverA.$executeRaw`UPDATE rate_limit_buckets SET "resetAt" = now() - interval '1 second' WHERE key = ${key}`;
    expect((await b.hit(key, rule)).ok).toBe(true);
    expect((await a.hit(key, rule)).ok).toBe(false);
  });

  it('키가 다르면 따로 센다', async () => {
    const rule = { limit: 1, windowMs: 60_000 };
    expect((await a.hit(`${prefix}:x`, rule)).ok).toBe(true);
    expect((await a.hit(`${prefix}:y`, rule)).ok).toBe(true);
  });
});
