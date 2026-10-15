import { ConflictException, Injectable } from '@nestjs/common';
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma } from '@prisma/client';
import { PersonaKnowledgeStore } from '../persona-rag/persona-knowledge.store.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { readiness } from './card.js';
import { toCharacterFields, toKnowledge } from './card-export.js';
import { StudioService, parseVisibility } from './studio.service.js';
import { testState } from './test-session.js';

// 초안 하나 = 지식 파일 하나. 이름이 바뀌어도 파일을 찾을 수 있게 캐릭터 이름 대신 초안 id로 짓는다
// (저장소는 파일 안의 character 값으로 캐릭터를 찾는다)
export const knowledgeFileName = (draftId: string) => `studio-${draftId}.json`;

// 발행 (기획서 §6.1 "발행은 테스트 통과 후"). 2026-10-15 사용자 결정으로 누구나 발행하고
// 공개 범위(공개 / 링크 공개 / 비공개)를 고른다 — 기획서 §9.2 "v1 유저 광장 없음"을 사용자가 바꿨다
@Injectable()
export class StudioPublishService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studio: StudioService,
    private readonly store: PersonaKnowledgeStore,
  ) {}

  async publish(userId: string, id: string) {
    const draft = await this.studio.findOwned(userId, id);
    const card = draft.card;

    // 운영자가 내린 캐릭터는 주인이 다시 올릴 수 없다 (운영자가 복구해야 한다)
    if (draft.character?.takenDownAt) {
      throw new ConflictException(`운영자가 내린 캐릭터라 다시 발행할 수 없습니다. 사유: ${draft.character.takedownReason ?? ''}`);
    }
    if (!readiness(card).complete) throw new ConflictException('필수 단계를 모두 채워야 발행할 수 있습니다.');
    // 테스트 상태는 카드 지문으로 판단하므로, 통과한 뒤 카드를 고쳤다면 여기서 막힌다
    if (!testState(card, draft.lastTest).passed) {
      throw new ConflictException('지금 카드로 3턴 테스트를 통과해야 발행할 수 있습니다.');
    }

    const fields = toCharacterFields(card);
    const taken = await this.prisma.character.findUnique({ where: { name: fields.name }, select: { id: true } });
    if (taken && taken.id !== draft.characterId) {
      throw new ConflictException(`'${fields.name}' 이름의 캐릭터가 이미 있습니다.`);
    }

    // 지식 파일을 먼저 쓴다 — 캐릭터가 공개되는 순간 RAG가 이미 준비돼 있어야 첫 대화부터 같은 캐릭터다
    this.writeKnowledge(id, toKnowledge(card));

    // 초상은 카드와 따로 올린 것이라 발행할 때 캐릭터로 옮긴다
    const art = await this.prisma.characterDraft.findUnique({ where: { id }, select: { portrait: true, portraitMime: true } });
    const data = {
      ...fields,
      portrait: art?.portrait ? new Uint8Array(art.portrait) : null,
      portraitMime: art?.portraitMime ?? null,
      profile: fields.profile ?? Prisma.DbNull,
      secret: card.boundary.secret,
      secretUnlockCondition: card.boundary.unlockCondition,
      published: true,
      visibility: draft.visibility,
      ownerId: userId,
    };
    const character = draft.characterId
      ? await this.prisma.character.update({ where: { id: draft.characterId }, data, select: { id: true } })
      : await this.prisma.character.create({ data, select: { id: true } });
    if (!draft.characterId) {
      await this.prisma.characterDraft.update({ where: { id }, data: { characterId: character.id } });
    }
    return this.studio.get(userId, id);
  }

  // 목록·새 대화에서 내린다. 이미 있는 대화 기록은 그대로 두고, 초안으로 고쳐 다시 발행할 수 있다
  async unpublish(userId: string, id: string) {
    const draft = await this.studio.findOwned(userId, id);
    if (draft.characterId) {
      await this.prisma.character.update({ where: { id: draft.characterId }, data: { published: false } });
    }
    rmSync(join(this.store.directory, knowledgeFileName(id)), { force: true });
    this.store.invalidate();
    return this.studio.get(userId, id);
  }

  // 공개 범위 바꾸기: 카드 지문과 무관해 다시 테스트할 필요 없다. 발행 중이면 캐릭터에 바로 적용한다
  async setVisibility(userId: string, id: string, raw: unknown) {
    const visibility = parseVisibility(raw);
    const draft = await this.studio.findOwned(userId, id);
    await this.prisma.characterDraft.update({ where: { id }, data: { visibility } });
    if (draft.characterId) {
      await this.prisma.character.update({ where: { id: draft.characterId }, data: { visibility } });
    }
    return this.studio.get(userId, id);
  }

  private writeKnowledge(id: string, knowledge: unknown) {
    const dir = this.store.directory;
    mkdirSync(dir, { recursive: true });
    // 반쯤 쓴 파일을 저장소가 읽지 않게 _ 임시 파일(저장소가 건너뜀)에 쓰고 바꿔 끼운다
    const tmp = join(dir, `_${knowledgeFileName(id)}.tmp`);
    writeFileSync(tmp, `${JSON.stringify(knowledge, null, 2)}\n`, 'utf8');
    renameSync(tmp, join(dir, knowledgeFileName(id)));
    this.store.invalidate();
  }
}
