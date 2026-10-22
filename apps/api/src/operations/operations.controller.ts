import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { RateLimit } from '../security/rate-limit.js';
import { DM_MAX_LENGTH, OperationsService } from './operations.service.js';

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

  // 메시지: 문자 기록
  @Get('messages')
  messages(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.ops.messagesView(id, authorization);
  }

  // 메시지: 문자 보내기 { text } → 캐릭터 답장 (코레딧 없음)
  @Post('messages')
  @HttpCode(200)
  @RateLimit('chat')
  sendMessage(@Param('id') id: string, @Body() body: { text?: unknown }, @Headers('authorization') authorization?: string) {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (text === '') throw new BadRequestException('보낼 문자를 적어 주세요.');
    if (text.length > DM_MAX_LENGTH) throw new BadRequestException(`문자는 ${DM_MAX_LENGTH}자 이하로 보내 주세요.`);
    return this.ops.sendMessage(id, text, authorization);
  }
}
