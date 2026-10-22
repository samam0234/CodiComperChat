import { Controller, Get, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { RateLimit } from '../security/rate-limit.js';
import { OperationsService } from './operations.service.js';

// 오퍼레이션: 이 캐릭터와의 지금 대화에 붙는 플러그인. 로그인한 사람만, 진행 중인 대화가 있어야 만들 수 있다
@Controller('characters/:id/chat/ops')
export class OperationsController {
  constructor(private readonly ops: OperationsService) {}

  // 심리 탐구: 지금까지 엿본 속마음 목록 + 값·잔액
  @Get('mind')
  mind(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.mindView(id, authorization);
  }

  // 심리 탐구: 지금 이 순간의 속마음을 엿본다 (코레딧)
  @Post('mind')
  @HttpCode(200)
  @RateLimit('chat')
  readMind(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.readMind(id, authorization);
  }

  // 일기: 캐릭터가 쓴 일기 목록 + 값·잔액
  @Get('diary')
  diary(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.diaryView(id, authorization);
  }

  // 일기: 최근 대화를 돌아보는 새 일기 한 편 (코레딧)
  @Post('diary')
  @HttpCode(200)
  @RateLimit('chat')
  writeDiary(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.writeDiary(id, authorization);
  }
}
