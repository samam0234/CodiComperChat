import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { postToAi } from '../ai/ai-client.js';
import { buildContextSlice } from '../character-chat/character-chat.context.js';
import { groundingFacts, groundingText, keepGrounded, ungroundedTopics } from '../character-chat/grounding.js';
import type { ChatTurn, UserPersonaPayload } from '../character-chat/character-chat.types.js';
import type { CharactersService } from '../characters/characters.service.js';
import { PersonaRagService } from '../persona-rag/persona-rag.service.js';
import { tokenize } from '../persona-rag/retriever.js';
import { PersonasService } from '../personas/personas.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { cardHash, type Card } from './card.js';
import { toCharacterFields, toKnowledge } from './card-export.js';
import { StudioService } from './studio.service.js';
import { TEST_TURNS, asSession, userTurns, type TestSession, type Verdict } from './test-session.js';

// 대화 기록은 서버가 들고 있어야 판정을 조작할 수 없다

type PublicCharacter = Awaited<ReturnType<CharactersService['findOnePublished']>>;

const DEFAULT_TESTER: UserPersonaPayload = { name: '테스트 유저', description: '' };

// 말투 샘플용 고정 질문과 개수 (기획서 §6.2)
export const SAMPLE_QUESTION = '지금 뭐 해?';
export const SAMPLE_COUNT = 2;

// 비밀 원문은 모델에 보내지 않으므로 우연히라도 비슷한 말이 나오면 서버가 잡는다 (§7.8, §11 "서버 점검")
export function secretLeaked(secret: string, replies: string[]): boolean {
  const secretGrams = new Set([...tokenize(secret, true).keys()].filter((g) => g.length === 2));
  if (secretGrams.size < 4) return false;
  return replies.some((reply) => {
    const grams = tokenize(reply, true);
    let hit = 0;
    for (const g of secretGrams) if (grams.has(g)) hit++;
    return hit / secretGrams.size >= 0.5;
  });
}

