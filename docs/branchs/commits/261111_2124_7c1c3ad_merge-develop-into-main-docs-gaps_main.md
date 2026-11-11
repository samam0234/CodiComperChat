# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `7c1c3ad25d6a59a930b8071ac5341883ea44683d` |
| Short SHA | `7c1c3ad` |
| Branch | `main` |
| Parent | `e24a6fe, 35b3879` |
| Date | 2026-11-11 21:24:18 +0900 |

## 주 내용

대화 속도·호스팅 오류 고침에서 빠졌던 문서 보강을 main에 병합했다.

## 상세

### 배경

새 환경변수와 "키 오류는 덮지 않는다"는 옛 문장, 시험 수 등이 살아있는 문서에 반영되지 않았다.

### 변경 범위

- develop(35b3879)을 `--no-ff`로 main에 합쳤다. docs 01e0fba와 기록.

### 기술 포인트

병합 전에 `git fetch`로 다른 세션의 변동이 없음을 확인했다.

### 안 한 것

e2e 실패 3개(Q09~Q11)는 고치지 않았다. 서버에는 올리지 않았다.

## 결과

### 동작 확인

mermaid 검사 통과(브랜치에서). 문서만 바뀌어 코드 시험은 다시 돌리지 않았다(직전 병합 때 통과).

### 리스크

없음(문서).

### 후속

develop을 main에 맞춘 뒤 둘을 같이 푸시한다.

### 관련 문서

- `docs/guidance/environment.md`
- `docs/TASKS.md`
