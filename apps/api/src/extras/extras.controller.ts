import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { CharactersService } from '../characters/characters.service.js';
import { ConversationsService } from '../conversations/conversations.service.js';
import { ExtrasService } from './extras.service.js';

// 내 엑스트라 목록 (만들기·고치기·지우기)
@Controller('me/extras')
@UseGuards(AuthGuard)
export class ExtrasController {
  constructor(private readonly extras: ExtrasService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.extras.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() body: unknown) {
    return this.extras.create(userId, body);
  }

  @Patch(':extraId')
  update(@CurrentUserId() userId: string, @Param('extraId') id: string, @Body() body: unknown) {
    return this.extras.update(userId, id, body);
  }

  @Delete(':extraId')
  @HttpCode(204)
  async remove(@CurrentUserId() userId: string, @Param('extraId') id: string) {
    await this.extras.remove(userId, id);
  }
}

// 지금 대화에 엑스트라 적용하기 (대화마다 따로 — 새로하기를 하면 새 대화에는 없다)
@Controller('characters/:id/chat/extras')
@UseGuards(AuthGuard)
export class ChatExtrasController {
  constructor(
    private readonly characters: CharactersService,
    private readonly conversations: ConversationsService,
    private readonly extras: ExtrasService,
  ) {}

  @Get()
  async view(@Param('id') characterId: string, @CurrentUserId() userId: string) {
    const character = await this.characters.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    return this.extras.view(userId, conversation, character.name);
  }

  // { triggers: ['relation' | 'situation' | 'place', ...] } — 셋 다 고르면 "모두"
  @Put(':extraId')
  async apply(
    @Param('id') characterId: string,
    @Param('extraId') extraId: string,
    @CurrentUserId() userId: string,
    @Body() body: { triggers?: unknown },
  ) {
    const character = await this.characters.findOnePublished(characterId, userId);
    // 대화 전에도 적용할 수 있게, 대화가 없으면 만든다 (상태설정과 같은 방식)
    const conversation = await this.conversations.findOrCreate(userId, character);
    await this.extras.apply(userId, conversation, extraId, body?.triggers);
    return this.extras.view(userId, conversation, character.name);
  }

  @Delete(':extraId')
  async unapply(
    @Param('id') characterId: string,
    @Param('extraId') extraId: string,
    @CurrentUserId() userId: string,
  ) {
    const character = await this.characters.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    if (conversation) await this.extras.unapply(conversation, extraId);
    return this.extras.view(userId, conversation, character.name);
  }
}
