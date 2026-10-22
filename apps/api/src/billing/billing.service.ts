import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { extendPro } from '../plan/plan.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { activeProvider, cancelPayment, clientKey, confirmPayment, type ProviderName } from './payment-provider.js';
import { findProduct, products } from './products.js';

const DAY_MS = 86_400_000;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  products() {
    const provider = activeProvider();
    return { products: products(), provider, clientKey: provider ? clientKey(provider) : null };
  }

  private provider(): ProviderName {
    const provider = activeProvider();
    if (!provider) throw new ServiceUnavailableException('결제가 아직 준비되지 않았습니다. 고객센터로 문의해 주세요.');
    return provider;
  }

  // 결제창을 열기 전에 주문을 만든다. 금액은 서버의 상품표에서 정한다
  async checkout(userId: string, productId: unknown) {
    const provider = this.provider();
    const product = findProduct(productId);
    if (!product) throw new BadRequestException('없는 상품입니다.');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, displayName: true } });
    if (!user) throw new NotFoundException('계정을 찾을 수 없습니다.');
    const order = await this.prisma.paymentOrder.create({
      data: { userId, buyerEmail: user.email, productId: product.id, amount: product.amount, days: product.days, provider },
      select: { id: true },
    });
    return {
      orderId: order.id,
      orderName: product.name,
      amount: product.amount,
      provider,
      clientKey: clientKey(provider),
      // 토스 결제창의 구매자 키. 사용자 id를 그대로 쓰지 않는다
      customerKey: `cust_${userId}`,
      customerEmail: user.email,
      customerName: user.displayName,
    };
  }

  // 결제창에서 돌아온 결제를 승인한다. 같은 주문을 두 번 승인해도 등급이 두 번 늘지 않는다
  async confirm(userId: string, body: { orderId?: unknown; paymentKey?: unknown; amount?: unknown } | undefined) {
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    const paymentKey = typeof body?.paymentKey === 'string' ? body.paymentKey.slice(0, 200) : '';
    const amount = Number(body?.amount);
    if (!orderId || !paymentKey || !Number.isInteger(amount)) throw new BadRequestException('결제 정보가 올바르지 않습니다.');

    const order = await this.prisma.paymentOrder.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (order.status === PaymentStatus.PAID) {
      if (order.paymentKey !== paymentKey) throw new ConflictException('이미 다른 결제로 처리된 주문입니다.');
      return this.result(userId, order.id);
    }
    if (order.status === PaymentStatus.FAILED) throw new ConflictException('실패한 주문입니다. 다시 결제해 주세요.');
    // 결제창이 돌려준 금액이 주문 금액과 다르면 승인하지 않는다(브라우저에서 금액을 바꾼 경우)
    if (amount !== order.amount) {
      await this.fail(order.id, '결제 금액이 주문과 다릅니다.');
      throw new BadRequestException('결제 금액이 주문과 다릅니다.');
    }

    const confirmed = await confirmPayment(order.provider as ProviderName, { paymentKey, orderId, amount });
    if (!confirmed.ok || confirmed.amount !== order.amount) {
      const reason = confirmed.ok ? '결제사가 승인한 금액이 주문과 다릅니다.' : confirmed.reason;
      await this.fail(order.id, reason);
      throw new BadRequestException(reason);
    }

    // 주문을 PAID로 바꾸는 쪽만 등급을 늘린다 (동시에 두 번 승인 요청이 와도 한 번만)
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.paymentOrder.updateMany({
        where: { id: order.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.PAID, paymentKey, paidAt: new Date(), receiptUrl: confirmed.receiptUrl },
      });
      if (count !== 1) return;
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planUntil: true } });
      await tx.user.update({ where: { id: userId }, data: { plan: 'PRO', planUntil: extendPro(user, order.days) } });
    });
    return this.result(userId, order.id);
  }

  private async fail(orderId: string, reason: string) {
    await this.prisma.paymentOrder.updateMany({
      where: { id: orderId, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED, failReason: reason.slice(0, 300) },
    });
  }

  private async result(userId: string, orderId: string) {
    const [order, user] = await Promise.all([
      this.prisma.paymentOrder.findUniqueOrThrow({ where: { id: orderId }, select: { productId: true, amount: true, days: true } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { planUntil: true } }),
    ]);
    return { paid: true, ...order, planUntil: user.planUntil };
  }

  // 운영자: 결제를 전액 환불하고, 그 결제로 늘어난 프로 기간을 되돌린다.
  // 결제사 환불이 먼저 성공해야 우리 기록을 바꾼다(돈은 돌려주지 않았는데 기간만 줄어드는 일이 없게)
  async refund(orderId: string, body: { reason?: unknown } | undefined) {
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 200) : '';
    if (!reason) throw new BadRequestException('환불 사유를 적어 주세요.');
    const order = await this.prisma.paymentOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다.');
    if (order.status === PaymentStatus.REFUNDED) throw new ConflictException('이미 환불한 결제입니다.');
    if (order.status !== PaymentStatus.PAID || !order.paymentKey) throw new ConflictException('결제가 끝난 주문만 환불할 수 있습니다.');

    const cancelled = await cancelPayment(order.provider as ProviderName, order.paymentKey, reason);
    if (!cancelled.ok) throw new BadRequestException(cancelled.reason);

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.paymentOrder.updateMany({
        where: { id: order.id, status: PaymentStatus.PAID },
        data: { status: PaymentStatus.REFUNDED, refundedAt: new Date(), refundReason: reason },
      });
      // 탈퇴한 계정의 결제면 되돌릴 기간이 없다(환불만 한다)
      if (count !== 1 || !order.userId) return;
      const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId }, select: { plan: true, planUntil: true } });
      // 만료 없는 프로(운영자 부여)는 건드리지 않는다. 기간이 있으면 그 결제의 일수만큼 줄인다(지금보다 앞이면 지금 끝)
      if (user.plan === 'PRO' && user.planUntil) {
        const until = new Date(Math.max(Date.now(), user.planUntil.getTime() - order.days * DAY_MS));
        await tx.user.update({ where: { id: order.userId }, data: { planUntil: until } });
      }
    });
    return { refunded: true };
  }

  // 운영자: 계정의 결제 목록 (환불할 주문을 고른다)
  async ordersOf(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
    if (!user) throw new NotFoundException('계정을 찾을 수 없습니다.');
    const orders = await this.prisma.paymentOrder.findMany({
      where: { userId: user.id, status: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] } },
      orderBy: { paidAt: 'desc' },
      take: 50,
      select: { id: true, productId: true, amount: true, days: true, provider: true, status: true, paidAt: true, refundedAt: true, refundReason: true },
    });
    return orders.map((o) => ({ ...o, name: findProduct(o.productId)?.name ?? o.productId }));
  }

  async orders(userId: string) {
    const [orders, user] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where: { userId, status: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] } },
        orderBy: { paidAt: 'desc' },
        take: 50,
        select: { id: true, productId: true, amount: true, days: true, paidAt: true, receiptUrl: true, status: true, refundedAt: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planUntil: true } }),
    ]);
    return {
      orders: orders.map((o) => ({ ...o, name: findProduct(o.productId)?.name ?? o.productId })),
      // 내 등급 화면에서 "언제까지"를 보여 준다 (만료 없음이면 null)
      planUntil: user?.plan === 'PRO' ? user.planUntil : null,
    };
  }
}
