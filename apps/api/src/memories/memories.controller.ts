import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { CharactersService } from '../characters/characters.service.js';
import { ConversationsService } from '../conversations/conversations.service.js';
import { RateLimit } from '../security/rate-limit.js';
import { MemoriesService } from './memories.service.js';

// 이 캐릭터와의 대화에서 캐릭터가 기억하는 것 — 본인 대화만 보고 지울 수 있다
@Controller('characters/:id/chat/memories')
@UseGuards(AuthGuard)
export class MemoriesController {
  constructor(
    private readonly characters: CharactersService,
    private readonly conversations: ConversationsService,
    private readonly memories: MemoriesService,
  ) {}

  @Get()
  async list(@Param('id') characterId: string, @CurrentUserId() userId: string) {
    const character = await this.characters.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    return {
      character: { id: character.id, name: character.name },
      started: conversation !== null,
      memories: conversation ? await this.memories.list(conversation.campaignId) : [],
    };
  }

  @Delete(':memoryId')
  @HttpCode(204)
  async remove(
    @Param('id') characterId: string,
    @Param('memoryId') memoryId: string,
    @CurrentUserId() userId: string,
  ) {
    const conversation = await this.conversations.find(userId, characterId);
    if (!conversation) return;
    await this.memories.remove(conversation.campaignId, memoryId);
  }

  // "지금 정리하기": 3번 오가기를 기다리지 않고 아직 정리 안 된 대화를 바로 정리한다
  @Post('refresh')
  @RateLimit('memory')
  @HttpCode(200)
  async refresh(@Param('id') characterId: string, @CurrentUserId() userId: string) {
    const character = await this.characters.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    if (!conversation) return { created: 0 };
    const userName = await this.conversations.lastSpeaker(conversation.sessionId);
    const created = await this.memories.memorize(
      conversation,
      { characterName: character.name, userName: userName ?? '유저' },
      true,
    );
    return { created };
  }
}
