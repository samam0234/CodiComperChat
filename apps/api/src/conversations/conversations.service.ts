import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { CampaignStatus, MessageRole } from '@prisma/client';
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

// 이 대화에 고정된 내 프로필 (첫 메시지 때 정해진다)
export type LockedPersona = { id: string; name: string; description: string };

export type Conversation = { campaignId: string; sessionId: string; persona: LockedPersona | null };

const CONVERSATION_SELECT = {
  id: true,
  personaId: true,
  personaName: true,
  personaDescription: true,
  sessions: { select: { id: true }, orderBy: { index: 'asc' as const }, take: 1 },
};

type ConversationRow = {
  id: string;
  personaId: string | null;
  personaName: string | null;
  personaDescription: string | null;
  sessions: { id: string }[];
};

function toConversation(row: ConversationRow | null): Conversation | null {
  if (!row || row.sessions.length === 0) return null;
  return {
    campaignId: row.id,
    sessionId: row.sessions[0].id,
    persona:
      row.personaId && row.personaName !== null
        ? { id: row.personaId, name: row.personaName, description: row.personaDescription ?? '' }
        : null,
  };
}

// 저장한 대화 목록에 붙일 이름: 첫 유저 말 앞부분
const SAVED_TITLE_CHARS = 30;

const toTurnRole = (role: MessageRole): 'user' | 'character' =>
  role === MessageRole.USER ? 'user' : 'character';

