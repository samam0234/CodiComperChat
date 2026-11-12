import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { simpleParser, type ParsedMail } from 'mailparser';
import { SMTPServer } from 'smtp-server';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MailService } from './mail.service.js';

// 실제 SMTP로 보내 본다: 이 시험 안에서 진짜 SMTP 서버를 띄우고, 우리 메일 모듈이 MAIL_SMTP_URL로 접속해 보낸 것을 받아 읽는다
const ENV = ['MAIL_SMTP_URL', 'MAIL_OUTBOX_DIR', 'MAIL_FROM', 'NODE_ENV'] as const;
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));

let server: SMTPServer;
let port = 0;
const received: { mail: ParsedMail; user?: string; rcpt: string[] }[] = [];

beforeAll(async () => {
  server = new SMTPServer({
    // 인증을 요구하는 실제 메일 서비스처럼 (시험용이라 TLS 없이)
    authOptional: false,
    allowInsecureAuth: true,
    disabledCommands: ['STARTTLS'],
    onAuth(auth, _session, callback) {
      if (auth.username === 'mailer' && auth.password === 'p@ss word') return callback(null, { user: auth.username });
      callback(new Error('잘못된 인증'));
    },
    onData(stream, session, callback) {
      simpleParser(stream)
        .then((mail) => {
          received.push({ mail, user: session.user as string | undefined, rcpt: session.envelope.rcptTo.map((r) => r.address) });
          callback();
        })
        .catch(callback);
    },
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  received.length = 0;
});

describe('메일 발송', () => {
  it('MAIL_SMTP_URL로 인증해 보내고, 한글 제목·본문·보내는 사람이 그대로 도착한다', async () => {
    // 비밀번호의 특수문자는 URL 인코딩해서 적는다 (.env.example 안내와 같게)
    process.env.MAIL_SMTP_URL = `smtp://mailer:${encodeURIComponent('p@ss word')}@127.0.0.1:${port}`;
    process.env.MAIL_FROM = '코디컴퍼챗 <no-reply@example.com>';
    await new MailService().send({
      to: 'minjun@example.com',
      subject: '[코디컴퍼챗] 이메일 주소를 확인해 주세요',
      text: '아래 링크를 열면 인증이 끝나요.\nhttps://example.com/verify-email?token=abc',
    });

    expect(received).toHaveLength(1);
    const [{ mail, user, rcpt }] = received;
    expect(user).toBe('mailer');
    expect(rcpt).toEqual(['minjun@example.com']);
    expect(mail.subject).toBe('[코디컴퍼챗] 이메일 주소를 확인해 주세요');
    expect(mail.from?.value[0]).toMatchObject({ name: '코디컴퍼챗', address: 'no-reply@example.com' });
    expect(mail.text).toContain('https://example.com/verify-email?token=abc');
    expect(mail.text).toContain('인증이 끝나요');
  });

  it('SMTP 인증이 틀리면 보내기가 실패한다 (호출부가 잡아 로그로 남긴다)', async () => {
    process.env.MAIL_SMTP_URL = `smtp://mailer:wrong@127.0.0.1:${port}`;
    await expect(new MailService().send({ to: 'a@example.com', subject: 's', text: 't' })).rejects.toThrow();
    expect(received).toHaveLength(0);
  });

  it('SMTP가 없고 MAIL_OUTBOX_DIR가 있으면 그 폴더에 JSON으로 남긴다', async () => {
    delete process.env.MAIL_SMTP_URL;
    const dir = mkdtempSync(join(tmpdir(), 'outbox-'));
    process.env.MAIL_OUTBOX_DIR = dir;
    try {
      await new MailService().send({ to: 'b@example.com', subject: '제목', text: '본문' });
      const [file] = readdirSync(dir);
      expect(JSON.parse(readFileSync(join(dir, file), 'utf8'))).toMatchObject({ to: 'b@example.com', subject: '제목', text: '본문' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('운영에서 발송 설정이 없으면 보내지 않고 실패하지도 않는다(오류 로그만)', async () => {
    delete process.env.MAIL_SMTP_URL;
    delete process.env.MAIL_OUTBOX_DIR;
    process.env.NODE_ENV = 'production';
    await expect(new MailService().send({ to: 'c@example.com', subject: 's', text: 't' })).resolves.toBeUndefined();
    expect(received).toHaveLength(0);
  });
});
