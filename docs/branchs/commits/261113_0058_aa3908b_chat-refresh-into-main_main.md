# 대화 새로 고침과 CPU 예비 축소를 main에 병합

| 항목 | 내용 |
|------|------|
| Subject | `merge(chat): 대화 새로 고침과 CPU 예비 축소를 main에 병합` |
| Full SHA | `aa3908bb770915f18a280760a6099178ec353034` |
| Short SHA | `aa3908b` |
| Branch | `main` |
| Parent | `98daa63, 045ac48` |
| Date | 2026-11-13 00:58:14 +0900 |

## 주 내용

- develop을 main에 `--no-ff`로 병합했다.

## 상세

**배경**
대화 줄 메뉴의 새로 고침과 CPU 예비 프롬프트 축소를 main에 합친다.

**변경 범위**
병합 커밋. 내용은 develop의 `a78ac26`과 같다.

**기술 포인트**
main은 작업 트리가 있는 폴더에서만 병합했다. 빨리 감기가 아니다.

**안 한 것**
푸시는 이 기록과 develop을 main에 맞춘 뒤에 두 브랜치를 함께 한다.

## 결과

**동작 확인**
기능 커밋에서 `tests.test_llm_openai`와 `tests.test_world` 32개를 통과했다. 공개 웹 시간은 재지 않았다.

**리스크**
웹 배포가 API 이미지보다 먼저 나갈 수 있다. API 변경은 Oracle 이미지를 다시 올리기 전에는 공개 주소에 없다.

**후속**
develop을 main에 맞춘 뒤 origin의 develop과 main을 함께 푸시한다.

**관련 문서**
docs/trainings/chat-latency.md
