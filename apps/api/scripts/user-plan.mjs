// 계정의 요금 등급을 바꾼다. 결제 연동 전이라 운영자가 부여한다 (PRO면 공방 긴 글 칸 글자 수 3배)
//   npm run user:plan --workspace api -- someone@example.com pro          만료 없음
//   npm run user:plan --workspace api -- someone@example.com pro 30       30일 뒤 FREE로
//   npm run user:plan --workspace api -- someone@example.com free
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const [email, planArg, daysArg] = process.argv.slice(2);
const plan = planArg?.toUpperCase();
const days = daysArg === undefined ? null : Number(daysArg);
if (!email || (plan !== 'PRO' && plan !== 'FREE') || (days !== null && (!Number.isInteger(days) || days < 1))) {
  console.error('사용법: npm run user:plan --workspace api -- <이메일> <pro|free> [일수]');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const planUntil = plan === 'PRO' && days ? new Date(Date.now() + days * 86_400_000) : null;
  const user = await prisma.user.update({ where: { email }, data: { plan, planUntil }, select: { email: true, plan: true, planUntil: true } });
  console.log(`${user.email} → ${user.plan}${user.planUntil ? ` (${user.planUntil.toISOString().slice(0, 10)}까지)` : ''}`);
} catch (error) {
  if (error?.code === 'P2025') {
    console.error(`계정을 찾을 수 없다: ${email}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
} finally {
  await prisma.$disconnect();
}
