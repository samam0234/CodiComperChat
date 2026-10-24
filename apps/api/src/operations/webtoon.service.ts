import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ADULT_BLOCK_MESSAGE } from '../account/adult.js';
import { postToAi } from '../ai/ai-client.js';
import { readSession } from '../auth/session.js';
import { CharacterChatService } from '../character-chat/character-chat.service.js';
import { OPERATION_COSTS } from '../credits/credits.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OperationsService, PHOTONET_TIMEOUT_MS, type PhotonetRating } from './operations.service.js';

// 웹툰 (오퍼레이션, 2026-10-24 사용자 요청 "한 컷 마다 45 코레딧").
// 콘티(컷마다 장면 설계·해설·대사)를 먼저 무료로 쓰고, 컷은 하나씩 그린다 — 컷마다 코레딧을 빼고, 못 그리면 돌려준다.
// 한 번에 다 그리지 않는 이유: 한 컷이 40초~3분이라 여러 컷을 한 요청에 묶으면 시간 제한을 넘고, 중간에 실패해도 처음부터 다시 해야 한다
export const WEBTOON_MIN_PANELS = 2;
export const WEBTOON_MAX_PANELS = 6;
const WEBTOON_LIST = 8;
// 콘티는 컷 수만큼 길어진다 (로컬 LLM)
const PLAN_TIMEOUT_MS = 240_000;
const PANEL_RATIO = '가로';

type PlanResult = {
  title: string;
  panels: { plan: Prisma.InputJsonValue; caption: string; lines: { speaker: string; text: string }[] }[];
};
type PanelResult = { image: string; mime: string; width: number; height: number; promptUsed: string };

const PANEL_SELECT = { index: true, caption: true, lines: true, width: true, height: true, drawnAt: true } as const;
const WEBTOON_SELECT = {
  id: true,
  title: true,
  prompt: true,
  rating: true,
  createdAt: true,
  panels: { select: PANEL_SELECT, orderBy: { index: 'asc' as const } },
} as const;

type WebtoonRow = Prisma.WebtoonGetPayload<{ select: typeof WEBTOON_SELECT }>;

// 화면용: 그림이 있는지(drawn)만 알리고 본문은 따로 받는다
function present(w: WebtoonRow) {
  return {
    id: w.id,
    title: w.title,
    prompt: w.prompt,
    rating: w.rating,
    createdAt: w.createdAt,
    panels: w.panels.map((p) => ({
      index: p.index,
      caption: p.caption,
      lines: Array.isArray(p.lines) ? p.lines : [],
      drawn: p.drawnAt !== null,
      width: p.width,
      height: p.height,
    })),
  };
}

@Injectable()
export class WebtoonService {
  // 같은 컷을 두 번 눌러 코레딧이 두 번 빠지지 않게 (한 프로세스 안에서)
  private readonly drawing = new Set<string>();

  constructor(
    private readonly ops: OperationsService,
    private readonly chat: CharacterChatService,
    private readonly prisma: PrismaService,
  ) {}

  async view(characterId: string, authorization?: string) {
    const v = await this.ops.view(characterId, authorization);
    const block = await this.ops.adultBlockOf(v.userId);
    const [ready, webtoons] = await Promise.all([
      this.ops.engineReady(),
      v.conversation
        ? this.prisma.webtoon.findMany({
            // 성인 확인이 없으면 성인 웹툰은 목록에도 싣지 않는다
            where: { campaignId: v.conversation.campaignId, ...(block ? { rating: 'sfw' } : {}) },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: WEBTOON_LIST,
            select: WEBTOON_SELECT,
          })
        : Promise.resolve([]),
    ]);
    return {
      character: v.character,
      started: v.started,
      cost: OPERATION_COSTS.webtoon,
      balance: v.balance,
      ready,
      minPanels: WEBTOON_MIN_PANELS,
      maxPanels: WEBTOON_MAX_PANELS,
      nsfw: { allowed: block === null, reason: block, message: block ? ADULT_BLOCK_MESSAGE[block] : null },
      webtoons: webtoons.map(present),
    };
  }

