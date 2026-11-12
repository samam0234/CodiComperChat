import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ADULT_BLOCK_MESSAGE, adultBlock, adultModeOff, parseBirthDate } from './adult.js';
import { verifyPassword } from '../auth/password.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { StudioPublishService } from '../../studio/publish/studio-publish.service.js';

function validBirthDate(raw: unknown): Date {
  const birthDate = parseBirthDate(raw);
  if (!birthDate || birthDate.getUTCFullYear() < 1900 || birthDate > new Date()) {
    throw new BadRequestException('생년월일을 YYYY-MM-DD 형식으로 정확히 입력해 주세요.');
  }
  return birthDate;
}

// 회원 탈퇴. 비밀번호를 한 번 더 확인한 뒤 계정과 그 사람의 데이터(대화·기억·프로필·엑스트라·캐릭터 초안·신고)를 지운다.
// 남기는 것: 결제 기록(법정 보관 — 주문의 계정 연결만 끊고 구매자 이메일은 남긴다).
// 발행한 캐릭터는 먼저 내린다 — 남이 그 캐릭터와 나눈 대화는 남지만 더는 열 수 없다
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: StudioPublishService,
  ) {}

  async deleteAccount(userId: string, body: { password?: unknown; confirm?: unknown } | undefined): Promise<void> {
    if (body?.confirm !== '탈퇴합니다') throw new BadRequestException('확인 문구 "탈퇴합니다"를 그대로 입력해 주세요.');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user) throw new UnauthorizedException('로그인이 필요합니다.');
    if (!user.passwordHash || typeof body.password !== 'string' || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }
    await this.publisher.retireAllOf(userId);
    await this.prisma.user.delete({ where: { id: userId } });
  }

  // 나이 확인 { birthDate: "YYYY-MM-DD" } — 프리미엄 모델(만 18세 이상)을 연다. 성인 모드와 별개라 ADULT_MODE=off여도 받는다.
  // 생년월일은 한 번 넣으면 바꿀 수 없다
  async setBirthDate(userId: string, body: { birthDate?: unknown } | undefined): Promise<{ saved: true }> {
    const birthDate = validBirthDate(body?.birthDate);
    const { count } = await this.prisma.user.updateMany({ where: { id: userId, birthDate: null }, data: { birthDate } });
    if (count !== 1) throw new ConflictException('생년월일은 한 번 입력하면 바꿀 수 없어요.');
    return { saved: true };
  }

  // 성인 확인 { birthDate: "YYYY-MM-DD", consent: true } (임시 — 공개 전 본인인증으로 바꾼다).
  // 생년월일은 한 번 넣으면 바꿀 수 없다: 만 19세 미만으로 막힌 뒤 날짜만 고쳐 다시 시도하는 것을 막는다
  async confirmAdult(userId: string, body: { birthDate?: unknown; consent?: unknown } | undefined): Promise<{ adult: true }> {
    // 꺼져 있으면 생년월일도 받아 저장하지 않는다
    if (adultModeOff()) throw new ForbiddenException(ADULT_BLOCK_MESSAGE.DISABLED);
    if (body?.consent !== true) throw new BadRequestException('성인 콘텐츠 보기에 동의해 주세요.');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true, adultConsentAt: true, emailVerifiedAt: true },
    });
    if (!user) throw new UnauthorizedException('로그인이 필요합니다.');
    const birthDate = user.birthDate ?? validBirthDate(body.birthDate);
    const block = adultBlock({ birthDate, adultConsentAt: new Date(), emailVerifiedAt: user.emailVerifiedAt });
    if (!user.birthDate) await this.prisma.user.update({ where: { id: userId }, data: { birthDate } });
    if (block) throw new ForbiddenException(ADULT_BLOCK_MESSAGE[block]);
    await this.prisma.user.update({ where: { id: userId }, data: { adultConsentAt: new Date() } });
    return { adult: true };
  }

  // 성인 콘텐츠 끄기. 동의만 거두고 생년월일은 남긴다
  async revokeAdult(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { adultConsentAt: null } });
  }
}
