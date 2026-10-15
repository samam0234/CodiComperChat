import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { verifyToken } from '../auth/token.js';

// 요청 한도. 로그인 무차별 대입을 막고, LLM을 부르는 요청(비용·속도)과 업로드·신고의 남용을 막는다.
// 한 서버 프로세스 안의 메모리 카운터라 서버가 여러 대가 되면 공유 저장소(Redis 등)로 옮겨야 한다 — 그때까지의 최소선.

type By = 'ip' | 'user' | 'ip+email';

export type Rule = {
  limit: number;
  windowMs: number;
  by: By;
  // 걸렸을 때 보여 줄 말 (뒤에 "N초 뒤에 다시 시도해 주세요"가 붙는다)
  label: string;
};

const MIN = 60_000;

// 이름 → 규칙. 컨트롤러는 이름만 쓴다(@RateLimit('chat'))
export const RULES = {
  // 무차별 대입 방어: 같은 이메일을 같은 곳에서 15분에 10번까지, 한 곳(IP)에서 15분에 40번까지
  login: { limit: 10, windowMs: 15 * MIN, by: 'ip+email', label: '로그인 시도가 너무 많습니다.' },
  loginIp: { limit: 40, windowMs: 15 * MIN, by: 'ip', label: '로그인 시도가 너무 많습니다.' },
  signup: { limit: 10, windowMs: 60 * MIN, by: 'ip', label: '가입 요청이 너무 많습니다.' },
  password: { limit: 5, windowMs: 15 * MIN, by: 'user', label: '비밀번호 변경 시도가 너무 많습니다.' },
  // 메일 발송: 남의 주소로 메일을 퍼붓지 못하게 계정별·주소별·IP별로 막는다
  mail: { limit: 3, windowMs: 15 * MIN, by: 'user', label: '인증 메일을 너무 자주 요청했어요. 잠시 뒤에 다시 시도해 주세요.' },
  forgot: { limit: 3, windowMs: 15 * MIN, by: 'ip+email', label: '비밀번호 찾기를 너무 자주 요청했어요.' },
  forgotIp: { limit: 10, windowMs: 15 * MIN, by: 'ip', label: '비밀번호 찾기를 너무 자주 요청했어요.' },
  // 메일 링크 토큰 맞히기 방어
  emailToken: { limit: 20, windowMs: 15 * MIN, by: 'ip', label: '요청이 너무 많습니다. 잠시 뒤에 다시 시도해 주세요.' },
  // LLM 호출: 느린 모델 하나를 여럿이 나눠 쓰므로 한 사람이 독점하지 못하게
  chat: { limit: 20, windowMs: MIN, by: 'user', label: '메시지를 너무 빨리 보내고 있어요.' },
  suggest: { limit: 10, windowMs: MIN, by: 'user', label: '대답 추천을 너무 자주 요청하고 있어요.' },
  studioLlm: { limit: 12, windowMs: MIN, by: 'user', label: '공방 AI 요청이 너무 많습니다.' },
  memory: { limit: 5, windowMs: MIN, by: 'user', label: '기억 정리를 너무 자주 요청하고 있어요.' },
  agent: { limit: 15, windowMs: MIN, by: 'ip', label: '안내 도우미에게 너무 자주 묻고 있어요.' },
  upload: { limit: 10, windowMs: MIN, by: 'user', label: '이미지를 너무 자주 올리고 있어요.' },
  report: { limit: 10, windowMs: 60 * MIN, by: 'user', label: '신고를 너무 많이 보냈어요.' },
  billing: { limit: 20, windowMs: 10 * MIN, by: 'user', label: '결제 요청이 너무 많습니다. 잠시 뒤에 다시 시도해 주세요.' },
} as const satisfies Record<string, Rule>;

export type RuleName = keyof typeof RULES;

type Bucket = { count: number; resetAt: number };

