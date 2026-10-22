import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreditReason } from '@prisma/client';
import { postToAi } from '../ai/ai-client.js';
import { readSession } from '../auth/session.js';
import { CharacterChatService } from '../character-chat/character-chat.service.js';
import { CharactersService } from '../characters/characters.service.js';
import { ConversationsService } from '../conversations/conversations.service.js';
import { OPERATION_COSTS, OPERATION_LABELS, type OperationName } from '../credits/credits.js';
import { CreditsService } from '../credits/credits.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// 오퍼레이션: 대화에 붙는 플러그인 (2026-10-23 사용자 요청, 제타의 플러그인과 비슷한 것).
// 모두 "진행 중인 대화"에 딸린 기록이라 대화를 지우면 함께 지워지고, 저장한 대화로 넘어가면 그 대화와 함께 남는다
const clip = (text: unknown, max: number) => (typeof text === 'string' ? text.trim().slice(0, max) : '');
const LIST_TAKE = 30;

type MindResult = { innerVoice: string; feeling: string; aboutUser: string };

@Injectable()
export class OperationsService {
  constructor(
    private readonly chat: CharacterChatService,
    private readonly characters: CharactersService,
    private readonly conversations: ConversationsService,
    private readonly credits: CreditsService,
    private readonly prisma: PrismaService,
  ) {}

  // 화면용 공통: 캐릭터, 지금 대화(없으면 null), 내 코레딧
  async view(characterId: string, authorization?: string) {
    const userId = await readSession(this.prisma, authorization);
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    const character = await this.characters.findOnePublished(characterId, userId);
    const [conversation, balance] = await Promise.all([
      this.conversations.find(userId, characterId),
      this.credits.balance(userId),
    ]);
    return {
      userId,
      character: { id: character.id, name: character.name },
      conversation,
      // 오퍼레이션은 내 프로필이 고정된 대화(첫 메시지를 보낸 대화)에서만 쓸 수 있다
      started: !!conversation?.persona,
      balance,
    };
  }

  // 코레딧을 먼저 빼고(모자라면 403), 만들기·저장이 실패하면 돌려준다
  async charged<T>(userId: string, op: OperationName, run: () => Promise<T>): Promise<{ result: T; balance: number }> {
    const cost = OPERATION_COSTS[op];
    await this.credits.spend(userId, cost, `op:${op}`, OPERATION_LABELS[op], CreditReason.OPERATION);
    try {
      const result = await run();
      return { result, balance: await this.credits.balance(userId) };
    } catch (error) {
      await this.credits.refund(userId, cost, `op:${op}`);
      throw error;
    }
  }

  // ── 심리 탐구: 상대의 머릿속 ──────────────────────────────
  async mindView(characterId: string, authorization?: string) {
    const v = await this.view(characterId, authorization);
    const readings = v.conversation
      ? await this.prisma.mindReading.findMany({
          where: { campaignId: v.conversation.campaignId },
          orderBy: { createdAt: 'desc' },
          take: LIST_TAKE,
          select: { id: true, innerVoice: true, feeling: true, aboutUser: true, createdAt: true },
        })
      : [];
    return { character: v.character, started: v.started, cost: OPERATION_COSTS.mind, balance: v.balance, readings };
  }

  async readMind(characterId: string, authorization?: string) {
    // 대화가 없으면 여기서 409 — 코레딧을 빼기 전에 막는다
    const ctx = await this.chat.operationContext(characterId, authorization);
    const { result, balance } = await this.charged(ctx.userId, 'mind', async () => {
      const raw = await postToAi<MindResult>('/mind', { context: ctx.context });
      return this.prisma.mindReading.create({
        data: {
          campaignId: ctx.conversation.campaignId,
          innerVoice: clip(raw.innerVoice, 800),
          feeling: clip(raw.feeling, 40),
          aboutUser: clip(raw.aboutUser, 300),
        },
        select: { id: true, innerVoice: true, feeling: true, aboutUser: true, createdAt: true },
      });
    });
    return { reading: result, balance };
  }
}
