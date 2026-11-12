import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildContextSlice } from '../character-chat/character-chat.context.js';
import { EXAMPLE_PATH } from './persona-example.fixture.js';
import { PersonaKnowledgeStore } from './persona-knowledge.store.js';
import { PersonaRagService } from './persona-rag.service.js';

describe('컨텍스트 조립', () => {
  const character = {
    name: '한지우',
    role: 'guide',
    oneLiner: '카페 주인',
    addressing: '손님이라 부른다',
    personalityAxes: '과묵',
    speechStyle: '존댓말',
    knows: 'a',
    unknown: 'b',
    goal: 'c',
    conflictSeed: 'd',
    openingScene: 'e',
  } as never;

  it('지식이 있으면 core만 directorNote로, 검색된 조각은 activeLore로 넘긴다', () => {
    const rag = { core: ['핵심1', '핵심2'], lore: [{ keyword: '주제', content: '내용' }], retrievedIds: ['x'] };
    const slice = buildContextSlice(character, [], null, rag);
    expect(slice.directorNote).toBe('- 핵심1\n- 핵심2');
    expect(slice.activeLore).toEqual([{ keyword: '주제', content: '내용' }]);
  });

  it('지식이 없으면 예전처럼 카드 원문 전부를 넘긴다', () => {
    const slice = buildContextSlice(character, [], null, null);
    expect(slice.directorNote).toContain('호칭: 손님이라 부른다');
    expect(slice.directorNote).toContain('갈등 씨앗: d');
    expect(slice.activeLore).toEqual([]);
  });
});

describe('PersonaRagService', () => {
  let dir: string;
  const original = process.env.PERSONA_RAG;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'persona-rag-'));
    writeFileSync(join(dir, '한지우.json'), readFileSync(EXAMPLE_PATH));
    delete process.env.PERSONA_RAG;
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (original === undefined) delete process.env.PERSONA_RAG;
    else process.env.PERSONA_RAG = original;
  });

  const service = () => new PersonaRagService(PersonaKnowledgeStore.at(dir));

  it('유저 말로 검색하고 core를 함께 돌려준다', () => {
    const result = service().assemble('한지우', [], '비 오는 날 좋아하세요?');
    expect(result?.retrievedIds[0]).toBe('preference-rainy-day');
    expect(result?.core.length).toBeGreaterThan(0);
    expect(result?.lore[0]).toEqual({
      keyword: '비 오는 날',
      content: expect.stringContaining('비 오는 날을 좋아한다'),
    });
  });

  it('지식 파일이 없는 캐릭터는 null이다', () => {
    expect(service().assemble('유지성', [], '안녕')).toBeNull();
  });

  it('PERSONA_RAG=off 이면 지식이 있어도 null이다', () => {
    process.env.PERSONA_RAG = 'off';
    expect(service().assemble('한지우', [], '비 오는 날')).toBeNull();
  });

  it('유저가 아직 말하기 전(대답 추천)에는 마지막 대화로 검색한다', () => {
    const history = [
      { role: 'character' as const, text: '오늘은 고양이 보리가 서랍을 뒤져요.' },
    ];
    expect(service().assemble('한지우', history)?.retrievedIds).toContain('relationship-cat');
  });
});
