# ERD (개체 관계도)

정본은 코드다: 스키마 `apps/api/prisma/schema.prisma`, 실제 테이블은 `apps/api/prisma/migrations/`. 이 문서의 그림과 표는 **마이그레이션을 모두 적용한 PostgreSQL 16을 직접 읽어** 만든 것이다(`scripts/erd/build.mjs`). 손으로 옮겨 적은 칸은 없다. 각 칸의 뜻은 `schema.prisma`의 주석과 [DATABASE.md](DATABASE.md)에 있다. 최종 갱신 2026-11-07.

<!-- erd:counts -->
테이블 **37개** · 외래 키 **40개** · 열거형 **17개** · 마이그레이션 **34개**
<!-- /erd:counts -->

<!-- logic-structure -->
## 로직 구조

```text
apps/api/prisma/migrations/*/migration.sql
        │ 빈 PostgreSQL에 순서대로 적용 (또는 prisma migrate deploy를 마친 DB)
        ▼
information_schema · pg_constraint · pg_indexes · pg_enum  ── 읽기만 한다
        │ node scripts/erd/build.mjs --db <URL>
        ▼
docs/plan/ERD.md (이 문서의 <!-- erd:* --> 구간) + docs/.assets/erd/*.mmd
        │ mmdc (scripts/erd/README.md)
        ▼
docs/.assets/erd/*.svg · *.png
```

<!-- logic-mermaid -->

### 이 문서가 만들어지는 순서

```mermaid
flowchart LR
  MG["migrations/*.sql"] --> PG["PostgreSQL 16<br/>(마이그레이션 적용)"]
  PG -->|"읽기만"| B["scripts/erd/build.mjs"]
  SC["schema.prisma<br/>(칸 순서)"] --> B
  B --> MD["ERD.md 구간"]
  B --> MMD[".assets/erd/*.mmd"]
  MMD -->|"mmdc"| IMG["*.svg · *.png"]
```

## 읽는 법

| 표기 | 뜻 |
|---|---|
| `PK` · `FK` · `UK` | 기본 키 · 외래 키 · 단독 고유 키 |
| `UK(a+b)` | 여러 칸을 묶은 고유 키 (그 칸들의 조합이 겹치지 않는다) |
| `NULL` | 비어 있을 수 있다. 표시가 없으면 `NOT NULL` |
| `기본 …` | **DB에 걸린** 기본값. `now()`는 `CURRENT_TIMESTAMP` |
| 관계선 이름 | `외래 키 칸 · 부모 행을 지울 때 동작(CASCADE·SET NULL·RESTRICT)` |
| `\|\|--o{` | 부모 1 : 자식 0..N |
| `\|o--o{` | 외래 키가 비어 있을 수 있음 (부모 0..1 : 자식 0..N) |
| `\|\|--o\|` · `\|o--o\|` | 1 : 0..1 (외래 키 칸이 고유) |

