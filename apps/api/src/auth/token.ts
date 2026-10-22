import { SignJWT, jwtVerify } from 'jose';

const TOKEN_TTL = '7d';

// 키가 없거나 짧으면 조용히 통과시키지 않고 서버 시작을 막는다 (약한 키 = 토큰 위조 가능)
export function assertAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET 환경변수가 없거나 32자보다 짧다. apps/api/.env.example의 생성 방법을 참고해 apps/api/.env에 설정한다.',
    );
  }
  return new TextEncoder().encode(secret);
}

// sv: 계정의 토큰 세대(users.sessionVersion). 비밀번호를 바꾸면 세대가 올라 이전 토큰이 모두 무효가 된다
export function signToken(userId: string, sessionVersion = 0): Promise<string> {
  return new SignJWT({ sv: sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(assertAuthSecret());
}

// 서명·만료만 확인한 토큰 내용. 계정이 아직 있는지·세대가 맞는지는 readSession(session.ts)이 DB로 확인한다
export async function readToken(token: string): Promise<{ userId: string; sessionVersion: number } | null> {
  const key = assertAuthSecret();
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    // 세대 칸이 생기기 전에 발급한 토큰은 0세대로 본다
    return { userId: payload.sub, sessionVersion: typeof payload.sv === 'number' ? payload.sv : 0 };
  } catch {
    return null;
  }
}

// 유효하면 userId, 아니면(변조·만료·형식 오류) null. 요청 한도의 사용자 키처럼 DB 확인이 필요 없는 곳에서 쓴다
export async function verifyToken(token: string): Promise<string | null> {
  return (await readToken(token))?.userId ?? null;
}
