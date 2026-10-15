import { SignJWT } from 'jose';
import { hashPassword, verifyPassword } from './password.js';
import { assertAuthSecret, readToken, signToken, verifyToken } from './token.js';

describe('password', () => {
  it('맞는 비밀번호만 통과시킨다', async () => {
    const stored = await hashPassword('pass1234word');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('pass1234word', stored)).toBe(true);
    expect(await verifyPassword('pass1234worD', stored)).toBe(false);
  });

  it('같은 비밀번호라도 매번 다른 해시를 만든다 (salt)', async () => {
    expect(await hashPassword('same-password')).not.toBe(
      await hashPassword('same-password'),
    );
  });

  it('형식이 깨진 저장값은 예외 없이 거부한다', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
    expect(await verifyPassword('x', 'bcrypt$a$b')).toBe(false);
  });
});

describe('token', () => {
  const original = process.env.AUTH_SECRET;
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-that-is-long-enough-000000';
  });
  afterEach(() => {
    process.env.AUTH_SECRET = original;
  });

  it('서명한 토큰에서 userId를 되찾는다', async () => {
    expect(await verifyToken(await signToken('user-1'))).toBe('user-1');
  });

  it('토큰에 계정의 토큰 세대를 싣고, 세대가 없는 옛 토큰은 0세대로 읽는다', async () => {
    expect(await readToken(await signToken('user-1', 3))).toEqual({ userId: 'user-1', sessionVersion: 3 });
    const old = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('user-1').setExpirationTime('1h').sign(assertAuthSecret());
    expect(await readToken(old)).toEqual({ userId: 'user-1', sessionVersion: 0 });
  });

  it('다른 키로 서명한 토큰은 거부한다', async () => {
    const forged = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('another-secret-that-is-long-enough-00'));
    expect(await verifyToken(forged)).toBeNull();
  });

  it('만료된 토큰은 거부한다', async () => {
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(assertAuthSecret());
    expect(await verifyToken(expired)).toBeNull();
  });

  it('키가 없거나 짧으면 시작을 막는다', () => {
    process.env.AUTH_SECRET = 'short';
    expect(() => assertAuthSecret()).toThrow(/AUTH_SECRET/);
    delete process.env.AUTH_SECRET;
    expect(() => assertAuthSecret()).toThrow(/AUTH_SECRET/);
  });
});

describe('비밀번호 규칙', () => {
  it('너무 흔하거나 단순한 비밀번호는 거절한다', async () => {
    const { parseSignup, isWeakPassword } = await import('./auth.dto.js');
    for (const weak of ['12345678', 'password', 'Password', 'qwertyuiop', 'aaaaaaaa', 'abababab']) {
      expect(isWeakPassword(weak)).toBe(true);
      expect(() => parseSignup({ email: 'a@example.com', password: weak, displayName: '가' })).toThrow(/너무 흔하거나 단순/);
    }
  });
  it('이메일 아이디와 같은 비밀번호는 거절한다', async () => {
    const { isWeakPassword } = await import('./auth.dto.js');
    expect(isWeakPassword('minjun1234', 'minjun1234@example.com')).toBe(true);
    expect(isWeakPassword('minjun1234', 'other@example.com')).toBe(false);
  });
  it('평범한 비밀번호는 통과한다', async () => {
    const { parseSignup } = await import('./auth.dto.js');
    expect(parseSignup({ email: 'a@example.com', password: 'pass1234word', displayName: '가' }).password).toBe('pass1234word');
  });
});
