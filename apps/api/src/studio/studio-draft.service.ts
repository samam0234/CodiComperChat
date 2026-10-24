import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';
import { buildSheet, draftSpec, normalizeDraft } from './draft-fields.js';
import { QUEST_TITLE_MAX, type Quest } from '../quests/quest.js';
import { StudioService } from './studio.service.js';

// "이 칸만 AI로 초안" (기획서 §6.1). 제안만 돌려주고 카드는 건드리지 않는다 — 유저가 보고 적용을 누른다.
// 비밀·해금 조건은 설정 줄에 넣지 않으므로 FastAPI로 나가지 않는다 (§7.8)
@Injectable()
export class StudioDraftService {
  constructor(private readonly studio: StudioService) {}

  async draftField(ownerId: string, id: string, field: unknown) {
    const spec = draftSpec(field);
    const { card } = await this.studio.findOwned(ownerId, id);
    const current = spec.read(card);

    const raw = await postToAi<{ text: string; items: string[] }>('/draft-field', {
      sheet: buildSheet(card, spec.key),
      label: spec.label,
      guide: spec.guide,
      kind: spec.kind,
      maxChars: spec.max,
      maxItems: spec.maxItems,
      current: Array.isArray(current) ? current.join('\n') : current,
    });
    return { field: spec.key, kind: spec.kind, value: normalizeDraft(spec, raw) };
  }

  // 비밀 퀘스트를 한 번에 AI로 만든다 (카드의 지금 설정을 읽고). 제안만 돌려주고 저장하지 않는다.
  // 비밀·해금 조건은 설정 줄에 들어가지 않으므로 AI로 나가지 않는다. 길이는 카드 칸 상한(400)에 맞춘다
  async draftQuest(ownerId: string, id: string): Promise<Quest> {
    const { card } = await this.studio.findOwned(ownerId, id);
    const sheet = buildSheet(card, 'quest.title').filter((line) => !line.startsWith('퀘스트'));
    if (sheet.length < 3) {
      throw new BadRequestException('캐릭터 설정을 조금 더 채운 뒤에 퀘스트를 만들 수 있어요(이름·성격·목표 등).');
    }
    const raw = await postToAi<Partial<Quest>>('/draft-quest', { sheet, maxChars: 400, titleMax: QUEST_TITLE_MAX });
    const clamp = (v: unknown, max: number) => (typeof v === 'string' ? v.replaceAll('**', '').trim().slice(0, max) : '');
    const unlockAt = typeof raw.unlockAt === 'number' && Number.isFinite(raw.unlockAt) ? Math.max(10, Math.min(90, Math.round(raw.unlockAt))) : 40;
    const quest: Quest = {
      title: clamp(raw.title, QUEST_TITLE_MAX),
      offer: clamp(raw.offer, 400),
      objective: clamp(raw.objective, 400),
      reward: clamp(raw.reward, 400),
      unlockAt,
    };
    if (!quest.title || !quest.offer || !quest.objective) {
      throw new BadGatewayException('AI가 퀘스트를 만들지 못했어요. 다시 시도해 주세요.');
    }
    return quest;
  }
}
