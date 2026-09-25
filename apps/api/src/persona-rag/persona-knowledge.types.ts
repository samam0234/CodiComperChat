// 캐릭터 페르소나 지식(RAG 원천) JSON 형식. 실제 파일은 apps/api/data/personas/ 에 두고
// git에는 올리지 않는다(.gitignore). 형식 예시는 data/personas/_example.json.

export const SCHEMA_VERSION = 1;

export type PersonaChunk = {
  id: string;
  // backstory · relationship · habit · preference · world · speech_example · boundary … 자유롭게 쓴다
  type: string;
  // 이 조각이 무엇에 관한 것인지 짧은 제목. 검색과 프롬프트 표제에 쓰인다
  topic: string;
  // 검색이 놓치기 쉬운 말(동의어·별칭)을 적어 두는 자리. 없어도 본문으로 검색된다
  keywords: string[];
  text: string;
};

export type PersonaKnowledge = {
  schemaVersion: number;
  // Character.name과 같아야 그 캐릭터에 붙는다
  character: string;
  // 매 턴 항상 들어가는 극소 핵심(정체성·호칭·말투·금기). 길어지면 최근 대화가 밀려난다
  core: string[];
  chunks: PersonaChunk[];
};

export const LIMITS = {
  coreLines: 8,
  coreLineLength: 240,
  chunks: 200,
  textLength: 500,
  topicLength: 40,
  typeLength: 24,
  keywords: 30,
  keywordLength: 24,
} as const;

export class PersonaKnowledgeError extends Error {}

function fail(source: string, message: string): never {
  throw new PersonaKnowledgeError(`${source}: ${message}`);
}

function str(value: unknown, source: string, label: string, max: number): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(source, `${label}은(는) 비어 있지 않은 문자열이어야 한다`);
  }
  const text = value.trim();
  if (text.length > max) {
    fail(source, `${label}이(가) 너무 길다 (${text.length}자, 최대 ${max}자)`);
  }
  return text;
}

// 손으로 고치는 파일이라 어디가 틀렸는지 알려 주는 것이 중요하다. 첫 오류에서 멈추고 위치를 적는다
export function parsePersonaKnowledge(raw: unknown, source: string): PersonaKnowledge {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    fail(source, '최상위는 객체여야 한다');
  }
  const data = raw as Record<string, unknown>;

  if (data.schemaVersion !== SCHEMA_VERSION) {
    fail(source, `schemaVersion은 ${SCHEMA_VERSION}이어야 한다 (현재 ${String(data.schemaVersion)})`);
  }
  const character = str(data.character, source, 'character', 60);

  if (!Array.isArray(data.core)) fail(source, 'core는 문자열 배열이어야 한다');
  if (data.core.length > LIMITS.coreLines) {
    fail(source, `core는 최대 ${LIMITS.coreLines}줄이다 (현재 ${data.core.length}줄)`);
  }
  const core = data.core.map((line, i) => str(line, source, `core[${i}]`, LIMITS.coreLineLength));

  if (!Array.isArray(data.chunks)) fail(source, 'chunks는 배열이어야 한다');
  if (data.chunks.length > LIMITS.chunks) {
    fail(source, `chunks는 최대 ${LIMITS.chunks}개이다 (현재 ${data.chunks.length}개)`);
  }

  const seen = new Set<string>();
  const chunks = data.chunks.map((item, i): PersonaChunk => {
    const at = `chunks[${i}]`;
    if (typeof item !== 'object' || item === null) fail(source, `${at}은(는) 객체여야 한다`);
    const c = item as Record<string, unknown>;

    const id = str(c.id, source, `${at}.id`, 60);
    if (seen.has(id)) fail(source, `${at}.id '${id}'가 중복된다`);
    seen.add(id);

    let keywords: string[] = [];
    if (c.keywords !== undefined) {
      if (!Array.isArray(c.keywords)) fail(source, `${at}.keywords는 문자열 배열이어야 한다`);
      if (c.keywords.length > LIMITS.keywords) {
        fail(source, `${at}.keywords는 최대 ${LIMITS.keywords}개이다`);
      }
      keywords = c.keywords.map((k, j) => str(k, source, `${at}.keywords[${j}]`, LIMITS.keywordLength));
    }

    return {
      id,
      type: str(c.type, source, `${at}.type`, LIMITS.typeLength),
      topic: str(c.topic, source, `${at}.topic`, LIMITS.topicLength),
      keywords,
      text: str(c.text, source, `${at}.text`, LIMITS.textLength),
    };
  });

  return { schemaVersion: SCHEMA_VERSION, character, core, chunks };
}
