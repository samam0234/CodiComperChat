import { Module } from '@nestjs/common';
import { CampaignStateModule } from '../campaign-state/campaign-state.module.js';
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
  imports: [CharactersModule, PersonasModule, PersonaRagModule, ConversationsModule, MemoriesModule, ChatStateModule, ExtrasModule, CampaignStateModule, ModelsModule],
  controllers: [CharacterChatController],
  providers: [CharacterChatService],
})
export class CharacterChatModule {}
