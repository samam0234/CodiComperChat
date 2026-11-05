# 기술 스택 그림 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(readme): 기술 스택 그림 추가` |
| Full SHA | `b724f46674a68c945f92843100e149f440437300` |
| Short SHA | `b724f46` |
| Branch | `feature/readme-stack-image` |
| Parent | `5f14b70` |
| Date | 2026-11-06 04:16:03 +0900 |

## 주 내용

- 루트 README에 기술 스택 그림(`stack.png`)을 추가했다
- 그림을 만드는 `art.mjs`에 스택 그림을 더했다

## 상세

**배경**
사용자가 루트 README에서 프레임워크 관련 그림이 빠졌다고 지적했다(2026-11-06). 시스템 구조도만 있고 어떤 프레임워크와 버전을 쓰는지 한눈에 보이는 그림이 없었다.

**변경 범위**
`README.md`의 "구조" 절을 "기술 스택"과 "시스템 구조"로 나눴다. `scripts/readme-media/art.mjs`, `scripts/readme-media/README.md`, `docs/assets/readme/stack.png`.

**기술 포인트**
버전은 `package.json`과 `requirements*.txt`에 고정된 값만 적었다. AI 서비스의 시험은 `unittest`라 그대로 적었다. 외부 배지 서비스는 쓰지 않았다.

**안 한 것**
Cursor가 맡은 코드 작업과 다른 문서는 건드리지 않았다.

## 결과

**동작 확인**
그림을 직접 열어 글자 잘림과 겹침이 없음을 눈으로 확인했다.

**리스크**
GitHub 원격 화면에서의 표시는 확인하지 못했다.

**후속**
`docs/TASKS.md`.

**관련 문서**
[README 그림 도구](../../../scripts/readme-media/README.md)
