import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreditReason, MessageRole } from '@prisma/client';
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
// 메시지: 맥락에 넣는 최근 문자 수, 화면에 처음 보여 줄 문자 수, 한 번에 보낼 수 있는 글자 수
const DM_CONTEXT_TURNS = 30;
const DM_DISPLAY = 100;
export const DM_MAX_LENGTH = 500;

type MindResult = { innerVoice: string; feeling: string; aboutUser: string };
type DiaryResult = { title: string; mood: string; body: string };

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

  // ── 일기: 캐릭터가 자기 입장에서 쓰는 하루 ──────────────────
  async diaryView(characterId: string, authorization?: string) {
    const v = await this.view(characterId, authorization);
    const entries = v.conversation
      ? await this.prisma.diaryEntry.findMany({
          where: { campaignId: v.conversation.campaignId },
          orderBy: { createdAt: 'desc' },
          take: LIST_TAKE,
          select: { id: true, title: true, mood: true, body: true, createdAt: true },
        })
      : [];
    return { character: v.character, started: v.started, cost: OPERATION_COSTS.diary, balance: v.balance, entries };
  }

  async writeDiary(characterId: string, authorization?: string) {
    const ctx = await this.chat.operationContext(characterId, authorization);
    const { result, balance } = await this.charged(ctx.userId, 'diary', async () => {
      const raw = await postToAi<DiaryResult>('/diary', { context: ctx.context });
      return this.prisma.diaryEntry.create({
        data: {
          campaignId: ctx.conversation.campaignId,
          title: clip(raw.title, 60),
          mood: clip(raw.mood, 30),
          body: clip(raw.body, 2000),
        },
        select: { id: true, title: true, mood: true, body: true, createdAt: true },
      });
    });
    return { entry: result, balance };
  }

  // ── 메시지: 대화(롤플레이)와 따로 주고받는 짧은 문자 ─────────
  // 기억·관계·이야기 상태는 대화와 함께 쓰고, 최근 기록만 문자 창의 것을 쓴다. 코레딧은 받지 않는다(대화와 같다)
  private async directTurns(campaignId: string, take = DM_CONTEXT_TURNS) {
    const rows = await this.prisma.directMessage.findMany({
      where: { campaignId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      select: { id: true, role: true, content: true, createdAt: true },
    });
    return rows.reverse().map((m) => ({
      id: m.id,
      role: m.role === MessageRole.USER ? ('user' as const) : ('character' as const),
      text: m.content,
      createdAt: m.createdAt,
    }));
  }

  async messagesView(characterId: string, authorization?: string) {
    const v = await this.view(characterId, authorization);
    const messages = v.conversation ? await this.directTurns(v.conversation.campaignId, DM_DISPLAY) : [];
    return { character: v.character, started: v.started, cost: 0, balance: v.balance, messages };
  }

  async sendMessage(characterId: string, text: string, authorization?: string) {
    const v = await this.view(characterId, authorization);
    const history = v.conversation ? (await this.directTurns(v.conversation.campaignId)).map(({ role, text: t }) => ({ role, text: t })) : [];
    // 대화가 없으면 여기서 409
    const ctx = await this.chat.operationContext(characterId, authorization, history);
    const { reply } = await postToAi<{ reply: string }>('/infer', { context: ctx.context, userTurn: text, channel: 'message' });
    const now = Date.now();
    const campaignId = ctx.conversation.campaignId;
    const select = { id: true, role: true, content: true, createdAt: true } as const;
    // 답을 받은 뒤에 둘을 함께 남긴다 — 실패하면 내 문자도 남지 않아 다시 보낼 수 있다
    const [sent, received] = await this.prisma.$transaction([
      this.prisma.directMessage.create({ data: { campaignId, role: MessageRole.USER, content: text, createdAt: new Date(now) }, select }),
      this.prisma.directMessage.create({
        data: { campaignId, role: MessageRole.CHARACTER, content: clip(reply, 1000), createdAt: new Date(now + 1) },
        select,
      }),
    ]);
    const view = (m: typeof sent) => ({ id: m.id, role: m.role === MessageRole.USER ? 'user' : 'character', text: m.content, createdAt: m.createdAt });
    return { sent: view(sent), reply: view(received) };
  }
}