DB에 기본값이 없는 두 가지는 앱(Prisma)이 채운다: 모든 `id`(문자열)는 `@default(cuid())`, `updatedAt`은 `@updatedAt`. 타입 이름은 PostgreSQL 그대로이고(`timestamp(3)`은 밀리초까지, 시간대 없음), 대문자로 시작하는 타입은 아래 [열거형](#열거형)이다.

## 전체 관계도

37개 테이블과 외래 키만 그린 지도. 칸까지 보려면 아래 영역별 그림을 본다.

![전체 관계도](../.assets/erd/overview.svg)

<!-- erd:overview -->
```mermaid
erDiagram
  direction LR
  board_posts ||--o{ board_comments : "postId · CASCADE"
  campaigns ||--o{ board_posts : "campaignId · CASCADE"
  campaigns ||--o{ campaign_extras : "campaignId · CASCADE"
  campaigns ||--o| campaign_states : "campaignId · CASCADE"
  campaigns ||--o{ diary_entries : "campaignId · CASCADE"
  campaigns ||--o{ direct_messages : "campaignId · CASCADE"
  campaigns ||--o{ memory_chunks : "campaignId · CASCADE"
  campaigns ||--o{ mind_readings : "campaignId · CASCADE"
  campaigns ||--o{ photonet_images : "campaignId · CASCADE"
  campaigns ||--o{ sessions : "campaignId · CASCADE"
  campaigns ||--o{ webtoons : "campaignId · CASCADE"
  characters ||--o{ campaigns : "characterId · RESTRICT"
  characters |o--o| character_drafts : "characterId · SET NULL"
  characters ||--o{ character_reports : "characterId · CASCADE"
  characters |o--o{ world_cast : "characterId · SET NULL"
  sessions ||--o{ messages : "sessionId · CASCADE"
  user_extras ||--o{ campaign_extras : "extraId · CASCADE"
  users ||--o{ attendances : "userId · CASCADE"
  users ||--o{ campaigns : "userId · CASCADE"
  users ||--o{ character_drafts : "ownerId · CASCADE"
  users ||--o{ character_reports : "reporterId · CASCADE"
  users |o--o{ characters : "ownerId · SET NULL"
  users ||--o{ content_reports : "reporterId · CASCADE"
  users ||--o{ credit_ledger : "userId · CASCADE"
  users ||--o{ email_tokens : "userId · CASCADE"
  users ||--o{ model_usage : "userId · CASCADE"
  users |o--o{ payment_orders : "userId · SET NULL"
  users ||--o{ quest_rewards : "userId · CASCADE"
  users ||--o{ user_extras : "userId · CASCADE"
  users ||--o{ user_personas : "userId · CASCADE"
  users ||--o{ world_plays : "userId · CASCADE"
  users |o--o{ worlds : "ownerId · SET NULL"
  webtoons ||--o{ webtoon_panels : "webtoonId · CASCADE"
  world_plays ||--o{ world_events : "playId · CASCADE"
  world_plays ||--o{ world_messages : "playId · CASCADE"
  worlds ||--o{ world_cast : "worldId · CASCADE"
  worlds ||--o{ world_images : "worldId · CASCADE"
  worlds ||--o{ world_parts : "worldId · CASCADE"
  worlds ||--o{ world_places : "worldId · CASCADE"
  worlds ||--o{ world_plays : "worldId · CASCADE"
  app_settings
  rate_limit_buckets
```
<!-- /erd:overview -->

## 영역별 상세

다른 영역의 테이블은 `id`만 그리고 "○○ 그림에 전체"라고 적었다. 큰 그림은 [SVG](../.assets/erd/)를 새 탭에서 열면 확대해 볼 수 있다.

### 1. 계정 · 결제 · 코레딧

![계정 · 결제 · 코레딧](../.assets/erd/account.svg)

<!-- erd:account -->
```mermaid
erDiagram
  users ||--o{ attendances : "userId · CASCADE"
  users ||--o{ credit_ledger : "userId · CASCADE"
  users ||--o{ email_tokens : "userId · CASCADE"
  users ||--o{ model_usage : "userId · CASCADE"
  users |o--o{ payment_orders : "userId · SET NULL"
  users ||--o{ quest_rewards : "userId · CASCADE"
  users ||--o{ user_personas : "userId · CASCADE"
  users {
    text id PK
    text email UK
    text displayName
    text passwordHash "NULL"
    UserRole role "기본 USER"
    UserPlan plan "기본 FREE"
    timestamp(3) planUntil "NULL"
    timestamp(3) emailVerifiedAt "NULL"
    date birthDate "NULL"
    timestamp(3) adultConsentAt "NULL"
    timestamp(3) suspendedAt "NULL"
    text suspendReason "NULL"
    integer sessionVersion "기본 0"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) updatedAt
    integer credits "기본 0"
  }
  user_personas {
    text id PK
    text userId FK
    text name
    text description "기본 ''"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) updatedAt
  }
  email_tokens {
    text id PK
    text userId FK
    EmailTokenPurpose purpose
    text tokenHash UK
    timestamp(3) expiresAt
    timestamp(3) usedAt "NULL"
    timestamp(3) createdAt "기본 now()"
  }
  payment_orders {
    text id PK
    text userId FK "NULL"
    text buyerEmail "NULL"
    text productId
    integer amount
    integer days
    text provider
    PaymentStatus status "기본 PENDING"
    text paymentKey UK "NULL"
    text failReason "NULL"
    text receiptUrl "NULL"
    timestamp(3) refundedAt "NULL"
    text refundReason "NULL"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) paidAt "NULL"
  }
  credit_ledger {
    text id PK
    text userId FK
    integer delta
    integer balance
    CreditReason reason
    text modelId "NULL"
    timestamp(3) createdAt "기본 now()"
  }
  attendances {
    text userId PK,FK
    text day PK
    integer credits
    timestamp(3) createdAt "기본 now()"
  }
  model_usage {
    text userId PK,FK
    text modelId PK
    text day PK
    integer count "기본 0"
  }
  quest_rewards {
    text id PK
    text userId FK "UK(userId+characterId)"
    text characterId "UK(userId+characterId)"
    integer amount
    timestamp(3) createdAt "기본 now()"
  }
```
<!-- /erd:account -->

### 2. 캐릭터 · 대화

`campaigns`가 유저 × 캐릭터 대화 한 판이다. `characters`를 지우려 하면 대화가 남아 있는 한 막힌다(`RESTRICT`) — 운영에서 캐릭터는 지우지 않고 내린다(`takenDownAt`).

![캐릭터 · 대화](../.assets/erd/chat.svg)

<!-- erd:chat -->
```mermaid
erDiagram
  campaigns ||--o{ campaign_extras : "campaignId · CASCADE"
  campaigns ||--o| campaign_states : "campaignId · CASCADE"
  campaigns ||--o{ memory_chunks : "campaignId · CASCADE"
  campaigns ||--o{ sessions : "campaignId · CASCADE"
  characters ||--o{ campaigns : "characterId · RESTRICT"
  characters |o--o| character_drafts : "characterId · SET NULL"
  characters ||--o{ character_reports : "characterId · CASCADE"
  sessions ||--o{ messages : "sessionId · CASCADE"
  user_extras ||--o{ campaign_extras : "extraId · CASCADE"
  users ||--o{ campaigns : "userId · CASCADE"
  users ||--o{ character_drafts : "ownerId · CASCADE"
  users ||--o{ character_reports : "reporterId · CASCADE"
  users |o--o{ characters : "ownerId · SET NULL"
  users ||--o{ content_reports : "reporterId · CASCADE"
  users ||--o{ user_extras : "userId · CASCADE"
  users {
    text id PK "계정 그림에 전체"
  }
  characters {
    text id PK
    text name UK
    text oneLiner
    text role
    text addressing
    text personalityAxes
    text speechStyle
    text knows
    text unknown
    text goal
    text conflictSeed
    text secret
    text secretUnlockCondition
    text openingScene
    jsonb quest "NULL"
    jsonb recommendedPersona "NULL"
    jsonb profile "NULL"
    boolean published "기본 false"
    CharacterVisibility visibility "기본 PUBLIC"
    bytea portrait "NULL"
    text portraitMime "NULL"
    timestamp(3) takenDownAt "NULL"
    text takedownReason "NULL"
    text ownerId FK "NULL"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) updatedAt
  }
  character_drafts {
    text id PK
    text ownerId FK
    jsonb card
    jsonb lastTest "NULL"
    bytea portrait "NULL"
    text portraitMime "NULL"
    PortraitReview portraitReview "NULL"
    text portraitReviewNote "NULL"
    CharacterVisibility visibility "기본 PRIVATE"
    text characterId FK,UK "NULL"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) updatedAt
  }
  character_reports {
    text id PK
    text characterId FK
    text reporterId FK
    text reason
    text detail
    ReportStatus status "기본 OPEN"
    text resolution "NULL"
    timestamp(3) resolvedAt "NULL"
    timestamp(3) createdAt "기본 now()"
  }
  content_reports {
    text id PK
    text reporterId FK
    ContentTarget target
    text targetId
    text reason
    text detail
    ContentReportStatus status "기본 OPEN"
    text resolution "NULL"
    timestamp(3) resolvedAt "NULL"
    timestamp(3) createdAt "기본 now()"
  }
  campaigns {
    text id PK
    text userId FK
    text characterId FK
    text title
    CampaignStatus status "기본 ACTIVE"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) updatedAt
    text personaId "NULL"
    text personaName "NULL"
    text personaDescription "NULL"
    timestamp(3) savedAt "NULL"
    timestamp(3) memorizedUntil "NULL"
    text chatModel "기본 basic"
  }
  campaign_states {
    text id PK
    text campaignId FK,UK
    integer relationshipValue "기본 0"
    text relationshipNote "NULL"
    text userNickname "NULL"
    jsonb openHooks "기본 []"
    jsonb unlockedSecrets "기본 []"
    text briefForNextSession "NULL"
    boolean autoRelationship "기본 true"
    text relationshipReason "NULL"
    jsonb relationshipLog "기본 []"
    jsonb closedEvents "기본 []"
    timestamp(3) digestedUntil "NULL"
    jsonb questState "NULL"
    timestamp(3) updatedAt
  }
  sessions {
    text id PK
    text campaignId FK "UK(campaignId+index)"
    integer index "UK(campaignId+index)"
    SessionStatus status "기본 OPEN"
    timestamp(3) startedAt "기본 now()"
    timestamp(3) closedAt "NULL"
    text summaryBrief "NULL"
  }
  messages {
    text id PK
    text sessionId FK
    MessageRole role
    text content
    text speaker "NULL"
    timestamp(3) createdAt "기본 now()"
  }
  memory_chunks {
    text id PK
    text campaignId FK
    text content
    timestamp(3) createdAt "기본 now()"
  }
  user_extras {
    text id PK
    text userId FK
    text name
    text summary
    text personality
    text relation
    text situation
    text place
    timestamp(3) createdAt "기본 now()"
    timestamp(3) updatedAt
  }
  campaign_extras {
    text campaignId PK,FK
    text extraId PK,FK
    text[] triggers "NULL"
    timestamp(3) createdAt "기본 now()"
  }
```
<!-- /erd:chat -->

### 3. 오퍼레이션 (대화 플러그인)

전부 대화(`campaigns`)에 매달려 있어 대화를 지우면 함께 지워진다.

![오퍼레이션](../.assets/erd/ops.svg)

<!-- erd:ops -->
```mermaid
erDiagram
  board_posts ||--o{ board_comments : "postId · CASCADE"
  campaigns ||--o{ board_posts : "campaignId · CASCADE"
  campaigns ||--o{ diary_entries : "campaignId · CASCADE"
  campaigns ||--o{ direct_messages : "campaignId · CASCADE"
  campaigns ||--o{ mind_readings : "campaignId · CASCADE"
  campaigns ||--o{ photonet_images : "campaignId · CASCADE"
  campaigns ||--o{ webtoons : "campaignId · CASCADE"
  webtoons ||--o{ webtoon_panels : "webtoonId · CASCADE"
  campaigns {
    text id PK "대화 그림에 전체"
  }
  mind_readings {
    text id PK
    text campaignId FK
    text innerVoice
    text feeling
    text aboutUser
    timestamp(3) createdAt "기본 now()"
  }
  diary_entries {
    text id PK
    text campaignId FK
    text title
    text mood
    text body
    timestamp(3) createdAt "기본 now()"
  }
  direct_messages {
    text id PK
    text campaignId FK
    MessageRole role
    text content
    timestamp(3) createdAt "기본 now()"
  }
  board_posts {
    text id PK
    text campaignId FK
    BoardAuthor authorKind
    text authorName
    text title
    text body
    timestamp(3) createdAt "기본 now()"
  }
  board_comments {
    text id PK
    text postId FK
    BoardAuthor authorKind
    text authorName
    text body
    timestamp(3) createdAt "기본 now()"
  }
  photonet_images {
    text id PK
    text campaignId FK
    text prompt
    text promptUsed
    text style
    text ratio
    text rating "기본 sfw"
    timestamp(3) blockedAt "NULL"
    text blockReason "NULL"
    text mime
    bytea data
    integer width
    integer height
    timestamp(3) createdAt "기본 now()"
  }
  webtoons {
    text id PK
    text campaignId FK
    text title
    text prompt
    text rating "기본 sfw"
    timestamp(3) blockedAt "NULL"
    text blockReason "NULL"
    timestamp(3) createdAt "기본 now()"
  }
  webtoon_panels {
    text id PK
    text webtoonId FK "UK(webtoonId+index)"
    integer index "UK(webtoonId+index)"
    jsonb plan
    text caption
    jsonb lines "기본 []"
    text promptUsed "NULL"
    text mime "NULL"
    bytea data "NULL"
    integer width "NULL"
    integer height "NULL"
    timestamp(3) drawnAt "NULL"
  }
```
<!-- /erd:ops -->

### 4. 월드코퍼챗

![월드코퍼챗](../.assets/erd/world.svg)

<!-- erd:world -->
```mermaid
erDiagram
  characters |o--o{ world_cast : "characterId · SET NULL"
  users ||--o{ world_plays : "userId · CASCADE"
  users |o--o{ worlds : "ownerId · SET NULL"
  world_plays ||--o{ world_events : "playId · CASCADE"
  world_plays ||--o{ world_messages : "playId · CASCADE"
  worlds ||--o{ world_cast : "worldId · CASCADE"
  worlds ||--o{ world_images : "worldId · CASCADE"
  worlds ||--o{ world_parts : "worldId · CASCADE"
  worlds ||--o{ world_places : "worldId · CASCADE"
  worlds ||--o{ world_plays : "worldId · CASCADE"
  users {
    text id PK "계정 그림에 전체"
  }
  characters {
    text id PK "대화 그림에 전체"
  }
  worlds {
    text id PK
    text ownerId FK "NULL"
    text title
    text oneLiner "기본 ''"
    text setting "기본 ''"
    text rules "기본 ''"
    text opening "기본 ''"
    WorldMode mode "기본 CHAT"
    CharacterVisibility visibility "기본 PRIVATE"
    boolean published "기본 false"
    bytea map "NULL"
    text mapMime "NULL"
    PortraitReview mapReview "기본 APPROVED"
    timestamp(3) takenDownAt "NULL"
    text takedownReason "NULL"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) updatedAt
  }
  world_cast {
    text id PK
    text worldId FK "UK(worldId+name)"
    text characterId FK "NULL"
    text name "UK(worldId+name)"
    text summary
    text speech "기본 ''"
    text startPlace "기본 ''"
    text homePlace "기본 ''"
    integer order "기본 0"
  }
  world_places {
    text id PK
    text worldId FK "UK(worldId+name)"
    text name "UK(worldId+name)"
    float8 x
    float8 y
    text note "기본 ''"
    integer order "기본 0"
  }
  world_parts {
    text id PK
    text worldId FK "UK(worldId+order)"
    integer order "UK(worldId+order)"
    text title
    text goal
    text opening "기본 ''"
  }
  world_images {
    text id PK
    text worldId FK "UK(worldId+label)"
    text label "UK(worldId+label)"
    text character "기본 ''"
    text mime
    bytea data
    PortraitReview review "기본 APPROVED"
    text reviewNote "NULL"
    timestamp(3) blockedAt "NULL"
    timestamp(3) createdAt "기본 now()"
  }
  world_plays {
    text id PK
    text userId FK "UK(userId+worldId)"
    text worldId FK "UK(userId+worldId)"
    text personaName
    text personaDescription "기본 ''"
    integer partIndex "기본 0"
    boolean finished "기본 false"
    jsonb locations "기본 {}"
    integer turns "기본 0"
    integer turnsSinceEvent "기본 0"
    text eventNote "NULL"
    text storySoFar "기본 ''"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) updatedAt
  }
  world_messages {
    text id PK
    text playId FK
    MessageRole role
    text content
    text imageId "NULL"
    timestamp(3) createdAt "기본 now()"
  }
  world_events {
    text id PK
    text playId FK
    text userId
    WorldEventKind kind
    WorldEventStatus status "기본 OPEN"
    jsonb setup
    jsonb outcome "NULL"
    integer reward "기본 0"
    boolean rewarded "기본 false"
    text rewardDay "NULL"
    timestamp(3) createdAt "기본 now()"
    timestamp(3) resolvedAt "NULL"
  }
```
<!-- /erd:world -->

### 5. 독립 테이블

외래 키가 없다. `rate_limit_buckets`는 `RATE_LIMIT_STORE=db`일 때만 쓰는 요청 한도 카운터, `app_settings`는 운영 콘솔이 바꾸는 키 → JSON 설정이다.

<!-- erd:standalone -->
```mermaid
erDiagram
  rate_limit_buckets {
    text key PK
    integer count
    timestamp(3) resetAt
  }
  app_settings {
    text key PK
    jsonb value
    timestamp(3) updatedAt
  }
```
<!-- /erd:standalone -->

## 외래 키 없이 다른 행의 id를 담는 칸

DB 제약은 없고 앱 코드가 뜻을 정한다. 그래서 관계선으로 그리지 않았다. 근거는 `schema.prisma`의 주석이다.

| 칸 | 담는 것 | 외래 키를 두지 않은 이유 (schema.prisma) |
|---|---|---|
| `campaigns.personaId` | 대화에 고정한 내 프로필(`user_personas.id`) | 프로필을 고치거나 지워도 대화가 흔들리지 않게 이름·소개(`personaName`·`personaDescription`)를 복사해 둔다 |
| `content_reports.targetId` | `target`에 따라 `photonet_images`·`webtoons`·`worlds`의 id | 그림이 지워져도 신고는 남게 |
| `quest_rewards.characterId` | 보상을 준 캐릭터 id | 계정 × 캐릭터당 한 번만 주는 기록 (`UK(userId+characterId)`) |
| `world_events.userId` | 이벤트를 받은 계정 id | 하루 보상 한도를 세는 칸 (`INDEX(userId, rewardDay)`) |
| `world_messages.imageId` | 함께 보여 줄 장면 그림(`world_images.id`) | 주석: "WorldImage id" |
| `credit_ledger.modelId` | 모델 id 또는 `op:이름`·`quest:캐릭터 id`·`event:종류` | 이유(`reason`)에 따라 다른 것을 적는 칸 |

## 외래 키 전체

<!-- erd:fks -->
| 외래 키 칸 | 가리키는 곳 | 부모를 지우면 |
|---|---|---|
| `board_comments.postId` | `board_posts.id` | CASCADE |
| `board_posts.campaignId` | `campaigns.id` | CASCADE |
| `campaign_extras.campaignId` | `campaigns.id` | CASCADE |
| `campaign_states.campaignId` | `campaigns.id` | CASCADE |
| `diary_entries.campaignId` | `campaigns.id` | CASCADE |
| `direct_messages.campaignId` | `campaigns.id` | CASCADE |
| `memory_chunks.campaignId` | `campaigns.id` | CASCADE |
| `mind_readings.campaignId` | `campaigns.id` | CASCADE |
| `photonet_images.campaignId` | `campaigns.id` | CASCADE |
| `sessions.campaignId` | `campaigns.id` | CASCADE |
| `webtoons.campaignId` | `campaigns.id` | CASCADE |
| `campaigns.characterId` | `characters.id` | RESTRICT |
| `character_drafts.characterId` | `characters.id` | SET NULL |
| `character_reports.characterId` | `characters.id` | CASCADE |
| `world_cast.characterId` | `characters.id` | SET NULL |
| `messages.sessionId` | `sessions.id` | CASCADE |
| `campaign_extras.extraId` | `user_extras.id` | CASCADE |
| `attendances.userId` | `users.id` | CASCADE |
| `campaigns.userId` | `users.id` | CASCADE |
| `character_drafts.ownerId` | `users.id` | CASCADE |
| `character_reports.reporterId` | `users.id` | CASCADE |
| `characters.ownerId` | `users.id` | SET NULL |
| `content_reports.reporterId` | `users.id` | CASCADE |
| `credit_ledger.userId` | `users.id` | CASCADE |
| `email_tokens.userId` | `users.id` | CASCADE |
| `model_usage.userId` | `users.id` | CASCADE |
| `payment_orders.userId` | `users.id` | SET NULL |
| `quest_rewards.userId` | `users.id` | CASCADE |
| `user_extras.userId` | `users.id` | CASCADE |
| `user_personas.userId` | `users.id` | CASCADE |
| `world_plays.userId` | `users.id` | CASCADE |
| `worlds.ownerId` | `users.id` | SET NULL |
| `webtoon_panels.webtoonId` | `webtoons.id` | CASCADE |
| `world_events.playId` | `world_plays.id` | CASCADE |
| `world_messages.playId` | `world_plays.id` | CASCADE |
| `world_cast.worldId` | `worlds.id` | CASCADE |
| `world_images.worldId` | `worlds.id` | CASCADE |
| `world_parts.worldId` | `worlds.id` | CASCADE |
| `world_places.worldId` | `worlds.id` | CASCADE |
| `world_plays.worldId` | `worlds.id` | CASCADE |
<!-- /erd:fks -->

## 복합 키 · 고유 키 · 인덱스

기본 키가 `id` 하나인 테이블은 빼고, 그 밖의 키와 인덱스를 모두 적었다.

<!-- erd:keys -->
| 테이블 | 종류 | 칸 |
|---|---|---|
| `attendances` | 복합 PK | `userId`, `day` |
| `campaign_extras` | 복합 PK | `campaignId`, `extraId` |
| `model_usage` | 복합 PK | `userId`, `modelId`, `day` |
| `campaign_states` | UNIQUE | `campaignId` |
| `character_drafts` | UNIQUE | `characterId` |
| `characters` | UNIQUE | `name` |
| `email_tokens` | UNIQUE | `tokenHash` |
| `payment_orders` | UNIQUE | `paymentKey` |
| `quest_rewards` | UNIQUE | `userId`, `characterId` |
| `sessions` | UNIQUE | `campaignId`, `index` |
| `users` | UNIQUE | `email` |
| `webtoon_panels` | UNIQUE | `webtoonId`, `index` |
| `world_cast` | UNIQUE | `worldId`, `name` |
| `world_images` | UNIQUE | `worldId`, `label` |
| `world_parts` | UNIQUE | `worldId`, `order` |
| `world_places` | UNIQUE | `worldId`, `name` |
| `world_plays` | UNIQUE | `userId`, `worldId` |
| `board_comments` | INDEX | `postId`, `createdAt` |
| `board_posts` | INDEX | `campaignId`, `createdAt` |
| `campaigns` | INDEX | `userId`, `characterId`, `status` |
| `character_drafts` | INDEX | `ownerId`, `updatedAt` |
| `character_reports` | INDEX | `status`, `createdAt` |
| `character_reports` | INDEX | `characterId`, `status` |
| `content_reports` | INDEX | `status`, `createdAt` |
| `content_reports` | INDEX | `target`, `targetId`, `status` |
| `credit_ledger` | INDEX | `userId`, `createdAt` |
| `diary_entries` | INDEX | `campaignId`, `createdAt` |
| `direct_messages` | INDEX | `campaignId`, `createdAt` |
| `email_tokens` | INDEX | `userId`, `purpose` |
| `memory_chunks` | INDEX | `campaignId`, `createdAt` |
| `messages` | INDEX | `sessionId`, `createdAt` |
| `mind_readings` | INDEX | `campaignId`, `createdAt` |
| `model_usage` | INDEX | `day` |
| `payment_orders` | INDEX | `userId`, `createdAt` |
| `photonet_images` | INDEX | `campaignId`, `createdAt` |
| `rate_limit_buckets` | INDEX | `resetAt` |
| `user_extras` | INDEX | `userId`, `updatedAt` |
| `user_personas` | INDEX | `userId` |
| `webtoons` | INDEX | `campaignId`, `createdAt` |
| `world_events` | INDEX | `userId`, `rewardDay` |
| `world_events` | INDEX | `status`, `createdAt` |
| `world_images` | INDEX | `review` |
| `world_messages` | INDEX | `playId`, `createdAt` |
| `worlds` | INDEX | `published`, `visibility`, `takenDownAt` |
| `worlds` | INDEX | `ownerId` |
<!-- /erd:keys -->

## 열거형

<!-- erd:enums -->
| 열거형 | 값 |
|---|---|
| `BoardAuthor` | `USER` · `RESIDENT` |
| `CampaignStatus` | `ACTIVE` · `CLOSED` |
| `CharacterVisibility` | `PUBLIC` · `UNLISTED` · `PRIVATE` |
| `ContentReportStatus` | `OPEN` · `BLOCKED` · `DISMISSED` |
| `ContentTarget` | `PHOTONET` · `WEBTOON` · `WORLD` |
| `CreditReason` | `ATTENDANCE` · `MODEL_USE` · `REFUND` · `ADMIN` · `OPERATION` · `QUEST` · `EVENT` |
| `EmailTokenPurpose` | `VERIFY_EMAIL` · `RESET_PASSWORD` |
| `MessageRole` | `USER` · `CHARACTER` · `SYSTEM` |
| `PaymentStatus` | `PENDING` · `PAID` · `FAILED` · `REFUNDED` |
| `PortraitReview` | `APPROVED` · `PENDING` · `REJECTED` |
| `ReportStatus` | `OPEN` · `RESOLVED` · `DISMISSED` |
| `SessionStatus` | `OPEN` · `CLOSED` |
| `UserPlan` | `FREE` · `PRO` |
| `UserRole` | `USER` · `ADMIN` |
| `WorldEventKind` | `LADDER` · `DICE` · `BOWLING` · `LOTTERY` · `MAZE` |
| `WorldEventStatus` | `OPEN` · `WON` · `LOST` · `EXPIRED` |
| `WorldMode` | `CHAT` · `VISUAL_NOVEL` · `NOVEL` · `MESSENGER` |
<!-- /erd:enums -->

## 검증

2026-11-07에 다음으로 확인했다.

- 빈 PostgreSQL 16에 마이그레이션 34개를 이름 순서대로 적용 → 오류 없음, 테이블 37개.
- DB의 칸 목록·NULL 허용을 `schema.prisma`의 스칼라 필드와 한 칸씩 대조 → 어긋남 없음. 단 `campaign_extras.triggers`(`String[]`)는 DB에서 NULL 허용인데, Prisma가 목록 칸에 `NOT NULL`을 걸지 않기 때문이다(스키마와 마이그레이션은 일치).
- 외래 키 45줄(나중 마이그레이션이 `ON DELETE`를 바꾸며 다시 만든 5개 포함) → 최종 40개. 모두 `schema.prisma`의 `@relation`과 같다.

2026-11-08 마이그레이션 `20261108123000_chat_memory_scene`은 테이블을 늘리지 않고 칸만 더한다. `memory_chunks.pinned`(기본 거짓), `campaign_states.sceneTime`·`scenePlace`, `world_plays.sceneTime`·`scenePlace`. 위 34개 대조를 이 칸이 생긴 뒤 빈 데이터베이스에 다시 돌리지는 않았다.

## 다시 만들기

스키마를 바꾼 뒤 [scripts/erd/README.md](../../scripts/erd/README.md)대로 돌린다. 테이블이 늘면 `build.mjs`의 `groups`에 넣어야 한다(빠지면 멈춘다).
