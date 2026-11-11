import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { postToAi } from '../ai/ai-client.js';
import type { ChatTurn } from '../character-chat/character-chat.types.js';
import type { Conversation } from '../conversations/conversations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { replacePersonalVectors } from '../rag/vector-rag.js';
import { chooseMemories } from './choose-memories.js';

// 대화가 3번 오갈 때(메시지 6개)마다 기억을 정리한다
export const MEMORIZE_EVERY_MESSAGES = 6;
// 한 번 정리할 때 넘기는 메시지 상한 (밀린 게 많으면 여러 번에 나눠 정리한다)
const BATCH_MESSAGES = 12;
// 중복 판단에 쓰도록 기존 기억을 넘기는 상한
const EXISTING_FOR_DEDUP = 40;

export type MemoryItem = { id: string; content: string; pinned: boolean; createdAt: Date };

const MEMORY_MAX = 200;

// 유저가 자기 이야기나 상대 설정을 말한 턴만 자동 기억으로 보낸다
const FACT_CUE = /나는|난 |내가 |제가 |저는 |제 이름|내 이름|너는|넌 |네가 |상대는|사실은|직업은|살고|살아|약속|기억해|내 설정|캐릭터는|성격은|좋아하|싫어하/;

export function looksLikeFact(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 8 && FACT_CUE.test(trimmed);
}

type Names = { characterName: string; userName: string };

