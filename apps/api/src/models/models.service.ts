import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreditsService } from '../credits/credits.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  DEFAULT_MODEL_ID,
  LOCK_MESSAGE,
  MODELS,
  ENHANCED_OVERAGE_CREDITS,
  dailyLimitOf,
  findModel,
  kstDay,
  lockOf,
  type ChatModel,
  type ModelLock,
  type Wallet,
} from './models.js';

export type ModelOption = {
  id: string;
  label: string;
  group: ChatModel['group'];
  tier: ChatModel['tier'];
  note: string;
  // 답 1번에 드는 코레딧 (프리미엄만)
  credits: number | null;
  // 지금 못 쓰는 이유 (쓸 수 있으면 null)
  locked: ModelLock | null;
  // 하루 한도가 있을 때만 (강화 무료를 무료 등급이 쓸 때)
  limit: number | null;
  used: number | null;
  // 한도를 다 쓴 뒤 1번에 드는 코레딧 (하루 한도가 있을 때만)
  overage: number | null;
};

// 답을 만들기 전에 잡아 둔 것. 답을 못 만들면 그대로 돌려준다
export type Ticket = { model: ChatModel; kind: 'free' } | { model: ChatModel; kind: 'daily' } | { model: ChatModel; kind: 'credits'; amount: number };

// 답과 함께 화면에 돌려주는 사용량
export type UsageView = { usage: { used: number; limit: number } | null; credits: { spent: number; balance: number } | null };

@Injectable()
export class ModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
  ) {}

  private async usedToday(userId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.modelUsage.findMany({ where: { userId, day: kstDay() } });
    return new Map(rows.map((r) => [r.modelId, r.count]));
  }

  private async wallets(userId: string) {
    const [plan, used, balance] = await Promise.all([this.credits.planOf(userId), this.usedToday(userId), this.credits.balance(userId)]);
    return { plan, balance, of: (m: ChatModel): Wallet => ({ plan, balance, usedToday: used.get(m.id) ?? 0 }) };
  }

  // 화면에 보여 줄 목록: 모델마다 지금 쓸 수 있는지, 오늘 몇 번 썼는지, 코레딧이 얼마인지
  async list(userId: string) {
    const w = await this.wallets(userId);
    const models = MODELS.map((m): ModelOption => {
      const limit = dailyLimitOf(m, w.plan);
      return {
        id: m.id,
        label: m.label,
        group: m.group,
        tier: m.tier,
        note: m.note,
        credits: m.credits,
        locked: lockOf(m, w.of(m)),
        limit,
        used: limit === null ? null : w.of(m).usedToday,
        overage: limit === null ? null : ENHANCED_OVERAGE_CREDITS,
      };
    });
    return { default: DEFAULT_MODEL_ID, balance: w.balance, models };
  }

  // 이 모델로 답해도 되는지 확인한다. 안 되면 이유와 함께 거절한다
  async authorize(userId: string, id: string): Promise<ChatModel> {
    const model = findModel(id);
    if (!model) throw new BadRequestException('알 수 없는 모델입니다.');
    const lock = lockOf(model, (await this.wallets(userId)).of(model));
    if (lock) throw new ForbiddenException(`${model.label}: ${LOCK_MESSAGE[lock]}`);
    return model;
  }

  // 대화에 저장돼 있던 모델을 이어 쓸 수 있나 (한도 소진·코레딧 부족이면 기본 모델로 조용히 내려간다)
  async usableOrDefault(userId: string, id: string): Promise<ChatModel> {
    try {
      return await this.authorize(userId, id);
    } catch {
      return findModel(DEFAULT_MODEL_ID)!;
    }
  }

  // 답을 만들기 전에 1번을 잡는다: 하루 한도가 있으면 횟수를, 프리미엄이면 코레딧을.
  // 읽고 쓰는 사이에 동시 요청이 끼어도 한도·잔액을 넘지 않게 DB 한 문장으로 센다
  async reserve(userId: string, model: ChatModel): Promise<Ticket> {
    if (model.credits !== null) {
      await this.credits.spend(userId, model.credits, model.id, model.label);
      return { model, kind: 'credits', amount: model.credits };
    }
    const limit = dailyLimitOf(model, await this.credits.planOf(userId));
    if (limit === null) return { model, kind: 'free' };
    const rows = await this.prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "model_usage" ("userId", "modelId", "day", "count")
      VALUES (${userId}, ${model.id}, ${kstDay()}, 1)
      ON CONFLICT ("userId", "modelId", "day")
      DO UPDATE SET "count" = "model_usage"."count" + 1
      WHERE "model_usage"."count" < ${limit}
      RETURNING "count"`;
    if (rows.length > 0) return { model, kind: 'daily' };
    // 오늘 무료 횟수를 다 썼다: 자정까지는 1번에 코레딧으로 (모자라면 spend가 403)
    await this.credits.spend(userId, ENHANCED_OVERAGE_CREDITS, model.id, `${model.label} (오늘 무료 ${limit}번 이후)`);
    return { model, kind: 'credits', amount: ENHANCED_OVERAGE_CREDITS };
  }

  // 답을 못 만들었으면 잡아 둔 것을 돌려준다
  async release(userId: string, ticket: Ticket): Promise<void> {
    if (ticket.kind === 'credits') {
      await this.credits.refund(userId, ticket.amount, ticket.model.id);
    } else if (ticket.kind === 'daily') {
      await this.prisma.modelUsage.updateMany({
        where: { userId, modelId: ticket.model.id, day: kstDay(), count: { gt: 0 } },
        data: { count: { decrement: 1 } },
      });
    }
  }

  // 방금 쓴 뒤의 사용량
  async usage(userId: string, ticket: Ticket): Promise<UsageView> {
    if (ticket.kind === 'credits') {
      const credits = { spent: ticket.amount, balance: await this.credits.balance(userId) };
      // 강화 무료를 무료 횟수 뒤에 코레딧으로 쓴 경우: 횟수도 함께 (화면이 "오늘 30/30"을 계속 보이게)
      const limit = dailyLimitOf(ticket.model, await this.credits.planOf(userId));
      return { usage: limit === null ? null : { used: limit, limit }, credits };
    }
    if (ticket.kind === 'free') return { usage: null, credits: null };
    const limit = dailyLimitOf(ticket.model, await this.credits.planOf(userId)) ?? 0;
    const row = await this.prisma.modelUsage.findUnique({
      where: { userId_modelId_day: { userId, modelId: ticket.model.id, day: kstDay() } },
    });
    return { usage: { used: row?.count ?? 0, limit }, credits: null };
  }
}
