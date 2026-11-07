# 포트폴리오 챗봇을 e4b 하나로 맞추다

| 항목 | 내용 |
|------|------|
| Subject | `fix(portfolio): 포트폴리오 챗봇을 e4b 하나로 맞추다` |
| Full SHA | `dee911f3108d39b70100b2765b2214f0c1932fb8` |
| Short SHA | `dee911f` |
| Branch | `feature/portfolio-site-model` |
| Parent | `0f47e33` |
| Date | 2026-11-07 22:53:45 +0900 |

## 주 내용

- 공개 포트폴리오 사이트가 12b를 쓴다고 적은 문구를 고쳤다. 공개 주소는 Astro 정적 페이지만 서빙한다
- 챗봇 기본 모델과 예비를 gemma4:e4b 하나로 맞췄다. 12b와 나눠 고르지 않는다
- AI 층 설명과 내려받는 문서를 같은 내용으로 다시 만들었다

## 상세

**배경**
공개 사이트에는 Rails·Flask가 없는데 화면과 문서가 gemma4:12b를 쓴다고 적혀 있었다. 챗봇을 켤 때도 e4b만 쓰려는 목적과 달랐다.

**변경 범위**
PortFolio 사이트 문구, 콘텐츠 정본, 챗봇 설정·시험, 배포 예시, docx·pdf·pptx

**기술 포인트**
CHAT_MODEL과 FALLBACK_MODEL 기본값이 둘 다 gemma4:e4b라 다른 모델로 넘어가지 않는다. 챗봇 시험 12개는 모델 없이 통과했다. 사이트 빌드 10페이지에 gemma4:12b와 e4b·12b 고르기는 없다.

**안 한 것**
코디컴퍼챗 대화 화면의 모델 고르기(기본·강화·프리미엄). 운영 서버의 gemma-4-31b-it. 병합과 푸시.

## 결과

**동작 확인**
pytest 12 passed. astro build 10페이지. 문서에서 사이트 모델 고르기 문구 없음

**리스크**
Vercel은 푸시만으로 다시 배포되지 않는다. 공개 주소 문구는 다시 올려야 바뀐다.

**후속**
develop 병합과 푸시

**관련 문서**
[PortFolio/README.md](../../../PortFolio/README.md)
[docs/web_management/oracle-backend.md](../../web_management/oracle-backend.md)