  // 콘티 만들기 (무료). 엔진이 꺼져 있으면 그릴 수 없으니 콘티도 만들지 않는다(503)
  async create(
    characterId: string,
    input: { prompt: string; panels: number; rating: PhotonetRating; messageId?: string },
    authorization?: string,
  ) {
    const ctx = await this.chat.operationContext(characterId, authorization);
    if (input.rating === 'nsfw') {
      const block = await this.ops.adultBlockOf(ctx.userId);
      if (block) throw new ForbiddenException(ADULT_BLOCK_MESSAGE[block]);
    }
    const [cast, focus] = await Promise.all([
      this.ops.photonetCast(ctx.character, ctx.persona, ctx.conversation.campaignId),
      input.messageId
        ? this.ops.photonetFocus(ctx.conversation.sessionId, input.messageId, ctx.character.name)
        : Promise.resolve({ turns: [], picked: '' }),
    ]);
    if (!(await this.ops.engineReady())) {
      throw new ServiceUnavailableException('그림 엔진(Stable Diffusion)이 꺼져 있어 지금은 웹툰을 만들 수 없어요.');
    }
    const plan = await postToAi<PlanResult>(
      '/webtoon/plan',
      { context: ctx.context, prompt: input.prompt, rating: input.rating, panels: input.panels, cast, focus: focus.turns },
      { timeoutMs: PLAN_TIMEOUT_MS },
    );
    const webtoon = await this.prisma.webtoon.create({
      data: {
        campaignId: ctx.conversation.campaignId,
        title: plan.title.slice(0, 40),
        // 장면 설명 없이 대사만 골랐으면 그 대사를 남긴다
        prompt: (input.prompt || focus.picked || '최근 대화').slice(0, 300),
        rating: input.rating,
        panels: {
          create: plan.panels.slice(0, input.panels).map((p, index) => ({
            index,
            plan: p.plan,
            caption: p.caption.slice(0, 60),
            lines: p.lines.slice(0, 2).map((l) => ({ speaker: l.speaker.slice(0, 20), text: l.text.slice(0, 60) })),
          })),
        },
      },
      select: WEBTOON_SELECT,
    });
    return { webtoon: present(webtoon) };
  }

  // 내 대화의 웹툰 (남의 것은 없는 것과 같은 404). 성인 웹툰은 지금 성인 확인이 살아 있을 때만
  private async own(webtoonId: string, campaignId: string, userId: string) {
    const webtoon = await this.prisma.webtoon.findFirst({ where: { id: webtoonId, campaignId }, select: { id: true, rating: true } });
    if (!webtoon) throw new NotFoundException('웹툰이 없습니다.');
    if (webtoon.rating === 'nsfw') {
      const block = await this.ops.adultBlockOf(userId);
      if (block) throw new ForbiddenException(ADULT_BLOCK_MESSAGE[block]);
    }
    return webtoon;
  }

  // 컷 하나 그리기: 코레딧(45)을 먼저 빼고, 못 그리면(검수에 걸린 그림 포함) 돌려준다. 이미 그린 컷은 409
  async drawPanel(characterId: string, webtoonId: string, index: number, authorization?: string) {
    const ctx = await this.chat.operationContext(characterId, authorization);
    const webtoon = await this.own(webtoonId, ctx.conversation.campaignId, ctx.userId);
    const panel = await this.prisma.webtoonPanel.findUnique({
      where: { webtoonId_index: { webtoonId, index } },
      select: { id: true, plan: true, drawnAt: true },
    });
    if (!panel) throw new NotFoundException('그 컷이 없습니다.');
    if (panel.drawnAt) throw new ConflictException('이미 그린 컷이에요.');
    if (this.drawing.has(panel.id)) throw new ConflictException('그 컷을 그리는 중이에요.');
    if (!(await this.ops.engineReady())) {
      throw new ServiceUnavailableException('그림 엔진(Stable Diffusion)이 꺼져 있어 지금은 그릴 수 없어요. 코레딧은 빠지지 않았어요.');
    }
    this.drawing.add(panel.id);
    try {
      const { result, balance } = await this.ops.charged(ctx.userId, 'webtoon', async () => {
        const raw = await postToAi<PanelResult>(
          '/webtoon/panel',
          { plan: panel.plan, rating: webtoon.rating, ratio: PANEL_RATIO },
          { timeoutMs: PHOTONET_TIMEOUT_MS },
        );
        return this.prisma.webtoonPanel.update({
          where: { id: panel.id },
          data: {
            data: Buffer.from(raw.image, 'base64'),
            mime: raw.mime,
            width: raw.width,
            height: raw.height,
            promptUsed: raw.promptUsed.slice(0, 1500),
            drawnAt: new Date(),
          },
          select: PANEL_SELECT,
        });
      });
      return {
        panel: { index: result.index, caption: result.caption, lines: result.lines, drawn: true, width: result.width, height: result.height },
        balance,
      };
    } finally {
      this.drawing.delete(panel.id);
    }
  }

  // 컷 그림 본문: 그 대화를 하는 사람에게만 (성인 웹툰은 성인 확인이 살아 있을 때만, 아니면 404)
  async panelImage(characterId: string, webtoonId: string, index: number, authorization?: string) {
    const userId = await readSession(this.prisma, authorization);
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    const block = await this.ops.adultBlockOf(userId);
    const panel = await this.prisma.webtoonPanel.findFirst({
      where: {
        index,
        webtoon: { id: webtoonId, campaign: { userId, characterId }, ...(block ? { rating: 'sfw' } : {}) },
      },
      select: { data: true, mime: true },
    });
    if (!panel?.data || !panel.mime) throw new NotFoundException('그림이 없습니다.');
    return { data: Buffer.from(panel.data), mime: panel.mime };
  }
}

export function parsePanelCount(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < WEBTOON_MIN_PANELS || raw > WEBTOON_MAX_PANELS) {
    throw new BadRequestException(`컷 수는 ${WEBTOON_MIN_PANELS}~${WEBTOON_MAX_PANELS} 사이로 골라 주세요.`);
  }
  return raw;
}