@Injectable()
export class MemoriesService {
  private readonly logger = new Logger(MemoriesService.name);
  // 같은 대화를 동시에 두 번 정리하지 않게 막는다 (한 프로세스 안에서)
  private readonly running = new Set<string>();
  private readonly noticing = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  list(campaignId: string): Promise<MemoryItem[]> {
    return this.prisma.memoryChunk.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, pinned: true, createdAt: true },
    });
  }

  async add(campaignId: string, raw: string): Promise<MemoryItem> {
    const content = raw.trim().replace(/\s+/g, ' ');
    if (content.length < 2) throw new BadRequestException('기억은 두 글자 이상 적어 주세요.');
    if (content.length > MEMORY_MAX) throw new BadRequestException(`기억은 ${MEMORY_MAX}자 이하로 적어 주세요.`);
    const duplicate = await this.prisma.memoryChunk.findFirst({ where: { campaignId, content }, select: { id: true } });
    if (duplicate) throw new BadRequestException('같은 기억이 이미 있어요.');
    const created = await this.prisma.memoryChunk.create({
      data: { campaignId, content, pinned: true },
      select: { id: true, content: true, pinned: true, createdAt: true },
    });
    this.reindexInBackground(campaignId);
    return created;
  }

  async remove(campaignId: string, memoryId: string): Promise<void> {
    // campaignId를 조건에 걸어 남의 대화 기억은 지울 수 없게 한다
    const { count } = await this.prisma.memoryChunk.deleteMany({ where: { id: memoryId, campaignId } });
    if (count === 0) throw new NotFoundException('기억을 찾을 수 없습니다.');
    this.reindexInBackground(campaignId);
  }

  // 이번 턴에 넣을 기억. vectorTexts가 있으면 그 조각과 직접 적은 기억만, 없으면 글자 검색
  async forContext(
    campaignId: string,
    query: { message: string; recent: string[] },
    vectorTexts: string[] | null = null,
  ): Promise<{ id: string; text: string }[]> {
    return chooseMemories(await this.list(campaignId), query, vectorTexts);
  }

  reindexInBackground(campaignId: string): void {
    this.reindex(campaignId).catch((error: unknown) => {
      this.logger.warn(`기억 벡터 갱신 실패: ${error instanceof Error ? error.message : 'unknown'}`);
    });
  }

  private async reindex(campaignId: string): Promise<void> {
    const owner = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { userId: true, characterId: true },
    });
    if (!owner) return;
    const items = (await this.list(campaignId)).map((memory) => ({ id: memory.id, text: memory.content }));
    await replacePersonalVectors(owner.userId, owner.characterId, items);
  }

  private async pending(conversation: Conversation) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: conversation.campaignId },
      select: { memorizedUntil: true },
    });
    return this.prisma.message.findMany({
      where: {
        sessionId: conversation.sessionId,
        role: { in: [MessageRole.USER, MessageRole.CHARACTER] },
        ...(campaign?.memorizedUntil ? { createdAt: { gt: campaign.memorizedUntil } } : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { role: true, content: true, createdAt: true },
    });
  }

  // 밀린 메시지를 BATCH 단위로 정리한다. force면 개수가 모자라도 남은 것을 정리한다
  async memorize(conversation: Conversation, names: Names, force = false): Promise<number> {
    if (this.running.has(conversation.campaignId)) return 0;
    this.running.add(conversation.campaignId);
    let created = 0;
    try {
      let pending = await this.pending(conversation);
      while (pending.length >= (force ? 1 : MEMORIZE_EVERY_MESSAGES)) {
        // 유저 말이 하나도 없으면 정리할 게 없다 (시작 장면만 있는 경우)
        const batch = pending.slice(0, BATCH_MESSAGES);
        const until = batch[batch.length - 1].createdAt;

        if (batch.some((m) => m.role === MessageRole.USER)) {
          const existing = (await this.list(conversation.campaignId))
            .slice(0, EXISTING_FOR_DEDUP)
            .map((m) => m.content);
          const turns: ChatTurn[] = batch.map((m) => ({
            role: m.role === MessageRole.USER ? 'user' : 'character',
            text: m.content,
          }));
          // 평소 자동 정리는 뒤에서 하는 일이라 기다리는 답에 양보한다. "지금 정리하기"(force)는 사용자가 기다리므로 앞선다
          const { memories } = await postToAi<{ memories: string[] }>(
            '/remember',
            { characterName: names.characterName, userName: names.userName, existing, turns },
            { priority: force ? 'foreground' : 'background' },
          );
          if (memories.length > 0) {
            await this.prisma.memoryChunk.createMany({
              data: memories.map((content) => ({ campaignId: conversation.campaignId, content })),
            });
            created += memories.length;
            this.reindexInBackground(conversation.campaignId);
          }
        }

        await this.prisma.campaign.update({
          where: { id: conversation.campaignId },
          data: { memorizedUntil: until },
        });
        pending = pending.slice(batch.length);
      }
      return created;
    } finally {
      this.running.delete(conversation.campaignId);
    }
  }

  // 유저가 자기 프로필이나 상대 설정을 말한 턴이면, 그 사실만 장기 기억으로 남긴다
  async notice(conversation: Conversation, names: Names, userText: string, reply: string): Promise<number> {
    if (!looksLikeFact(userText)) return 0;
    if (this.noticing.has(conversation.campaignId)) return 0;
    this.noticing.add(conversation.campaignId);
    try {
      const existing = (await this.list(conversation.campaignId)).slice(0, EXISTING_FOR_DEDUP).map((m) => m.content);
      const turns: ChatTurn[] = [
        { role: 'user', text: userText },
        { role: 'character', text: reply },
      ];
      const { memories } = await postToAi<{ memories: string[] }>(
        '/notice-facts',
        { characterName: names.characterName, userName: names.userName, existing, turns },
        { priority: 'background' },
      );
      const known = new Set(existing);
      const fresh = (Array.isArray(memories) ? memories : [])
        .map((m) => m.trim())
        .filter((m) => m.length >= 4 && m.length <= 200 && !known.has(m));
      if (fresh.length === 0) return 0;
      await this.prisma.memoryChunk.createMany({
        data: fresh.map((content) => ({ campaignId: conversation.campaignId, content, pinned: false })),
      });
      this.reindexInBackground(conversation.campaignId);
      return fresh.length;
    } finally {
      this.noticing.delete(conversation.campaignId);
    }
  }

  noticeInBackground(conversation: Conversation, names: Names, userText: string, reply: string): void {
    this.notice(conversation, names, userText, reply).catch((error: unknown) => {
      this.logger.warn(`사실 기억 실패 (다음 턴에 다시 보지 않고 넘어감): ${(error as Error).message}`);
    });
  }

  // 답을 돌려준 뒤 뒤에서 조용히 정리한다 — 실패해도 대화는 멈추지 않고 다음 기회에 다시 한다
  memorizeInBackground(conversation: Conversation, names: Names): void {
    this.memorize(conversation, names).catch((error: unknown) => {
      this.logger.warn(`기억 정리 실패 (다음 턴에 다시 시도): ${(error as Error).message}`);
    });
  }
}