@Injectable()
export class StudioTestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studio: StudioService,
    private readonly personaRag: PersonaRagService,
    private readonly personas: PersonasService,
  ) {}

  // 카드가 그대로일 때만 이어 간다. 고쳤으면 새 테스트다
  private session(card: Card, raw: unknown): TestSession {
    const hash = cardHash(card);
    const saved = asSession(raw);
    return saved && saved.cardHash === hash ? saved : { cardHash: hash, turns: [], verdict: null };
  }

  private async save(id: string, session: TestSession | null) {
    await this.prisma.characterDraft.update({
      where: { id },
      data: { lastTest: session === null ? Prisma.DbNull : (session as unknown as Prisma.InputJsonValue) },
    });
  }

  private requireTestable(card: Card) {
    const missing = [
      [card.identity.name, '이름'],
      [card.personality.honorific, '반말/존댓말'],
      [card.greeting.firstMessage, '첫 메시지'],
    ]
      .filter(([v]) => !v)
      .map(([, label]) => label);
    if (missing.length) throw new BadRequestException(`테스트하려면 먼저 채워 주세요: ${missing.join(', ')}`);
  }

  async chat(ownerId: string, id: string, message: string, personaId?: string) {
    const draft = await this.studio.findOwned(ownerId, id);
    const card = draft.card;
    this.requireTestable(card);

    const session = this.session(card, draft.lastTest);
    if (userTurns(session.turns) >= TEST_TURNS) {
      throw new ConflictException(`테스트는 ${TEST_TURNS}턴입니다. 판정을 받거나 다시 시작하세요.`);
    }

    const persona = personaId
      ? await this.personas.findOwned(ownerId, personaId).then(({ name, description }) => ({ name, description }))
      : DEFAULT_TESTER;

    // 발행 뒤 실제 대화와 같은 경로로 맥락을 만든다: 카드 → 공개 필드 + 페르소나 지식 → 검색 → 조립
    const character = { id: draft.id, createdAt: new Date(), ...toCharacterFields(card) } as unknown as PublicCharacter;
    const history: ChatTurn[] = [{ role: 'character', text: card.greeting.firstMessage }, ...session.turns];
    const knowledge = toKnowledge(card);
    const rag = this.personaRag.assembleFrom(knowledge, history, message);

    // 발행 뒤 실제 대화와 같은 개인사 가드: 설정에 없는 개인사를 물으면 지어내지 못하게 막는다
    const grounding = groundingText(knowledge, character as unknown as Record<string, unknown>);
    const context = buildContextSlice(character, history, persona, rag, [], null, [], ungroundedTopics(message, grounding));
    const first = await postToAi<{ reply: string }>('/infer', { context, userTurn: message });
    const reply = await keepGrounded(context, message, first.reply, groundingFacts(grounding));

    session.turns.push({ role: 'user', text: message }, { role: 'character', text: reply });
    session.verdict = null;
    await this.save(id, session);
    return { reply, turnsUsed: userTurns(session.turns), turnsTotal: TEST_TURNS };
  }

  // 성격·말투 단계에서 바로 보는 샘플 답 (기획서 §6.2 "같은 질문 '지금 뭐 해?'에 대한 샘플 답 2개를 즉시 보여 말투를 검증").
  // 3턴 테스트와 같은 경로(카드 → 페르소나 지식 → 검색 → 조립 → 개인사 가드)로 답하지만 아무것도 저장하지 않는다 —
  // 테스트 턴을 쓰지 않고, 카드를 고쳐도 테스트 상태를 건드리지 않는다
  async samples(ownerId: string, id: string) {
    const draft = await this.studio.findOwned(ownerId, id);
    const card = draft.card;
    const missing = [
      [card.identity.name, '이름'],
      [card.personality.honorific, '반말/존댓말'],
    ]
      .filter(([v]) => !v)
      .map(([, label]) => label);
    if (missing.length) throw new BadRequestException(`샘플 답을 보려면 먼저 채워 주세요: ${missing.join(', ')}`);

    const character = { id: draft.id, createdAt: new Date(), ...toCharacterFields(card) } as unknown as PublicCharacter;
    // 첫 메시지가 아직 없으면 빈 대화에서 시작한다
    const history: ChatTurn[] = card.greeting.firstMessage ? [{ role: 'character', text: card.greeting.firstMessage }] : [];
    const knowledge = toKnowledge(card);
    const grounding = groundingText(knowledge, character as unknown as Record<string, unknown>);
    const replies: string[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const rag = this.personaRag.assembleFrom(knowledge, history, SAMPLE_QUESTION);
      const context = buildContextSlice(character, history, DEFAULT_TESTER, rag, [], null, [], ungroundedTopics(SAMPLE_QUESTION, grounding));
      const first = await postToAi<{ reply: string }>('/infer', { context, userTurn: SAMPLE_QUESTION });
      replies.push(await keepGrounded(context, SAMPLE_QUESTION, first.reply, groundingFacts(grounding)));
    }
    return { question: SAMPLE_QUESTION, replies };
  }

  async critique(ownerId: string, id: string): Promise<Verdict> {
    const draft = await this.studio.findOwned(ownerId, id);
    const card = draft.card;
    const session = this.session(card, draft.lastTest);
    if (userTurns(session.turns) < TEST_TURNS) {
      throw new ConflictException(
        `${TEST_TURNS}턴을 마쳐야 판정할 수 있습니다 (지금 ${userTurns(session.turns)}턴). 카드를 고쳤다면 테스트를 새로 해야 합니다.`,
      );
    }

    const p = card.personality;
    const knowledge = toKnowledge(card);
    const result = await postToAi<Omit<Verdict, 'passed' | 'at'>>('/critique-test', {
      character: {
        name: card.identity.name,
        role: card.identity.role || 'companion',
        warmth: p.warmth,
        directness: p.directness,
        impulse: p.impulse,
        protectiveness: p.protectiveness,
        speech: {
          honorific: p.honorific || 'mix',
          addressAs: p.addressing,
          forbidden: p.forbidden,
          habits: p.habits,
        },
        summary: p.summary,
        neverDo: card.boundary.neverDo,
        lockedSecretTopics: [],
        unlockedSecrets: [],
      },
      turns: [{ role: 'character', text: card.greeting.firstMessage }, ...session.turns],
      // 판정 기준이 되는 설정 자료 — 지식 JSON에 들어가는 그대로(비밀 제외). 안전장치 조각은 사실이 아니라 뺀다
      facts: [
        ...knowledge.core.filter((line) => !line.startsWith('금기:')),
        ...knowledge.chunks.filter((c) => c.type !== 'boundary' || c.id === 'card-unknown').map((c) => `${c.topic}: ${c.text}`),
      ].slice(0, 40),
    });

    const replies = session.turns.filter((t) => t.role === 'character').map((t) => t.text);
    const secretLeak = secretLeaked(card.boundary.secret, replies);
    const verdict: Verdict = {
      ...result,
      secretLeak,
      notes: secretLeak ? [...result.notes, '비밀 내용과 비슷한 말이 해금 전에 나왔다'] : result.notes,
      passed: !(result.toneBroken || result.overExplaining || result.metaLeak || result.inventedFacts || secretLeak),
      at: new Date().toISOString(),
    };
    session.verdict = verdict;
    await this.save(id, session);
    return verdict;
  }

  async reset(ownerId: string, id: string) {
    await this.studio.findOwned(ownerId, id);
    await this.save(id, null);
  }
}
