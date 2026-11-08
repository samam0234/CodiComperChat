import { BadRequestException } from '@nestjs/common';

export const SUPPORT_CATEGORIES = [
  { value: 'ACCOUNT', label: '계정' },
  { value: 'BILLING', label: '결제·환불' },
  { value: 'CHARACTER', label: '캐릭터·신고' },
  { value: 'BUG', label: '오류' },
  { value: 'OTHER', label: '기타' },
] as const;

const CATEGORY_VALUES: string[] = SUPPORT_CATEGORIES.map((c) => c.value);
export const SUBJECT_MAX = 80;
export const BODY_MAX = 2000;
export const REPLY_MAX = 2000;
export const OPEN_PER_USER = 10;

export function parseInquiry(body: unknown): { category: string; subject: string; body: string } {
  const data = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  if (typeof data.category !== 'string' || !CATEGORY_VALUES.includes(data.category)) {
    throw new BadRequestException('문의 종류를 골라 주세요.');
  }
  const subject = typeof data.subject === 'string' ? data.subject.trim() : '';
  const text = typeof data.body === 'string' ? data.body.trim() : '';
  if (subject === '') throw new BadRequestException('제목을 적어 주세요.');
  if (subject.length > SUBJECT_MAX) throw new BadRequestException(`제목은 ${SUBJECT_MAX}자 이하로 적어 주세요.`);
  if (text === '') throw new BadRequestException('문의 내용을 적어 주세요.');
  if (text.length > BODY_MAX) throw new BadRequestException(`내용은 ${BODY_MAX}자 이하로 적어 주세요.`);
  return { category: data.category, subject, body: text };
}

export function parseReply(raw: unknown): string {
  const reply = typeof raw === 'string' ? raw.trim() : '';
  if (reply === '') throw new BadRequestException('답변을 적어 주세요.');
  if (reply.length > REPLY_MAX) throw new BadRequestException(`답변은 ${REPLY_MAX}자 이하로 적어 주세요.`);
  return reply;
}
