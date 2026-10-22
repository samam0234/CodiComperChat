// 계정 권한을 바꾼다. 운영자(ADMIN)는 신고함·초상 검수·계정 등급·환불 화면을 쓴다 (docs/guidance/operations.md).
// 공방 발행은 이메일을 인증한 누구나 할 수 있다(처음에는 운영자 전용이었다, 기획서 §5.4·§9.2)
//   npm run user:role --workspace api -- someone@example.com admin
//   npm run user:role --workspace api -- someone@example.com user
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const [email, roleArg] = process.argv.slice(2);
const role = roleArg?.toUpperCase();
if (!email || (role !== 'ADMIN' && role !== 'USER')) {
  console.error('사용법: npm run user:role --workspace api -- <이메일> <admin|user>');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const user = await prisma.user.update({ where: { email }, data: { role }, select: { email: true, role: true } });
  console.log(`${user.email} → ${user.role}`);
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
