import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Conversation } from '../conversations/conversations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  TRIGGERS,
  TRIGGER_LABELS,
  selectActive,
  triggerKeywords,
  type ActiveExtra,
  type ExtraFields,
  type Trigger,
} from './extra-trigger.js';

// 글자 수 상한. 엑스트라는 조연이라 공방 카드보다 짧게 둔다
export const EXTRA_LIMITS = {
  name: 20,
  summary: 60,
  personality: 200,
  relation: 120,
  situation: 200,
  place: 120,
} as const;
export const EXTRAS_PER_USER = 20;
export const EXTRAS_PER_CONVERSATION = 3;

const FIELD_LABELS: Record<keyof ExtraFields, string> = {
  name: '이름',
  summary: '한 줄 소개',
  personality: '성격·말투',
  relation: '인물 관계',
  situation: '등장 상황',
  place: '등장 장소',
};

const TRIGGER_FIELD: Record<Trigger, keyof ExtraFields> = {
  relation: 'relation',
  situation: 'situation',
  place: 'place',
};

const EXTRA_SELECT = {
  id: true,
  name: true,
  summary: true,
  personality: true,
  relation: true,
  situation: true,
  place: true,
  updatedAt: true,
} as const;

export function parseExtra(body: unknown): ExtraFields {
  const data = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const out = {} as ExtraFields;
  for (const key of Object.keys(EXTRA_LIMITS) as (keyof ExtraFields)[]) {
    const raw = data[key] ?? '';
    if (typeof raw !== 'string') throw new BadRequestException(`${FIELD_LABELS[key]}은(는) 글이어야 합니다.`);
    const text = raw.trim();
    if (text.length > EXTRA_LIMITS[key]) {
      throw new BadRequestException(`${FIELD_LABELS[key]}은(는) ${EXTRA_LIMITS[key]}자 이하로 써 주세요.`);
    }
    out[key] = text;
  }
  if (out.name === '') throw new BadRequestException('이름을 써 주세요.');
  if (out.summary === '') throw new BadRequestException('한 줄 소개를 써 주세요.');
  return out;
}

// 등장 조건: 하나 이상. 고른 조건의 칸이 비어 있으면 그 조건으로는 등장할 수 없으니 거절한다
export function parseTriggers(raw: unknown, extra: ExtraFields): Trigger[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new BadRequestException('등장 조건을 하나 이상 고르세요.');
  const triggers = [...new Set(raw)];
  for (const t of triggers) {
    if (!TRIGGERS.includes(t as Trigger)) throw new BadRequestException('등장 조건 값이 올바르지 않습니다.');
    if (extra[TRIGGER_FIELD[t as Trigger]] === '') {
      throw new BadRequestException(`${TRIGGER_LABELS[t as Trigger]} 칸이 비어 있어 그 조건으로는 등장할 수 없습니다.`);
    }
  }
  return TRIGGERS.filter((t) => triggers.includes(t));
}

@Injectable()
export class ExtrasService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.userExtra.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: EXTRA_SELECT,
    });
  }

  private async findOwned(userId: string, id: string) {
    const extra = await this.prisma.userExtra.findFirst({ where: { id, userId }, select: EXTRA_SELECT });
    if (!extra) throw new NotFoundException('엑스트라를 찾을 수 없습니다.');
    return extra;
  }

  async create(userId: string, body: unknown) {
    const fields = parseExtra(body);
    const count = await this.prisma.userExtra.count({ where: { userId } });
    if (count >= EXTRAS_PER_USER) throw new ConflictException(`엑스트라는 ${EXTRAS_PER_USER}개까지 만들 수 있습니다.`);
    return this.prisma.userExtra.create({ data: { userId, ...fields }, select: EXTRA_SELECT });
  }

  async update(userId: string, id: string, body: unknown) {
    await this.findOwned(userId, id);
    const fields = parseExtra(body);
    // 칸을 비워 이미 적용한 조건이 성립하지 않게 되면, 그 조건만 대화들에서 뺀다
    const applied = await this.prisma.campaignExtra.findMany({ where: { extraId: id }, select: { campaignId: true, triggers: true } });
    const emptied = TRIGGERS.filter((t) => fields[TRIGGER_FIELD[t]] === '');
    await this.prisma.$transaction([
      this.prisma.userExtra.update({ where: { id }, data: fields }),
      ...applied.map((a) => {
        const left = a.triggers.filter((t) => !emptied.includes(t as Trigger));
        return left.length > 0
          ? this.prisma.campaignExtra.update({
              where: { campaignId_extraId: { campaignId: a.campaignId, extraId: id } },
              data: { triggers: left },
            })
          : this.prisma.campaignExtra.delete({ where: { campaignId_extraId: { campaignId: a.campaignId, extraId: id } } });
      }),
    ]);
    return this.findOwned(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.userExtra.delete({ where: { id } });
  }

  // 대화 화면의 엑스트라 설정: 내 엑스트라(조건별 등장 단어 미리보기 포함)와 이 대화에 적용한 것
  async view(userId: string, conversation: Conversation | null, characterName: string) {
    const [mine, applied] = await Promise.all([
      this.list(userId),
      conversation
        ? this.prisma.campaignExtra.findMany({
            where: { campaignId: conversation.campaignId },
            orderBy: { createdAt: 'asc' },
            select: { extraId: true, triggers: true },
          })
        : Promise.resolve([]),
    ]);
    return {
      limits: { ...EXTRA_LIMITS, perUser: EXTRAS_PER_USER, perConversation: EXTRAS_PER_CONVERSATION },
      mine: mine.map((e) => ({ ...e, keywords: triggerKeywords(e, characterName) })),
      applied: applied.map((a) => ({ extraId: a.extraId, triggers: a.triggers })),
    };
  }

  async apply(userId: string, conversation: Conversation, extraId: string, rawTriggers: unknown) {
    const extra = await this.findOwned(userId, extraId);
    const triggers = parseTriggers(rawTriggers, extra);
    const key = { campaignId_extraId: { campaignId: conversation.campaignId, extraId } };
    const existing = await this.prisma.campaignExtra.findUnique({ where: key, select: { extraId: true } });
    if (!existing) {
      const count = await this.prisma.campaignExtra.count({ where: { campaignId: conversation.campaignId } });
      if (count >= EXTRAS_PER_CONVERSATION) {
        throw new ConflictException(`한 대화에는 엑스트라를 ${EXTRAS_PER_CONVERSATION}명까지 적용할 수 있습니다.`);
      }
    }
    await this.prisma.campaignExtra.upsert({
      where: key,
      create: { campaignId: conversation.campaignId, extraId, triggers },
      update: { triggers },
    });
  }

  async unapply(conversation: Conversation, extraId: string) {
    await this.prisma.campaignExtra.deleteMany({ where: { campaignId: conversation.campaignId, extraId } });
  }

  // 이번 턴에 모델에 넘길 엑스트라 (조건에 맞는 것만)
  async activeFor(
    conversation: Conversation | null,
    history: { role: 'user' | 'character'; text: string }[],
    userTurn: string,
    characterName: string,
  ): Promise<ActiveExtra[]> {
    if (!conversation) return [];
    const rows = await this.prisma.campaignExtra.findMany({
      where: { campaignId: conversation.campaignId },
      orderBy: { createdAt: 'asc' },
      select: { triggers: true, extra: { select: EXTRA_SELECT } },
    });
    if (rows.length === 0) return [];
    return selectActive(
      rows.map((r) => ({ id: r.extra.id, triggers: r.triggers as Trigger[], fields: r.extra })),
      history,
      userTurn,
      characterName,
    );
  }
}
