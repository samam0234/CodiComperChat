# 시험 수를 실측으로 고치고 운영 배포 확인 표를 더한다

| 항목 | 내용 |
|------|------|
| Subject | `docs(testing): 시험 수를 실측으로 고치고 운영 배포 확인 표를 더한다` |
| Full SHA | `d4f6d3dfcf2cd6e28f70a051d7fd051ad80e5a9b` |
| Short SHA | `d4f6d3d` |
| Branch | `feature/docs-final-update` |
| Parent | `ecd55b4` |
| Date | 2026-11-07 09:53:22 +0900 |

## 주 내용

- `docs/plan/TESTING.md` 시험 수를 실측으로 고쳤다(API vitest 232개·파일 31, AI unittest 71개)
- "운영 배포 확인 (2026-11-07, 손으로)" 표를 더했다

## 상세

**배경**
2026-11-07 병합 뒤 실측과 실제 서버 확인을 시험 정본에 남긴다.

**변경 범위**
`docs/plan/TESTING.md`.

**안 한 것**
e2e 수는 그날 돌리지 않아 그대로 두었다.

## 결과

**동작 확인**
수는 병합 전 실행 결과(vitest 232 통과, unittest 71 OK)에서 옮겼다.

**리스크**
없음.

**후속**
없음.
