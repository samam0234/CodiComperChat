import { Body, Controller, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { RateLimit } from '../security/rate-limit.js';
import { AccountService } from './account.service.js';

@Controller('auth')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  // 회원 탈퇴 { password, confirm: "탈퇴합니다" }. 되돌릴 수 없다
  @Delete('me')
  @HttpCode(204)
  @RateLimit('password')
  @UseGuards(AuthGuard)
  async remove(@CurrentUserId() userId: string, @Body() body: { password?: unknown; confirm?: unknown } | undefined) {
    await this.account.deleteAccount(userId, body);
  }
}
