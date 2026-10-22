import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { RateLimit } from '../security/rate-limit.js';
import { BillingService } from './billing.service.js';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  // 상품표와 지금 켜진 결제 방식(toss·mock·null). 로그인 없이 요금 화면에서 본다
  @Get('products')
  products() {
    return this.billing.products();
  }

  @Post('checkout')
  @UseGuards(AuthGuard)
  @RateLimit('billing')
  checkout(@CurrentUserId() userId: string, @Body() body: { productId?: unknown } | undefined) {
    return this.billing.checkout(userId, body?.productId);
  }

  // { orderId, paymentKey, amount } — 결제창이 돌려준 값 그대로
  @Post('confirm')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @RateLimit('billing')
  confirm(@CurrentUserId() userId: string, @Body() body: { orderId?: unknown; paymentKey?: unknown; amount?: unknown } | undefined) {
    return this.billing.confirm(userId, body);
  }

  @Get('orders')
  @UseGuards(AuthGuard)
  orders(@CurrentUserId() userId: string) {
    return this.billing.orders(userId);
  }
}

// 운영자만: 계정의 결제 보기·환불 (환불하면 결제사 환불 후 그 결제로 늘어난 프로 기간을 되돌린다)
@Controller('admin/orders')
@UseGuards(AuthGuard, AdminGuard)
export class AdminOrdersController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  list(@Query('email') email?: string) {
    if (!email?.trim()) throw new BadRequestException('이메일을 입력해 주세요.');
    return this.billing.ordersOf(email);
  }

  // { reason } 필수
  @Post(':id/refund')
  @HttpCode(200)
  refund(@Param('id') id: string, @Body() body: { reason?: unknown } | undefined) {
    return this.billing.refund(id, body);
  }
}
