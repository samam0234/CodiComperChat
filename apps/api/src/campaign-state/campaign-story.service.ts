import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MessageRole, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { postToAi } from '../ai/ai-client.js';
import { buildContextSlice } from '../character-chat/character-chat.context.js';
import type { ChatTurn } from '../character-chat/character-chat.types.js';
import { type ChatState, DEFAULT_STATE, relationshipLabel } from '../chat-state/chat-state.service.js';
import type { CharactersService } from '../characters/characters.service.js';
import type { Conversation } from '../conversations/conversations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { QuestCheck } from '../quests/quest.js';
import { QuestsService } from '../quests/quests.service.js';
import {
  EMPTY_STORY,
  type DigestResult,
  type Hook,
  type LogEntry,
  type StoryState,
  applyDigest,
} from './story-logic.js';

type PublicCharacter = Awaited<ReturnType<CharactersService['findOnePublished']>>;
type Names = { character: PublicCharacter; persona: { name: string; description: string } };

// 대화가 3번 오갈 때(메시지 6개)마다 이야기 상태를 정리한다 — 기억 정리와 같은 박자
export const DIGEST_EVERY_MESSAGES = 6;
const BATCH_MESSAGES = 12;

const STORY_SELECT = {
  relationshipValue: true,
  relationshipNote: true,
  userNickname: true,
  autoRelationship: true,
  relationshipReason: true,
  relationshipLog: true,
  openHooks: true,
  closedEvents: true,
  briefForNextSession: true,
  digestedUntil: true,
} as const;

type Row = Prisma.CampaignStateGetPayload<{ select: typeof STORY_SELECT }>;

const asArray = <T>(raw: unknown): T[] => (Array.isArray(raw) ? (raw as T[]) : []);

function toStory(row: Row | null): StoryState {
  if (!row) return EMPTY_STORY;
  return {
    brief: row.briefForNextSession ?? '',
    openHooks: asArray<Hook>(row.openHooks),
    closedEvents: asArray<string>(row.closedEvents),
    relationshipLog: asArray<LogEntry>(row.relationshipLog),
  };
}

