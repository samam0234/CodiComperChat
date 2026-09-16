# docs/ 안내 (문서 허브)

`docs/`는 이 프로젝트의 문서 허브다. 코드 옆 README(각 앱의 `README.md` 등, 아직 없음)와 분리해서 기획·아키텍처·Git 기록·실행 가이드·운영 기록을 **폴더별로 고정된 용도**로 모은다.

제품 기획의 원본은 여기 없다 — 루트 [CodiComperChat_project_plan.md](../CodiComperChat_project_plan.md)를 먼저 본다. 이 문서를 포함해 `docs/` 전체는 그 원본에서 파생된 것이며, 원본을 수정할 때는 `.agents/skills/codicomperchat/SKILL.md` §0 원본 보존 원칙을 따른다.

> 현재 세 앱 모두 **뼈대만** 있다 — 화면/라우트는 서고, 내용은 비어 있다. DB/Redis/Docker는 아직 없고, 앱끼리 연결(web→api, api→ai)도 아직 없다. 아래 문서 중 상당수는 "지금 이렇게 동작한다"가 아니라 **계획서 기준의 목표/템플릿**이며, 그렇게 표시해 두었다.

---

## 폴더 맵

```text
docs/
├── README.md                 ← 이 파일 (허브 인덱스)
├── API_DOCUMENTATION.md      ← API 경계 초안
├── DEPLOYMENT.md             ← 배포 짧은 진입
├── WORKFLOW.md               ← AI 호출 파이프라인 요약
├── plan/                     ← 기획·정책·스택 정본급
├── Architecture/             ← 시스템 구조 설명
├── branchs/                  ← 브랜치·커밋 기록 (필수)
├── guidance/                 ← "따라 하기" 실행 가이드
├── find_debug/               ← 날짜별 디버그 일지
├── trainings/                ← 연구·학습 노트 (코드 아님)
├── repeater/                 ← 인프라 장애·해결 지식
├── vaildates/                ← 검증 체크리스트 (철자 의도적 유지)
└── web_management/           ← 배포·포트·운영 기록
```

**한 줄로 구분하면:**

| 성격 | 폴더 |
|------|------|
| 무엇이 맞고 무엇이 정책인가 | `plan/`, `Architecture/` |
| Git을 어떻게 남기는가 | `branchs/`, `guidance/commit-message.md`·`branch-merge.md` |
| 어떻게 돌리는가 | `guidance/` |
| 깨졌을 때 / 검증 / 배포 | `find_debug/`, `repeater/`, `vaildates/`, `web_management/` |
| 공부한 것 | `trainings/` |

---

## 앱과 포트 (계획 §7.3, 포트는 미확정)

| 앱 | 스택 | 위치 | 포트 | 상태 |
|----|------|------|------|------|
| web | Next.js 16 (TSX) | `apps/web/` | 3000 | 전역 셸 구현됨 |
| api | Nest.js 12 (TypeScript, ESM) | `apps/api/` | 4000 | 라우트 뼈대 구현됨 (health 외 501) |
| ai | FastAPI (Python 3.12) | `services/ai/` | 8000 | 라우트 뼈대 구현됨 (health 외 501, train 403) |
| DB | PostgreSQL | — | 5432(제안) | 미착수 |
| 캐시/잡 | Redis | — | 6379(제안) | 미착수 |

정본: [plan/CURRENT_STACK.md](plan/CURRENT_STACK.md)

---

## 빠른 링크

- 기획 원본: [CodiComperChat_project_plan.md](../CodiComperChat_project_plan.md)
- 에이전트 규칙 정본: [.agents/skills/codicomperchat/SKILL.md](../.agents/skills/codicomperchat/SKILL.md)
- 현재 스택: [plan/CURRENT_STACK.md](plan/CURRENT_STACK.md)
- 커밋 메시지: [guidance/commit-message.md](guidance/commit-message.md)
- 브랜치·병합: [guidance/branch-merge.md](guidance/branch-merge.md)
- 커밋 기록: [branchs/README.md](branchs/README.md)

---

## docs에서 하지 말 것

1. **`docs/commits/`에 커밋 기록** → 금지. 오직 `docs/branchs/commits/`만
2. 커밋 기록 생략 ("작다/나중에")
3. `Architecture/`를 안 고치고 구조만 코드로 바꾸기
4. `plan/CURRENT_STACK.md`와 다른 포트/스택 문구를 다른 문서에 방치
5. `vaildates` 폴더명 "교정"
6. `docs/trainings/`에 실제 학습 코드나 캐릭터 카드 원본 내용을 넣기 (연구 노트만)
7. `find_debug/`에만 남기고 재발 가능한 인프라 이슈를 `repeater/`·`web_management/ports-inventory.md`로 안 옮기기
8. 루트 `CodiComperChat_project_plan.md`를 `docs/` 안으로 옮기거나 이름 변경 (§0 원본 보존 원칙)
