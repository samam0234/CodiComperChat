import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentReportStatus, ContentTarget, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { parseNote } from '../reports/reports.service.js';

export const CONTENT_REPORT_REASONS = [
  { value: 'MINOR', label: '미성년자로 보임' },
  { value: 'PHOTOREAL', label: '실사와 너무 비슷함' },
  { value: 'NONCONSENT', label: '동의 없는 성적 묘사' },
  { value: 'REAL_PERSON', label: '실존 인물' },
  { value: 'OTHER', label: '기타' },
] as const;

const REASON_VALUES: string[] = CONTENT_REPORT_REASONS.map((r) => r.value);
const DETAIL_MAX = 500;
const OPEN_PER_REPORTER = 20;
const SUSPEND_MESSAGE = '이 계정은 운영 조치로 이용이 정지되었습니다.';

export function parseContentReport(body: unknown): { target: ContentTarget; targetId: string; reason: string; detail: string } {
  const data = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  if (data.target !== 'PHOTONET' && data.target !== 'WEBTOON') {
    throw new BadRequestException('신고할 대상을 알 수 없습니다.');
  }
  if (typeof data.targetId !== 'string' || data.targetId.length < 8 || data.targetId.length > 40) {
    throw new BadRequestException('신고할 그림을 알 수 없습니다.');
  }
  if (typeof data.reason !== 'string' || !REASON_VALUES.includes(data.reason)) {
    throw new BadRequestException('신고 사유를 골라 주세요.');
  }
  const detail = typeof data.detail === 'string' ? data.detail.trim() : '';
  if (detail.length > DETAIL_MAX) throw new BadRequestException(`자세한 내용은 ${DETAIL_MAX}자 이하로 써 주세요.`);
  if (data.reason === 'OTHER' && detail === '') throw new BadRequestException('기타는 내용을 써 주세요.');
  return { target: data.target, targetId: data.targetId, reason: data.reason, detail };
}

type Owner = { id: string; displayName: string; email: string; role: UserRole; suspendedAt: Date | null };

type TargetInfo = {
  blockedAt: Date | null;
  label: string;
  rating: string;
  characterName: string;
  owner: Owner;
  panels: number[];
};

const OWNER_SELECT = { id: true, displayName: true, email: true, role: true, suspendedAt: true } as const;

