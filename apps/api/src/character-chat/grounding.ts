import { Logger } from '@nestjs/common';
import { postToAi } from '../ai/ai-client.js';
import type { PersonaKnowledge } from '../persona-rag/persona-knowledge.types.js';
import type { ContextSlicePayload } from './character-chat.types.js';

// 개인사 질문 가드. 캐릭터 설정에 없는 개인사(취미·나이·가족·반려동물 등)를 유저가 물으면 모델이
// "산책을 좋아해요", "스물셋이에요"처럼 지어낸다. 검색 조각의 안전장치만으로는 뚫려서, 서버가 질문 주제를
// 직접 알아보고 "근거가 없다"를 그 턴 프롬프트 맨 끝에 못 박는다 (모델이 알아서 판단하게 두지 않는다).

type Topic = {
  label: string;
  // 유저 말에 이 말이 있으면 이 주제를 묻는 것이다
  ask: RegExp;
  // 설정(지식 JSON·카드)에 이 말이 있으면 근거가 있는 주제다 → 가드하지 않고 검색으로 사실을 넘긴다
  covered: RegExp;
};

const TOPICS: Topic[] = [
  {
    label: '가족·형제',
    ask: /가족|부모|엄마|아빠|어머니|아버지|형제|자매|남매|동생|누나|오빠|언니|자녀|자식|아이가|조카/,
    covered: /가족|부모|엄마|아빠|어머니|아버지|형제|자매|남매|동생|누나|오빠|언니/,
  },
  {
    label: '고향·사는 곳',
    ask: /고향|출신|어디\s*살|사는\s*(곳|데)|어디\s*사세|동네|집이\s*어디|자취/,
    covered: /고향|출신|거주|사는\s*곳|동네|자취/,
  },
  {
    label: '학교·학력·직장',
    ask: /학교|대학|전공|학과|졸업|학번|학년|직장|회사|무슨\s*일|무슨\s*과|어디\s*다니/,
    covered: /[가-힣A-Za-z]+(대학교|대학원|고등학교|중학교|초등학교)|전공\s*[:은는]|[가-힣]+과\s*(재학|졸업|학생)|직장|회사/,
  },
  {
    label: '나이·생일',
    ask: /나이|몇\s*살|몇살|연세|생일|몇\s*년생|동갑/,
    covered: /\d+\s*(살|세)\b|나이|생일|스무|스물|서른|년생/,
  },
  {
    label: '연애·결혼',
    ask: /여자\s*친구|남자\s*친구|여친|남친|애인|연애|결혼|배우자|짝사랑|첫사랑|이상형|좋아하는\s*사람/,
    covered: /여자\s*친구|남자\s*친구|애인|연애|결혼|배우자|짝사랑|첫사랑|이상형/,
  },
  {
    label: '친구·인간관계',
    ask: /친한\s*친구|친구가|친구는|절친|인간관계|동료가|선배|후배/,
    covered: /친구|절친|동료|선배|후배/,
  },
  {
    label: '취미·좋아하는 것',
    ask: /취미|특기|좋아하는\s*(음식|색|영화|음악|노래|책|가수|운동|계절|게임)|즐겨|주말에\s*(뭐|무엇)|쉬는\s*날|뭐\s*하면서\s*놀/,
    covered: /취미|특기|즐겨|좋아하는\s*(음식|색|영화|음악|노래|책|운동)/,
  },
  {
    label: '반려동물',
    ask: /반려|강아지|고양이|애완|키우(세|는|고)|펫/,
    covered: /반려|강아지|고양이|애완/,
  },
  {
    label: '어린 시절·과거',
    ask: /어린\s*시절|어릴\s*때|어렸을|옛날|과거|예전에\s*(뭐|무슨)|학창\s*시절|군대/,
    covered: /어린\s*시절|어릴\s*때|과거|학창|군대/,
  },
  {
    label: '외모·건강',
    ask: /키가|키\s*몇|몇\s*cm|몸무게|혈액형|mbti|엠비티아이|아픈\s*데|건강/i,
    covered: /키s*d|d+s*cm|키가|몸무게|혈액형|mbti|건강/i,
  },
];