// 고정 창(fixed window) 카운터. 창이 끝나면 처음부터 센다
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly now: () => number = Date.now) {}

  // 한 번 센다. 넘었으면 ok:false와 다시 시도할 수 있는 초를 돌려준다 (넘은 요청은 더 세지 않는다)
  hit(key: string, rule: Pick<Rule, 'limit' | 'windowMs'>): { ok: boolean; retryAfterSec: number } {
    const t = this.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= t) {
      this.buckets.set(key, { count: 1, resetAt: t + rule.windowMs });
      return { ok: true, retryAfterSec: 0 };
    }
    if (bucket.count >= rule.limit) return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - t) / 1000)) };
    bucket.count += 1;
    return { ok: true, retryAfterSec: 0 };
  }

  // 만료된 카운터를 지운다 (메모리가 계속 늘지 않게)
  prune(): number {
    const t = this.now();
    let removed = 0;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= t) {
        this.buckets.delete(key);
        removed++;
      }
    }
    return removed;
  }

  get size() {
    return this.buckets.size;
  }

  clear() {
    this.buckets.clear();
  }
}

const METADATA = 'rate-limit-rules';
// 여러 개를 줄 수 있다 (예: 로그인은 이메일 기준과 IP 기준을 함께)
export const RateLimit = (...names: RuleName[]) => SetMetadata(METADATA, names);

// RATE_LIMIT_SCALE: 한도에 곱하는 수. 웹 자동 테스트처럼 짧은 시간에 많이 부르는 환경에서 키운다 (기본 1).
// RATE_LIMIT=off: 끈다. 켜진 채 운영하는 것이 기본이다
export function scale(): number {
  if ((process.env.RATE_LIMIT ?? 'on').toLowerCase() === 'off') return Number.POSITIVE_INFINITY;
  const n = Number(process.env.RATE_LIMIT_SCALE ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

type Req = Request & { ip?: string; body?: { email?: unknown } };

async function keyFor(by: By, request: Req): Promise<string> {
  const ip = request.ip ?? 'unknown';
  if (by === 'ip') return `ip:${ip}`;
  if (by === 'ip+email') {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase().slice(0, 254) : '';
    return `ip+email:${ip}|${email}`;
  }
  // 로그인한 사용자 기준. 서명만 확인한다(DB를 부르지 않는다). 토큰이 없거나 틀리면 IP로 센다
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  const userId = scheme === 'Bearer' && token ? await verifyToken(token) : null;
  return userId ? `user:${userId}` : `ip:${ip}`;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limiter = new RateLimiter();
  private readonly timer: NodeJS.Timeout;

  constructor(private readonly reflector: Reflector) {
    this.timer = setInterval(() => this.limiter.prune(), 5 * MIN);
    // 이 타이머 때문에 프로세스가 안 끝나는 일이 없게
    this.timer.unref();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const names = this.reflector.get<RuleName[] | undefined>(METADATA, context.getHandler());
    if (!names || names.length === 0) return true;
    const factor = scale();
    if (factor === Number.POSITIVE_INFINITY) return true;

    const request = context.switchToHttp().getRequest<Req>();
    for (const name of names) {
      const rule: Rule = RULES[name];
      const key = `${name}|${await keyFor(rule.by, request)}`;
      const { ok, retryAfterSec } = this.limiter.hit(key, { limit: Math.floor(rule.limit * factor), windowMs: rule.windowMs });
      if (!ok) {
        context.switchToHttp().getResponse<Response>().setHeader('Retry-After', String(retryAfterSec));
        throw new HttpException(`${rule.label} ${formatWait(retryAfterSec)} 다시 시도해 주세요.`, HttpStatus.TOO_MANY_REQUESTS);
      }
    }
    return true;
  }
}

export function formatWait(sec: number): string {
  if (sec < 90) return `${sec}초 뒤에`;
  return `${Math.ceil(sec / 60)}분 뒤에`;
}
