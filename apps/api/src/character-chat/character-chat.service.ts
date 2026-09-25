import { Injectable, UnauthorizedException } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';
import { verifyToken } from '../auth/token.js';
import { CharactersService } from '../characters/characters.service.js';
import { PersonasService } from '../personas/personas.service.js';
import { buildContextSlice } from './character-chat.context.js';
import type { ChatTurn, UserPersonaPayload } from './character-chat.types.js';

type PersonaOptions = { personaId: string; authorization?: string };

@Injectable()
export class CharacterChatService {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly personasService: PersonasService,
  ) {}

  // 프로필은 로그인 유저의 것이다 — 토큰으로 유저를 확인하고, 그 유저의 프로필인지 본다
  private async resolvePersona({
    personaId,
    authorization,
  }: PersonaOptions): Promise<UserPersonaPayload> {
    const [scheme, token] = authorization?.split(' ') ?? [];
    const userId = scheme === 'Bearer' && token ? await verifyToken(token) : null;
    if (!userId) {
      throw new UnauthorizedException('캐릭터와 대화하려면 로그인이 필요합니다.');
    }

    const { name, description } = await this.personasService.findOwned(
      userId,
      personaId,
    );
    return { name, description };
  }

  private async buildContext(
    characterId: string,
    history: ChatTurn[],
    options: PersonaOptions,
  ) {
    // 발행 안 됐거나 없는 캐릭터면 여기서 NotFoundException을 던진다.
    const character = await this.charactersService.findOnePublished(characterId);
    const persona = await this.resolvePersona(options);
    return buildContextSlice(character, history, persona);
  }

  async send(
    characterId: string,
    userTurn: string,
    history: ChatTurn[],
    options: PersonaOptions,
  ) {
    return postToAi<{ reply: string }>('/infer', {
      context: await this.buildContext(characterId, history, options),
      userTurn,
    });
  }

  async suggest(
    characterId: string,
    history: ChatTurn[],
    avoid: string[],
    options: PersonaOptions,
  ) {
    return postToAi<{ suggestions: string[] }>('/suggest-replies', {
      context: await this.buildContext(characterId, history, options),
      avoid,
    });
  }
}
