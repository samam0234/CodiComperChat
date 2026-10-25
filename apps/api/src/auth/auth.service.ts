import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { adultBlock } from '../account/adult.js';
import { MailService, webBaseUrl } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  LoginInput,
  PasswordChangeInput,
  PasswordResetInput,
  ProfileInput,
  SignupInput,
} from './auth.dto.js';
import { consumeEmailToken, issueEmailToken } from './email-token.js';
import { hashPassword, verifyPassword } from './password.js';
import { effectivePlan } from '../plan/plan.js';
import { SUSPEND_MESSAGE } from '../content-reports/content-reports.service.js';
import { signToken } from './token.js';

// passwordHash는 어떤 응답에도 넣지 않는다
const PUBLIC_USER = {
  id: true,
  email: true,
  displayName: true,
  // 웹이 공방 발행 버튼을 보여 줄지 정한다. 권한 판단은 서버가 다시 한다
  role: true,
  // 요금 등급. 응답에는 만료를 반영한 plan만 싣는다(present)
  plan: true,
  planUntil: true,
  emailVerifiedAt: true,
  sessionVersion: true,
  createdAt: true,
  // 성인 확인(코디포토넷 NSFW). 생년월일 자체는 내보내지 않고 adult 하나로 알린다
  birthDate: true,
  adultConsentAt: true,
} as const;

type Raw = Prisma.UserGetPayload<{ select: typeof PUBLIC_USER }>;
export type PublicUser = Omit<Raw, 'planUntil' | 'emailVerifiedAt' | 'sessionVersion' | 'birthDate' | 'adultConsentAt'> & {
  emailVerified: boolean;
  adult: boolean;
};

// PRO 만료 시각이 지났으면 FREE로 내려 보낸다. 만료 시각·토큰 세대·생년월일은 내보내지 않는다
function present(user: Raw): PublicUser {
  const { planUntil: _until, emailVerifiedAt, sessionVersion: _version, birthDate, adultConsentAt, ...rest } = user;
  return {
    ...rest,
    plan: effectivePlan(user),
    emailVerified: emailVerifiedAt !== null,
    adult: adultBlock({ birthDate, adultConsentAt, emailVerifiedAt }) === null,
  };
}

// 없는 이메일로 로그인할 때도 해시 비교 시간을 들여, 응답 시간으로 가입 여부가 드러나지 않게 한다
const DUMMY_HASH = hashPassword('timing-equalizer-not-a-real-password');

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // 메일이 늦거나 실패해도 가입·요청 자체는 성공시킨다. 응답 시간으로 가입 여부가 드러나지 않게 기다리지도 않는다
  private sendLater(task: () => Promise<void>) {
    task().catch((error: unknown) =>
      this.logger.error(`메일 발송 실패: ${error instanceof Error ? error.message : String(error)}`),
    );
  }

  private async sendVerification(user: { id: string; email: string; displayName: string }) {
    const token = await issueEmailToken(this.prisma, user.id, 'VERIFY_EMAIL');
    await this.mail.send({
      to: user.email,
      subject: '[코디컴퍼챗] 이메일 주소를 확인해 주세요',
      text: [
        `${user.displayName}님, 코디컴퍼챗에 가입해 주셔서 고마워요.`,
        '아래 링크를 열면 이메일 인증이 끝납니다. 링크는 24시간 동안 쓸 수 있어요.',
        '',
        `${webBaseUrl()}/verify-email?token=${token}`,
        '',
        '직접 가입하지 않았다면 이 메일은 무시해 주세요.',
      ].join('\n'),
    });
  }

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
      this.sendLater(() => this.sendVerification(user));
      return { token: await signToken(user.id, user.sessionVersion), user: present(user) };
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
      select: { ...PUBLIC_USER, passwordHash: true, suspendedAt: true },
    });

    const ok = await verifyPassword(
      input.password,
      found?.passwordHash ?? (await DUMMY_HASH),
    );
    if (!found?.passwordHash || !ok) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (found.suspendedAt) throw new ForbiddenException(SUSPEND_MESSAGE);
    const { passwordHash: _omit, suspendedAt: _suspended, ...user } = found;
    return { token: await signToken(user.id, user.sessionVersion), user: present(user) };
  }

  async getProfile(userId: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER,
    });
    return user ? present(user) : null;
  }

  async updateProfile(userId: string, input: ProfileInput): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { displayName: input.displayName },
      select: PUBLIC_USER,
    });
    return present(user);
  }

  // 바꾼 뒤에는 다른 기기의 로그인이 모두 끊긴다. 지금 쓰는 기기는 돌려준 새 토큰으로 이어 간다
  async changePassword(
    userId: string,
    input: PasswordChangeInput,
  ): Promise<{ token: string }> {
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

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(input.newPassword), sessionVersion: { increment: 1 } },
      select: { sessionVersion: true },
    });
    return { token: await signToken(userId, updated.sessionVersion) };
  }

  // 인증 메일 다시 보내기. 이미 인증했으면 보내지 않는다
  async requestVerification(userId: string): Promise<{ alreadyVerified: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, emailVerifiedAt: true },
    });
    if (!user) throw new UnauthorizedException('로그인이 필요합니다.');
    if (user.emailVerifiedAt) return { alreadyVerified: true };
    await this.sendVerification(user);
    return { alreadyVerified: false };
  }

  async verifyEmail(token: unknown): Promise<{ verified: true }> {
    const userId = await consumeEmailToken(this.prisma, token, 'VERIFY_EMAIL');
    if (!userId) {
      throw new BadRequestException('인증 링크가 만료됐거나 이미 사용됐습니다. 인증 메일을 다시 받아 주세요.');
    }
    await this.prisma.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    return { verified: true };
  }

  // 비밀번호 찾기. 가입 여부를 드러내지 않도록 결과와 무관하게 같은 응답을 바로 돌려준다
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, passwordHash: true },
    });
    if (!user?.passwordHash) return;
    this.sendLater(async () => {
      const token = await issueEmailToken(this.prisma, user.id, 'RESET_PASSWORD');
      await this.mail.send({
        to: user.email,
        subject: '[코디컴퍼챗] 비밀번호 재설정 링크',
        text: [
          `${user.displayName}님, 비밀번호 재설정을 요청하셨어요.`,
          '아래 링크에서 새 비밀번호를 정해 주세요. 링크는 30분 동안 한 번만 쓸 수 있어요.',
          '',
          `${webBaseUrl()}/reset-password?token=${token}`,
          '',
          '요청하지 않았다면 이 메일은 무시해 주세요. 비밀번호는 바뀌지 않습니다.',
        ].join('\n'),
      });
    });
  }

  // 재설정하면 모든 기기의 로그인이 끊긴다. 메일을 받았다는 것은 주소의 주인이라는 뜻이라 인증도 함께 끝낸다
  async resetPassword(input: PasswordResetInput): Promise<void> {
    const userId = await consumeEmailToken(this.prisma, input.token, 'RESET_PASSWORD');
    if (!userId) {
      throw new BadRequestException('재설정 링크가 만료됐거나 이미 사용됐습니다. 비밀번호 찾기를 다시 해 주세요.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } });
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(input.newPassword),
        sessionVersion: { increment: 1 },
        ...(user?.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
      },
    });
  }
}
