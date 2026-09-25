import { Injectable, UnauthorizedException } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';
import { verifyToken } from '../auth/token.js';
import { CharactersService } from '../characters/characters.service.js';
import { PersonasService } from '../personas/personas.service.js';
import { buildContextSlice } from './character-chat.context.js';
import type { ChatTurn, UserPersonaPayload } from './character-chat.types.js';

@Injectable()
export class CharacterChatService {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly personasService: PersonasService,
  ) {}

  // 비로그인 대화는 그대로 허용한다. 프로필을 골랐을 때만 로그인과 소유를 확인한다
  private async resolvePersona(
    personaId: string | null,
    authorization: string | undefined,
  ): Promise<UserPersonaPayload | null> {
    if (!personaId) return null;

    const [scheme, token] = authorization?.split(' ') ?? [];
    const userId = scheme === 'Bearer' && token ? await verifyToken(token) : null;
    if (!userId) {
      throw new UnauthorizedException('프로필 캐릭터를 쓰려면 로그인이 필요합니다.');
    }

    const { name, description } = await this.personasService.findOwned(
      userId,
      personaId,
    );
    return { name, description };
  }

  async send(
    characterId: string,
    userTurn: string,
    history: ChatTurn[],
    options: { personaId: string | null; authorization?: string },
  ) {
    // 발행 안 됐거나 없는 캐릭터면 여기서 NotFoundException을 던진다.
    const character = await this.charactersService.findOnePublished(characterId);
    const persona = await this.resolvePersona(
      options.personaId,
      options.authorization,
    );

    return postToAi<{ reply: string }>('/infer', {
      context: buildContextSlice(character, history, persona),
      userTurn,
    });
  }
}
