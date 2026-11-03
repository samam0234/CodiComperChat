import { BadRequestException, Body, Controller, Get, HttpCode, Logger, NotFoundException, Post, Query, UseGuards } from '@nestjs/common';
import { ageOn, parseBirthDate } from '../account/adult.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { effectivePlan } from '../plan/plan.js';
import { PrismaService } from '../prisma/prisma.service.js';

// 운영자만: 계정을 이메일로 찾아 요금 등급을 직접 바꾼다 (환불·보상·시험 계정용. 결제와 따로)
@Controller('admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUsersController {
  private readonly log = new Logger(AdminUsersController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async find(@Query('email') email?: string) {
    const address = email?.trim().toLowerCase();
    if (!address) throw new BadRequestException('이메일을 입력해 주세요.');
    const user = await this.prisma.user.findUnique({
      where: { email: address },
      select: {
        email: true,
        displayName: true,
        role: true,
        plan: true,
        planUntil: true,
        birthDate: true,
        createdAt: true,
        orders: { where: { status: 'PAID' }, orderBy: { paidAt: 'desc' }, take: 10, select: { productId: true, amount: true, paidAt: true } },
      },
    });
    if (!user) throw new NotFoundException('계정을 찾을 수 없습니다.');
    // 날짜는 내보내지 않고 만 나이만 보여 준다
    const { birthDate, ...rest } = user;
    return { ...rest, effectivePlan: effectivePlan(user), age: birthDate ? ageOn(birthDate) : null };
  }

  // { email, birthDate: "YYYY-MM-DD" | null, reason } — 이용자가 생년월일을 잘못 넣었을 때 운영자가 고친다.
  // 나이는 프리미엄·성인 잠금의 기준이라, 고치면 성인 동의를 지워 이용자가 다시 확인하게 한다.
  // 사유는 서버 로그에 남긴다 (날짜와 이메일은 남기지 않는다)
  @Post('birthdate')
  @HttpCode(200)
  async setBirthDate(
    @CurrentUserId() adminId: string,
    @Body() body: { email?: unknown; birthDate?: unknown; reason?: unknown } | undefined,
  ) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
    if (!email) throw new BadRequestException('이메일을 입력해 주세요.');
    if (!reason) throw new BadRequestException('고치는 사유를 적어 주세요.');
    const raw = body?.birthDate;
    const birthDate = raw === null || raw === '' ? null : parseBirthDate(raw);
    if (raw !== null && raw !== '' && (!birthDate || birthDate.getTime() > Date.now())) {
      throw new BadRequestException('생년월일을 YYYY-MM-DD 형식으로 입력해 주세요.');
    }
    const updated = await this.prisma.user
      .update({ where: { email }, data: { birthDate, adultConsentAt: null }, select: { id: true, birthDate: true } })
      .catch((error: { code?: string }) => {
        if (error?.code === 'P2025') throw new NotFoundException('계정을 찾을 수 없습니다.');
        throw error;
      });
    this.log.warn(`생년월일 정정: 대상 ${updated.id}, 운영자 ${adminId}, 사유 ${reason.slice(0, 200)}`);
    return { age: updated.birthDate ? ageOn(updated.birthDate) : null };
  }

  // { email, plan: 'PRO' | 'FREE', days? } — days가 없으면 만료 없는 PRO
  @Post('plan')
  @HttpCode(200)
  async setPlan(@Body() body: { email?: unknown; plan?: unknown; days?: unknown } | undefined) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const plan = body?.plan;
    const days = body?.days === undefined || body.days === null || body.days === '' ? null : Number(body.days);
    if (!email) throw new BadRequestException('이메일을 입력해 주세요.');
    if (plan !== 'PRO' && plan !== 'FREE') throw new BadRequestException('등급은 PRO 또는 FREE입니다.');
    if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) {
      throw new BadRequestException('일수는 1~3650 사이의 정수입니다.');
    }
    const planUntil = plan === 'PRO' && days ? new Date(Date.now() + days * 86_400_000) : null;
    const updated = await this.prisma.user
      .update({ where: { email }, data: { plan, planUntil }, select: { email: true, plan: true, planUntil: true } })
      .catch((error: { code?: string }) => {
        if (error?.code === 'P2025') throw new NotFoundException('계정을 찾을 수 없습니다.');
        throw error;
      });
    return updated;
  }
}
