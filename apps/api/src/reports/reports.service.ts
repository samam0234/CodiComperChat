import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export const REPORT_REASONS = [
  { value: 'SEXUAL', label: '선정적·성적인 내용' },
  { value: 'VIOLENCE', label: '폭력·자해·위험한 내용' },
  { value: 'HATE', label: '혐오·차별·괴롭힘' },
  { value: 'PRIVACY', label: '실존 인물·개인정보' },
  { value: 'COPYRIGHT', label: '저작권·도용' },
  { value: 'SPAM', label: '광고·스팸' },
  { value: 'OTHER', label: '기타' },
] as const;
const REASON_VALUES: string[] = REPORT_REASONS.map((r) => r.value);

export const DETAIL_MAX = 500;
export const NOTE_MAX = 300;
// 신고 폭주 방지: 한 사람이 열어 둔 신고 상한
const OPEN_PER_REPORTER = 20;

export function parseReport(body: unknown): { reason: string; detail: string } {
  const data = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  if (typeof data.reason !== 'string' || !REASON_VALUES.includes(data.reason)) {
    throw new BadRequestException('신고 사유를 골라 주세요.');
  }
  const detail = typeof data.detail === 'string' ? data.detail.trim() : '';
  if (detail.length > DETAIL_MAX) throw new BadRequestException(`자세한 내용은 ${DETAIL_MAX}자 이하로 써 주세요.`);
  if (data.reason === 'OTHER' && detail === '') throw new BadRequestException('기타는 내용을 써 주세요.');
  return { reason: data.reason, detail };
}

export function parseNote(raw: unknown, required: boolean): string {
  const note = typeof raw === 'string' ? raw.trim() : '';
  if (note.length > NOTE_MAX) throw new BadRequestException(`사유는 ${NOTE_MAX}자 이하로 써 주세요.`);
  if (required && note === '') throw new BadRequestException('내리는 사유를 써 주세요. 캐릭터 주인에게 보입니다.');
  return note;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // 보이는 캐릭터만 신고할 수 있다(비공개·내려간 캐릭터는 찾을 수 없음). 내 캐릭터는 신고할 수 없다
  async report(reporterId: string, characterId: string, body: unknown) {
    const { reason, detail } = parseReport(body);
    const character = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        published: true,
        takenDownAt: null,
        OR: [{ visibility: { in: ['PUBLIC', 'UNLISTED'] } }, { ownerId: reporterId }],
      },
      select: { id: true, ownerId: true },
    });
    if (!character) throw new NotFoundException('캐릭터를 찾을 수 없습니다.');
    if (character.ownerId === reporterId) throw new BadRequestException('내가 만든 캐릭터는 신고할 수 없습니다.');

    const [already, open] = await Promise.all([
      this.prisma.characterReport.findFirst({ where: { characterId, reporterId, status: ReportStatus.OPEN }, select: { id: true } }),
      this.prisma.characterReport.count({ where: { reporterId, status: ReportStatus.OPEN } }),
    ]);
    if (already) throw new ConflictException('이미 신고한 캐릭터입니다. 운영자가 확인하는 중이에요.');
    if (open >= OPEN_PER_REPORTER) throw new ConflictException('처리 중인 신고가 너무 많습니다. 잠시 후 다시 신고해 주세요.');

    await this.prisma.characterReport.create({ data: { characterId, reporterId, reason, detail } });
  }

  // 운영자: 처리 대기 신고를 캐릭터별로 묶어 보여 준다 (같은 캐릭터가 여러 번 신고돼도 한 줄)
  async openByCharacter() {
    const rows = await this.prisma.characterReport.findMany({
      where: { status: ReportStatus.OPEN },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        reason: true,
        detail: true,
        createdAt: true,
        reporter: { select: { displayName: true } },
        character: {
          select: {
            id: true,
            name: true,
            oneLiner: true,
            visibility: true,
            takenDownAt: true,
            owner: { select: { id: true, displayName: true, email: true } },
          },
        },
      },
    });
    const groups = new Map<string, { character: (typeof rows)[number]['character']; reports: Omit<(typeof rows)[number], 'character'>[] }>();
    for (const { character, ...report } of rows) {
      const g = groups.get(character.id) ?? { character, reports: [] };
      g.reports.push(report);
      groups.set(character.id, g);
    }
    // 신고가 많은 캐릭터가 위로
    return [...groups.values()].sort((a, b) => b.reports.length - a.reports.length);
  }

  async takenDown() {
    return this.prisma.character.findMany({
      where: { takenDownAt: { not: null } },
      orderBy: { takenDownAt: 'desc' },
      select: { id: true, name: true, takenDownAt: true, takedownReason: true, owner: { select: { displayName: true } } },
    });
  }

  // 캐릭터를 내리고 그 캐릭터의 열린 신고를 모두 처리한다. 사유는 주인에게 보인다
  async takeDown(characterId: string, rawNote: unknown) {
    const note = parseNote(rawNote, true);
    const character = await this.prisma.character.findUnique({ where: { id: characterId }, select: { id: true } });
    if (!character) throw new NotFoundException('캐릭터를 찾을 수 없습니다.');
    await this.prisma.$transaction([
      this.prisma.character.update({ where: { id: characterId }, data: { takenDownAt: new Date(), takedownReason: note } }),
      this.prisma.characterReport.updateMany({
        where: { characterId, status: ReportStatus.OPEN },
        data: { status: ReportStatus.RESOLVED, resolution: note, resolvedAt: new Date() },
      }),
    ]);
  }

  async dismiss(characterId: string, rawNote: unknown) {
    const note = parseNote(rawNote, false);
    const { count } = await this.prisma.characterReport.updateMany({
      where: { characterId, status: ReportStatus.OPEN },
      data: { status: ReportStatus.DISMISSED, resolution: note || null, resolvedAt: new Date() },
    });
    if (count === 0) throw new NotFoundException('처리할 신고가 없습니다.');
  }

  async restore(characterId: string) {
    const { count } = await this.prisma.character.updateMany({
      where: { id: characterId, takenDownAt: { not: null } },
      data: { takenDownAt: null, takedownReason: null },
    });
    if (count === 0) throw new NotFoundException('내려간 캐릭터를 찾을 수 없습니다.');
  }
}
