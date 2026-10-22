import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CharactersModule } from '../characters/characters.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { MemoriesController } from './memories.controller.js';
import { MemoriesService } from './memories.service.js';

@Module({
  imports: [AuthModule, CharactersModule, ConversationsModule],
  controllers: [MemoriesController],
  providers: [MemoriesService],
  exports: [MemoriesService],
})
export class MemoriesModule {}