@Injectable()
export class ContentReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // 만든 사람만 자기 그림을 신고한다 (다른 사람에게는 보이지 않는 그림이다)
  async report(reporterId: string, characterId: string, body: unknown) {
    const parsed = parseContentReport(body);
    const target = await this.loadTarget(parsed.target, parsed.targetId);
    if (!target || target.owner.id !== reporterId || target.characterId !== characterId) {
      throw new NotFoundException('그림을 찾을 수 없습니다.');
    }
    if (target.blockedAt) throw new BadRequestException('이미 접근이 막힌 그림입니다.');

    const [already, open] = await Promise.all([
      this.prisma.contentReport.findFirst({
        where: { target: parsed.target, targetId: parsed.targetId, reporterId, status: ContentReportStatus.OPEN },
        select: { id: true },
      }),
      this.prisma.contentReport.count({ where: { reporterId, status: ContentReportStatus.OPEN } }),
    ]);
    if (already) throw new ConflictException('이미 신고한 그림입니다. 운영자가 확인하는 중이에요.');
    if (open >= OPEN_PER_REPORTER) throw new ConflictException('처리 중인 신고가 너무 많습니다. 잠시 후 다시 신고해 주세요.');

    await this.prisma.contentReport.create({
      data: { reporterId, target: parsed.target, targetId: parsed.targetId, reason: parsed.reason, detail: parsed.detail },
    });
  }

  async openQueue() {
    const rows = await this.prisma.contentReport.findMany({
      where: { status: ContentReportStatus.OPEN },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        target: true,
        targetId: true,
        reason: true,
        detail: true,
        createdAt: true,
        reporter: { select: { displayName: true } },
      },
    });
    return Promise.all(rows.map(async (row) => ({ ...row, ...(await this.summary(row.target, row.targetId)) })));
  }

  async blocked() {
    const rows = await this.prisma.contentReport.findMany({
      where: { status: ContentReportStatus.BLOCKED },
      orderBy: { resolvedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        target: true,
        targetId: true,
        reason: true,
        resolution: true,
        resolvedAt: true,
        reporter: { select: { displayName: true } },
      },
    });
    return Promise.all(rows.map(async (row) => ({ ...row, ...(await this.summary(row.target, row.targetId)) })));
  }

  // 그림을 만든 사람에게도 안 보이게 하고, 그 그림의 열린 신고를 모두 처리한다. suspend면 계정도 정지
  async block(reportId: string, rawNote: unknown, suspend: boolean) {
    const note = parseNote(rawNote, true);
    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
      select: { id: true, target: true, targetId: true, status: true },
    });
    if (!report || report.status !== ContentReportStatus.OPEN) throw new NotFoundException('처리할 신고가 없습니다.');
    const target = await this.loadTarget(report.target, report.targetId);
    if (!target) throw new NotFoundException('그림을 찾을 수 없습니다.');
    if (suspend && target.owner.role === UserRole.ADMIN) {
      throw new BadRequestException('운영자 계정은 정지할 수 없습니다.');
    }

    const now = new Date();
    const hide =
      report.target === ContentTarget.PHOTONET
        ? this.prisma.photonetImage.update({ where: { id: report.targetId }, data: { blockedAt: now, blockReason: note } })
        : this.prisma.webtoon.update({ where: { id: report.targetId }, data: { blockedAt: now, blockReason: note } });
    const ops: Prisma.PrismaPromise<unknown>[] = [
      hide,
      this.prisma.contentReport.updateMany({
        where: { target: report.target, targetId: report.targetId, status: ContentReportStatus.OPEN },
        data: { status: ContentReportStatus.BLOCKED, resolution: note, resolvedAt: now },
      }),
    ];
    if (suspend) {
      ops.push(
        this.prisma.user.update({
          where: { id: target.owner.id },
          data: { suspendedAt: now, suspendReason: note },
        }),
      );
    }
    await this.prisma.$transaction(ops);
  }

  async dismiss(reportId: string, rawNote: unknown) {
    const note = parseNote(rawNote, false);
    const report = await this.prisma.contentReport.findUnique({ where: { id: reportId }, select: { status: true } });
    if (!report || report.status !== ContentReportStatus.OPEN) throw new NotFoundException('처리할 신고가 없습니다.');
    await this.prisma.contentReport.update({
      where: { id: reportId },
      data: { status: ContentReportStatus.DISMISSED, resolution: note || null, resolvedAt: new Date() },
    });
  }

  async unsuspend(userId: string) {
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId, suspendedAt: { not: null }, role: { not: UserRole.ADMIN } },
      data: { suspendedAt: null, suspendReason: null },
    });
    if (count === 0) throw new NotFoundException('정지된 계정을 찾을 수 없습니다.');
  }

  async image(reportId: string, panelRaw: unknown): Promise<{ data: Buffer; mime: string }> {
    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
      select: { target: true, targetId: true },
    });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');
    if (report.target === ContentTarget.PHOTONET) {
      const image = await this.prisma.photonetImage.findUnique({
        where: { id: report.targetId },
        select: { data: true, mime: true },
      });
      if (!image) throw new NotFoundException('그림이 없습니다.');
      return { data: Buffer.from(image.data), mime: image.mime };
    }
    const panels = await this.prisma.webtoonPanel.findMany({
      where: { webtoonId: report.targetId, data: { not: null } },
      orderBy: { index: 'asc' },
      select: { index: true, data: true, mime: true },
    });
    const wanted = panelRaw === undefined || panelRaw === '' ? panels[0]?.index : Number(panelRaw);
    const panel = panels.find((p) => p.index === wanted && p.data && p.mime);
    if (!panel?.data || !panel.mime) throw new NotFoundException('그림이 없습니다.');
    return { data: Buffer.from(panel.data), mime: panel.mime };
  }

  private async summary(target: ContentTarget, targetId: string) {
    const info = await this.loadTarget(target, targetId);
    if (!info) {
      return { missing: true as const, label: '', rating: '', characterName: '', owner: null, panels: [] as number[], ownerSuspended: false };
    }
    return {
      missing: false as const,
      label: info.label,
      rating: info.rating,
      characterName: info.characterName,
      owner: { id: info.owner.id, displayName: info.owner.displayName, email: info.owner.email },
      panels: info.panels,
      ownerSuspended: info.owner.suspendedAt !== null,
    };
  }

  private async loadTarget(target: ContentTarget, targetId: string): Promise<(TargetInfo & { characterId: string }) | null> {
    if (target === ContentTarget.PHOTONET) {
      const image = await this.prisma.photonetImage.findUnique({
        where: { id: targetId },
        select: {
          blockedAt: true,
          prompt: true,
          rating: true,
          campaign: {
            select: {
              characterId: true,
              character: { select: { name: true } },
              user: { select: OWNER_SELECT },
            },
          },
        },
      });
      if (!image) return null;
      return {
        blockedAt: image.blockedAt,
        label: image.prompt,
        rating: image.rating,
        characterId: image.campaign.characterId,
        characterName: image.campaign.character.name,
        owner: image.campaign.user,
        panels: [],
      };
    }
    const webtoon = await this.prisma.webtoon.findUnique({
      where: { id: targetId },
      select: {
        blockedAt: true,
        title: true,
        rating: true,
        panels: { where: { drawnAt: { not: null } }, select: { index: true }, orderBy: { index: 'asc' } },
        campaign: {
          select: {
            characterId: true,
            character: { select: { name: true } },
            user: { select: OWNER_SELECT },
          },
        },
      },
    });
    if (!webtoon) return null;
    return {
      blockedAt: webtoon.blockedAt,
      label: webtoon.title,
      rating: webtoon.rating,
      characterId: webtoon.campaign.characterId,
      characterName: webtoon.campaign.character.name,
      owner: webtoon.campaign.user,
      panels: webtoon.panels.map((p) => p.index),
    };
  }
}

export { SUSPEND_MESSAGE };
