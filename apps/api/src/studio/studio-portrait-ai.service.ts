import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CreditReason } from '@prisma/client';
import { getFromAi, postToAi } from '../ai/ai-client.js';
import { OPERATION_COSTS, OPERATION_LABELS } from '../credits/credits.js';
import { CreditsService } from '../credits/credits.service.js';
import { PORTRAIT_MAX_BYTES } from './portrait.js';
import { StudioService } from './studio.service.js';

// 공방 외형 단계의 "AI로 직접 만들기" (2026-10-25 사용자 요청, 한 장 25 코레딧).
// 화풍 4가지 중 하나와 생김새를 고르면 그림 엔진이 흉상을 그리고, 그 그림을 올린 그림과 똑같이
// 초상 자동 검수(PortraitReviewService)를 거쳐 저장한다. 못 그리거나 검수에서 막히면 코레딧을 돌려준다.
// 남에게 보이는 초상이라 전체 이용가로만 그린다
export const PORTRAIT_STYLES = ['애니메이션', '웹툰', '수채화', '실사풍'] as const;
export const PORTRAIT_OPTIONS = {
  gender: ['female', 'male', 'other'],
  age: ['20s', '30s', '40s', '50s'],
  hairColor: ['black', 'brown', 'blonde', 'silver', 'red', 'blue', 'pink', 'white'],
  hairStyle: ['short', 'bob', 'long', 'ponytail', 'wavy', 'updo'],
  eyeColor: ['black', 'brown', 'blue', 'green', 'red', 'purple', 'gold'],
  outfit: ['casual', 'suit', 'knit', 'dress', 'armor', 'robe', 'hanbok', 'sports'],
  expression: ['smile', 'calm', 'cold', 'shy', 'playful', 'serious'],
  background: ['plain', 'indoor', 'outdoor', 'city', 'fantasy'],
} as const;
export const PORTRAIT_EXTRA_MAX = 100;

type OptionKey = keyof typeof PORTRAIT_OPTIONS;
export type PortraitAiInput = {
  style: (typeof PORTRAIT_STYLES)[number];
  options: { [K in OptionKey]: (typeof PORTRAIT_OPTIONS)[K][number] };
  extra: string;
  useCard: boolean;
};

const ENGINE_STATUS_TIMEOUT_MS = 3000;
// 화풍 계열을 바꾸면 처음 한 번은 모델을 다시 읽느라 오래 걸린다 (코디포토넷과 같다)
const PORTRAIT_TIMEOUT_MS = 300_000;

export function parsePortraitAi(body: unknown): PortraitAiInput {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  if (!(PORTRAIT_STYLES as readonly unknown[]).includes(b.style)) throw new BadRequestException('알 수 없는 화풍입니다.');
  const raw = (typeof b.options === 'object' && b.options !== null ? b.options : {}) as Record<string, unknown>;
  const options = {} as Record<OptionKey, string>;
  for (const key of Object.keys(PORTRAIT_OPTIONS) as OptionKey[]) {
    const value = raw[key];
    if (!(PORTRAIT_OPTIONS[key] as readonly unknown[]).includes(value)) {
      throw new BadRequestException(`고를 수 없는 값입니다: ${key}`);
    }
    options[key] = value as string;
  }
  const extra = typeof b.extra === 'string' ? b.extra.trim() : '';
  if (extra.length > PORTRAIT_EXTRA_MAX) throw new BadRequestException(`추가 설명은 ${PORTRAIT_EXTRA_MAX}자 이하로 적어 주세요.`);
  return { style: b.style as PortraitAiInput['style'], options: options as PortraitAiInput['options'], extra, useCard: b.useCard !== false };
}

@Injectable()
export class StudioPortraitAiService {
  constructor(
    private readonly studio: StudioService,
    private readonly credits: CreditsService,
  ) {}

  private async engineReady(): Promise<boolean> {
    try {
      return (await getFromAi<{ ready: boolean }>('/photonet/status', ENGINE_STATUS_TIMEOUT_MS)).ready === true;
    } catch {
      return false;
    }
  }

  async generate(ownerId: string, id: string, input: PortraitAiInput) {
    const { card } = await this.studio.findOwned(ownerId, id);
    // 엔진이 꺼져 있으면 코레딧을 빼기 전에 막는다
    if (!(await this.engineReady())) {
      throw new ServiceUnavailableException('그림 엔진이 꺼져 있어 지금은 만들 수 없어요. 코레딧은 빠지지 않았어요.');
    }
    // 카드의 외형 서술·분위기 키워드(비밀은 넣지 않는다)
    const appearance = input.useCard
      ? [card.appearance.description, card.appearance.keywords.join(', ')].filter(Boolean).join(' / ').slice(0, 1000)
      : '';
    const cost = OPERATION_COSTS.portraitAi;
    await this.credits.spend(ownerId, cost, 'op:portraitAi', OPERATION_LABELS.portraitAi, CreditReason.OPERATION);
    try {
      const raw = await postToAi<{ image: string; mime: 'image/webp' }>(
        '/portrait',
        { style: input.style, options: input.options, appearance, extra: input.extra, maxBytes: PORTRAIT_MAX_BYTES },
        { timeoutMs: PORTRAIT_TIMEOUT_MS },
      );
      // 올린 그림과 같은 길로: 초상 자동 검수 → 저장 (명백히 안 되면 여기서 400 → 환불)
      const draft = await this.studio.setPortrait(ownerId, id, { data: Buffer.from(raw.image, 'base64'), mime: raw.mime });
      return { draft, balance: await this.credits.balance(ownerId), cost };
    } catch (error) {
      await this.credits.refund(ownerId, cost, 'op:portraitAi');
      throw error;
    }
  }
}
