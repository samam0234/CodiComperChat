import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma } from '@prisma/client';
import { PersonaKnowledgeStore } from '../persona-rag/persona-knowledge.store.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { readiness } from './card.js';
import { toCharacterFields, toKnowledge } from './card-export.js';
import { StudioService } from './studio.service.js';
import { testState } from './test-session.js';

// 초안 하나 = 지식 파일 하나. 이름이 바뀌어도 파일을 찾을 수 있게 캐릭터 이름 대신 초안 id로 짓는다
// (저장소는 파일 안의 character 값으로 캐릭터를 찾는다)
export const knowledgeFileName = (draftId: string) => `studio-${draftId}.json`;

// 발행 (기획서 §5.4 운영자 도구, §6.1 "발행은 테스트 통과 후"). v1에는 유저 광장이 없어 운영자만 발행한다 (§9.2)
@Injectable()
export class StudioPublishService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studio: StudioService,
    private readonly store: PersonaKnowledgeStore,
  ) {}

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN') throw new ForbiddenException('발행은 운영자만 할 수 있습니다.');
  }

  async publish(userId: string, id: string) {
    await this.assertAdmin(userId);
    const draft = await this.studio.findOwned(userId, id);
    const card = draft.card;

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

    const data = {
      ...fields,
      profile: fields.profile ?? Prisma.DbNull,
      secret: card.boundary.secret,
      secretUnlockCondition: card.boundary.unlockCondition,
      published: true,
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
    await this.assertAdmin(userId);
    const draft = await this.studio.findOwned(userId, id);
    if (draft.characterId) {
      await this.prisma.character.update({ where: { id: draft.characterId }, data: { published: false } });
    }
    rmSync(join(this.store.directory, knowledgeFileName(id)), { force: true });
    this.store.invalidate();
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
