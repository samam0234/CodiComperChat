# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `d4dcf749565a4e10fdde806faf32432afd076475` |
| Short SHA | `d4dcf74` |
| Branch | `main` |
| Parent | `2f7a01f, 5f14b70` |
| Date | 2026-11-06 00:41:55 +0900 |

## 주 내용

- `develop`을 `main`에 `--no-ff`로 병합했다

## 상세

**배경**
사용자가 README·라이선스·문서 작업 뒤 병합과 푸시를 지시했다(2026-11-06).

**변경 범위**
README, LICENSE, SECURITY, `docs/`, 에이전트 문서, `scripts/readme-media/`, `docs/assets/readme/`. 앱 코드는 바뀌지 않았다.

**기술 포인트**
기록 목록은 `merge=union`으로 충돌 없이 합쳐졌다.

**안 한 것**
`release/*`는 쓰지 않았다.

## 결과

**동작 확인**
병합 전 `develop`에서 타입 검사, API 210개, AI 단위, 린트, e2e 117개, 성인 끔 e2e 1개 통과. `main`과 `develop`의 차이는 커밋 기록 파일뿐이다.

**리스크**
GitHub Actions 결과와 원격 화면은 확인하지 못했다.

**후속**
`docs/TASKS.md`.

**관련 문서**
[AGENT_HANDOVER.md](../../AGENT_HANDOVER.md)