// 대화(Campaign)는 유저×캐릭터마다 "지금 대화"(ACTIVE) 하나와 "저장한 대화"(CLOSED) 여럿이다.
// 기억·상태설정은 대화에 붙어 있어 대화마다 따로다. 회차(Session)는 아직 하나만 쓴다 —
// 세션을 닫고 요약하는 흐름(기획서 13.4)이 생기면 그때 회차를 나눈다
@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 지금 대화
  async find(userId: string, characterId: string): Promise<Conversation | null> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { userId, characterId, status: CampaignStatus.ACTIVE },
      orderBy: { updatedAt: 'desc' },
      select: CONVERSATION_SELECT,
    });
    return toConversation(campaign);
  }

  // 첫 메시지를 보낼 때 대화를 만들고, 캐릭터의 시작 장면을 첫 메시지로 남긴다.
  // 프로필을 넘기면 이 대화의 프로필로 고정한다 (이미 고정돼 있으면 그대로 둔다)
  async findOrCreate(
    userId: string,
    character: { id: string; name: string; openingScene: string },
    persona?: LockedPersona,
  ): Promise<Conversation> {
    const existing = await this.find(userId, character.id);
    if (existing) {
      if (persona && !existing.persona) {
        await this.prisma.campaign.update({
          where: { id: existing.campaignId },
          data: { personaId: persona.id, personaName: persona.name, personaDescription: persona.description },
        });
        return { ...existing, persona };
      }
      return existing;
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        userId,
        characterId: character.id,
        title: character.name,
        ...(persona
          ? { personaId: persona.id, personaName: persona.name, personaDescription: persona.description }
          : {}),
        sessions: {
          create: {
            index: 1,
            messages: { create: { role: MessageRole.CHARACTER, content: character.openingScene } },
          },
        },
      },
      select: CONVERSATION_SELECT,
    });
    return toConversation(campaign)!;
  }

  private async userMessageCount(campaignId: string): Promise<number> {
    return this.prisma.message.count({ where: { session: { campaignId }, role: MessageRole.USER } });
  }

  private async savedTitle(campaignId: string, fallback: string): Promise<string> {
    const first = await this.prisma.message.findFirst({
      where: { session: { campaignId }, role: MessageRole.USER },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { content: true },
    });
    const text = first?.content.replace(/\s+/g, ' ').trim() ?? '';
    if (text === '') return fallback;
    return text.length > SAVED_TITLE_CHARS ? `${text.slice(0, SAVED_TITLE_CHARS)}…` : text;
  }

  // 지금 대화를 내려놓는다. save면 저장한 대화로 남기고, 아니면 지운다(기억·상태설정도 함께).
  // 아직 한 마디도 안 한 대화는 저장할 것이 없어 지운다
  async closeActive(userId: string, characterId: string, save: boolean): Promise<{ saved: boolean }> {
    const active = await this.find(userId, characterId);
    if (!active) return { saved: false };
    if (save && (await this.userMessageCount(active.campaignId)) > 0) {
      const character = await this.prisma.character.findUnique({ where: { id: characterId }, select: { name: true } });
      await this.prisma.campaign.update({
        where: { id: active.campaignId },
        data: {
          status: CampaignStatus.CLOSED,
          savedAt: new Date(),
          title: await this.savedTitle(active.campaignId, character?.name ?? '저장한 대화'),
        },
      });
      return { saved: true };
    }
    await this.prisma.campaign.delete({ where: { id: active.campaignId } });
    return { saved: false };
  }

  async listSaved(userId: string, characterId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { userId, characterId, status: CampaignStatus.CLOSED },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        personaName: true,
        savedAt: true,
        updatedAt: true,
        sessions: { select: { id: true }, take: 1 },
        _count: { select: { memories: true } },
      },
    });
    const sessionIds = campaigns.flatMap((c) => (c.sessions[0] ? [c.sessions[0].id] : []));
    const [counts, lasts] = await Promise.all([
      this.prisma.message.groupBy({
        by: ['sessionId'],
        where: { sessionId: { in: sessionIds }, role: { in: [MessageRole.USER, MessageRole.CHARACTER] } },
        _count: { _all: true },
      }),
      this.lastMessages(sessionIds),
    ]);
    const countOf = new Map(counts.map((r) => [r.sessionId, r._count._all]));
    return campaigns.map((c) => {
      const sessionId = c.sessions[0]?.id;
      const last = sessionId ? lasts.get(sessionId) : undefined;
      return {
        id: c.id,
        title: c.title,
        personaName: c.personaName,
        savedAt: c.savedAt,
        updatedAt: c.updatedAt,
        messageCount: sessionId ? (countOf.get(sessionId) ?? 0) : 0,
        memoryCount: c._count.memories,
        lastMessage: last ? { role: toTurnRole(last.role), text: last.content, speaker: last.speaker } : null,
      };
    });
  }

  // 세션마다 마지막 대화 한 줄을 쿼리 한 번으로 가져온다 (목록 한 건마다 쿼리하던 것을 없앤다)
  private async lastMessages(sessionIds: string[]) {
    const map = new Map<string, { role: MessageRole; content: string; speaker: string | null; createdAt: Date }>();
    if (sessionIds.length === 0) return map;
    const rows = await this.prisma.$queryRaw<
      { sessionId: string; role: MessageRole; content: string; speaker: string | null; createdAt: Date }[]
    >`SELECT DISTINCT ON ("sessionId") "sessionId", role::text AS role, LEFT(content, 120) AS content, speaker, "createdAt"
      FROM messages
      WHERE "sessionId" = ANY(${sessionIds}) AND role::text IN ('USER', 'CHARACTER')
      ORDER BY "sessionId", "createdAt" DESC, id DESC`;
    for (const r of rows) map.set(r.sessionId, r);
    return map;
  }

  private async findSaved(userId: string, characterId: string, campaignId: string) {
    const saved = await this.prisma.campaign.findFirst({
      where: { id: campaignId, userId, characterId, status: CampaignStatus.CLOSED },
      select: { id: true },
    });
    if (!saved) throw new NotFoundException('저장한 대화를 찾을 수 없습니다.');
    return saved;
  }

  // 저장한 대화를 지금 대화로 되살린다. 지금 대화는 saveCurrent에 따라 저장하거나 지운다
  async resume(userId: string, characterId: string, campaignId: string, saveCurrent: boolean) {
    await this.findSaved(userId, characterId, campaignId);
    await this.closeActive(userId, characterId, saveCurrent);
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.ACTIVE, updatedAt: new Date() },
    });
  }

  async removeSaved(userId: string, characterId: string, campaignId: string): Promise<void> {
    await this.findSaved(userId, characterId, campaignId);
    await this.prisma.campaign.delete({ where: { id: campaignId } });
  }

  async savedCount(userId: string, characterId: string): Promise<number> {
    return this.prisma.campaign.count({ where: { userId, characterId, status: CampaignStatus.CLOSED } });
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

  // 대화 목록: 캐릭터마다 한 줄. 지금 대화가 있으면 그것을, 없으면 가장 최근에 저장한 대화를 보여 준다
  async listForUser(userId: string) {
    const all = await this.prisma.campaign.findMany({
      // 운영자가 내린 캐릭터와의 대화는 목록에서 뺀다(열어도 404라서)
      where: { userId, character: { takenDownAt: null } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        characterId: true,
        updatedAt: true,
        // 목록에 초상을 붙이려고 초상 형식과 바뀐 시각(캐시 무효화)도 싣는다
        character: { select: { id: true, name: true, oneLiner: true, portraitMime: true, updatedAt: true } },
        sessions: { select: { id: true, _count: { select: { messages: true } } }, take: 1 },
      },
    });

    const byCharacter = new Map<string, typeof all>();
    for (const c of all) byCharacter.set(c.characterId, [...(byCharacter.get(c.characterId) ?? []), c]);
    const campaigns = [...byCharacter.values()].map((group) => ({
      ...(group.find((c) => c.status === CampaignStatus.ACTIVE) ?? group[0]),
      savedCount: group.filter((c) => c.status === CampaignStatus.CLOSED).length,
    }));

    const lasts = await this.lastMessages(campaigns.flatMap((c) => (c.sessions[0] ? [c.sessions[0].id] : [])));
    return campaigns.map((c) => {
      const session = c.sessions[0];
      const last = session ? lasts.get(session.id) : undefined;
      return {
        id: c.id,
        character: c.character,
        messageCount: session?._count.messages ?? 0,
        updatedAt: c.updatedAt,
        active: c.status === CampaignStatus.ACTIVE,
        savedCount: c.savedCount,
        lastMessage: last
          ? { role: toTurnRole(last.role), text: last.content, speaker: last.speaker, createdAt: last.createdAt }
          : null,
      };
    });
  }
}
