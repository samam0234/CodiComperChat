import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

// 운영자(ADMIN)만 통과. 반드시 AuthGuard 뒤에 둔다(`@UseGuards(AuthGuard, AdminGuard)`) — userId는 거기서 정해진다.
// 권한은 토큰이 아니라 DB의 role을 매번 읽는다(운영자에서 내려오면 바로 막히게)
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { userId?: string }>();
    const user = request.userId
      ? await this.prisma.user.findUnique({ where: { id: request.userId }, select: { role: true } })
      : null;
    if (user?.role !== 'ADMIN') throw new ForbiddenException('운영자만 할 수 있습니다.');
    return true;
  }
}
