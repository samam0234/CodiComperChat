import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';
import { readSession } from '../auth/session.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CampaignStoryService } from '../campaign-state/campaign-story.service.js';
import { ChatStateService } from '../chat-state/chat-state.service.js';
import { CharactersService } from '../characters/characters.service.js';
import {
  ConversationsService,
  DISPLAY_MESSAGES,
  type LockedPersona,
} from '../conversations/conversations.service.js';
import { ExtrasService } from '../extras/extras.service.js';
import { MemoriesService } from '../memories/memories.service.js';
import { DEFAULT_MODEL_ID, findModel } from '../models/models.js';
import { ModelsService } from '../models/models.service.js';
import { PersonaRagService } from '../persona-rag/persona-rag.service.js';
import { PersonasService } from '../personas/personas.service.js';
import { buildContextSlice } from './character-chat.context.js';
import { groundingFacts, groundingText, keepGrounded, ungroundedTopics } from './grounding.js';
import type { ChatTurn } from './character-chat.types.js';

type PersonaOptions = { personaId: string; authorization?: string };
type SendOptions = PersonaOptions & { model?: string };

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
    private readonly story: CampaignStoryService,
    private readonly models: ModelsService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveUser(authorization: string | undefined): Promise<string> {
    const userId = await readSession(this.prisma, authorization);
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
    const story = conversation ? await this.story.get(conversation.campaignId) : null;
    return { character, userId, persona, conversation, history, chatState, story };
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
        model: DEFAULT_MODEL_ID,
        persona: null,
        savedCount,
        messages: [{ id: 'opening', role: 'character', text: character.openingScene, speaker: null }],
      };
    }
    return {
      started: true,
      model: findModel(conversation.chatModel) ? conversation.chatModel : DEFAULT_MODEL_ID,
      persona: conversation.persona ? { id: conversation.persona.id, name: conversation.persona.name } : null,
      savedCount,
      messages: await this.conversations.messages(conversation.sessionId, DISPLAY_MESSAGES),
    };
  }

  // 새로하기: 지금 대화를 저장(save)하거나 지우고, 시작 장면부터 다시 연다
  async startNew(characterId: string, save: boolean, authorization?: string) {
    const userId = await this.resolveUser(authorization);
    await this.charactersService.findOnePublished(characterId, userId);
    const active = save ? await this.conversations.find(userId, characterId) : null;
    const { saved } = await this.conversations.closeActive(userId, characterId, save);
    if (saved && active?.persona) {
      const character = await this.charactersService.findOnePublished(characterId, userId);
      this.story.digestInBackground(active, { character, persona: active.persona }, true);
    }
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

  async send(characterId: string, userTurn: string, options: SendOptions) {
    const { character, userId, persona, conversation: existing, history, chatState, story } = await this.prepare(
      characterId,
      options,
    );
    const rag = this.personaRag.assemble(character.name, history, userTurn);
    const memories = await this.memoriesFor(existing, history, userTurn);
    const extras = await this.extras.activeFor(existing, history, userTurn, character.name);

    const grounding = groundingText(this.personaRag.knowledgeFor(character.name), character);
    const context = buildContextSlice(
      character,
      history,
      persona,
      rag,
      memories,
      chatState,
      extras,
      ungroundedTopics(userTurn, grounding),
      story,
    );
    // 모델: 이번에 고른 것 > 이 대화에 저장된 것 > 기본. 고른 것이 안 되면(프로 아님·한도 초과) 이유와 함께 거절한다
    const model = options.model
      ? await this.models.authorize(userId, options.model)
      : await this.models.usableOrDefault(userId, existing?.chatModel ?? DEFAULT_MODEL_ID);
    // 하루 한도가 있는 모델이면 답을 만들기 전에 1번을 잡고, 못 만들면 돌려준다
    await this.models.reserve(userId, model);
    let reply: string;
    try {
      const first = await postToAi<{ reply: string }>('/infer', { context, userTurn, model: model.runtime });
      // 설정에 없는 개인사를 물었을 때만, 답이 그것을 지어냈는지 한 번 더 확인한다
      reply = await keepGrounded(context, userTurn, first.reply, groundingFacts(grounding), model.runtime);
    } catch (error) {
      await this.models.release(userId, model);
      throw error;
    }

    // 답을 받은 뒤에만 저장한다 — 실패한 턴은 기록에 남지 않고, 유저는 같은 말을 다시 보낼 수 있다
    const conversation = await this.conversations.findOrCreate(userId, character, persona, model.id);
    await this.conversations.appendExchange(conversation, userTurn, persona.name, reply);
    // 대화가 충분히 쌓였으면 답을 돌려준 뒤 뒤에서 기억을 정리한다 (답 속도에 영향 없음)
    this.memories.memorizeInBackground(conversation, {
      characterName: character.name,
      userName: persona.name,
    });
    // 같은 박자로 이야기 상태(지난 이야기 요약·친밀도 자동 변화·복선)도 뒤에서 정리한다
    this.story.digestInBackground(conversation, { character, persona });
    return { reply, model: model.id, usage: await this.models.usage(userId, model) };
  }

  async suggest(characterId: string, avoid: string[], options: PersonaOptions) {
    const { character, persona, conversation, history, chatState, story } = await this.prepare(characterId, options);
    const rag = this.personaRag.assemble(character.name, history);
    const memories = await this.memoriesFor(conversation, history);
    // 대답 추천은 직전 캐릭터 말을 기준으로 엑스트라를 고른다
    const extras = await this.extras.activeFor(conversation, history.slice(0, -1), history.at(-1)?.text ?? '', character.name);
    return postToAi<{ suggestions: string[] }>('/suggest-replies', {
      context: buildContextSlice(character, history, persona, rag, memories, chatState, extras, [], story),
      avoid,
    });
  }
}
