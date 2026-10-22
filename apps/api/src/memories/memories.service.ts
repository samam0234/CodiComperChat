import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { postToAi } from '../ai/ai-client.js';
import type { ChatTurn } from '../character-chat/character-chat.types.js';
import type { Conversation } from '../conversations/conversations.service.js';
import { retrieve } from '../persona-rag/retriever.js';
import { PrismaService } from '../prisma/prisma.service.js';

// 대화가 3번 오갈 때(메시지 6개)마다 기억을 정리한다
export const MEMORIZE_EVERY_MESSAGES = 6;
// 한 번 정리할 때 넘기는 메시지 상한 (밀린 게 많으면 여러 번에 나눠 정리한다)
const BATCH_MESSAGES = 12;
// 이 개수 이하면 기억을 전부 넣고, 넘으면 관련 있는 것 + 최근 것만 고른다
const INCLUDE_ALL_UNDER = 8;
const RELEVANT_PICK = 4;
const RECENT_PICK = 3;
// 중복 판단에 쓰도록 기존 기억을 넘기는 상한
const EXISTING_FOR_DEDUP = 40;

export type MemoryItem = { id: string; content: string; createdAt: Date };

type Names = { characterName: string; userName: string };

@Injectable()
export class MemoriesService {
  private readonly logger = new Logger(MemoriesService.name);
  // 같은 대화를 동시에 두 번 정리하지 않게 막는다 (한 프로세스 안에서)
  private readonly running = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  list(campaignId: string): Promise<MemoryItem[]> {
    return this.prisma.memoryChunk.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, createdAt: true },
    });
  }

  async remove(campaignId: string, memoryId: string): Promise<void> {
    // campaignId를 조건에 걸어 남의 대화 기억은 지울 수 없게 한다
    const { count } = await this.prisma.memoryChunk.deleteMany({ where: { id: memoryId, campaignId } });
    if (count === 0) throw new NotFoundException('기억을 찾을 수 없습니다.');
  }

  // 이번 턴에 넣을 기억. 적으면 전부, 많으면 이번 말과 관련된 것 + 가장 최근 것
  async forContext(
    campaignId: string,
    query: { message: string; recent: string[] },
  ): Promise<{ id: string; text: string }[]> {
    const all = await this.list(campaignId);
    if (all.length <= INCLUDE_ALL_UNDER) {
      return all.reverse().map((m) => ({ id: m.id, text: m.content }));
    }

    const chunks = all.map((m) => ({ id: m.id, type: 'memory', topic: '', keywords: [], text: m.content }));
    const relevant = retrieve(chunks, query, { topK: RELEVANT_PICK, charBudget: 600 }).map((p) => p.chunk.id);
    const pick = new Set([...relevant, ...all.slice(0, RECENT_PICK).map((m) => m.id)]);
    // 오래된 것부터 넣어 시간 순서를 지킨다
    return all
      .filter((m) => pick.has(m.id))
      .reverse()
      .map((m) => ({ id: m.id, text: m.content }));
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

  // 답을 돌려준 뒤 뒤에서 조용히 정리한다 — 실패해도 대화는 멈추지 않고 다음 기회에 다시 한다
  memorizeInBackground(conversation: Conversation, names: Names): void {
    this.memorize(conversation, names).catch((error: unknown) => {
      this.logger.warn(`기억 정리 실패 (다음 턴에 다시 시도): ${(error as Error).message}`);
    });
  }
}
