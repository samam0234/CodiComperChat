import { BadRequestException } from '@nestjs/common';
import type { Card } from './card.js';

// "이 칸만 AI로 초안" (기획서 §6.1). 전체 자동 생성은 하지 않고, 칸 하나씩 제안만 만든다.
// 비밀·해금 조건·예시 대화·추가 로어는 대상이 아니다 — 비밀은 AI에 보내지 않는 것이 원칙(§7.8)이고,
// 예시·추가 로어는 구조가 있는 칸이라 직접 쓰는 편이 낫다.

type Spec = {
  label: string;
  guide: string;
  kind: 'text' | 'list';
  // text: 글자 수 상한 / list: 항목 하나의 글자 수 상한 (card.ts의 상한과 같아야 한다)
  max: number;
  maxItems: number;
  read: (c: Card) => string | string[];
};

export const DRAFT_FIELDS: Record<string, Spec> = {
  'identity.oneLiner': {
    label: '한 줄 소개',
    guide: '목록에 나가는 한 줄 소개. 직업·분위기·갈등을 한 문장에 담고 이름은 넣지 않는다',
    kind: 'text', max: 40, maxItems: 1, read: (c) => c.identity.oneLiner,
  },
  'identity.tags': {
    label: '태그',
    guide: '검색·분류용 짧은 태그(예: 카페, 힐링). 단어 하나 또는 짧은 구',
    kind: 'list', max: 12, maxItems: 5, read: (c) => c.identity.tags,
  },
  'appearance.description': {
    label: '외형 서술',
    guide: '모델이 장면을 묘사할 때 쓰는 외형. 머리·옷·인상 위주로 2~3문장',
    kind: 'text', max: 300, maxItems: 1, read: (c) => c.appearance.description,
  },
  'appearance.keywords': {
    label: '분위기 키워드',
    guide: '외형·분위기를 나타내는 짧은 키워드(예: 차분함, 앞치마)',
    kind: 'list', max: 12, maxItems: 8, read: (c) => c.appearance.keywords,
  },
  'personality.addressing': {
    label: '호칭 규칙',
    guide: '캐릭터가 유저를 부르는 규칙 한 문장. 처음과 친해진 뒤가 어떻게 다른지 포함',
    kind: 'text', max: 120, maxItems: 1, read: (c) => c.personality.addressing,
  },
  'personality.habits': {
    label: '말투 습관',
    guide: '말투·행동에서 드러나는 구체적인 버릇 3개(예: 말끝을 흐린다, 비유로 설명한다). 성격 형용사가 아니라 눈에 보이는 버릇',
    kind: 'list', max: 80, maxItems: 3, read: (c) => c.personality.habits,
  },
  'personality.forbidden': {
    label: '금지 말투',
    guide: '이 캐릭터가 쓰지 않는 말투(예: 이모지, 인터넷 말투, 욕설)',
    kind: 'list', max: 80, maxItems: 5, read: (c) => c.personality.forbidden,
  },
  'personality.summary': {
    label: '성격 요약',
    guide: '성격을 두 문장으로. 장점과 함께 약점이나 모순을 한 가지 넣는다',
    kind: 'text', max: 200, maxItems: 1, read: (c) => c.personality.summary,
  },
  'campaign.scene': {
    label: '시작 장면',
    guide: '대화가 시작되는 장면. 장소·시간·분위기를 두세 문장으로',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.campaign.scene,
  },
  'campaign.knows': {
    label: '아는 것',
    guide: '캐릭터가 이미 알고 있는 것(유저나 세계에 대해). 구체적으로',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.campaign.knows,
  },
  'campaign.unknown': {
    label: '모르는 것',
    guide: '캐릭터가 모르는 것. 물어보면 모른다고 답하게 될 내용',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.campaign.unknown,
  },
  'campaign.goal': {
    label: '목표',
    guide: '캐릭터가 이 이야기에서 이루려는 것(겉으로 드러나는 목표)',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.campaign.goal,
  },
  'campaign.stance': {
    label: '유저에게 거는 태도',
    guide: '유저를 어떤 태도로 대하는지, 관계가 어떻게 변해 가는지',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.campaign.stance,
  },
  'campaign.conflictSeed': {
    label: '갈등 씨앗',
    guide: '이야기를 움직일 갈등이나 사건의 씨앗을 한두 문장으로. 해결하지 말고 불씨만',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.campaign.conflictSeed,
  },
  'boundary.neverDo': {
    label: '절대 하지 않는 것',
    guide: '캐릭터가 절대 하지 않는 행동·말(예: AI라고 말하기, 유저를 비웃기)',
    kind: 'list', max: 80, maxItems: 6, read: (c) => c.boundary.neverDo,
  },
  'boundary.breakers': {
    label: '관계가 깨지는 것',
    guide: '유저가 이러면 캐릭터와의 관계가 틀어지는 행동',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.boundary.breakers,
  },
  'greeting.firstMessage': {
    label: '첫 메시지',
    guide: '대화를 열 때 처음 보이는 메시지. 상황 묘사 2~4줄 뒤에 캐릭터의 대사 한두 줄(큰따옴표). 자기소개로 시작하지 않는다',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.greeting.firstMessage,
  },
  'greeting.alternates': {
    label: '대체 인사',
    guide: '첫 메시지와 다른 상황의 인사. 항목 하나가 상황 묘사 한두 줄 + 대사 한 줄',
    kind: 'list', max: 400, maxItems: 2, read: (c) => c.greeting.alternates,
  },
  'lore.world': {
    label: '세계 규칙',
    guide: '이 세계에서만 통하는 규칙·배경 설정',
    kind: 'text', max: 500, maxItems: 1, read: (c) => c.lore.world,
  },
  'lore.person': {
    label: '중요 인물',
    guide: '캐릭터와 관련된 중요한 인물과 그 관계',
    kind: 'text', max: 500, maxItems: 1, read: (c) => c.lore.person,
  },
  'quest.title': {
    label: '퀘스트 이름',
    guide: '비밀 퀘스트의 이름. 건네받은 뒤에야 유저에게 보이는 짧은 이름(예: 멈춰 둔 서랍). 정답을 알려 주지 않는다',
    kind: 'text', max: 30, maxItems: 1, read: (c) => c.quest.title,
  },
  'quest.offer': {
    label: '퀘스트 부탁',
    guide: '캐릭터가 친해진 유저에게 속마음으로 건네는 부탁의 내용과 꺼내는 방식. 이 캐릭터의 성격과 약점에서 나오는, 이야기 속 부탁으로 쓴다(게임 미션처럼 쓰지 않는다)',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.quest.offer,
  },
  'quest.objective': {
    label: '퀘스트 달성 조건',
    guide: '유저가 대화에서 구체적으로 무엇을 하거나 말하면 부탁을 해낸 것으로 볼지. 대화 기록만 보고 판정할 수 있게 눈에 보이는 행동·말로 쓴다. 캐릭터에게는 알려지지 않는다',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.quest.objective,
  },
  'quest.reward': {
    label: '퀘스트 보상 장면',
    guide: '유저가 해냈을 때 캐릭터가 보이는 변화나 장면(마음의 변화, 처음 하는 말이나 행동). 코레딧 같은 게임 보상이 아니라 이야기 속 변화',
    kind: 'text', max: 400, maxItems: 1, read: (c) => c.quest.reward,
  },
  'lore.taboo': {
    label: '금기',
    guide: '이 세계·캐릭터에서 건드리면 안 되는 화제나 행동',
    kind: 'text', max: 500, maxItems: 1, read: (c) => c.lore.taboo,
  },
};

