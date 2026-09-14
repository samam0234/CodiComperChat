# 데이터베이스 (기획)

정본: `CodiComperChat_project_plan.md` §7.4, §7.5. 상태: **스키마 미확정 — 테이블명 확정은 Prisma 단계에서.**

## 데이터스토어 (계획서 §7.4)

| 용도 | 추천 | 이유 |
|------|------|------|
| 원본 데이터 | PostgreSQL | 유저, 카드, 세션, 관계, 훅, 로그 |
| 의미 검색 | pgvector 또는 이후 전용 벡터DB | 지난 장면·로어 검색 |
| 세션 캐시·잡 | Redis | 스트림 버퍼, 요약 잡, 동시성 |
| 에셋 | 오브젝트 스토리지 | 초상 이미지 |

ORM은 Nest 쪽 **Prisma**. 카드 타입을 프론트와 공유하기 쉽다.

FastAPI는 원본 DB를 함부로 쓰지 않는다 — 추론에 필요한 슬라이스만 Nest가 조립해 넘긴다. (읽기 전용 replica는 나중에 열 수 있음.)

## 핵심 도메인 (논리 모델, 계획서 §7.5)

- `User`
- `Character` — 카드 본체. JSONB + 정규화 필드 혼합 가능
- `LoreEntry` — 캐릭터 또는 캠페인에 속함
- `Campaign` — 유저 × 캐릭터, 또는 유저 × 월드
- `CampaignState` — 관계, 훅, 지식, 요약 포인터
- `Session`
- `Message`
- `MemoryChunk` — 요약·임베딩된 과거. 원문 전체와 분리

## 캐릭터 창작 폼 타입 (계획서 §7.5, 프론트·Nest DTO·FastAPI 입력이 공유하는 뼈대)

```ts
type CampaignRole = 'companion' | 'rival' | 'client' | 'guide' | 'wildcard';

interface CharacterDraft {
  identity: {
    name: string;
    nickname?: string;
    tagline: string;
    speciesJob?: string;
    apparentAge?: string;
    tags: string[];
    visibility: 'private' | 'link' | 'public';
  };
  appearance: {
    description: string;
    keywords: string[];
    portraitUrl?: string;
  };
  persona: {
    warmth: number;
    directness: number;
    impulse: number;
    protectiveness: number;
    speech: {
      honorific: 'banmal' | 'jondae' | 'mix';
      addressAs: string;
      forbidden: string[];
      habits: string[];
    };
    summary: string;
  };
  campaign: {
    role: CampaignRole;
    openingScene: string;
    known: string;
    unknown: string;
    goal: string;
    stanceToUser: string;
    hook: string;
  };
  bounds: {
    secrets: { text: string; unlockWhen: string }[];
    neverDo: string[];
    dealbreakers: string[];
    content: { violence: 0 | 1 | 2; romance: 0 | 1 | 2; horror: 0 | 1 | 2 };
    noMeta: boolean;
  };
  dialogue: {
    firstMessage: string;
    alternateGreetings: string[];
    examples: { user: string; character: string }[];
  };
  lorebook: {
    keyword: string;
    content: string;
    importance: number;
    insert: 'match' | 'always' | 'conditional';
  }[];
}
```

**세 곳(프론트 폼 상태, Nest DTO, FastAPI 입력)에서 다른 필드명을 쓰지 않는다** — 계획서 원문 그대로: "다른 필드명을 쓰면 말투보다 먼저 공방이 망가진다."

관련: [CURRENT_STACK.md](CURRENT_STACK.md), [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