// 근거 텍스트: 지식 JSON이 있으면 core + 조각 본문(안전장치 조각 guard-*는 "없다는 사실"이라 뺀다), 없으면 카드 공개 필드
export function groundingText(
  knowledge: PersonaKnowledge | null,
  card: Record<string, unknown>,
): string {
  const parts: string[] = [];
  if (knowledge) {
    parts.push(...knowledge.core);
    for (const chunk of knowledge.chunks) {
      if (!chunk.id.startsWith('guard-')) parts.push(chunk.topic, chunk.text);
    }
  } else {
    for (const key of ['oneLiner', 'addressing', 'personalityAxes', 'speechStyle', 'knows', 'unknown', 'goal', 'conflictSeed', 'openingScene']) {
      if (typeof card[key] === 'string') parts.push(card[key] as string);
    }
  }
  // 카드의 부가 프로필(직업·나이·키 등)은 지식 파일 유무와 상관없이 근거다
  if (card.profile) parts.push(JSON.stringify(card.profile));
  return parts.join('\n');
}

// 이번 유저 말이 건드린 개인사 주제 중 설정에 근거가 없는 것. 근거 텍스트는 지식 JSON·카드의 공개 필드를 이어 붙인 글이다.
// 안전장치 조각(guard-*)은 "없다는 사실"을 적은 글이라 근거로 치지 않는다 — 호출부가 걸러서 넘긴다.
export function ungroundedTopics(userMessage: string, groundingText: string): string[] {
  const found: string[] = [];
  for (const topic of TOPICS) {
    if (!topic.ask.test(userMessage)) continue;
    if (topic.covered.test(groundingText)) continue;
    found.push(topic.label);
  }
  return found.slice(0, 4);
}

const logger = new Logger('Grounding');
const MAX_RETRIES = 2;

// 검사에 넘길 설정 자료 줄 (글 전체를 줄 단위로 쪼개 상한 안에서)
export function groundingFacts(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim().slice(0, 300))
    .filter((line) => line.length > 2)
    .slice(0, 60);
}

// 근거 없는 개인사를 물은 턴에서만 호출한다. 답이 그것을 단정했으면(예: "취미는 독서예요", "반려동물은 없어요")
// 이유를 알려 주고 다시 쓰게 한다. 검사가 실패하면 원래 답을 그대로 쓴다 — 검사 때문에 대화가 막히지 않게
export async function keepGrounded(
  context: ContextSlicePayload,
  userTurn: string,
  firstReply: string,
  facts: string[],
  // 다시 쓸 때도 처음 답과 같은 모델로 (기본 모델이면 null)
  model: string | null = null,
): Promise<string> {
  const topics = context.ungroundedTopics;
  if (topics.length === 0) return firstReply;
  let reply = firstReply;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const check = await postToAi<{ invented: boolean; note: string }>('/ground-check', { reply, topics, facts });
      if (!check.invented) return reply;
      if (attempt === MAX_RETRIES) break;
      logger.debug(`개인사 단정 감지(${topics.join(', ')}) → 다시 쓰기 ${attempt + 1}`);
      const retry = await postToAi<{ reply: string }>('/infer', {
        context,
        userTurn,
        model,
        retryNote:
          `방금 쓴 답은 설정에 없는 [${topics.join(', ')}] 내용을 단정했다(${reply.slice(0, 120).replace(/\s+/g, ' ')}). ` +
          '그 내용을 빼고, 있다/없다·구체적인 내용을 말하지 않고 캐릭터답게 말을 돌리거나 되묻는 짧은 한두 문장으로 다시 쓴다.',
      });
      reply = retry.reply;
    } catch {
      return reply;
    }
  }
  // 두 번 다시 써도 단정하면, 단정하지 않는 쪽의 가장 안전한 말로 대신한다
  return '그건… 지금은 말하기가 좀 그러네요. 그 얘기는 다음에 해요.';
}
