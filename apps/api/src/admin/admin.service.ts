import { Injectable } from '@nestjs/common';
import { CampaignStatus, CharacterVisibility, ContentReportStatus, PortraitReview, Prisma, ReportStatus } from '@prisma/client';
import { aiQueue } from '../ai/ai-queue.js';
import { effectivePlan } from '../plan/plan.js';
import { PrismaService } from '../prisma/prisma.service.js';

const DAY = 86_400_000;

export type CharacterFilter = 'all' | 'public' | 'unlisted' | 'private' | 'official' | 'taken-down' | 'unpublished';

// 운영자 콘솔(console/)이 쓰는 읽기 전용 모아 보기. 처리(내리기·검수·등급)는 각 기능 모듈의 운영자 경로가 한다
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // 대시보드 숫자. 한 번에 한 화면을 그릴 만큼만 센다
  async stats(now = new Date()) {
    const since1d = new Date(now.getTime() - DAY);
    const since7d = new Date(now.getTime() - 7 * DAY);
    const [
      users,
      verifiedUsers,
      newUsers7d,
      admins,
      proRows,
      characters,
      publicCharacters,
      takenDown,
      openReports,
      openContentReports,
      reportedCharacters,
      pendingPortraits,
      activeConversations,
      messages24h,
      drafts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
      this.prisma.user.count({ where: { createdAt: { gte: since7d } } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.findMany({ where: { plan: 'PRO' }, select: { plan: true, planUntil: true } }),
      this.prisma.character.count({ where: { published: true } }),
      this.prisma.character.count({ where: { published: true, takenDownAt: null, visibility: CharacterVisibility.PUBLIC } }),
      this.prisma.character.count({ where: { takenDownAt: { not: null } } }),
      this.prisma.characterReport.count({ where: { status: ReportStatus.OPEN } }),
      this.prisma.contentReport.count({ where: { status: ContentReportStatus.OPEN } }),
      this.prisma.characterReport.groupBy({ by: ['characterId'], where: { status: ReportStatus.OPEN } }),
      this.prisma.characterDraft.count({ where: { portraitReview: PortraitReview.PENDING } }),
      this.prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
      this.prisma.message.count({ where: { createdAt: { gte: since1d } } }),
      this.prisma.characterDraft.count(),
    ]);
    return {
      users: { total: users, verified: verifiedUsers, new7d: newUsers7d, admins, pro: proRows.filter((u) => effectivePlan(u, now) === 'PRO').length },
      characters: { published: characters, public: publicCharacters, takenDown, drafts },
      moderation: { openReports, openContentReports, reportedCharacters: reportedCharacters.length, pendingPortraits },
      activity: { activeConversations, messages24h },
      // 지금 이 API 서버의 AI 호출 대기열 (서버가 여러 대면 대마다 다르다)
      ai: aiQueue.stats(),
      at: now,
    };
  }

  // 캐릭터 전체 목록 (비공개·내려간 것까지). 이름·한 줄 소개로 찾는다
  async characters(query: { q?: unknown; filter?: unknown; take?: unknown }) {
    const q = typeof query.q === 'string' ? query.q.trim().slice(0, 40) : '';
    const filter = (typeof query.filter === 'string' ? query.filter : 'all') as CharacterFilter;
    const take = Math.min(200, Math.max(1, Number(query.take) || 100));

    const where: Prisma.CharacterWhereInput = {};
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { oneLiner: { contains: q, mode: 'insensitive' } }];
    if (filter === 'public') Object.assign(where, { published: true, takenDownAt: null, visibility: CharacterVisibility.PUBLIC });
    if (filter === 'unlisted') Object.assign(where, { published: true, takenDownAt: null, visibility: CharacterVisibility.UNLISTED });
    if (filter === 'private') Object.assign(where, { published: true, takenDownAt: null, visibility: CharacterVisibility.PRIVATE });
    if (filter === 'official') where.ownerId = null;
    if (filter === 'taken-down') where.takenDownAt = { not: null };
    if (filter === 'unpublished') where.published = false;

    const rows = await this.prisma.character.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        oneLiner: true,
        published: true,
        visibility: true,
        portraitMime: true,
        takenDownAt: true,
        takedownReason: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { displayName: true, email: true } },
        _count: { select: { campaigns: true, reports: { where: { status: ReportStatus.OPEN } } } },
      },
    });
    return rows.map(({ owner, _count, ...c }) => ({
      ...c,
      hasPortrait: c.portraitMime !== null,
      official: owner === null,
      owner: owner ? { displayName: owner.displayName, email: owner.email } : null,
      conversations: _count.campaigns,
      openReports: _count.reports,
    }));
  }

  async portrait(id: string) {
    const row = await this.prisma.character.findUnique({ where: { id }, select: { portrait: true, portraitMime: true } });
    return row?.portrait && row.portraitMime ? { data: Buffer.from(row.portrait), mime: row.portraitMime } : null;
  }
}
