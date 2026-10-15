import { createHash, randomBytes } from 'node:crypto';
import type { EmailTokenPurpose } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service.js';

// 메일 링크에 싣는 일회용 토큰. 원문은 메일에만 있고 DB에는 해시만 둔다(DB가 새도 링크를 만들 수 없게)
export const TOKEN_TTL_MS: Record<EmailTokenPurpose, number> = {
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,
  RESET_PASSWORD: 30 * 60 * 1000,
};

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// 새 토큰을 만들고, 같은 용도로 전에 보낸(아직 안 쓴) 토큰은 지운다 — 가장 최근 메일의 링크만 통한다
export async function issueEmailToken(prisma: PrismaService, userId: string, purpose: EmailTokenPurpose): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  await prisma.$transaction([
    prisma.emailToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
    prisma.emailToken.create({
      data: { userId, purpose, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]) },
    }),
  ]);
  return raw;
}

// 토큰을 한 번만 쓰게 한다. 유효하면 userId, 없거나·만료됐거나·이미 썼으면 null.
// "안 쓴 것만 쓴 것으로 바꾸기"를 한 문장으로 해 같은 링크를 동시에 두 번 눌러도 한 번만 통한다
export async function consumeEmailToken(
  prisma: PrismaService,
  raw: unknown,
  purpose: EmailTokenPurpose,
): Promise<string | null> {
  if (typeof raw !== 'string' || raw.length < 20 || raw.length > 200) return null;
  const tokenHash = hashToken(raw);
  const { count } = await prisma.emailToken.updateMany({
    where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count !== 1) return null;
  const token = await prisma.emailToken.findUnique({ where: { tokenHash }, select: { userId: true } });
  return token?.userId ?? null;
}
