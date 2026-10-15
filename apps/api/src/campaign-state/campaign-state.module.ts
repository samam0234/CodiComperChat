import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CharactersModule } from '../characters/characters.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { CampaignStoryController } from './campaign-story.controller.js';
import { CampaignStoryService } from './campaign-story.service.js';

@Module({
  imports: [AuthModule, CharactersModule, ConversationsModule],
  controllers: [CampaignStoryController],
  providers: [CampaignStoryService],
  exports: [CampaignStoryService],
})
export class CampaignStateModule {}
