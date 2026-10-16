# 데이터베이스

정본: `CodiComperChat_project_plan.md` §7.4, §7.5. 스키마 정본은 코드 `apps/api/prisma/schema.prisma`(각 칸의 의미는 거기 주석에 있다), 바뀐 이력은 `apps/api/prisma/migrations/`. 최종 갱신 2026-10-16.

## 데이터스토어 (계획서 §7.4 → 실제)

| 용도 | 계획서 추천 | 지금 | 비고 |
|------|------|------|------|
| 원본 데이터 | PostgreSQL | **PostgreSQL 16** | 유저, 카드, 대화, 관계, 복선, 결제 |
| 의미 검색 | pgvector 또는 벡터DB | **쓰지 않음** | 캐릭터 설정은 페르소나 지식 JSON(파일) + 글자 2-gram BM25. 임베딩 모델이 생기면 같은 인터페이스로 교체 |
| 세션 캐시·잡 | Redis | **쓰지 않음** | 요청 한도는 메모리 또는 `rate_limit_buckets`, AI 호출 대기열은 프로세스 메모리 |
| 에셋 | 오브젝트 스토리지 | **DB `bytea`** | 초상(150KB 이하)을 `characters.portrait`·`character_drafts.portrait`에. 커지면 스토리지로 옮긴다 |

ORM은 Nest 쪽 **Prisma 7**. FastAPI는 DB를 직접 보지 않는다 — 추론에 필요한 슬라이스만 Nest가 조립해 넘긴다.

## 테이블 (15개)

계획서 핵심 도메인(§7.5) 8개 중 7개가 있고(`LoreEntry`는 카드 JSON·지식 파일로 대신), 구현하며 8개가 생겼다.

| 테이블 (모델) | 계획서 | 무엇 | 지워질 때 |
|---|---|---|---|
| `users` (User) | ● | 이메일·표시 이름·비밀번호 해시·역할(USER/ADMIN)·요금 등급(FREE/PRO, `planUntil`)·이메일 인증 시각·토큰 세대(`sessionVersion`) | 탈퇴: 아래 Cascade가 함께 지워짐 |
| `user_personas` (UserPersona) | | 대화할 때 내가 연기할 프로필 캐릭터(이름·소개), 계정당 10개 | 계정과 함께 |
| `characters` (Character) | ● | 발행된 캐릭터(카드 핵심 필드·비밀·시작 장면·프로필·공개 범위·초상·운영자가 내린 시각·사유). `ownerId`가 비면 운영 공식 캐릭터 | 주인 탈퇴 시 `ownerId` 비움(그 전에 내림) |
| `campaigns` (Campaign) | ● | 유저 × 캐릭터 대화 한 판. 지금 대화(ACTIVE) 하나 + 저장한 대화(CLOSED). 고정된 내 프로필 이름·소개를 그대로 복사해 둔다 | 계정과 함께 |
| `campaign_states` (CampaignState) | ● | 친밀도(값·근거·자동 여부·변화 기록), 호칭, 열린 복선·끝난 일, 해금된 비밀, 다음 회차 요약, 정리한 지점 | 대화와 함께 |
| `sessions` (Session) | ● | 회차(지금은 대화당 하나) | 대화와 함께 |
| `messages` (Message) | ● | 유저·캐릭터 말(역할·내용·말한 이름) | 회차와 함께 |
| `memory_chunks` (MemoryChunk) | ● | 대화에서 정리한 장기 기억 한 줄씩 | 대화와 함께 |
| `character_drafts` (CharacterDraft) | | 공방 초안: 카드 7층 JSON, 마지막 3턴 테스트(카드 지문 포함), 초상·검수 상태(APPROVED/PENDING/REJECTED·사유), 공개 범위, 발행된 캐릭터 연결 | 계정과 함께 |
| `user_extras` (UserExtra) | | 내가 만든 엑스트라(조연): 이름·요약·성격·관계·상황·장소 | 계정과 함께 |
| `campaign_extras` (CampaignExtra) | | 이 대화에 적용한 엑스트라와 등장 조건 | 대화·엑스트라와 함께 |
| `character_reports` (CharacterReport) | | 캐릭터 신고(사유·내용·처리 상태·처리 메모) | 신고한 계정·캐릭터와 함께 |
| `email_tokens` (EmailToken) | | 이메일 인증·비밀번호 재설정 일회용 토큰 — **원문은 메일에만, DB에는 SHA-256 해시** | 계정과 함께 |
| `payment_orders` (PaymentOrder) | | 결제 주문(상품·금액·일수·결제사·상태 PENDING/PAID/FAILED/REFUNDED·결제 키·영수증·환불 사유·구매자 이메일) | **계정이 지워져도 남는다**(`userId`만 비움, 전자상거래법상 결제 기록 보관) |
| `rate_limit_buckets` (RateLimitBucket) | | 요청 한도 카운터(키·횟수·창 끝 시각). `RATE_LIMIT_STORE=db`일 때만 쓴다 | 창이 끝나고 5분 뒤 주기적으로 삭제 |

### 비공개로 다루는 칸

- `characters.secret`·`secretUnlockCondition`: 어떤 공개 응답에도 싣지 않고 AI에도 보내지 않는다(계획서 §13.3)
- `users.passwordHash`, `email_tokens.tokenHash`: 응답에 싣지 않는다
- 초상 본문(`portrait`)은 목록 응답에 싣지 않고 따로 받는다(`GET /characters/:id/portrait`)

### 파일로 두는 것 (DB 밖)

- 페르소나 지식 JSON: `apps/api/data/personas/*.json` (git 제외, 발행하면 공방이 만든다) · [`apps/api/data/personas/README.md`](../../apps/api/data/personas/README.md)

## 마이그레이션

```bash
cd apps/api
npx prisma migrate dev --name <이름>   # 스키마를 고친 뒤 (개발 DB)
npx prisma migrate deploy              # 이미 만든 마이그레이션만 적용 (e2e·CI·운영)
npx prisma generate                    # 클라이언트 다시 만들기
```

기존 데이터를 옮겨야 하는 변경은 `--create-only`로 만든 뒤 SQL을 덧붙였다(예: 이메일 인증 도입 전 계정은 인증된 것으로, 검수 도입 전 초상은 승인된 것으로, 기존 주문에 구매자 이메일 채우기).

## 캐릭터 창작 폼 타입 (계획서 §7.5 원안)

> 실제 공방 카드는 이 원안을 바탕으로 7층 `identity · appearance · personality · campaign · boundary · greeting · lore`로 만들었다. 정본은 `apps/api/src/studio/card.ts`(서버, 길이 제한·정규화)이고 웹 `apps/web/lib/studio-card.ts`가 같은 모양을 쓴다. 아래는 계획서 원안 그대로 남긴다.

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
