import { Controller, Delete, Get, HttpCode, Param, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { CharactersService } from '../characters/characters.service.js';
import { ConversationsService } from '../conversations/conversations.service.js';
import { CampaignStoryService } from './campaign-story.service.js';

// 지금 대화의 이야기 상태: 지난 이야기 요약, 열린 복선, 끝난 일, 친밀도 자동 변화 기록
@Controller('characters/:id/chat/story')
@UseGuards(AuthGuard)
export class CampaignStoryController {
  constructor(
    private readonly characters: CharactersService,
    private readonly conversations: ConversationsService,
    private readonly story: CampaignStoryService,
  ) {}

  @Get()
  async view(@Param('id') characterId: string, @CurrentUserId() userId: string) {
    await this.characters.findOnePublished(characterId, userId);
    return this.story.view(await this.conversations.find(userId, characterId));
  }

  @Delete('hooks/:hookId')
  @HttpCode(204)
  async removeHook(@Param('id') characterId: string, @Param('hookId') hookId: string, @CurrentUserId() userId: string) {
    await this.characters.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    if (conversation) await this.story.removeHook(conversation.campaignId, hookId);
  }
}
