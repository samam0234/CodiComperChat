# 커밋 기록 작성기를 저장소에 넣다

| 항목 | 내용 |
|------|------|
| Subject | `chore(scripts): 커밋 기록 작성기를 저장소에 넣다` |
| Full SHA | `4bf69b496bcbfad28e6ba4a222563d219e4f95a3` |
| Short SHA | `4bf69b4` |
| Branch | `feature/record-tools` |
| Parent | `67be2aa` |
| Date | 2026-11-03 12:51:25 +0900 |

## 주 내용

- `scripts/record-commit.mjs`: 기록 파일 생성, `docs/branchs/README.md` 목록 추가, 선택적 커밋
- 파일 이름·제목·표·부모 SHA는 git에서 읽는다. 사람은 `## 주 내용`부터의 본문만 쓴다
- 같은 커밋을 두 번 넣지 않는다
- 시험 파일 `scripts/record-commit.test.mjs` (이 커밋에서는 실패, 아래 결과 참고)

## 상세

**배경**
기록 작성기가 개발 PC의 임시 폴더에만 있어 지워지면 다시 만들어야 했다. 실제로 이번 세션에서 사라져 있었다. 해야 할 일 목록의 항목이다.

**변경 범위**
scripts/, docs/branchs/README.md

**기술 포인트**
트레일러는 모델이 바뀌면 달라져 코드에 고정하지 않고 `--trailer`로 받는다.

**안 한 것**
git hook으로 자동 실행하기. 본문은 사람이 써야 해서 강제하지 않았다.

## 결과

**동작 확인**
이 커밋 시점의 시험 파일은 문법 오류로 실패했고, CRLF 처리도 빠져 있었다. 다음 커밋(`fix(scripts)`)에서 고쳐 6개가 통과한다. 처음에 "6개 통과"로 잘못 적어 바로잡았다. 이 기록은 작성기로 만들었다.

**리스크**
없음. 런타임 코드와 무관하다.

**후속**
없음.

**관련 문서**
[TEMPLATE.md](../TEMPLATE.md), [README.md](../README.md)
