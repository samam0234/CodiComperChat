# 프로젝트 소개 화면을 기능 목록에 넣다

| 항목 | 내용 |
|------|------|
| Subject | `docs(features): 프로젝트 소개 화면을 기능 목록에 넣다` |
| Full SHA | `e76020f0641286c021114f1bc9bc0d6d5f04b5b3` |
| Short SHA | `e76020f` |
| Branch | `feature/docs-live-status` |
| Parent | `429a7a9` |
| Date | 2026-11-07 23:10:43 +0900 |

## 주 내용

- 웹 /project 소개 화면을 FEATURES 11장에 한 줄 추가했다
- 기능 목록의 상태는 코드 기준이고, 운영에서 열리는 범위는 STATUS.md라고 덧붙였다

## 상세

**배경**
2026-11-07에 소개 페이지가 웹에 들어갔는데 기능 목록 기준 시점은 2026-11-06이라 그 화면이 빠져 있었다.

**변경 범위**
docs/FEATURES.md

**기술 포인트**
기존 기능 줄은 고치지 않았다. 상태 열의 뜻을 덮어쓰지 않고 문장으로 구분했다.

**안 한 것**
화면 개수 재산정. 운영 상태 열을 표 전체에 넣기.

## 결과

**동작 확인**
문서 수정만

**리스크**
없음

**후속**
허브·인수인계·배포 입구가 STATUS를 가리키게 한다

**관련 문서**
[docs/STATUS.md](../STATUS.md)
[apps/web/app/project/page.tsx](../../apps/web/app/project/page.tsx)
