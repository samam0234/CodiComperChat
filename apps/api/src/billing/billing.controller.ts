import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
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
