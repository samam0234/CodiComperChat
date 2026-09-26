import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { ConversationsService } from './conversations.service.js';

@Controller('me/conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  // 대화 목록 페이지: 최근에 대화한 캐릭터부터
  @Get()
  list(@CurrentUserId() userId: string) {
    return this.conversations.listForUser(userId);
  }
}
