import { Injectable, UnauthorizedException } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';
import { verifyToken } from '../auth/token.js';
import { CharactersService } from '../characters/characters.service.js';
import {
  ConversationsService,
  DISPLAY_MESSAGES,
} from '../conversations/conversations.service.js';
import { PersonaRagService } from '../persona-rag/persona-rag.service.js';
import { PersonasService } from '../personas/personas.service.js';
import { buildContextSlice } from './character-chat.context.js';
import type { ChatTurn } from './character-chat.types.js';

type PersonaOptions = { personaId: string; authorization?: string };

@Injectable()
export class CharacterChatService {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly personasService: PersonasService,
    private readonly personaRag: PersonaRagService,
    private readonly conversations: ConversationsService,
  ) {}

  private async resolveUser(authorization: string | undefined): Promise<string> {
    const [scheme, token] = authorization?.split(' ') ?? [];
    const userId = scheme === 'Bearer' && token ? await verifyToken(token) : null;
    if (!userId) {
      throw new UnauthorizedException('캐릭터와 대화하려면 로그인이 필요합니다.');
    }
    return userId;
  }

  // 대화 맥락은 브라우저가 보낸 기록이 아니라 서버에 저장된 기록으로 만든다 (조작·유실 방지)
  private async prepare(characterId: string, options: PersonaOptions) {
    // 발행 안 됐거나 없는 캐릭터면 여기서 NotFoundException을 던진다.
    const character = await this.charactersService.findOnePublished(characterId);
    const userId = await this.resolveUser(options.authorization);
    // 프로필은 로그인 유저의 것이어야 한다
    const { name, description } = await this.personasService.findOwned(userId, options.personaId);
    const conversation = await this.conversations.find(userId, characterId);
    const history: ChatTurn[] = conversation
      ? await this.conversations.recentTurns(conversation.sessionId)
      : [{ role: 'character', text: character.openingScene }];
    return { character, userId, persona: { name, description }, conversation, history };
  }

  async history(characterId: string, authorization?: string) {
    const character = await this.charactersService.findOnePublished(characterId);
    const userId = await this.resolveUser(authorization);
    const conversation = await this.conversations.find(userId, characterId);
    if (!conversation) {
      // 아직 대화 전이면 시작 장면만 보여 준다 (저장은 첫 메시지를 보낼 때)
      return {
        started: false,
        messages: [{ id: 'opening', role: 'character', text: character.openingScene, speaker: null }],
      };
    }
    return {
      started: true,
      messages: await this.conversations.messages(conversation.sessionId, DISPLAY_MESSAGES),
    };
  }

  async send(characterId: string, userTurn: string, options: PersonaOptions) {
    const { character, userId, persona, history } = await this.prepare(characterId, options);
    const rag = this.personaRag.assemble(character.name, history, userTurn);

    const { reply } = await postToAi<{ reply: string }>('/infer', {
      context: buildContextSlice(character, history, persona, rag),
      userTurn,
    });

    // 답을 받은 뒤에만 저장한다 — 실패한 턴은 기록에 남지 않고, 유저는 같은 말을 다시 보낼 수 있다
    const conversation = await this.conversations.findOrCreate(userId, character);
    await this.conversations.appendExchange(conversation, userTurn, persona.name, reply);
    return { reply };
  }

  async suggest(characterId: string, avoid: string[], options: PersonaOptions) {
    const { character, persona, history } = await this.prepare(characterId, options);
    const rag = this.personaRag.assemble(character.name, history);
    return postToAi<{ suggestions: string[] }>('/suggest-replies', {
      context: buildContextSlice(character, history, persona, rag),
      avoid,
    });
  }
}
