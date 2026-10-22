import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyPassword } from '../auth/password.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StudioPublishService } from '../studio/studio-publish.service.js';

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
}
