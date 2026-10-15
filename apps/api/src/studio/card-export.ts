import {
  LIMITS,
  SCHEMA_VERSION,
  parsePersonaKnowledge,
  type PersonaChunk,
  type PersonaKnowledge,
} from '../persona-rag/persona-knowledge.types.js';
import type { Card } from './card.js';

// 카드 한 장을 실제 대화가 쓰는 두 형태로 바꾼다. 3턴 테스트와 발행이 같은 변환을 써야
// "테스트에서 본 캐릭터 = 발행 뒤 유저가 만나는 캐릭터"가 된다.
//  1) Character 행(공개 필드)  — 채팅 컨텍스트 조립기(buildContextSlice)가 읽는다
//  2) 페르소나 지식 JSON        — persona-rag가 매 턴 관련 조각을 골라 넣는다 (git 제외 파일)
// 비밀·해금 조건은 어느 쪽에도 넣지 않는다. Character.secret 칸에만 남는다 (§7.8)

const HONORIFIC_TEXT = {
  jondae: '존댓말 기본',
  banmal: '반말 기본',
  // 컨텍스트 조립기가 '존댓말'/'반말' 글자로 높임을 판별하므로 섞어 쓰기는 두 낱말을 피한다
  mix: '높임과 낮춤을 상황에 따라 섞어 씀',
} as const;

const axisText = (c: Card) => {
  const p = c.personality;
  return `온기 ${p.warmth}, 직설 ${p.directness}, 충동 ${p.impulse}, 보호 ${p.protectiveness} (0~100)`;
};

