import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SUSPEND_MESSAGE } from '../content-reports/content-reports.service.js';
import { readToken } from './token.js';

// Authorization 헤더의 로그인 토큰을 확인해 userId를 돌려준다. 아니면 null.
// 서명만 믿지 않는다: 그 사이 계정이 사라졌거나, 비밀번호를 바꿔 토큰 세대가 올라갔으면 거절한다
export async function readSession(prisma: PrismaService, authorization: string | undefined): Promise<string | null> {
  const [scheme, token] = authorization?.split(' ') ?? [];
  const claims = scheme === 'Bearer' && token ? await readToken(token) : null;
  if (!claims) return null;
  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: { sessionVersion: true, suspendedAt: true },
  });
  if (!user || user.sessionVersion !== claims.sessionVersion) return null;
  if (user.suspendedAt) throw new ForbiddenException(SUSPEND_MESSAGE);
  return claims.userId;
}
