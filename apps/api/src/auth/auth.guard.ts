import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { readSession } from './session.js';

type AuthedRequest = Request & { userId?: string };

// 토큰이 유효해도 그 사이 계정이 사라졌거나 비밀번호를 바꿔 토큰 세대가 바뀌었으면 막는다 — 서명만 믿지 않고 DB에서 한 번 더 확인
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const userId = await readSession(this.prisma, request.headers.authorization);
    if (!userId) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    request.userId = userId;
    return true;
  }
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthedRequest>().userId!,
);
