# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `f6b5f44e464801df0aaa5bb1416afcc448ff285f` |
| Short SHA | `f6b5f44` |
| Branch | `main` |
| Parent | `f1ae0ad, 06e1668` |
| Date | 2026-11-08 17:11:23 +0900 |

## 주 내용

develop에만 남아 있던 포트폴리오 병합 기록을 main에 합쳤다.

## 상세

### 배경

feature/portfolio-oracle를 develop에 병합한 기록 커밋이, main 병합보다 나중에 생겨 main에 없었다.

### 변경 범위

- docs/branchs/commits의 develop 병합 기록.

### 안 한 것

Next가 다시 쓴 apps/web/AGENTS.md는 커밋하지 않고 되돌렸다. 운영 서버는 다시 올리지 않았다.

## 결과

### 동작 확인

문서 기록만 옮긴다. 화면과 API 동작은 바뀌지 않는다.

### 관련 문서

- docs/branchs/commits/