export function speechText(card: Card): string {
  const p = card.personality;
  return [
    p.honorific ? HONORIFIC_TEXT[p.honorific] : '',
    p.habits.length ? `습관: ${p.habits.join(' / ')}` : '',
    p.forbidden.length ? `쓰지 않는 말투: ${p.forbidden.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('. ');
}

// 채팅 컨텍스트 조립기와 캐릭터 목록이 읽는 공개 필드
export function toCharacterFields(card: Card) {
  return {
    name: card.identity.name,
    oneLiner: card.identity.oneLiner,
    role: card.identity.role || 'companion',
    addressing: card.personality.addressing,
    personalityAxes: [card.personality.summary, axisText(card)].filter(Boolean).join(' — '),
    speechStyle: speechText(card),
    knows: card.campaign.knows,
    unknown: card.campaign.unknown,
    goal: card.campaign.goal,
    conflictSeed: card.campaign.conflictSeed,
    // 채팅을 열면 가장 먼저 보이는 말. 첫인사(§6.2 "상황 2~4줄 + 대사 1~2줄")가 그 자리다
    openingScene: card.greeting.firstMessage,
    profile: card.identity.occupation ? { occupation: card.identity.occupation } : null,
  };
}

const cut = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1) + '…');

// 조각 하나의 본문 상한보다 짧게 나눈다(약간 여유). 프로 등급의 긴 글이 잘려 나가지 않게 문장 단위로 여러 조각이 된다
const PIECE = LIMITS.textLength - 20;

// 긴 글을 PIECE 이하로 쪼갠다. 문장 끝(. ! ? … 따옴표, 줄바꿈)에서 먼저 자르고, 한 문장이 길면 글자 수로 자른다
export function splitText(text: string, max = PIECE): string[] {
  const body = text.trim();
  if (body.length <= max) return body ? [body] : [];
  const sentences = body.split(/(?<=[.!?…"”』」])\s+|\n+/).map((x) => x.trim()).filter(Boolean);
  const pieces: string[] = [];
  let current = '';
  const flush = () => {
    if (current) pieces.push(current);
    current = '';
  };
  for (const sentence of sentences) {
    // 한 문장이 상한보다 길면 글자 수로 잘라 이어 붙인다
    for (let i = 0; i < sentence.length; i += max) {
      const part = sentence.slice(i, i + max);
      if (current && current.length + part.length + 1 > max) flush();
      current = current ? `${current} ${part}` : part;
    }
  }
  flush();
  return pieces;
}

// 본문이 길면 id, id-2, id-3 … 으로 여러 조각을 만든다 (검색이 관련 있는 조각만 골라 넣는다)
function chunk(id: string, type: string, topic: string, text: string, keywords: string[] = []): PersonaChunk[] {
  return splitText(text).map((piece, i) => ({
    id: i === 0 ? id : `${id}-${i + 1}`,
    type,
    topic: cut(topic, LIMITS.topicLength),
    keywords: keywords.map((k) => cut(k, LIMITS.keywordLength)).slice(0, LIMITS.keywords),
    text: piece,
  }));
}

export function toKnowledge(card: Card): PersonaKnowledge {
  const { identity: id, personality: p, campaign: ca, boundary: b, greeting: g, lore, appearance: ap } = card;

  const core = [
    `${id.name}: ${id.oneLiner}`,
    p.addressing ? `호칭: ${p.addressing}` : '',
    `성격: ${[p.summary, axisText(card)].filter(Boolean).join(' — ')}`,
    `말투: ${speechText(card)}`,
    b.neverDo.length ? `절대 하지 않는 것: ${b.neverDo.join(', ')}` : '',
    '금기: 자기가 AI라거나 설정이 있다는 말을 하지 않는다. 설정에 없는 개인사는 지어내지 않고 캐릭터답게 넘기거나 되묻는다',
  ]
    .filter(Boolean)
    .map((line) => cut(line, LIMITS.coreLineLength))
    .slice(0, LIMITS.coreLines);

  const chunks: PersonaChunk[] = [
    // 성격 요약이 길면 core 한 줄(240자)에서 잘리는 나머지를 조각으로도 둔다 (프로 등급)
    ...(p.summary.length > 150 ? chunk('card-personality', 'profile', '성격 자세히', p.summary, ['성격', '어떤 사람']) : []),
    ...chunk('card-scene', 'world', '처음 만나는 장면', ca.scene, ['처음', '첫날', '첫 만남']),
    ...chunk('card-knows', 'knowledge', '캐릭터가 아는 것', ca.knows && `캐릭터가 아는 것: ${ca.knows}`),
    // 카드의 '모르는 것'은 캐릭터 본인이 모르는 사실이다. 표시를 붙여 아는 것처럼 말하지 않게 한다
    ...chunk('card-unknown', 'boundary', '캐릭터가 아직 모르는 것', ca.unknown && `캐릭터 본인은 아직 모르고 스스로 꺼내지도 않는다: ${ca.unknown}`),
    ...chunk('card-goal', 'motivation', '목표와 속마음', ca.goal, ['목표', '꿈', '바라는']),
    ...chunk('card-stance', 'relationship', '유저를 대하는 태도', ca.stance, ['나를', '저를', '어떻게 생각']),
    ...chunk('card-conflict', 'conflict', '갈등의 씨앗', ca.conflictSeed),
    ...chunk('card-breakers', 'boundary', '관계가 깨지는 것', b.breakers, ['싫어하는', '화나는', '용서']),
    ...chunk(
      'card-appearance',
      'profile',
      '외형',
      [ap.description, ap.keywords.length ? `분위기: ${ap.keywords.join(', ')}` : ''].filter(Boolean).join(' '),
      ['생김새', '외모', '옷', '머리'],
    ),
    ...chunk(
      'card-profile',
      'profile',
      '기본 프로필',
      [id.occupation && `직업: ${id.occupation}`, id.apparentAge && `겉보기 나이: ${id.apparentAge}`].filter(Boolean).join(', '),
      ['나이', '몇 살', '직업', '뭐 하는'],
    ),
    ...chunk('lore-world', 'world', '세계 규칙', lore.world, ['세계', '규칙']),
    ...chunk('lore-person', 'relationship', '중요 인물', lore.person),
    ...chunk('lore-taboo', 'boundary', '금기', lore.taboo, ['금기', '하면 안']),
    ...lore.extra.flatMap((e, i) => chunk(`lore-extra-${i + 1}`, 'world', e.title || `로어 ${i + 1}`, e.text)),
    // 예시 대화는 작은 모델의 말투를 붙잡는 가장 강한 수단이다 (§6.2 "말투 고정용 짧은 페어")
    ...g.examples.flatMap((e, i) =>
      chunk(`speech-example-${i + 1}`, 'speech_example', '말투 예시', `예) 유저: ${e.user} / ${id.name}: ${e.character}`, ['말투']),
    ),
    {
      id: 'guard-unwritten',
      type: 'boundary',
      topic: '설정에 없는 개인사',
      keywords: ['가족', '부모', '형제', '고향', '출신', '어린 시절', '학교', '전공', '연애', '친구', '취미'],
      text: '가족·형제·고향·출신·학교·전공·어린 시절·연애·취미 같은 세부 사정 중 위 자료에 없는 것은 설정에 적혀 있지 않다. 있다/없다, 어디다, 무엇이다로 단정하지 않고 캐릭터답게 말을 돌리거나 되묻는다.',
    },
  ];

  // persona-rag가 읽는 형식 그대로인지 같은 검증기로 확인한다 (발행 전에 깨진 파일을 막는다)
  return parsePersonaKnowledge({ schemaVersion: SCHEMA_VERSION, character: id.name, core, chunks }, `${id.name}.json`);
}
