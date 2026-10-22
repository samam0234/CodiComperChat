import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CharacterVisibility, Prisma } from '@prisma/client';
import { effectivePlan, multiplierFor } from '../plan/plan.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EMPTY_CARD, normalizeCard, readiness, type Card } from './card.js';
import type { PortraitMime } from './portrait.js';
import { PortraitReviewService } from './portrait-review.service.js';
import { testState } from './test-session.js';

// 이미 저장된 카드를 읽을 때는 길이를 보지 않는다 — 프로 등급이 끝난 뒤에도 긴 글을 그대로 보고 쓸 수 있어야 한다
const READ = { multiplier: Number.POSITIVE_INFINITY } as const;

export const VISIBILITIES = Object.values(CharacterVisibility);

export function parseVisibility(raw: unknown): CharacterVisibility {
  if (typeof raw !== 'string' || !VISIBILITIES.includes(raw as CharacterVisibility)) {
    throw new BadRequestException('공개 범위는 PUBLIC, UNLISTED, PRIVATE 중 하나여야 합니다.');
  }
  return raw as CharacterVisibility;
}

// 초안 목록·편집. 초안은 만든 사람만 보고 고친다 (모든 조회에 ownerId 조건)
@Injectable()
export class StudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: PortraitReviewService,
  ) {}

  async list(ownerId: string) {
    const drafts = await this.prisma.characterDraft.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        card: true,
        visibility: true,
        portraitMime: true,
        characterId: true,
        updatedAt: true,
        character: { select: { published: true, takenDownAt: true } },
      },
    });
    return drafts.map((d) => {
      const card = normalizeCard(d.card, READ);
      return {
        id: d.id,
        name: card.identity.name,
        oneLiner: card.identity.oneLiner,
        published: (d.character?.published ?? false) && !d.character?.takenDownAt,
        takenDown: !!d.character?.takenDownAt,
        visibility: d.visibility,
        hasPortrait: d.portraitMime !== null,
        characterId: d.characterId,
        updatedAt: d.updatedAt,
        complete: readiness(card).complete,
      };
    });
  }

  async create(ownerId: string) {
    const draft = await this.prisma.characterDraft.create({
      data: { ownerId, card: EMPTY_CARD as unknown as Prisma.InputJsonValue },
      select: { id: true },
    });
    return draft;
  }

  async findOwned(ownerId: string, id: string) {
    const draft = await this.prisma.characterDraft.findFirst({
      where: { id, ownerId },
      select: {
        id: true,
        card: true,
        lastTest: true,
        visibility: true,
        portraitMime: true,
        portraitReview: true,
        portraitReviewNote: true,
        characterId: true,
        updatedAt: true,
        character: { select: { published: true, takenDownAt: true, takedownReason: true } },
      },
    });
    if (!draft) throw new NotFoundException('초안을 찾을 수 없습니다.');
    return { ...draft, card: normalizeCard(draft.card, READ) };
  }

  // 이 사용자에게 지금 적용되는 요금 등급과 긴 글 칸 배수
  async planOf(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planUntil: true } });
    const plan = user ? effectivePlan(user) : 'FREE';
    return { plan, multiplier: multiplierFor(plan) };
  }

  async get(ownerId: string, id: string) {
    const [draft, { plan, multiplier }] = await Promise.all([this.findOwned(ownerId, id), this.planOf(ownerId)]);
    return {
      id: draft.id,
      plan,
      limitMultiplier: multiplier,
      card: draft.card,
      test: testState(draft.card, draft.lastTest),
      characterId: draft.characterId,
      published: (draft.character?.published ?? false) && !draft.character?.takenDownAt,
      visibility: draft.visibility,
      hasPortrait: draft.portraitMime !== null,
      // 초상 검수: APPROVED(남에게 보임) / PENDING(운영자 확인 중, 남에게 안 보임) / REJECTED(반려, note에 사유)
      portraitReview: draft.portraitMime !== null ? draft.portraitReview : null,
      portraitReviewNote: draft.portraitReviewNote,
      // 운영자가 내렸으면 시각과 사유(다시 발행할 수 없다)
      takedown: draft.character?.takenDownAt
        ? { at: draft.character.takenDownAt, reason: draft.character.takedownReason ?? '' }
        : null,
      updatedAt: draft.updatedAt,
      readiness: readiness(draft.card),
    };
  }

  // 초상은 카드(지문)와 따로다 — 바꿔도 다시 테스트할 필요 없다.
  // 올리면 자동 검수를 거친다(명백히 안 되는 그림은 400). 발행 중이면 승인된 초상만 캐릭터에 바로 싣고,
  // 검수 대기면 캐릭터에서는 초상을 내려 둔다(운영자가 승인하면 실린다)
  async setPortrait(ownerId: string, id: string, image: { data: Buffer; mime: PortraitMime } | null) {
    const draft = await this.findOwned(ownerId, id);
    const review = image ? await this.reviews.moderate(image) : null;
    const art = image
      ? { portrait: new Uint8Array(image.data), portraitMime: image.mime }
      : { portrait: null, portraitMime: null };
    await this.prisma.characterDraft.update({
      where: { id },
      data: { ...art, portraitReview: review?.review ?? null, portraitReviewNote: review?.note ?? null },
    });
    if (draft.characterId) {
      const visible = review?.review === 'APPROVED' ? art : { portrait: null, portraitMime: null };
      await this.prisma.character.update({ where: { id: draft.characterId }, data: visible });
    }
    return this.get(ownerId, id);
  }

  async portrait(ownerId: string, id: string) {
    await this.findOwned(ownerId, id);
    const row = await this.prisma.characterDraft.findUnique({ where: { id }, select: { portrait: true, portraitMime: true } });
    if (!row?.portrait || !row.portraitMime) throw new NotFoundException('초상이 없습니다.');
    return { data: Buffer.from(row.portrait), mime: row.portraitMime };
  }

  async save(ownerId: string, id: string, rawCard: unknown) {
    const [current, { multiplier }] = await Promise.all([this.findOwned(ownerId, id), this.planOf(ownerId)]);
    // 등급이 허용하는 길이까지 받고, 지금 저장된 값 그대로인 긴 글은 상한을 넘어도 받는다
    const card: Card = normalizeCard(rawCard, { multiplier, existing: current.card });
    await this.prisma.characterDraft.update({
      where: { id },
      data: { card: card as unknown as Prisma.InputJsonValue },
    });
    return this.get(ownerId, id);
  }

  async remove(ownerId: string, id: string) {
    const draft = await this.findOwned(ownerId, id);
    // 발행된 캐릭터에는 유저 대화가 붙어 있다. 초안만 지우면 고칠 길이 사라지므로 막는다
    if (draft.character?.published) {
      throw new ConflictException('발행된 캐릭터의 초안은 지울 수 없습니다.');
    }
    await this.prisma.characterDraft.delete({ where: { id } });
  }
}
