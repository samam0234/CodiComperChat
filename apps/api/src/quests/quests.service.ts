import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { readSession } from '../auth/session.js';
import { CharactersService } from '../characters/characters.service.js';
import { ConversationsService } from '../conversations/conversations.service.js';
import { CreditsService } from '../credits/credits.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  QUEST_REWARD_CREDITS,
  nextQuestState,
  parseQuest,
  parseQuestState,
  questNote,
  stage,
  unlocked,
  type Quest,
  type QuestCheck,
  type QuestState,
} from './quest.js';

// 비밀 퀘스트: 캐릭터의 퀘스트 정의(Character.quest)와 대화별 진행(CampaignState.questState)을 잇는다.
// 퀘스트 정의는 공개 캐릭터 응답에 싣지 않고 이 서비스만 읽는다 (달성 조건이 알려지면 의미가 없다)
@Injectable()
export class QuestsService {
  private readonly logger = new Logger(QuestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
    private readonly characters: CharactersService,
    private readonly conversations: ConversationsService,
  ) {}

  private async questOf(characterId: string): Promise<{ quest: Quest | null; official: boolean }> {
    const row = await this.prisma.character.findUnique({ where: { id: characterId }, select: { quest: true, ownerId: true } });
    return { quest: row ? parseQuest(row.quest) : null, official: row?.ownerId === null };
  }

  private async stateOf(campaignId: string): Promise<QuestState> {
    const row = await this.prisma.campaignState.findUnique({ where: { campaignId }, select: { questState: true } });
    return parseQuestState(row?.questState);
  }

  private save(campaignId: string, state: QuestState) {
    const data = { questState: state === null ? Prisma.DbNull : (state as unknown as Prisma.InputJsonValue) };
    return this.prisma.campaignState.upsert({ where: { campaignId }, create: { campaignId, ...data }, update: data });
  }

  // 이번 답에 캐릭터에게 줄 지시. 퀘스트가 없거나 아직 때가 아니면 null.
  // 달성 직후의 보상 장면은 한 번만 보이도록, 지시를 만드는 순간 "보였다"고 표시한다
  async noteFor(characterId: string, campaignId: string | null, relationshipValue: number): Promise<string | null> {
    if (!campaignId) return null;
    const { quest } = await this.questOf(characterId);
    if (!quest) return null;
    const state = await this.stateOf(campaignId);
    const note = questNote(quest, relationshipValue, state);
    if (note && state?.status === 'done' && !state.staged) await this.save(campaignId, stage(state));
    return note;
  }

  // 이야기 정리(FastAPI /summarize)에 함께 보낼 퀘스트 정보. 아직 열리지 않았거나 이미 달성했으면 null
  async checkInput(characterId: string, campaignId: string, valueBefore: number) {
    const { quest } = await this.questOf(characterId);
    if (!quest) return null;
    const state = await this.stateOf(campaignId);
    if (state?.status === 'done' || !unlocked(quest, valueBefore)) return null;
    return { offer: quest.offer, objective: quest.objective, offered: state?.status === 'offered' };
  }

  // 판정 결과를 반영한다. 처음 달성했고 공식 캐릭터면 코레딧 보상(계정×캐릭터당 한 번)
  async apply(characterId: string, campaignId: string, valueBefore: number, check: QuestCheck): Promise<void> {
    const { quest, official } = await this.questOf(characterId);
    if (!quest) return;
    const state = await this.stateOf(campaignId);
    const next = nextQuestState(quest, state, valueBefore, check, new Date());
    if (next.state === state) return;
    await this.save(campaignId, next.state);
    if (next.completedNow && official) {
      const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId }, select: { userId: true } });
      if (!campaign) return;
      const balance = await this.credits.grantQuestReward(campaign.userId, characterId, QUEST_REWARD_CREDITS);
      this.logger.log(`비밀 퀘스트 달성 character=${characterId} reward=${balance === null ? '이미 받음' : QUEST_REWARD_CREDITS}`);
    }
  }

  // 화면용. 아직 건네지 않았으면 퀘스트가 있다는 사실과 "잠김"만 알린다(제목·내용은 건넨 뒤에).
  // 보상 장면은 달성한 뒤에만 보인다
  async view(characterId: string, authorization?: string) {
    const userId = await readSession(this.prisma, authorization);
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    await this.characters.findOnePublished(characterId, userId);
    const { quest, official } = await this.questOf(characterId);
    if (!quest) return { exists: false as const };
    const conversation = await this.conversations.find(userId, characterId);
    const state = conversation ? await this.stateOf(conversation.campaignId) : null;
    const rewarded = official ? (await this.prisma.questReward.count({ where: { userId, characterId } })) > 0 : false;
    const base = { exists: true as const, started: conversation !== null, credits: official ? QUEST_REWARD_CREDITS : 0, rewarded };
    if (!state) return { ...base, status: 'locked' as const };
    return {
      ...base,
      status: state.status,
      title: quest.title,
      offer: quest.offer,
      objective: quest.objective,
      reward: state.status === 'done' ? quest.reward : null,
    };
  }
}
