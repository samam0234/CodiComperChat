import { Module } from '@nestjs/common';
import { CampaignStateModule } from '../campaign-state/campaign-state.module.js';
import { QuestsModule } from '../quests/quests.module.js';
import { ChatStateModule } from '../chat-state/chat-state.module.js';
import { CharactersModule } from '../characters/characters.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { ExtrasModule } from '../extras/extras.module.js';
import { MemoriesModule } from '../memories/memories.module.js';
import { ModelsModule } from '../models/models.module.js';
import { PersonaRagModule } from '../persona-rag/persona-rag.module.js';
import { PersonasModule } from '../personas/personas.module.js';
import { CharacterChatController } from './character-chat.controller.js';
import { CharacterChatService } from './character-chat.service.js';

@Module({
  imports: [CharactersModule, PersonasModule, PersonaRagModule, ConversationsModule, MemoriesModule, ChatStateModule, ExtrasModule, CampaignStateModule, QuestsModule, ModelsModule],
  controllers: [CharacterChatController],
  providers: [CharacterChatService],
  // 오퍼레이션 모듈이 대화 맥락 조립(operationContext)을 함께 쓴다
  exports: [CharacterChatService],
})
export class CharacterChatModule {}
