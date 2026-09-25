import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { example, readExampleRaw } from './persona-example.fixture.js';
import { PersonaKnowledgeStore } from './persona-knowledge.store.js';
import { LIMITS, PersonaKnowledgeError, parsePersonaKnowledge } from './persona-knowledge.types.js';

describe('persona knowledge 형식 검증', () => {
  it('저장소에 올라간 예시 파일은 항상 유효하다 (문서와 검증기가 어긋나지 않게)', () => {
    const knowledge = example();
    expect(knowledge.character).toBe('한지우');
    expect(knowledge.core.length).toBeLessThanOrEqual(LIMITS.coreLines);
    expect(knowledge.chunks.length).toBeGreaterThan(3);
  });

  it('어디가 틀렸는지 위치를 알려 준다', () => {
    const good = readExampleRaw();

    expect(() => parsePersonaKnowledge({ ...good, schemaVersion: 2 }, 'x.json')).toThrow(/schemaVersion/);
    expect(() => parsePersonaKnowledge({ ...good, character: '' }, 'x.json')).toThrow(/character/);

    const dup = { ...good, chunks: [good.chunks[0], { ...good.chunks[1], id: good.chunks[0].id }] };
    expect(() => parsePersonaKnowledge(dup, 'x.json')).toThrow(/chunks\[1\]\.id .*중복/);

    const long = { ...good, chunks: [{ ...good.chunks[0], text: 'ㄱ'.repeat(LIMITS.textLength + 1) }] };
    expect(() => parsePersonaKnowledge(long, 'x.json')).toThrow(/chunks\[0\]\.text.*너무 길다/);

    const tooManyCore = { ...good, core: Array.from({ length: LIMITS.coreLines + 1 }, () => '줄') };
    expect(() => parsePersonaKnowledge(tooManyCore, 'x.json')).toThrow(PersonaKnowledgeError);
  });
});

describe('저장소', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'persona-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const write = (file: string, content: unknown) =>
    writeFileSync(join(dir, file), typeof content === 'string' ? content : JSON.stringify(content), 'utf8');

  it('캐릭터 이름으로 찾고, _로 시작하는 파일과 깨진 파일은 무시한다', () => {
    const good = readExampleRaw();
    write('한지우.json', good);
    write('_draft.json', { ...good, character: '초안' });
    write('깨짐.json', '{ 이건 JSON이 아니다');
    write('틀림.json', { ...good, schemaVersion: 9 });

    const store = PersonaKnowledgeStore.at(dir);
    expect(store.get('한지우')?.chunks.length).toBe(good.chunks.length);
    expect(store.get('초안')).toBeNull();
    expect(store.get('없는 캐릭터')).toBeNull();

    const report = store.report();
    expect(report.loaded.map((f) => f.file)).toEqual(['한지우.json']);
    expect(report.invalid.map((f) => f.file).sort()).toEqual(['깨짐.json', '틀림.json']);
    expect(report.invalid.find((f) => f.file === '틀림.json')?.error).toMatch(/schemaVersion/);
  });

  it('폴더가 없어도 오류 없이 빈 결과다', () => {
    expect(PersonaKnowledgeStore.at(join(dir, 'nope')).get('한지우')).toBeNull();
  });

  it('파일을 고치면 서버 재시작 없이 반영된다', () => {
    const good = readExampleRaw();
    write('a.json', good);
    const store = PersonaKnowledgeStore.at(dir);
    expect(store.get('한지우')?.core[0]).toContain('바리스타');

    write('a.json', { ...good, core: ['고친 핵심 줄'] });
    const future = new Date(Date.now() + 5000);
    utimesSync(join(dir, 'a.json'), future, future);
    store.report(); // 폴더 재확인을 강제한다 (평소에는 2초 간격)
    expect(store.get('한지우')?.core).toEqual(['고친 핵심 줄']);
  });
});
