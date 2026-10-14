import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { EMPTY_CARD, normalizeCard, readiness, type Card } from './card.js';
import { testState } from './test-session.js';

// 초안 목록·편집. 초안은 만든 사람만 보고 고친다 (모든 조회에 ownerId 조건)
@Injectable()
export class StudioService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerId: string) {
    const drafts = await this.prisma.characterDraft.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, card: true, characterId: true, updatedAt: true, character: { select: { published: true } } },
    });
    return drafts.map((d) => {
      const card = normalizeCard(d.card);
      return {
        id: d.id,
        name: card.identity.name,
        oneLiner: card.identity.oneLiner,
        published: d.character?.published ?? false,
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
        characterId: true,
        updatedAt: true,
        character: { select: { published: true } },
      },
    });
    if (!draft) throw new NotFoundException('초안을 찾을 수 없습니다.');
    return { ...draft, card: normalizeCard(draft.card) };
  }

  async get(ownerId: string, id: string) {
    const draft = await this.findOwned(ownerId, id);
    return {
      id: draft.id,
      card: draft.card,
      test: testState(draft.card, draft.lastTest),
      characterId: draft.characterId,
      published: draft.character?.published ?? false,
      updatedAt: draft.updatedAt,
      readiness: readiness(draft.card),
    };
  }

  async save(ownerId: string, id: string, rawCard: unknown) {
    await this.findOwned(ownerId, id);
    const card: Card = normalizeCard(rawCard);
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
