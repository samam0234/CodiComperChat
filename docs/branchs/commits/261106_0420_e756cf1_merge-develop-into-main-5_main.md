# develop into main

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main` |
| Full SHA | `e756cf16c6576d7dd31db905b1171f519c287e29` |
| Short SHA | `e756cf1` |
| Branch | `main` |
| Parent | `9a8266c, 0a79721` |
| Date | 2026-11-06 04:20:03 +0900 |

## 주 내용

- `develop`을 `main`에 `--no-ff`로 병합했다

## 상세

**배경**
사용자가 README 로고 배지 추가 뒤 병합까지 지시했다(2026-11-06).

**변경 범위**
README 로고 배지와 그림 확대 링크. 앱 코드는 바뀌지 않았다.

**기술 포인트**
기록 목록은 `merge=union`으로 충돌 없이 합쳐졌다.

**안 한 것**
`release/*`는 쓰지 않았다.

## 결과

**동작 확인**
docs만 바뀌어 그림 파일 존재와 병합 충돌 없음만 확인했다. 시험은 다시 돌리지 않았다.

**리스크**
GitHub Actions 결과와 원격 화면은 확인하지 못했다.

**후속**
`docs/TASKS.md`.

**관련 문서**
[AGENT_HANDOVER.md](../../AGENT_HANDOVER.md)
