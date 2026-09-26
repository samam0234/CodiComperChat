import { Injectable } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import type { ChatTurn } from '../character-chat/character-chat.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

// 모델에 넘기는 최근 대화 턴 수. 오래된 것은 기억(메모리)으로 이어 간다
export const CONTEXT_TURNS = 30;
// 화면에 처음 보여 줄 메시지 수
export const DISPLAY_MESSAGES = 200;

export type StoredMessage = {
  id: string;
  role: 'user' | 'character';
  text: string;
  speaker: string | null;
  createdAt: Date;
};

export type Conversation = { campaignId: string; sessionId: string };

const toTurnRole = (role: MessageRole): 'user' | 'character' =>
  role === MessageRole.USER ? 'user' : 'character';

// 대화는 유저×캐릭터마다 하나다(Campaign). 회차(Session)는 아직 하나만 쓴다 —
// 세션을 닫고 요약하는 흐름(기획서 13.4)이 생기면 그때 회차를 나눈다
@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async find(userId: string, characterId: string): Promise<Conversation | null> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { userId, characterId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, sessions: { select: { id: true }, orderBy: { index: 'asc' }, take: 1 } },
    });
    if (!campaign || campaign.sessions.length === 0) return null;
    return { campaignId: campaign.id, sessionId: campaign.sessions[0].id };
  }

  // 첫 메시지를 보낼 때 대화를 만들고, 캐릭터의 시작 장면을 첫 메시지로 남긴다
  async findOrCreate(
    userId: string,
    character: { id: string; name: string; openingScene: string },
  ): Promise<Conversation> {
    const existing = await this.find(userId, character.id);
    if (existing) return existing;

    const campaign = await this.prisma.campaign.create({
      data: {
        userId,
        characterId: character.id,
        title: character.name,
        sessions: {
          create: {
            index: 1,
            messages: { create: { role: MessageRole.CHARACTER, content: character.openingScene } },
          },
        },
      },
      select: { id: true, sessions: { select: { id: true } } },
    });
    return { campaignId: campaign.id, sessionId: campaign.sessions[0].id };
  }

  async messages(sessionId: string, limit: number): Promise<StoredMessage[]> {
    const rows = await this.prisma.message.findMany({
      where: { sessionId, role: { in: [MessageRole.USER, MessageRole.CHARACTER] } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: { id: true, role: true, content: true, speaker: true, createdAt: true },
    });
    return rows.reverse().map((m) => ({
      id: m.id,
      role: toTurnRole(m.role),
      text: m.content,
      speaker: m.speaker,
      createdAt: m.createdAt,
    }));
  }

  // 기억 문장의 주어로 쓸, 가장 최근에 쓴 내 프로필 이름
  async lastSpeaker(sessionId: string): Promise<string | null> {
    const row = await this.prisma.message.findFirst({
      where: { sessionId, role: MessageRole.USER, speaker: { not: null } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { speaker: true },
    });
    return row?.speaker ?? null;
  }

  async recentTurns(sessionId: string): Promise<ChatTurn[]> {
    return (await this.messages(sessionId, CONTEXT_TURNS)).map(({ role, text }) => ({ role, text }));
  }

  // 유저 말과 캐릭터 답을 한 번에 남긴다 — 답을 못 받았을 때 유저 말만 덩그러니 남지 않게
  async appendExchange(
    conversation: Conversation,
    userText: string,
    speaker: string,
    reply: string,
  ): Promise<void> {
    const now = Date.now();
    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          sessionId: conversation.sessionId,
          role: MessageRole.USER,
          content: userText,
          speaker,
          createdAt: new Date(now),
        },
      }),
      // 같은 시각이면 정렬 순서가 흔들린다. 답은 1ms 뒤로 둔다
      this.prisma.message.create({
        data: {
          sessionId: conversation.sessionId,
          role: MessageRole.CHARACTER,
          content: reply,
          createdAt: new Date(now + 1),
        },
      }),
      this.prisma.campaign.update({
        where: { id: conversation.campaignId },
        data: { updatedAt: new Date(now + 1) },
      }),
    ]);
  }

  async listForUser(userId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        updatedAt: true,
        character: { select: { id: true, name: true, oneLiner: true } },
        sessions: { select: { id: true, _count: { select: { messages: true } } }, take: 1 },
      },
    });

    return Promise.all(
      campaigns.map(async (c) => {
        const session = c.sessions[0];
        const last = session
          ? await this.prisma.message.findFirst({
              where: { sessionId: session.id, role: { in: [MessageRole.USER, MessageRole.CHARACTER] } },
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
              select: { role: true, content: true, speaker: true, createdAt: true },
            })
          : null;
        return {
          id: c.id,
          character: c.character,
          messageCount: session?._count.messages ?? 0,
          updatedAt: c.updatedAt,
          lastMessage: last
            ? { role: toTurnRole(last.role), text: last.content.slice(0, 120), speaker: last.speaker, createdAt: last.createdAt }
            : null,
        };
      }),
    );
  }
}
