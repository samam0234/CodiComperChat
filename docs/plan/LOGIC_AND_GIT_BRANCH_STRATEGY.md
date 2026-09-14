# 로직 작업 순서 + Git 브랜치 전략의 기획 근거

이 문서는 "왜 이 순서로 만드는가"(계획서 §10)와 "왜 이 브랜치 구조인가"(`.agents/skills/codicomperchat/SKILL.md` §5)를 한곳에서 연결한다. 실행 절차 자체는 각 정본 문서를 따른다.

## 로직 순서 (계획서 §10)

```text
1. 모노레포 + docker-compose
2. Prisma 스키마
3. Nest 인증 + 캐릭터/캠페인 CRUD
4. Next 홈 + 세션 채팅 셸
5. FastAPI /infer 스트림 + Nest 프록시
6. 컨텍스트 조립기
7. 세션 종료 요약 → State 갱신
8. 캐릭터 공방 7단계 UI
9. 테스트 3턴, 발행 가드
10. 공식 캐릭터 1명 실제 카드 기입 후 플레이테스트
```

이 순서가 중요한 이유(계획서 원문): 공방을 먼저 예쁘게 만들면 "카드는 있는데 세계가 없는" 데모가 되고, 채팅만 먼저 열면 "모델 말발만 있는" 캐릭터챗이 된다. **상태와 세션을 가운데 두고, 앞뒤로 UI와 추론을 붙인다.**

## 이 순서를 브랜치에 매핑하는 방식 (제안)

각 번호를 하나의 feature 브랜치로 쪼개는 것을 기본으로 한다. 예:

```text
feature/monorepo-scaffold        # 1
feature/prisma-schema            # 2
feature/api-auth-crud            # 3
feature/web-home-chat-shell      # 4
feature/ai-infer-proxy           # 5
feature/context-assembler        # 6
feature/session-close-summary    # 7
feature/studio-7step-ui          # 8
feature/publish-guard-tests      # 9
feature/official-character-launch # 10
```

각 feature는 완료 시 `develop`에 `--no-ff`로 합류한다 (`docs/guidance/branch-merge.md`). 번호 순서를 건너뛰어 뒤 단계(예: 8번 공방 UI)를 먼저 브랜치로 파는 것은, 계획서가 경고한 "카드는 있는데 세계가 없는 데모"를 만들 위험이 있으므로 지양한다.

## 커밋 기록과의 연결

각 feature 브랜치의 커밋마다 `docs/branchs/commits/`에 기록을 남기고, 어떤 로직 단계(1~10)에 해당하는지 기록 md의 "상세 > 배경"에 적어 두면 나중에 §10 순서와 실제 이력을 대조하기 쉽다.

관련: [LOGIC_STRUCTURE.md](LOGIC_STRUCTURE.md), `docs/guidance/branch-merge.md`, `docs/branchs/BRANCH_MAP.md`
