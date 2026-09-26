import { BadRequestException, Injectable } from '@nestjs/common';
import type { Conversation } from '../conversations/conversations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const RELATIONSHIP_MIN = 0;
export const RELATIONSHIP_MAX = 100;
export const NOTE_MAX = 200;
export const NICKNAME_MAX = 20;

export type ChatState = {
  relationshipValue: number;
  relationshipNote: string | null;
  userNickname: string | null;
};

export const DEFAULT_STATE: ChatState = {
  relationshipValue: 0,
  relationshipNote: null,
  userNickname: null,
};

// 숫자만 넘기면 모델이 의미를 모른다. 구간마다 이름을 붙여 함께 넘긴다 (웹 화면도 같은 구간을 쓴다)
export function relationshipLabel(value: number): string {
  if (value >= 80) return '각별한 사이';
  if (value >= 60) return '가까운 사이';
  if (value >= 40) return '편한 사이';
  if (value >= 20) return '알아 가는 중';
  return '처음 만난 사이';
}

// 보낸 필드만 바꾼다. 빈 문자열은 "지우기"(null)로 본다
export function parseStatePatch(body: unknown): Partial<ChatState> {
  const data = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const patch: Partial<ChatState> = {};

  if (data.relationshipValue !== undefined) {
    const value = data.relationshipValue;
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < RELATIONSHIP_MIN ||
      value > RELATIONSHIP_MAX
    ) {
      throw new BadRequestException(
        `친밀도는 ${RELATIONSHIP_MIN}~${RELATIONSHIP_MAX} 사이의 정수여야 합니다.`,
      );
    }
    patch.relationshipValue = value;
  }

  for (const [key, max, label] of [
    ['relationshipNote', NOTE_MAX, '관계 메모'],
    ['userNickname', NICKNAME_MAX, '호칭'],
  ] as const) {
    const raw = data[key];
    if (raw === undefined) continue;
    if (raw === null) {
      patch[key] = null;
      continue;
    }
    if (typeof raw !== 'string') throw new BadRequestException(`${label}은(는) 문자열이어야 합니다.`);
    const text = raw.trim();
    if (text.length > max) throw new BadRequestException(`${label}은(는) ${max}자 이하여야 합니다.`);
    patch[key] = text === '' ? null : text;
  }

  return patch;
}

@Injectable()
export class ChatStateService {
  constructor(private readonly prisma: PrismaService) {}

  async get(campaignId: string | null): Promise<ChatState> {
    if (!campaignId) return DEFAULT_STATE;
    const row = await this.prisma.campaignState.findUnique({
      where: { campaignId },
      select: { relationshipValue: true, relationshipNote: true, userNickname: true },
    });
    return row ?? DEFAULT_STATE;
  }

  async update(conversation: Conversation, patch: Partial<ChatState>): Promise<ChatState> {
    return this.prisma.campaignState.upsert({
      where: { campaignId: conversation.campaignId },
      create: { campaignId: conversation.campaignId, ...DEFAULT_STATE, ...patch },
      update: patch,
      select: { relationshipValue: true, relationshipNote: true, userNickname: true },
    });
  }
}