// 캠페인 상태 기계 (기획서 §4.2 · §13.4): 지난 이야기 요약, 친밀도 자동 변화, 열린 복선·끝난 일.
// 모델이 돌려준 값은 story-logic이 폭과 개수를 제한해 반영한다
@Injectable()
export class CampaignStoryService {
  private readonly logger = new Logger(CampaignStoryService.name);
  // 같은 대화를 동시에 두 번 정리하지 않게 막는다 (한 프로세스 안에서)
  private readonly running = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly quests: QuestsService,
  ) {}

  async get(campaignId: string | null): Promise<StoryState> {
    if (!campaignId) return EMPTY_STORY;
    return toStory(await this.prisma.campaignState.findUnique({ where: { campaignId }, select: STORY_SELECT }));
  }

  // 화면용: 지난 이야기·열린 복선·끝난 일·친밀도 자동 변화 기록
  async view(conversation: Conversation | null) {
    const row = conversation
      ? await this.prisma.campaignState.findUnique({ where: { campaignId: conversation.campaignId }, select: STORY_SELECT })
      : null;
    const story = toStory(row);
    const value = row?.relationshipValue ?? DEFAULT_STATE.relationshipValue;
    return {
      started: conversation !== null,
      brief: story.brief,
      openHooks: story.openHooks,
      closedEvents: story.closedEvents,
      auto: row?.autoRelationship ?? true,
      relation: {
        value,
        label: relationshipLabel(value),
        reason: row?.relationshipReason ?? null,
        log: story.relationshipLog,
      },
    };
  }

  // 틀리게 잡힌 복선을 유저가 지운다
  async removeHook(campaignId: string, hookId: string): Promise<void> {
    const story = await this.get(campaignId);
    if (!story.openHooks.some((h) => h.id === hookId)) throw new NotFoundException('복선을 찾을 수 없습니다.');
    await this.prisma.campaignState.update({
      where: { campaignId },
      data: { openHooks: story.openHooks.filter((h) => h.id !== hookId) as unknown as Prisma.InputJsonValue },
    });
  }

  private async pending(conversation: Conversation, since: Date | null) {
    return this.prisma.message.findMany({
      where: {
        sessionId: conversation.sessionId,
        role: { in: [MessageRole.USER, MessageRole.CHARACTER] },
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { role: true, content: true, createdAt: true },
    });
  }

  // 밀린 메시지를 BATCH 단위로 반영한다. force면 개수가 모자라도 남은 것을 반영한다 (저장하고 새로하기 할 때)
  async digest(conversation: Conversation, names: Names, force = false): Promise<void> {
    if (this.running.has(conversation.campaignId)) return;
    this.running.add(conversation.campaignId);
    try {
      const threshold = force ? 2 : DIGEST_EVERY_MESSAGES;
      for (;;) {
        // 첫 정리 전이라 상태 행이 없을 수 있다
        const row = await this.prisma.campaignState.upsert({
          where: { campaignId: conversation.campaignId },
          create: { campaignId: conversation.campaignId },
          update: {},
          select: STORY_SELECT,
        });
        const pending = await this.pending(conversation, row.digestedUntil);
        if (pending.length < threshold) return;

        const batch = pending.slice(0, BATCH_MESSAGES);
        const until = batch[batch.length - 1].createdAt;
        const story = toStory(row);

        if (batch.some((m) => m.role === MessageRole.USER)) {
          const chatState: ChatState = {
            relationshipValue: row.relationshipValue,
            relationshipNote: row.relationshipNote,
            userNickname: row.userNickname,
            autoRelationship: row.autoRelationship,
          };
          const turns: ChatTurn[] = batch.map((m) => ({
            role: m.role === MessageRole.USER ? 'user' : 'character',
            text: m.content,
          }));
          const context = buildContextSlice(names.character, [], names.persona, null, [], chatState, [], [], story);
          // 이전 요약을 "지금까지의 이야기"로 넘겨 거기에 이번 대화를 합쳐 새 요약을 쓰게 한다
          context.storySoFar = story.brief || null;
          // 뒤에서 하는 정리라 사용자가 기다리는 답에 양보한다 (ai-queue)
          // 비밀 퀘스트: 열려 있고 아직 달성 전이면 "건넸나·해냈나"도 함께 판정시킨다 (친밀도는 이 정리 전의 값 기준)
          const quest = await this.quests.checkInput(names.character.id, conversation.campaignId, row.relationshipValue);
          const result = await postToAi<DigestResult & { questOffered?: boolean; questDone?: boolean }>(
            '/summarize',
            { context, sessionTurns: turns, ...(quest ? { quest } : {}) },
            { priority: 'background' },
          );

          // 응답을 기다리는 사이 유저가 친밀도를 직접 바꿨을 수 있어, 반영 직전에 다시 읽는다
          const fresh = await this.prisma.campaignState.findUnique({ where: { campaignId: conversation.campaignId }, select: STORY_SELECT });
          const base = toStory(fresh);
          const applied = applyDigest(
            base,
            fresh?.relationshipValue ?? row.relationshipValue,
            fresh?.autoRelationship ?? row.autoRelationship,
            result,
            new Date(),
            () => `h${randomBytes(4).toString('hex')}`,
          );
          await this.prisma.campaignState.update({
            where: { campaignId: conversation.campaignId },
            data: {
              relationshipValue: applied.relationshipValue,
              ...(applied.relationshipReason !== null ? { relationshipReason: applied.relationshipReason } : {}),
              relationshipLog: applied.story.relationshipLog as unknown as Prisma.InputJsonValue,
              openHooks: applied.story.openHooks as unknown as Prisma.InputJsonValue,
              closedEvents: applied.story.closedEvents as unknown as Prisma.InputJsonValue,
              briefForNextSession: applied.story.brief || null,
              digestedUntil: until,
            },
          });
          if (quest) {
            const check: QuestCheck = { offered: result.questOffered === true, done: result.questDone === true };
            await this.quests.apply(names.character.id, conversation.campaignId, row.relationshipValue, check);
          }
        } else {
          await this.prisma.campaignState.update({ where: { campaignId: conversation.campaignId }, data: { digestedUntil: until } });
        }
      }
    } finally {
      this.running.delete(conversation.campaignId);
    }
  }

  // 답을 돌려준 뒤 뒤에서 조용히 반영한다 — 실패해도 대화는 멈추지 않고 다음 기회에 다시 한다
  digestInBackground(conversation: Conversation, names: Names, force = false): void {
    this.digest(conversation, names, force).catch((error: unknown) => {
      this.logger.warn(`이야기 상태 정리 실패 (다음에 다시 시도): ${(error as Error).message}`);
    });
  }
}
