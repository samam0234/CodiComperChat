import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PortraitReview } from '@prisma/client';
import { postToAi } from '../ai/ai-client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PortraitMime } from './portrait.js';

type Verdict = { verdict: 'ok' | 'review' | 'block'; flags: string[]; reason: string };

// 초상 자동 검수 + 운영자 검수. 승인된 초상만 캐릭터에 실려 남에게 보인다.
//  - AI가 "문제 없음" → 승인
//  - AI가 "애매함"(실존 인물 사진·혐오 상징 가능성 등) 또는 AI가 꺼져 있음 → 운영자 검수 대기 (그동안 남에게 안 보임)
//  - AI가 "명백히 안 됨"(성적 노출·잔혹한 유혈 등) → 올리지 못함 (400)
@Injectable()
export class PortraitReviewService {
  private readonly logger = new Logger('PortraitReview');

  constructor(private readonly prisma: PrismaService) {}

  async moderate(image: { data: Buffer; mime: PortraitMime }): Promise<{ review: PortraitReview; note: string | null }> {
    let result: Verdict;
    try {
      result = await postToAi<Verdict>('/moderate-image', { image: image.data.toString('base64'), mime: image.mime });
    } catch (error) {
      // 검수를 못 했다고 그냥 통과시키지 않는다. 사람이 볼 때까지 남에게 보이지 않게 둔다
      this.logger.warn(`자동 검수 실패 → 운영자 검수로: ${error instanceof Error ? error.message : String(error)}`);
      return { review: PortraitReview.PENDING, note: '자동 검수를 하지 못해 운영자가 확인해요.' };
    }
    if (result.verdict === 'block') throw new BadRequestException(result.reason || '올릴 수 없는 그림이에요.');
    if (result.verdict === 'review') return { review: PortraitReview.PENDING, note: result.reason || '운영자가 확인해요.' };
    return { review: PortraitReview.APPROVED, note: null };
  }

  // 운영자: 검수 대기 초상 목록 (그림 본문은 따로 받는다)
  async pending() {
    const drafts = await this.prisma.characterDraft.findMany({
      where: { portraitReview: PortraitReview.PENDING },
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        card: true,
        portraitReviewNote: true,
        updatedAt: true,
        characterId: true,
        owner: { select: { displayName: true, email: true } },
      },
    });
    return drafts.map((d) => ({
      draftId: d.id,
      name: cardName(d.card),
      note: d.portraitReviewNote ?? '',
      updatedAt: d.updatedAt,
      published: d.characterId !== null,
      owner: d.owner.displayName,
      ownerEmail: d.owner.email,
    }));
  }

  async image(draftId: string) {
    const row = await this.prisma.characterDraft.findUnique({
      where: { id: draftId },
      select: { portrait: true, portraitMime: true },
    });
    if (!row?.portrait || !row.portraitMime) throw new NotFoundException('초상이 없습니다.');
    return { data: Buffer.from(row.portrait), mime: row.portraitMime };
  }

  // 승인: 초안을 승인하고, 발행된 캐릭터가 있으면 그 캐릭터에도 초상을 싣는다
  // 반려: 사유를 남긴다(만든 사람이 공방에서 본다). 캐릭터에는 실리지 않는다
  async decide(draftId: string, body: { decision?: unknown; note?: unknown } | undefined) {
    const decision = body?.decision;
    if (decision !== 'approve' && decision !== 'reject') {
      throw new BadRequestException('decision은 approve 또는 reject여야 합니다.');
    }
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 300) : '';
    if (decision === 'reject' && !note) throw new BadRequestException('반려 사유를 적어 주세요. 만든 사람에게 보입니다.');

    const draft = await this.prisma.characterDraft.findFirst({
      where: { id: draftId, portraitReview: PortraitReview.PENDING },
      select: { characterId: true, portrait: true, portraitMime: true },
    });
    if (!draft) throw new NotFoundException('검수를 기다리는 초상이 아닙니다.');

    if (decision === 'approve') {
      await this.prisma.characterDraft.update({
        where: { id: draftId },
        data: { portraitReview: PortraitReview.APPROVED, portraitReviewNote: null },
      });
      if (draft.characterId) {
        await this.prisma.character.update({
          where: { id: draft.characterId },
          data: { portrait: draft.portrait, portraitMime: draft.portraitMime },
        });
      }
      return;
    }
    await this.prisma.characterDraft.update({
      where: { id: draftId },
      data: { portraitReview: PortraitReview.REJECTED, portraitReviewNote: note },
    });
  }
}

function cardName(card: unknown): string {
  const name = (card as { identity?: { name?: unknown } } | null)?.identity?.name;
  return typeof name === 'string' && name ? name : '(이름 없음)';
}
