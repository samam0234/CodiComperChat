import { Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { RateLimiter, Rule } from './rate-limit.js';

export type HitResult = { ok: boolean; retryAfterSec: number };
type Window = Pick<Rule, 'limit' | 'windowMs'>;

// 요청 한도 카운터를 어디에 두는가. RATE_LIMIT_STORE로 고른다:
//  - memory(기본): 서버 프로세스 메모리. 가장 빠르지만 서버가 여러 대면 대수만큼 한도가 늘어난다
//  - db: PostgreSQL(rate_limit_buckets). 서버가 여러 대여도 한도를 함께 센다
export interface RateStore {
  hit(key: string, rule: Window): Promise<HitResult>;
  prune(): Promise<number>;
}

export class MemoryRateStore implements RateStore {
  constructor(private readonly limiter: RateLimiter) {}

  async hit(key: string, rule: Window) {
    return this.limiter.hit(key, rule);
  }

  async prune() {
    return this.limiter.prune();
  }
}

export class PostgresRateStore implements RateStore {
  private readonly logger = new Logger('RateLimit');

  constructor(private readonly prisma: PrismaService) {}

  // 한 문장으로 "창이 끝났으면 1부터, 아니면 +1"을 한다 — 여러 서버가 동시에 세도 빠지는 수가 없다.
  // 시각은 DB의 now()를 쓴다(서버마다 시계가 조금씩 달라도 같은 창을 본다)
  async hit(key: string, rule: Window): Promise<HitResult> {
    try {
      const [row] = await this.prisma.$queryRaw<{ count: number; wait_ms: number }[]>`
        INSERT INTO rate_limit_buckets (key, count, "resetAt")
        VALUES (${key}, 1, now() + ${rule.windowMs} * interval '1 millisecond')
        ON CONFLICT (key) DO UPDATE SET
          count = CASE WHEN rate_limit_buckets."resetAt" <= now() THEN 1 ELSE rate_limit_buckets.count + 1 END,
          "resetAt" = CASE WHEN rate_limit_buckets."resetAt" <= now() THEN EXCLUDED."resetAt" ELSE rate_limit_buckets."resetAt" END
        RETURNING count, (EXTRACT(EPOCH FROM ("resetAt" - now())) * 1000)::float8 AS wait_ms`;
      if (row.count <= rule.limit) return { ok: true, retryAfterSec: 0 };
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil(row.wait_ms / 1000)) };
    } catch (error) {
      // 한도 저장소가 잠깐 안 될 때 사이트 전체를 막지 않는다 (DB가 죽었으면 어차피 로그인·대화도 안 된다)
      this.logger.warn(`요청 한도 확인 실패 → 통과: ${error instanceof Error ? error.message : String(error)}`);
      return { ok: true, retryAfterSec: 0 };
    }
  }

  async prune(): Promise<number> {
    try {
      return await this.prisma.$executeRaw`DELETE FROM rate_limit_buckets WHERE "resetAt" < now() - interval '5 minutes'`;
    } catch {
      return 0;
    }
  }
}

export function storeKind(): 'memory' | 'db' {
  return (process.env.RATE_LIMIT_STORE ?? 'memory').toLowerCase() === 'db' ? 'db' : 'memory';
}
