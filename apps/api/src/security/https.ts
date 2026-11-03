import type { NextFunction, Request, Response } from 'express';

// 브라우저가 http로 다시 오지 않게 하는 기간. 180일. preload는 넣지 않는다
export const HSTS_VALUE = 'max-age=15552000; includeSubDomains';

export type HttpsInput = {
  host: string;
  proto: string;
  path: string;
  nodeEnv?: string;
  requireHttps?: string;
};

export type HttpsDecision =
  | { action: 'next'; hsts: boolean }
  | { action: 'redirect'; location: string }
  | { action: 'refuse'; message: string };

export function isLoopbackHost(host: string): boolean {
  const name = host.replace(/:\d+$/, '').replace(/^\[|\]$/g, '').toLowerCase();
  return name === 'localhost' || name === '127.0.0.1' || name === '::1';
}

// 공개 호스트의 운영 서버는 HTTPS만 받는다. 루프백(로컬 next start·개발)은 그대로 둔다.
// 앞단 프록시가 X-Forwarded-Proto를 덮어써야 한다. 이용자가 보낸 값은 믿지 않는다(trust proxy).
export function decideHttps(input: HttpsInput): HttpsDecision {
  const local = isLoopbackHost(input.host);
  const https = input.proto === 'https';
  if (input.nodeEnv === 'production' && input.requireHttps !== '1' && !local) {
    return { action: 'refuse', message: '운영 서버는 REQUIRE_HTTPS=1 이 있어야 합니다.' };
  }
  if (input.requireHttps === '1' && !local && !https) {
    const host = input.host || 'localhost';
    return { action: 'redirect', location: `https://${host}${input.path}` };
  }
  return { action: 'next', hsts: https };
}

export function httpsEnforcement(req: Request, res: Response, next: NextFunction): void {
  const decision = decideHttps({
    host: req.headers.host ?? '',
    proto: req.protocol,
    path: req.originalUrl || '/',
    nodeEnv: process.env.NODE_ENV,
    requireHttps: process.env.REQUIRE_HTTPS,
  });
  if (decision.action === 'refuse') {
    res.status(503).type('text/plain; charset=utf-8').send(decision.message);
    return;
  }
  if (decision.action === 'redirect') {
    res.redirect(308, decision.location);
    return;
  }
  if (decision.hsts) res.setHeader('Strict-Transport-Security', HSTS_VALUE);
  next();
}
