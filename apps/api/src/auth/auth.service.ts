import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  LoginInput,
  PasswordChangeInput,
  ProfileInput,
  SignupInput,
} from './auth.dto.js';
import { hashPassword, verifyPassword } from './password.js';
import { signToken } from './token.js';

// passwordHash는 어떤 응답에도 넣지 않는다
const PUBLIC_USER = {
  id: true,
  email: true,
  displayName: true,
  // 웹이 공방 발행 버튼을 보여 줄지 정한다. 권한 판단은 서버가 다시 한다
  role: true,
  createdAt: true,
} as const;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof PUBLIC_USER }>;

// 없는 이메일로 로그인할 때도 해시 비교 시간을 들여, 응답 시간으로 가입 여부가 드러나지 않게 한다
const DUMMY_HASH = hashPassword('timing-equalizer-not-a-real-password');

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(input: SignupInput): Promise<{ token: string; user: PublicUser }> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          displayName: input.displayName,
          passwordHash: await hashPassword(input.password),
        },
        select: PUBLIC_USER,
      });
      return { token: await signToken(user.id), user };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('이미 가입된 이메일입니다.');
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<{ token: string; user: PublicUser }> {
    const found = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { ...PUBLIC_USER, passwordHash: true },
    });

    const ok = await verifyPassword(
      input.password,
      found?.passwordHash ?? (await DUMMY_HASH),
    );
    if (!found?.passwordHash || !ok) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const { passwordHash: _omit, ...user } = found;
    return { token: await signToken(user.id), user };
  }

  getProfile(userId: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER,
    });
  }

  updateProfile(userId: string, input: ProfileInput): Promise<PublicUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { displayName: input.displayName },
      select: PUBLIC_USER,
    });
  }

  async changePassword(
    userId: string,
    input: PasswordChangeInput,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (
      !user?.passwordHash ||
      !(await verifyPassword(input.currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(input.newPassword) },
    });
  }
}
