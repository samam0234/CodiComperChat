import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { BoardAuthor, CreditReason, MessageRole } from '@prisma/client';
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
type BoardCommentResult = { author: string; body: string };
type BoardPostsResult = { posts: { author: string; title: string; body: string; comments?: BoardCommentResult[] }[] };
type BoardCommentsResult = { comments: BoardCommentResult[] };

const POST_SELECT = {
  id: true,
  authorKind: true,
  authorName: true,
  title: true,
  body: true,
  createdAt: true,
  comments: {
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
    select: { id: true, authorKind: true, authorName: true, body: true, createdAt: true },
  },
};
// 코디포토넷: 그림 엔진이 붙었나 (지금은 없다), 고를 수 있는 화풍·비율, 장면 설명 길이
export const PHOTONET_READY = false;
export const PHOTONET_STYLES = ["애니메이션", "웹툰", "수채화", "실사풍"] as const;
export const PHOTONET_RATIOS = ["정사각", "세로", "가로"] as const;
export const PHOTONET_PROMPT_MAX = 300;
// 커뮤니티 글 길이 한도
export const POST_TITLE_MAX = 60;
export const POST_BODY_MAX = 1000;

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

  // ── 커뮤니티: 캐릭터 세계 속 가상 익명 게시판 (이 대화를 하는 나에게만 보인다) ──
  // 주인공·이 대화에 적용한 지인(엑스트라)은 실명으로 언급될 수 있다
  private async acquaintances(campaignId: string) {
    const rows = await this.prisma.campaignExtra.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'asc' },
      take: 6,
      select: { extra: { select: { name: true, summary: true, relation: true } } },
    });
    return rows.map(({ extra }) => ({
      name: extra.name.slice(0, 20),
      about: [extra.relation, extra.summary].filter(Boolean).join(' · ').slice(0, 300),
    }));
  }

  private posts(campaignId: string, take = LIST_TAKE) {
    return this.prisma.boardPost.findMany({
      where: { campaignId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      select: POST_SELECT,
    });
  }

  async boardView(characterId: string, authorization?: string) {
    const v = await this.view(characterId, authorization);
    const posts = v.conversation ? await this.posts(v.conversation.campaignId) : [];
    return {
      character: v.character,
      started: v.started,
      cost: OPERATION_COSTS.boardRefresh,
      postCost: OPERATION_COSTS.boardPost,
      balance: v.balance,
      // 실명으로 글을 쓸 때 쓰는 내 주인공 이름
      persona: v.conversation?.persona?.name ?? null,
      posts,
    };
  }

  // 새 글 불러오기: 주민들이 올린 글 3개 (댓글 포함)
  async refreshBoard(characterId: string, authorization?: string) {
    const ctx = await this.chat.operationContext(characterId, authorization);
    const campaignId = ctx.conversation.campaignId;
    const [acquaintances, recent] = await Promise.all([this.acquaintances(campaignId), this.posts(campaignId, 20)]);
    const { result, balance } = await this.charged(ctx.userId, 'boardRefresh', async () => {
      const raw = await postToAi<BoardPostsResult>('/board-posts', {
        context: ctx.context,
        acquaintances,
        recentTitles: recent.map((p) => p.title),
      });
      const now = Date.now();
      // 화면에서 위에서부터 첫 글이 보이게, 앞 글일수록 조금 늦은 시각으로
      return this.prisma.$transaction(
        raw.posts.slice(0, 3).map((p, i) =>
          this.prisma.boardPost.create({
            data: {
              campaignId,
              authorKind: BoardAuthor.RESIDENT,
              authorName: clip(p.author, 20) || '익명',
              title: clip(p.title, 60),
              body: clip(p.body, 1000),
              createdAt: new Date(now + (3 - i) * 10),
              comments: {
                create: (p.comments ?? []).slice(0, 2).map((c, j) => ({
                  authorKind: BoardAuthor.RESIDENT,
                  authorName: clip(c.author, 20) || '익명',
                  body: clip(c.body, 300),
                  createdAt: new Date(now + (3 - i) * 10 + j + 1),
                })),
              },
            },
            select: POST_SELECT,
          }),
        ),
      );
    });
    return { posts: result, balance };
  }

  // 내 글 쓰기: 익명 또는 내 주인공 실명으로. 주민 댓글이 함께 달린다
  async writePost(characterId: string, input: { title: string; body: string; anonymous: boolean }, authorization?: string) {
    const ctx = await this.chat.operationContext(characterId, authorization);
    const campaignId = ctx.conversation.campaignId;
    const authorName = input.anonymous ? '익명' : ctx.persona.name.slice(0, 20);
    const acquaintances = await this.acquaintances(campaignId);
    const { result, balance } = await this.charged(ctx.userId, 'boardPost', async () => {
      const raw = await postToAi<BoardCommentsResult>('/board-comments', {
        context: ctx.context,
        acquaintances,
        postAuthor: authorName,
        postTitle: input.title,
        postBody: input.body,
      });
      const now = Date.now();
      return this.prisma.boardPost.create({
        data: {
          campaignId,
          authorKind: BoardAuthor.USER,
          authorName,
          title: input.title,
          body: input.body,
          createdAt: new Date(now),
          comments: {
            create: raw.comments.slice(0, 3).map((c, j) => ({
              authorKind: BoardAuthor.RESIDENT,
              authorName: clip(c.author, 20) || '익명',
              body: clip(c.body, 300),
              createdAt: new Date(now + j + 1),
            })),
          },
        },
        select: POST_SELECT,
      });
    });
    return { post: result, balance };
  }

  // ── 코디포토넷: 대화 장면을 그림으로 (2026-10-23 사용자 결정: 화면·흐름만, 엔진은 준비 중) ──
  // 지금 로컬 모델(gemma4)은 그림을 읽기만 하고 만들지 못한다. 엔진을 붙일 때 PHOTONET_READY를 켜고
  // services/ai에 생성 경로를 더한 뒤 createPhotonet에서 charged('photonet', …)로 부른다
  async photonetView(characterId: string, authorization?: string) {
    const v = await this.view(characterId, authorization);
    return {
      character: v.character,
      started: v.started,
      cost: OPERATION_COSTS.photonet,
      balance: v.balance,
      ready: PHOTONET_READY,
      styles: PHOTONET_STYLES,
      ratios: PHOTONET_RATIOS,
      images: [] as { id: string; url: string; prompt: string; createdAt: Date }[],
    };
  }

  async createPhotonet(characterId: string, authorization?: string) {
    // 대화가 없으면 409, 엔진이 없으면 503 — 둘 다 코레딧을 빼기 전에 막는다
    await this.chat.operationContext(characterId, authorization);
    if (!PHOTONET_READY) {
      throw new ServiceUnavailableException('코디포토넷은 아직 준비 중이에요. 그림을 만드는 엔진이 연결되면 열려요.');
    }
    throw new ServiceUnavailableException('코디포토넷 엔진이 연결되지 않았습니다.');
  }
}
