import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ChatTurn } from '../character-chat/character-chat.types.js';
import { PersonaKnowledgeStore } from './persona-knowledge.store.js';
import type { PersonaKnowledge } from './persona-knowledge.types.js';
import { retrieve } from './retriever.js';

export type RagContext = {
  // 항상 들어갈 핵심 줄. 지식 파일이 없으면 null → 호출부가 카드 원문 방식으로 되돌아간다
  core: string[];
  // FastAPI ContextSlice.activeLore 형식 그대로
  lore: { keyword: string; content: string }[];
  // 어떤 조각이 골라졌는지 로그·디버깅용
  retrievedIds: string[];
};

// PERSONA_RAG=off 로 끄면 예전 방식(카드 원문 전부)으로 돌아간다. 효과를 비교할 때 쓴다
export function ragEnabled(): boolean {
  return (process.env.PERSONA_RAG ?? 'on').toLowerCase() !== 'off';
}

// 이번 말 앞의 대화 중 검색 맥락으로 쓸 최근 두 턴의 본문
function recentTexts(history: ChatTurn[]): string[] {
  return history.slice(-2).map((turn) => turn.text);
}

@Injectable()
export class PersonaRagService implements OnModuleInit {
  private readonly logger = new Logger(PersonaRagService.name);

  constructor(private readonly store: PersonaKnowledgeStore) {}

  onModuleInit(): void {
    if (!ragEnabled()) {
      this.logger.log('PERSONA_RAG=off — 카드 원문 방식으로 대화한다');
      return;
    }
    const report = this.store.report();
    if (report.loaded.length === 0 && report.invalid.length === 0) {
      this.logger.log(`페르소나 지식 파일이 없다 (${report.dir}) — 카드 원문 방식으로 대화한다`);
    }
    for (const file of report.loaded) {
      this.logger.log(`페르소나 지식 로드: ${file.character} (${file.file}, 조각 ${file.chunks}개)`);
    }
  }

  // 이 캐릭터의 지식 JSON (없거나 RAG를 껐으면 null) — 설정에 근거가 있는지 서버가 따질 때 쓴다
  knowledgeFor(characterName: string): PersonaKnowledge | null {
    return ragEnabled() ? this.store.get(characterName) : null;
  }

  // message가 없으면(대답 추천처럼 유저가 아직 말하기 전) 최근 대화만으로 검색한다
  assemble(characterName: string, history: ChatTurn[], message?: string): RagContext | null {
    if (!ragEnabled()) return null;

    const knowledge = this.store.get(characterName);
    if (!knowledge) return null;
    return this.assembleFrom(knowledge, history, message);
  }

  // 파일이 아니라 손에 든 지식으로 검색한다 — 공방 3턴 테스트가 발행 전 초안 카드로 쓴다
  assembleFrom(knowledge: PersonaKnowledge, history: ChatTurn[], message?: string): RagContext {
    const characterName = knowledge.character;
    const query =
      message !== undefined
        ? { message, recent: recentTexts(history) }
        : { message: history.at(-1)?.text ?? '', recent: recentTexts(history.slice(0, -1)) };

    const picked = retrieve(knowledge.chunks, query);
    const retrievedIds = picked.map((p) => p.chunk.id);
    this.logger.debug(`${characterName} 검색: ${retrievedIds.join(', ') || '(없음)'}`);

    return {
      core: knowledge.core,
      lore: picked.map(({ chunk }) => ({ keyword: chunk.topic, content: chunk.text })),
      retrievedIds,
    };
  }
}
