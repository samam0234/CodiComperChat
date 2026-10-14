import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';
import { verifyToken } from '../auth/token.js';
import { ChatStateService } from '../chat-state/chat-state.service.js';
import { CharactersService } from '../characters/characters.service.js';
import {
  ConversationsService,
  DISPLAY_MESSAGES,
  type LockedPersona,
} from '../conversations/conversations.service.js';
import { ExtrasService } from '../extras/extras.service.js';
import { MemoriesService } from '../memories/memories.service.js';
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
    private readonly memories: MemoriesService,
    private readonly chatState: ChatStateService,
    private readonly extras: ExtrasService,
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
    const userId = await this.resolveUser(options.authorization);
    // 발행 안 됐거나 없는 캐릭터, 남의 비공개 캐릭터면 여기서 NotFoundException을 던진다.
    const character = await this.charactersService.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    // 대화마다 프로필이 하나로 고정된다. 바꾸려면 새로하기로 새 대화를 시작한다
    let persona: LockedPersona;
    if (conversation?.persona) {
      if (conversation.persona.id !== options.personaId) {
        throw new ConflictException(
          `이 대화는 '${conversation.persona.name}' 프로필로 진행 중입니다. 프로필을 바꾸려면 새로하기로 시작하세요.`,
        );
      }
      // 프로필을 나중에 고치거나 지워도 이 대화에서는 처음 고른 그대로 쓴다
      persona = conversation.persona;
    } else {
      // 프로필은 로그인 유저의 것이어야 한다
      const owned = await this.personasService.findOwned(userId, options.personaId);
      persona = { id: owned.id, name: owned.name, description: owned.description };
    }
    const history: ChatTurn[] = conversation
      ? await this.conversations.recentTurns(conversation.sessionId)
      : [{ role: 'character', text: character.openingScene }];
    const chatState = conversation ? await this.chatState.get(conversation.campaignId) : null;
    return { character, userId, persona, conversation, history, chatState };
  }

  async history(characterId: string, authorization?: string) {
    const userId = await this.resolveUser(authorization);
    const character = await this.charactersService.findOnePublished(characterId, userId);
    const [conversation, savedCount] = await Promise.all([
      this.conversations.find(userId, characterId),
      this.conversations.savedCount(userId, characterId),
    ]);
    if (!conversation) {
      // 아직 대화 전이면 시작 장면만 보여 준다 (저장은 첫 메시지를 보낼 때)
      return {
        started: false,
        persona: null,
        savedCount,
        messages: [{ id: 'opening', role: 'character', text: character.openingScene, speaker: null }],
      };
    }
    return {
      started: true,
      persona: conversation.persona ? { id: conversation.persona.id, name: conversation.persona.name } : null,
      savedCount,
      messages: await this.conversations.messages(conversation.sessionId, DISPLAY_MESSAGES),
    };
  }

  // 새로하기: 지금 대화를 저장(save)하거나 지우고, 시작 장면부터 다시 연다
  async startNew(characterId: string, save: boolean, authorization?: string) {
    const userId = await this.resolveUser(authorization);
    await this.charactersService.findOnePublished(characterId, userId);
    const { saved } = await this.conversations.closeActive(userId, characterId, save);
    return { saved, ...(await this.history(characterId, authorization)) };
  }

  async listSaved(characterId: string, authorization?: string) {
    const userId = await this.resolveUser(authorization);
    const character = await this.charactersService.findOnePublished(characterId, userId);
    const [current, saved] = await Promise.all([
      this.conversations.find(userId, characterId),
      this.conversations.listSaved(userId, characterId),
    ]);
    // 이어하기 전에 지금 대화를 저장할지 물어야 하는지 화면이 알 수 있게
    const currentHasMessages = current ? (await this.conversations.messages(current.sessionId, 2)).length > 1 : false;
    return { character: { id: character.id, name: character.name }, currentHasMessages, saved };
  }

  // 이어하기: 저장한 대화를 지금 대화로. 지금 대화는 saveCurrent에 따라 저장하거나 지운다
  async resume(characterId: string, campaignId: string, saveCurrent: boolean, authorization?: string) {
    const userId = await this.resolveUser(authorization);
    await this.charactersService.findOnePublished(characterId, userId);
    await this.conversations.resume(userId, characterId, campaignId, saveCurrent);
    return this.history(characterId, authorization);
  }

  async removeSaved(characterId: string, campaignId: string, authorization?: string) {
    const userId = await this.resolveUser(authorization);
    await this.conversations.removeSaved(userId, characterId, campaignId);
  }

  private async memoriesFor(
    conversation: { campaignId: string } | null,
    history: ChatTurn[],
    message?: string,
  ) {
    if (!conversation) return [];
    const recent = history.slice(-2).map((t) => t.text);
    const query =
      message !== undefined
        ? { message, recent }
        : { message: history.at(-1)?.text ?? '', recent: recent.slice(0, -1) };
    return this.memories.forContext(conversation.campaignId, query);
  }

  async send(characterId: string, userTurn: string, options: PersonaOptions) {
    const { character, userId, persona, conversation: existing, history, chatState } = await this.prepare(
      characterId,
      options,
    );
    const rag = this.personaRag.assemble(character.name, history, userTurn);
    const memories = await this.memoriesFor(existing, history, userTurn);
    const extras = await this.extras.activeFor(existing, history, userTurn, character.name);

    const { reply } = await postToAi<{ reply: string }>('/infer', {
      context: buildContextSlice(character, history, persona, rag, memories, chatState, extras),
      userTurn,
    });

    // 답을 받은 뒤에만 저장한다 — 실패한 턴은 기록에 남지 않고, 유저는 같은 말을 다시 보낼 수 있다
    const conversation = await this.conversations.findOrCreate(userId, character, persona);
    await this.conversations.appendExchange(conversation, userTurn, persona.name, reply);
    // 대화가 충분히 쌓였으면 답을 돌려준 뒤 뒤에서 기억을 정리한다 (답 속도에 영향 없음)
    this.memories.memorizeInBackground(conversation, {
      characterName: character.name,
      userName: persona.name,
    });
    return { reply };
  }

  async suggest(characterId: string, avoid: string[], options: PersonaOptions) {
    const { character, persona, conversation, history, chatState } = await this.prepare(characterId, options);
    const rag = this.personaRag.assemble(character.name, history);
    const memories = await this.memoriesFor(conversation, history);
    // 대답 추천은 직전 캐릭터 말을 기준으로 엑스트라를 고른다
    const extras = await this.extras.activeFor(conversation, history.slice(0, -1), history.at(-1)?.text ?? '', character.name);
    return postToAi<{ suggestions: string[] }>('/suggest-replies', {
      context: buildContextSlice(character, history, persona, rag, memories, chatState, extras),
      avoid,
    });
  }
}
