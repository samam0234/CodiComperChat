import { Controller, Get, Headers, Param } from '@nestjs/common';
import { QuestsService } from './quests.service.js';

// 비밀 퀘스트: 이 캐릭터와의 지금 대화에서 퀘스트가 어디까지 왔는지 (로그인한 사람만)
@Controller('characters/:id/chat/quest')
export class QuestsController {
  constructor(private readonly quests: QuestsService) {}

  @Get()
  view(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.quests.view(id, authorization);
  }
}