export function draftSpec(key: unknown): Spec & { key: string } {
  if (typeof key !== 'string' || !(key in DRAFT_FIELDS)) {
    throw new BadRequestException('AI 초안을 지원하지 않는 칸입니다. 비밀·해금 조건·예시 대화는 직접 써 주세요.');
  }
  return { key, ...DRAFT_FIELDS[key] };
}

const ROLE_LABEL: Record<string, string> = { companion: '동료', rival: '라이벌', client: '의뢰인', guide: '가이드', wildcard: '와일드카드' };
const HONORIFIC_LABEL: Record<string, string> = { jondae: '존댓말', banmal: '반말', mix: '높임과 낮춤을 섞어 씀' };

// 지금까지 채워진 카드를 "라벨: 값" 줄로. 비밀·해금 조건은 어떤 경우에도 넣지 않는다.
// 쓰는 칸 자체는 빼서 모델이 자기 답을 되풀이하지 않게 한다 (현재 값은 따로 넘긴다)
export function buildSheet(card: Card, exceptKey: string): string[] {
  const rows: [string, string, string | string[]][] = [
    ['identity.name', '이름', card.identity.name],
    ['identity.oneLiner', '한 줄 소개', card.identity.oneLiner],
    ['identity.role', '캠페인 역할', ROLE_LABEL[card.identity.role] ?? ''],
    ['identity.occupation', '종족/직업', card.identity.occupation],
    ['identity.apparentAge', '겉보기 나이', card.identity.apparentAge],
    ['identity.tags', '태그', card.identity.tags],
    ['appearance.description', '외형 서술', card.appearance.description],
    ['appearance.keywords', '분위기 키워드', card.appearance.keywords],
    ['personality.honorific', '말투', HONORIFIC_LABEL[card.personality.honorific] ?? ''],
    [
      'personality.axes',
      '성격 축(0~100)',
      `온기 ${card.personality.warmth}, 직설 ${card.personality.directness}, 충동 ${card.personality.impulse}, 보호 ${card.personality.protectiveness}`,
    ],
    ['personality.addressing', '호칭 규칙', card.personality.addressing],
    ['personality.habits', '말투 습관', card.personality.habits],
    ['personality.forbidden', '금지 말투', card.personality.forbidden],
    ['personality.summary', '성격 요약', card.personality.summary],
    ['campaign.scene', '시작 장면', card.campaign.scene],
    ['campaign.knows', '아는 것', card.campaign.knows],
    ['campaign.unknown', '모르는 것', card.campaign.unknown],
    ['campaign.goal', '목표', card.campaign.goal],
    ['campaign.stance', '유저에게 거는 태도', card.campaign.stance],
    ['campaign.conflictSeed', '갈등 씨앗', card.campaign.conflictSeed],
    ['boundary.neverDo', '절대 하지 않는 것', card.boundary.neverDo],
    ['boundary.breakers', '관계가 깨지는 것', card.boundary.breakers],
    ['greeting.firstMessage', '첫 메시지', card.greeting.firstMessage],
    ['lore.world', '세계 규칙', card.lore.world],
    ['lore.person', '중요 인물', card.lore.person],
    ['lore.taboo', '금기', card.lore.taboo],
    ['quest.title', '퀘스트 이름', card.quest.title],
    ['quest.offer', '퀘스트 부탁', card.quest.offer],
    ['quest.objective', '퀘스트 달성 조건', card.quest.objective],
    ['quest.reward', '퀘스트 보상 장면', card.quest.reward],
  ];
  return rows
    .filter(([key]) => key !== exceptKey)
    .map(([, label, value]) => [label, Array.isArray(value) ? value.join(' / ') : value] as const)
    .filter(([, value]) => value.trim() !== '')
    .map(([label, value]) => `${label}: ${value.slice(0, 400)}`);
}

// 글자 수 상한에 맞춰 자른다. 가능하면 문장 끝에서 자른다
function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'), cut.lastIndexOf('"'), cut.lastIndexOf('다'));
  return end >= max * 0.6 ? cut.slice(0, end + 1).trim() : cut.trim();
}

// FastAPI가 돌려준 초안을 카드 칸의 형식·상한에 맞춘다
export function normalizeDraft(spec: Spec, raw: { text?: string; items?: string[] }): string | string[] {
  if (spec.kind === 'list') {
    const items = (raw.items ?? [])
      .map((i) => clamp(i.replace(/^[-*•\d.)\s]+/, ''), spec.max))
      .filter(Boolean);
    return [...new Set(items)].slice(0, spec.maxItems);
  }
  return clamp((raw.text ?? '').replace(/\*\*/g, ''), spec.max);
}
