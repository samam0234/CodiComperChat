import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreditReason, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { effectivePlan, type Plan } from '../plan/plan.js';
import { kstDay } from '../models/models.js';
import { KRW_PER_100_CREDITS, attendanceReward } from './credits.js';

const HISTORY_TAKE = 30;

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async planOf(userId: string): Promise<Plan> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planUntil: true } });
    return effectivePlan(user ?? { plan: 'FREE', planUntil: null });
  }

  async balance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
    return user?.credits ?? 0;
  }

  // 잔액·오늘 출석했는지·출석하면 받을 양·최근 기록
  async summary(userId: string) {
    const [balance, plan, today, history] = await Promise.all([
      this.balance(userId),
      this.planOf(userId),
      this.prisma.attendance.findUnique({ where: { userId_day: { userId, day: kstDay() } } }),
      this.prisma.creditLedger.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: HISTORY_TAKE,
        select: { delta: true, balance: true, reason: true, modelId: true, createdAt: true },
      }),
    ]);
    return {
      balance,
      attendedToday: today !== null,
      attendanceReward: attendanceReward(plan),
      krwPer100: KRW_PER_100_CREDITS,
      history,
    };
  }

  // 출석: 하루(한국 시각) 한 번. 같은 날 두 번이면 409 — 출석 줄의 기본키(계정×날짜)가 동시 요청도 막는다
  async attend(userId: string): Promise<{ credited: number; balance: number }> {
    const credited = attendanceReward(await this.planOf(userId));
    try {
      const balance = await this.prisma.$transaction(async (tx) => {
        await tx.attendance.create({ data: { userId, day: kstDay(), credits: credited } });
        const user = await tx.user.update({ where: { id: userId }, data: { credits: { increment: credited } }, select: { credits: true } });
        await tx.creditLedger.create({ data: { userId, delta: credited, balance: user.credits, reason: CreditReason.ATTENDANCE } });
        return user.credits;
      });
      return { credited, balance };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('오늘은 이미 출석했어요. 한국 시각 자정이 지나면 다시 출석할 수 있어요.');
      }
      throw error;
    }
  }

  // 비밀 퀘스트 보상: 계정×캐릭터당 한 번. 이미 받았으면 null (기본키가 동시 요청도 막는다). 지급과 기록은 한 트랜잭션
  async grantQuestReward(userId: string, characterId: string, amount: number): Promise<number | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.questReward.create({ data: { userId, characterId, amount } });
        const user = await tx.user.update({ where: { id: userId }, data: { credits: { increment: amount } }, select: { credits: true } });
        await tx.creditLedger.create({
          data: { userId, delta: amount, balance: user.credits, reason: CreditReason.QUEST, modelId: `quest:${characterId}` },
        });
        return user.credits;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null;
      throw error;
    }
  }

  // 모델을 쓰기 전에 코레딧을 먼저 뺀다. 모자라면 거절한다 — 잔액 확인과 차감을 한 문장으로 해 동시 요청도 음수가 되지 않는다.
  // reason: 프리미엄 모델 답이면 MODEL_USE, 오퍼레이션이면 OPERATION (modelId 칸에 "op:이름")
  async spend(
    userId: string,
    amount: number,
    modelId: string,
    label: string,
    reason: CreditReason = CreditReason.MODEL_USE,
  ): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ credits: number }[]>`
      UPDATE "users" SET "credits" = "credits" - ${amount}
      WHERE "id" = ${userId} AND "credits" >= ${amount}
      RETURNING "credits"`;
    if (rows.length === 0) throw new ForbiddenException(`${label}: 코레딧이 모자라요. 출석하면 코레딧을 받을 수 있어요.`);
    const balance = rows[0].credits;
    await this.prisma.creditLedger.create({ data: { userId, delta: -amount, balance, reason, modelId } });
    return balance;
  }

  // 답을 못 만들었으면 뺀 코레딧을 돌려준다
  async refund(userId: string, amount: number, modelId: string): Promise<void> {
    const user = await this.prisma.user.update({ where: { id: userId }, data: { credits: { increment: amount } }, select: { credits: true } });
    await this.prisma.creditLedger.create({ data: { userId, delta: amount, balance: user.credits, reason: CreditReason.REFUND, modelId } });
  }
}
