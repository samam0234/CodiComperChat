import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { effectivePlan } from '../plan/plan.js';
import {
  DEFAULT_MODEL_ID,
  LOCK_MESSAGE,
  MODELS,
  dailyLimitOf,
  findModel,
  kstDay,
  lockOf,
  type ChatModel,
  type ModelLock,
} from './models.js';

export type ModelOption = {
  id: string;
  label: string;
  group: ChatModel['group'];
  tier: ChatModel['tier'];
  note: string;
  // 지금 못 쓰는 이유 (쓸 수 있으면 null)
  locked: ModelLock | null;
  // 하루 한도가 있는 모델만
  limit: number | null;
  used: number | null;
};

@Injectable()
export class ModelsService {
  constructor(private readonly prisma: PrismaService) {}

  private async planOf(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planUntil: true } });
    return effectivePlan(user ?? { plan: 'FREE', planUntil: null });
  }

  private async usedToday(userId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.modelUsage.findMany({ where: { userId, day: kstDay() } });
    return new Map(rows.map((r) => [r.modelId, r.count]));
  }

  // 화면에 보여 줄 목록: 모델마다 지금 쓸 수 있는지, 오늘 몇 번 썼는지
  async list(userId: string): Promise<{ default: string; models: ModelOption[] }> {
    const [plan, used] = await Promise.all([this.planOf(userId), this.usedToday(userId)]);
    const models = MODELS.map((m): ModelOption => {
      const limit = dailyLimitOf(m);
      const count = limit === null ? null : (used.get(m.id) ?? 0);
      return {
        id: m.id,
        label: m.label,
        group: m.group,
        tier: m.tier,
        note: m.note,
        locked: lockOf(m, plan, count ?? 0),
        limit,
        used: count,
      };
    });
    return { default: DEFAULT_MODEL_ID, models };
  }

  // 이 모델로 답해도 되는지 확인한다. 안 되면 이유와 함께 거절한다
  async authorize(userId: string, id: string): Promise<ChatModel> {
    const model = findModel(id);
    if (!model) throw new BadRequestException('알 수 없는 모델입니다.');
    const [plan, used] = await Promise.all([this.planOf(userId), this.usedToday(userId)]);
    const lock = lockOf(model, plan, used.get(model.id) ?? 0);
    if (lock) throw new ForbiddenException(`${model.label}: ${LOCK_MESSAGE[lock]}`);
    return model;
  }

  // 대화에 저장돼 있던 모델을 이어 쓸 수 있나 (프로 기간이 끝났으면 기본 모델로 조용히 내려간다)
  async usableOrDefault(userId: string, id: string): Promise<ChatModel> {
    try {
      return await this.authorize(userId, id);
    } catch {
      return findModel(DEFAULT_MODEL_ID)!;
    }
  }

  // 하루 한도가 있는 모델이면 답을 만들기 전에 1번을 먼저 잡는다. 한도에 닿았으면 거절한다.
  // 읽고 쓰는 사이에 동시 요청이 끼어도 한도를 넘지 않게 DB 한 문장으로 센다
  async reserve(userId: string, model: ChatModel): Promise<void> {
    const limit = dailyLimitOf(model);
    if (limit === null) return;
    const rows = await this.prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "model_usage" ("userId", "modelId", "day", "count")
      VALUES (${userId}, ${model.id}, ${kstDay()}, 1)
      ON CONFLICT ("userId", "modelId", "day")
      DO UPDATE SET "count" = "model_usage"."count" + 1
      WHERE "model_usage"."count" < ${limit}
      RETURNING "count"`;
    if (rows.length === 0) throw new ForbiddenException(`${model.label}: ${LOCK_MESSAGE.DAILY_LIMIT}`);
  }

  // 답을 못 만들었으면 잡아 둔 1번을 돌려준다
  async release(userId: string, model: ChatModel): Promise<void> {
    if (dailyLimitOf(model) === null) return;
    await this.prisma.modelUsage.updateMany({
      where: { userId, modelId: model.id, day: kstDay(), count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    });
  }

  // 방금 쓴 뒤의 오늘 사용량 (답과 함께 화면에 돌려준다)
  async usage(userId: string, model: ChatModel): Promise<{ used: number; limit: number } | null> {
    const limit = dailyLimitOf(model);
    if (limit === null) return null;
    const row = await this.prisma.modelUsage.findUnique({
      where: { userId_modelId_day: { userId, modelId: model.id, day: kstDay() } },
    });
    return { used: row?.count ?? 0, limit };
  }
}
