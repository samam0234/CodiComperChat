import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUserId } from '../auth/auth.guard.js';
import { CharactersService } from '../characters/characters.service.js';
import { ConversationsService } from '../conversations/conversations.service.js';
import { ChatStateService, parseStatePatch, relationshipLabel } from './chat-state.service.js';

// 캐릭터 내 상태설정: 이 캐릭터와의 관계(친밀도·메모)와 캐릭터가 나를 부르는 호칭
@Controller('characters/:id/chat/state')
@UseGuards(AuthGuard)
export class ChatStateController {
  constructor(
    private readonly characters: CharactersService,
    private readonly conversations: ConversationsService,
    private readonly chatState: ChatStateService,
  ) {}

  @Get()
  async get(@Param('id') characterId: string, @CurrentUserId() userId: string) {
    const character = await this.characters.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    const state = await this.chatState.get(conversation?.campaignId ?? null);
    return {
      character: { id: character.id, name: character.name, addressing: character.addressing },
      state: { ...state, relationshipLabel: relationshipLabel(state.relationshipValue) },
    };
  }

  // 대화 전에도 설정할 수 있게, 대화가 없으면 만든다 (시작 장면을 첫 메시지로 남긴다)
  @Patch()
  async update(
    @Param('id') characterId: string,
    @CurrentUserId() userId: string,
    @Body() body: unknown,
  ) {
    const patch = parseStatePatch(body);
    const character = await this.characters.findOnePublished(characterId, userId);
    const conversation = await this.conversations.findOrCreate(userId, character);
    const state = await this.chatState.update(conversation, patch);
    return { state: { ...state, relationshipLabel: relationshipLabel(state.relationshipValue) } };
  }
}
