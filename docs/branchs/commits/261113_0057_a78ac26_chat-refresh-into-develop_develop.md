# 대화 새로 고침과 CPU 예비 축소를 develop에 병합

| 항목 | 내용 |
|------|------|
| Subject | `merge(chat): 대화 새로 고침과 CPU 예비 축소를 develop에 병합` |
| Full SHA | `a78ac2660015bd3bce5410eb673cdfb4d99e3d21` |
| Short SHA | `a78ac26` |
| Branch | `develop` |
| Parent | `98daa63, 3dff108` |
| Date | 2026-11-13 00:57:41 +0900 |

## 주 내용

- `feature/chat-refresh-and-cpu-prefill`을 develop에 `--no-ff`로 병합했다.

## 상세

**배경**
대화 줄 메뉴의 새로 고침과 CPU 예비 프롬프트 축소를 develop에 합친다.

**변경 범위**
병합 커밋. 내용은 기능 커밋 `4a937bb`와 같다.

**기술 포인트**
빨리 감기가 아닌 병합 커밋이다.

**안 한 것**
main 병합과 푸시는 이 기록 다음에 한다. develop만 먼저 푸시하지 않는다.

## 결과

**동작 확인**
병합 전 기능 커밋에서 `tests.test_llm_openai`와 `tests.test_world` 32개를 통과했다.

**리스크**
공개 API는 Oracle 이미지를 다시 올리기 전에는 바뀌지 않는다.

**후속**
main에 같은 방식으로 병합한 뒤 develop과 main을 함께 푸시한다.

**관련 문서**
docs/trainings/chat-latency.md
