import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { CreditsService } from './credits.service.js';

@Controller('me')
@UseGuards(AuthGuard)
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  // 코레딧 잔액·오늘 출석 여부·최근 기록
  @Get('credits')
  summary(@CurrentUserId() userId: string) {
    return this.credits.summary(userId);
  }

  // 출석 (하루 한 번, 무료 1000·프로 5000)
  @Post('attendance')
  @HttpCode(200)
  attend(@CurrentUserId() userId: string) {
    return this.credits.attend(userId);
  }
}
