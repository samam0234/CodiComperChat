# 월드코퍼챗 정본·사용 안내·실측 문서 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(worlds): 월드코퍼챗 정본·사용 안내·실측 문서 추가` |
| Full SHA | `cda9e88ca41c5eed8b32c62335b8577ad4375e06` |
| Short SHA | `cda9e88` |
| Branch | `feature/docs-overhaul-world` |
| Parent | `2e6c1ae` |
| Date | 2026-11-06 15:43:18 +0900 |

## 주 내용

- 월드코퍼챗 정본 `docs/plan/WORLD_COPPERCHAT.md`, 쓰는 법·실행·시험·디버깅 `docs/guidance/world-copperchat.md`, 실측 `docs/trainings/world-copperchat.md`를 새로 썼다

## 상세

**배경**
사용자 요청(2026-11-06): 추가된 기능을 문서에 상세하고 정확하게, 직접 시험한 것까지.

**변경 범위**
새 문서 3개.

**기술 포인트**
정본에는 사용자 결정(하루 3회·서버 확률·누구나 제작), 원문 요청과 구현의 대응(예: "직접 만들기"는 공방 링크로 푼 이유), 구성 요소별 한도, DB 9개 테이블, API 표, 진행자 프롬프트 순서, 운영, 시험, 한계를 적었다. 실측 문서에는 형식 평가 13/16 → 16/24 → 23/24의 과정과 평가를 고친 사실(직전 대화를 방식에 맞춤)을 그대로 적었다. README 화면을 찍다 찾은 세 가지도 적었다.

**안 한 것**
없음.

## 결과

**동작 확인**
문서 안 수치를 시험 결과와 대조했다(API 226, e2e 123, AI 단위 54, world.spec 15, test_world 9, worlds.spec 6, 평가 23/24). 링크 검사 927개 깨짐 0.

**리스크**
없음.

**후속**
없음.

**관련 문서**
[WORLD_COPPERCHAT.md](../../plan/WORLD_COPPERCHAT.md)
