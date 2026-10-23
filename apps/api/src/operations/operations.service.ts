import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { BoardAuthor, CreditReason, MessageRole } from '@prisma/client';
import { getFromAi, postToAi } from '../ai/ai-client.js';
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
// 코디포토넷: 고를 수 있는 화풍·비율(services/ai image_engine.STYLES와 같게), 장면 설명 길이, 창에 보여 줄 최근 그림 수
export const PHOTONET_STYLES = ["애니메이션", "웹툰", "수채화", "실사풍"] as const;
export const PHOTONET_RATIOS = ["정사각", "세로", "가로"] as const;
export const PHOTONET_PROMPT_MAX = 300;
const PHOTONET_GALLERY = 12;
// 엔진 상태는 짧게 묻는다 (꺼져 있으면 창이 늦게 뜨지 않게)
const ENGINE_STATUS_TIMEOUT_MS = 3000;
// 그림 한 장: 화풍 계열(SDXL ↔ SD1.5)을 바꾸면 모델을 다시 읽느라 2~3분 걸릴 수 있다 (RAM 16GB에서 측정)
const PHOTONET_TIMEOUT_MS = 300_000;
const PHOTONET_SELECT = { id: true, prompt: true, style: true, ratio: true, width: true, height: true, createdAt: true } as const;
type PhotonetResult = { image: string; mime: string; width: number; height: number; promptUsed: string; cast?: string[] };
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
      // 화면에서 위에서부터 첫 글이 보이게, 앞 글일수록 조금 늦은 시각으로.
      // 지금보다 미래로 찍으면 바로 뒤에 쓴 내 글보다 위에 와 버리므로 지금부터 과거 쪽으로 찍는다
      return this.prisma.$transaction(
        raw.posts.slice(0, 3).map((p, i) =>
          this.prisma.boardPost.create({
            data: {
              campaignId,
              authorKind: BoardAuthor.RESIDENT,
              authorName: clip(p.author, 20) || '익명',
              title: clip(p.title, 60),
              body: clip(p.body, 1000),
              createdAt: new Date(now - i * 10),
              comments: {
                create: (p.comments ?? []).slice(0, 2).map((c, j) => ({
                  authorKind: BoardAuthor.RESIDENT,
                  authorName: clip(c.author, 20) || '익명',
                  body: clip(c.body, 300),
                  createdAt: new Date(now - i * 10 + j + 1),
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

  // ── 코디포토넷: 대화 장면을 그림으로 (2026-10-24: 로컬 Stable Diffusion WebUI 연결) ──
  // 엔진(WebUI)은 따로 켜고 끈다. 꺼져 있으면 "준비 중"으로 보이고, 만들기는 코레딧을 빼기 전에 503
  private async engineReady(): Promise<boolean> {
    try {
      return (await getFromAi<{ ready: boolean }>('/photonet/status', ENGINE_STATUS_TIMEOUT_MS)).ready === true;
    } catch {
      return false;
    }
  }

  async photonetView(characterId: string, authorization?: string) {
    const v = await this.view(characterId, authorization);
    const [ready, images] = await Promise.all([
      this.engineReady(),
      v.conversation
        ? this.prisma.photonetImage.findMany({
            where: { campaignId: v.conversation.campaignId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: PHOTONET_GALLERY,
            select: PHOTONET_SELECT,
          })
        : Promise.resolve([]),
    ]);
    return {
      character: v.character,
      started: v.started,
      cost: OPERATION_COSTS.photonet,
      balance: v.balance,
      ready,
      styles: PHOTONET_STYLES,
      ratios: PHOTONET_RATIOS,
      images,
    };
  }

  // 그림에 나올 수 있는 사람: 대화 상대 캐릭터(프로필의 성별·나이·직업 + 공방 카드의 외형·겉보기 나이),
  // 내 주인공(이 대화에 고정된 프로필), 이 대화에 적용한 지인(엑스트라). 성별이 없으면 AI가 소개·외형·대화에서 추론한다
  private async photonetCast(
    character: { id: string; name: string; oneLiner: string; profile: unknown },
    persona: { name: string; description: string },
    campaignId: string,
  ) {
    const [draft, extras] = await Promise.all([
      this.prisma.characterDraft.findUnique({ where: { characterId: character.id }, select: { card: true } }),
      this.prisma.campaignExtra.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'asc' },
        take: 6,
        select: { extra: { select: { name: true, summary: true, relation: true, personality: true } } },
      }),
    ]);
    const profile = (character.profile ?? {}) as Record<string, unknown>;
    const card = (draft?.card ?? {}) as {
      identity?: { occupation?: unknown; apparentAge?: unknown };
      appearance?: { description?: unknown; keywords?: unknown };
    };
    const text = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
    const keywords = Array.isArray(card.appearance?.keywords) ? card.appearance.keywords.map(text).filter(Boolean).join(', ') : '';
    return [
      {
        name: character.name.slice(0, 20),
        role: 'character' as const,
        gender: clip(text(profile.gender), 20),
        age: clip(text(profile.age) || text(card.identity?.apparentAge), 20),
        occupation: clip(text(profile.occupation) || text(card.identity?.occupation), 60),
        appearance: clip([text(card.appearance?.description), keywords].filter(Boolean).join(' / '), 600),
        about: clip(character.oneLiner, 400),
      },
      { name: persona.name.slice(0, 20), role: 'protagonist' as const, about: clip(persona.description, 400) },
      ...extras.map(({ extra }) => ({
        name: extra.name.slice(0, 20),
        role: 'acquaintance' as const,
        about: clip([extra.relation, extra.summary, extra.personality].filter(Boolean).join(' · '), 400),
      })),
    ];
  }

  // 유저가 고른 대사와 그 앞 3개·뒤 2개 (이 순간을 그린다). 이 대화의 대사가 아니면 400
  private async photonetFocus(sessionId: string, messageId: string, characterName: string) {
    const roles = { in: [MessageRole.USER, MessageRole.CHARACTER] };
    const target = await this.prisma.message.findFirst({
      where: { id: messageId, sessionId, role: roles },
      select: { createdAt: true },
    });
    if (!target) throw new BadRequestException('고른 대사를 이 대화에서 찾을 수 없어요.');
    const select = { role: true, content: true, speaker: true } as const;
    const [before, at, after] = await Promise.all([
      this.prisma.message.findMany({ where: { sessionId, role: roles, createdAt: { lt: target.createdAt } }, orderBy: { createdAt: 'desc' }, take: 3, select }),
      this.prisma.message.findMany({ where: { id: messageId }, select }),
      this.prisma.message.findMany({ where: { sessionId, role: roles, createdAt: { gt: target.createdAt } }, orderBy: { createdAt: 'asc' }, take: 2, select }),
    ]);
    const turn = (m: (typeof at)[number]) => ({
      speaker: (m.role === MessageRole.USER ? (m.speaker ?? '나') : characterName).slice(0, 20),
      text: clip(m.content, 2000),
    });
    return { turns: [...before.reverse(), ...at, ...after].map(turn), picked: at[0] ? turn(at[0]).text : '' };
  }

  async createPhotonet(
    characterId: string,
    input: { prompt: string; style: string; ratio: string; messageId?: string },
    authorization?: string,
  ) {
    // 대화가 없으면 409, 엔진이 꺼져 있으면 503 — 둘 다 코레딧을 빼기 전에 막는다
    const ctx = await this.chat.operationContext(characterId, authorization);
    const [cast, focus] = await Promise.all([
      this.photonetCast(ctx.character, ctx.persona, ctx.conversation.campaignId),
      input.messageId
        ? this.photonetFocus(ctx.conversation.sessionId, input.messageId, ctx.character.name)
        : Promise.resolve({ turns: [], picked: '' }),
    ]);
    if (!(await this.engineReady())) {
      throw new ServiceUnavailableException('그림 엔진(Stable Diffusion)이 꺼져 있어 지금은 만들 수 없어요. 코레딧은 빠지지 않았어요.');
    }
    // 만들기·검수에 실패하면(검수에 걸린 그림 포함) 코레딧을 돌려준다
    let castShown: string[] = [];
    const { result, balance } = await this.charged(ctx.userId, 'photonet', async () => {
      const raw = await postToAi<PhotonetResult>(
        '/photonet',
        { context: ctx.context, prompt: input.prompt, style: input.style, ratio: input.ratio, cast, focus: focus.turns },
        { timeoutMs: PHOTONET_TIMEOUT_MS },
      );
      castShown = (raw.cast ?? []).slice(0, 4).map((c) => clip(c, 30));
      return this.prisma.photonetImage.create({
        data: {
          campaignId: ctx.conversation.campaignId,
          // 장면 설명 없이 대사만 골랐으면 그 대사를 남긴다 (갤러리에서 무엇을 그렸는지 알 수 있게)
          prompt: input.prompt || clip(focus.picked, 300),
          promptUsed: clip(raw.promptUsed, 1500),
          style: input.style,
          ratio: input.ratio,
          mime: raw.mime,
          data: Buffer.from(raw.image, 'base64'),
          width: raw.width,
          height: raw.height,
        },
        select: PHOTONET_SELECT,
      });
    });
    return { image: result, balance, cast: castShown };
  }

  // 그림 본문: 그 대화를 하는 사람(내 대화)에게만. 남의 그림은 없는 것과 같은 404
  async photonetImage(characterId: string, imageId: string, authorization?: string) {
    const userId = await readSession(this.prisma, authorization);
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    const image = await this.prisma.photonetImage.findFirst({
      where: { id: imageId, campaign: { userId, characterId } },
      select: { data: true, mime: true },
    });
    if (!image) throw new NotFoundException('그림이 없습니다.');
    return { data: Buffer.from(image.data), mime: image.mime };
  }
}
