// 메일 발송 설정(MAIL_SMTP_URL)이 실제로 되는지 시험 메일 한 통을 보내 확인한다.
//   npm run mail:check --workspace api -- 받을주소@example.com
// apps/api/.env의 MAIL_SMTP_URL·MAIL_FROM을 쓴다. 비밀번호 등 설정 값은 출력하지 않는다
import 'dotenv/config';
import nodemailer from 'nodemailer';

const to = process.argv[2];
const url = process.env.MAIL_SMTP_URL;
if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error('사용법: npm run mail:check --workspace api -- 받을주소@example.com');
  process.exit(1);
}
if (!url) {
  console.error('MAIL_SMTP_URL이 없다. apps/api/.env에 넣는다 (.env.example 참고).');
  process.exit(1);
}

const transport = nodemailer.createTransport(url);
try {
  await transport.verify();
  const info = await transport.sendMail({
    from: process.env.MAIL_FROM ?? '코디컴퍼챗 <no-reply@codicomperchat.local>',
    to,
    subject: '[코디컴퍼챗] 메일 발송 시험',
    text: '이 메일이 보이면 코디컴퍼챗의 메일 발송 설정이 정상입니다.',
  });
  console.log(`✓ 보냈다 (메일 서버 응답: ${info.response})`);
} catch (error) {
  console.error(`✗ 보내지 못했다: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  transport.close();
}
