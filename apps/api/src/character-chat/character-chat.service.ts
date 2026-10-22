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
  type Conversation,
  type LockedPersona,
} from '../conversations/conversations.service.js';
import { ExtrasService } from '../extras/extras.service.js';
import { MemoriesService } from '../memories/memories.service.js';
import { DEFAULT_MODEL_ID, findModel } from '../models/models.js';
import { ModelsService, type Ticket } from '../models/models.service.js';
import { PersonaRagService } from '../persona-rag/persona-rag.service.js';
import { PersonasService } from '../personas/personas.service.js';
import { buildContextSlice } from './character-chat.context.js';
import { groundingFacts, groundingText, keepGrounded, ungroundedTopics } from './grounding.js';
import type { ChatTurn } from './character-chat.types.js';

type PersonaOptions = { personaId: string; authorization?: string };
type SendOptions = PersonaOptions & { model?: string };
type Prepared = Awaited<ReturnType<CharacterChatService['prepare']>>;

// /계속: 유저가 말하지 않았다는 장면 지시. 괄호 속 말은 유저의 장면 지시로 읽게 해 두었다 (services/ai inference.py)
const CONTINUE_TURN = '(아무 말 없이 기다린다. 방금 장면에서 자연스럽게 이어서 계속해 줘)';

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

  // 오퍼레이션(심리 탐구·일기·메시지·커뮤니티)이 쓰는 대화 맥락.
  // 진행 중인 대화가 있어야 한다 — 고정된 내 프로필·기억·상태설정·이야기 상태를 그대로 쓴다.
  // history를 주면(메시지 창의 문자 기록 등) 그것을 최근 대화로 쓴다
  async operationContext(characterId: string, authorization?: string, history?: ChatTurn[]) {
    const userId = await this.resolveUser(authorization);
    const character = await this.charactersService.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    if (!conversation?.persona) {
      throw new ConflictException('먼저 이 캐릭터와 대화를 시작해 주세요. 오퍼레이션은 진행 중인 대화를 바탕으로 해요.');
    }
    const turns = history ?? (await this.conversations.recentTurns(conversation.sessionId));
    const [chatState, story, memories] = await Promise.all([
      this.chatState.get(conversation.campaignId),
      this.story.get(conversation.campaignId),
      this.memoriesFor(conversation, turns),
    ]);
    const rag = this.personaRag.assemble(character.name, turns);
    const context = buildContextSlice(character, turns, conversation.persona, rag, memories, chatState, [], [], story);
    return { userId, character, conversation, persona: conversation.persona, context };
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

  // 캐릭터 답 한 번: 모델 고르기 → 횟수·코레딧 잡기 → 답 만들기 (못 만들면 잡은 것을 돌려준다).
  // 보내기·다시 쓰기(/다시)·이어 가기(/계속)가 같이 쓴다. 저장은 부르는 쪽이 한다
  private async compose(prep: Prepared, userTurn: string, requested: string | undefined) {
    const { character, userId, persona, conversation: existing, history, chatState, story } = prep;
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
    // 모델: 이번에 고른 것 > 이 대화에 저장된 것 > 기본. 고른 것이 안 되면(한도 소진·코레딧 부족·준비 중) 이유와 함께 거절한다
    const model = requested
      ? await this.models.authorize(userId, requested)
      : await this.models.usableOrDefault(userId, existing?.chatModel ?? DEFAULT_MODEL_ID);
    const ticket = await this.models.reserve(userId, model);
    try {
      const first = await postToAi<{ reply: string }>('/infer', { context, userTurn, model: model.runtime });
      // 설정에 없는 개인사를 물었을 때만, 답이 그것을 지어냈는지 한 번 더 확인한다
      const reply = await keepGrounded(context, userTurn, first.reply, groundingFacts(grounding), model.runtime);
      return { reply, ticket };
    } catch (error) {
      await this.models.release(userId, ticket);
      throw error;
    }
  }

  // 답을 저장한 뒤: 대화가 충분히 쌓였으면 뒤에서 기억·이야기 상태(지난 이야기 요약·친밀도·복선)를 정리한다 (답 속도에 영향 없음)
  private async finish(prep: Prepared, conversation: Conversation, reply: string, ticket: Ticket) {
    const { character, persona, userId } = prep;
    this.memories.memorizeInBackground(conversation, { characterName: character.name, userName: persona.name });
    this.story.digestInBackground(conversation, { character, persona });
    return { reply, model: ticket.model.id, ...(await this.models.usage(userId, ticket)) };
  }

  async send(characterId: string, userTurn: string, options: SendOptions) {
    const prep = await this.prepare(characterId, options);
    const { reply, ticket } = await this.compose(prep, userTurn, options.model);
    // 답을 받은 뒤에만 저장한다 — 실패한 턴은 기록에 남지 않고, 유저는 같은 말을 다시 보낼 수 있다
    const conversation = await this.conversations.findOrCreate(prep.userId, prep.character, prep.persona, ticket.model.id);
    await this.conversations.appendExchange(conversation, userTurn, prep.persona.name, reply);
    return this.finish(prep, conversation, reply, ticket);
  }

  // /다시: 마지막 내 말에 대한 답을 새로 쓴다 (이전 답은 지운다)
  async regenerate(characterId: string, options: SendOptions) {
    const prep = await this.prepare(characterId, options);
    const last = prep.conversation ? await this.conversations.lastExchange(prep.conversation.sessionId) : null;
    if (!prep.conversation || !last) throw new ConflictException('다시 쓸 답이 없어요. 먼저 말을 걸어 주세요.');
    // 맥락에서는 마지막 내 말과 그 뒤 답을 빼고, 내 말을 이번 말로 다시 넣는다
    const history = prep.history.slice(0, Math.max(0, prep.history.length - 1 - last.replyIds.length));
    const { reply, ticket } = await this.compose({ ...prep, history }, last.userText, options.model);
    const conversation = await this.conversations.findOrCreate(prep.userId, prep.character, prep.persona, ticket.model.id);
    await this.conversations.replaceReplies(conversation, last.replyIds, reply);
    return this.finish(prep, conversation, reply, ticket);
  }

  // /계속: 내가 말하지 않고 캐릭터가 장면을 이어 간다
  async continueScene(characterId: string, options: SendOptions) {
    const prep = await this.prepare(characterId, options);
    if (!prep.conversation) throw new ConflictException('먼저 말을 걸어 주세요. 이어 갈 장면이 없어요.');
    const { reply, ticket } = await this.compose(prep, CONTINUE_TURN, options.model);
    const conversation = await this.conversations.findOrCreate(prep.userId, prep.character, prep.persona, ticket.model.id);
    await this.conversations.appendReply(conversation, reply);
    return this.finish(prep, conversation, reply, ticket);
  }

  // /되돌리기: 마지막 내 말과 그 뒤의 답을 지운다. 이미 정리된 기억은 그대로 둔다
  async undo(characterId: string, authorization?: string) {
    const userId = await this.resolveUser(authorization);
    await this.charactersService.findOnePublished(characterId, userId);
    const conversation = await this.conversations.find(userId, characterId);
    const removed = conversation ? await this.conversations.undoLast(conversation) : 0;
    if (removed === 0) throw new ConflictException('되돌릴 대화가 없어요.');
    return { removed, ...(await this.history(characterId, authorization)) };
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
