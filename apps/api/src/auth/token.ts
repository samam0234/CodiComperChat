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

export function signToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(assertAuthSecret());
}

// 유효하면 userId, 아니면(변조·만료·형식 오류) null
export async function verifyToken(token: string): Promise<string | null> {
  const key = assertAuthSecret();
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
