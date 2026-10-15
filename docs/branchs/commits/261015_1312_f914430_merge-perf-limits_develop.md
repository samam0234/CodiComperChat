# merge: feature/perf-limits into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/perf-limits into develop (no-ff)` |
| Full SHA | `f91443098ac3b999effe861b2ac029a2e036e201` |
| Short SHA | `f914430` |
| Branch | `develop` |
| Parent | `555ccfe`, `1bdc43a` |
| Date | 2026-10-15T13:12:42+09:00 |

## 주 내용

- `feature/perf-limits`를 `develop`에 `--no-ff`로 병합
- AI 호출 대기열·타임아웃과 부하 측정

## 상세

**배경**
사용자 지시("병합하고 푸시")에 따라 AI 품질 평가 → 웹 e2e → 보안·운영 → 프로 등급 → 성능 브랜치 5개를 쌓인 순서대로 병합한다.

**변경 범위**
apps/api(ai, conversations, health), services/ai(fake_llm), e2e/bench

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용. 브랜치가 앞 브랜치 위에 쌓여 있어 순서대로 합치면 충돌이 없다.

**안 한 것**
없음

## 결과

**동작 확인**
`git merge --no-ff` 정상 완료, 충돌 없음

**리스크**
없음

**후속**
배포 시 AI_CONCURRENCY 조정

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
