import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { effectivePlan } from '../plan/plan.js';
import { PrismaService } from '../prisma/prisma.service.js';

// 운영자만: 계정을 이메일로 찾아 요금 등급을 직접 바꾼다 (환불·보상·시험 계정용. 결제와 따로)
@Controller('admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUsersController {
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
        createdAt: true,
        orders: { where: { status: 'PAID' }, orderBy: { paidAt: 'desc' }, take: 10, select: { productId: true, amount: true, paidAt: true } },
      },
    });
    if (!user) throw new NotFoundException('계정을 찾을 수 없습니다.');
    return { ...user, effectivePlan: effectivePlan(user) };
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
