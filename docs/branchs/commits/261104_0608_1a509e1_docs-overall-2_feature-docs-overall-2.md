# 남은 작업과 소유자 안내를 정리하고 전체 문서를 갱신

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 남은 작업과 소유자 안내를 정리하고 전체 문서를 갱신` |
| Full SHA | `1a509e11054d353332df44f53e8b076fcefccefc` |
| Short SHA | `1a509e1` |
| Branch | `feature/docs-overall-2` |
| Parent | `ced99f8` |
| Date | 2026-11-04 06:08:31 +0900 |

## 주 내용

- 작업 지시서를 남은 일 기준으로 다시 쓰고, 소유자가 직접 할 일 안내를 새로 만들었다
- 전체 문서를 읽고 코드와 어긋난 곳을 고쳤다
- 시험 수와 실제 모델 평가 결과를 `TESTING.md`에 모았다

## 상세

**배경**
이번 작업으로 끝난 일이 많아 지시서와 문서가 낡았다. 소유자가 직접 할 일은 곳곳에 흩어져 있었다.

**변경 범위**
`docs/`, 루트 `SECURITY.md`·`THIRD_PARTY_NOTICES.md`, `e2e/README.md`, `console/README.md`, `services/ai/README.md`.

**기술 포인트**
오래된 설명을 고쳤다: Docker 안내, AI 서비스 토큰, Nodemailer 버전, 퀘스트 시드, e2e 실행 안내, 콘솔 공개 방식. 인수인계의 병합 상태는 이번 병합을 전제로 적었다.

**안 한 것**
기획 원본과 `LICENSE`는 고치지 않았다. `find_debug`와 커밋 기록은 당시 기록이라 그대로 두었다.

## 결과

**동작 확인**
문서 안 상대 링크를 스크립트로 전부 확인했다. 깨진 링크는 없다.

**리스크**
주요 문서는 읽었지만 일부(API 문서 전체, `NAVIGATION_IA.md`)는 바뀐 부분 위주로 고쳤다. 소유자 안내의 외부 절차는 직접 따라 해 보지 않았다.

**후속**
`docs/TASKS.md`.

**관련 문서**
[owner-checklist.md](../../guidance/owner-checklist.md)
