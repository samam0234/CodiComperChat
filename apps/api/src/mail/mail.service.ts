import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

export type Mail = { to: string; subject: string; text: string };

// 메일 보내는 곳을 한곳에 둔다. 설정에 따라 셋 중 하나로 간다:
//  1) MAIL_SMTP_URL이 있으면 SMTP로 실제 발송 (예: smtps://user:pass@smtp.example.com:465)
//  2) MAIL_OUTBOX_DIR이 있으면 그 폴더에 JSON 파일로 남김 (자동 테스트가 링크를 읽는다)
//  3) 둘 다 없으면 개발 중에만 서버 로그에 남김. 운영(NODE_ENV=production)에서는 보내지 못했다고 오류 로그만 남긴다
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private transport?: Transporter;

  private smtp(): Transporter | undefined {
    const url = process.env.MAIL_SMTP_URL;
    if (!url) return undefined;
    this.transport ??= nodemailer.createTransport(url);
    return this.transport;
  }

  async send(mail: Mail): Promise<void> {
    const from = process.env.MAIL_FROM ?? '코디컴퍼챗 <no-reply@codicomperchat.local>';
    const smtp = this.smtp();
    if (smtp) {
      await smtp.sendMail({ from, ...mail });
      return;
    }
    const outbox = process.env.MAIL_OUTBOX_DIR;
    if (outbox) {
      await mkdir(outbox, { recursive: true });
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
      await writeFile(join(outbox, name), JSON.stringify({ from, ...mail }, null, 2));
      return;
    }
    if (process.env.NODE_ENV === 'production') {
      this.logger.error(`메일 발송 설정(MAIL_SMTP_URL)이 없어 "${mail.subject}" 메일을 보내지 못했다`);
      return;
    }
    // 개발 중: 받는 사람과 본문(링크 포함)을 로그로 본다
    this.logger.log(`[개발용 메일] 받는 사람 ${mail.to} / ${mail.subject}\n${mail.text}`);
  }
}

// 메일 속 링크가 가리킬 웹 주소
export function webBaseUrl(): string {
  return (process.env.WEB_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
