import { decideHttps, isLoopbackHost } from './https.js';
import { assertProductionSafety } from './production.js';

describe('HTTPS 결정', () => {
  it('루프백은 운영이어도 http를 유지한다', () => {
    expect(isLoopbackHost('localhost:3000')).toBe(true);
    expect(
      decideHttps({ host: 'localhost:4000', proto: 'http', path: '/health', nodeEnv: 'production', requireHttps: undefined }),
    ).toEqual({ action: 'next', hsts: false });
  });

  it('공개 호스트의 운영 서버는 REQUIRE_HTTPS 없이 거절한다', () => {
    const decision = decideHttps({ host: 'api.example.com', proto: 'http', path: '/health', nodeEnv: 'production' });
    expect(decision.action).toBe('refuse');
  });

  it('REQUIRE_HTTPS=1 이면 http를 https로 보낸다', () => {
    expect(
      decideHttps({ host: 'api.example.com', proto: 'http', path: '/auth/me', nodeEnv: 'production', requireHttps: '1' }),
    ).toEqual({ action: 'redirect', location: 'https://api.example.com/auth/me' });
  });

  it('내부 호스트로 지정한 곳은 http를 그대로 받고, 다른 호스트는 그대로 돌려보낸다', () => {
    const base = { proto: 'http', path: '/auth/me', nodeEnv: 'production', requireHttps: '1', exemptHosts: 'api, internal' };
    expect(decideHttps({ ...base, host: 'api:4000' })).toEqual({ action: 'next', hsts: false });
    expect(decideHttps({ ...base, host: 'API' })).toEqual({ action: 'next', hsts: false });
    expect(decideHttps({ ...base, host: 'api.example.com' }).action).toBe('redirect');
  });

  it('이미 https면 HSTS를 붙인다', () => {
    expect(
      decideHttps({ host: 'api.example.com', proto: 'https', path: '/', requireHttps: '1' }),
    ).toEqual({ action: 'next', hsts: true });
  });
});

describe('운영 안전 검사', () => {
  const base = { NODE_ENV: 'production', REQUIRE_HTTPS: '1', AI_SERVICE_TOKEN: 'a'.repeat(32) };

  it('개발 환경은 통과한다', () => {
    expect(() => assertProductionSafety({ NODE_ENV: 'development', LLM_FAKE: '1' })).not.toThrow();
  });

  it('운영에서 가짜 스위치·짧은 토큰을 막는다', () => {
    expect(() => assertProductionSafety({ ...base, LLM_FAKE: '1', BILLING_PROVIDER: 'mock' })).toThrow(/LLM_FAKE/);
    expect(() => assertProductionSafety({ ...base, AI_SERVICE_TOKEN: 'short' })).toThrow(/AI_SERVICE_TOKEN/);
  });

  it('운영 조건이 맞으면 통과한다', () => {
    expect(() => assertProductionSafety(base)).not.toThrow();
  });
});
