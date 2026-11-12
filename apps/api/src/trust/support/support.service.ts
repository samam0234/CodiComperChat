import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SupportInquiryStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { OPEN_PER_USER, SUPPORT_CATEGORIES, parseInquiry, parseReply } from './support-inquiries.js';

const mineSelect = {
  id: true,
  category: true,
  subject: true,
  body: true,
  status: true,
  reply: true,
  repliedAt: true,
  createdAt: true,
} as const;

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  categories() {
    return SUPPORT_CATEGORIES;
  }

  async mine(userId: string) {
    return this.prisma.supportInquiry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: mineSelect,
    });
  }

  async create(userId: string, raw: unknown) {
    const input = parseInquiry(raw);
    const open = await this.prisma.supportInquiry.count({ where: { userId, status: SupportInquiryStatus.OPEN } });
    if (open >= OPEN_PER_USER) throw new ConflictException('답변을 기다리는 문의가 너무 많습니다. 답변이 온 뒤에 다시 보내 주세요.');
    const row = await this.prisma.supportInquiry.create({ data: { userId, ...input }, select: { id: true } });
    return row;
  }

  async queue() {
    const rows = await this.prisma.supportInquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        ...mineSelect,
        user: { select: { email: true, displayName: true } },
      },
    });
    const present = (row: (typeof rows)[number]) => ({
      id: row.id,
      category: row.category,
      subject: row.subject,
      body: row.body,
      status: row.status,
      reply: row.reply,
      repliedAt: row.repliedAt,
      createdAt: row.createdAt,
      user: row.user,
    });
    return {
      categories: SUPPORT_CATEGORIES,
      open: rows.filter((row) => row.status === SupportInquiryStatus.OPEN).map(present),
      answered: rows.filter((row) => row.status === SupportInquiryStatus.ANSWERED).map(present),
    };
  }

  async reply(id: string, raw: unknown) {
    const reply = parseReply(raw);
    const row = await this.prisma.supportInquiry.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException('문의를 찾을 수 없습니다.');
    await this.prisma.supportInquiry.update({
      where: { id },
      data: { reply, status: SupportInquiryStatus.ANSWERED, repliedAt: new Date() },
    });
  }
}
