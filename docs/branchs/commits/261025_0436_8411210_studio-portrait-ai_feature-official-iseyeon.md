# 외형 단계 AI로 초상 직접 만들기 (25 코레딧)

| 항목 | 내용 |
|------|------|
| Subject | `feat(studio): 외형 단계 AI로 초상 직접 만들기 (25 코레딧)` |
| Full SHA | `84112104e830748cdc8cb39f46ac015d1b8d66a3` |
| Short SHA | `8411210` |
| Branch | `feature/official-iseyeon` |
| Parent | `4edc43d` (develop) |
| Date | 2026-10-25T04:36:19+09:00 |

## 주 내용

- 공방 외형 단계에 "AI로 직접 만들기 · 25 코레딧": 화풍 4가지(애니메이션·웹툰·수채화·실사풍) 중 하나 + 생김새(성별·나이대 20대~·머리색·머리 모양·눈 색·옷차림·표정·배경) + 추가 설명(100자)
- 고른 항목은 코드가 영어 태그로, 카드 외형 서술·추가 설명만 로컬 LLM이 영어 태그로 번역(전체 이용가 태그 정리)
- 흉상 구도·성인 태그·전체 이용가 부정 프롬프트로 그려 384px WebP → 코디포토넷 그림 검수(전체 이용가) → Nest가 올린 그림과 같은 초상 자동 검수로 저장. 실패·검수 차단 시 환불, 엔진 꺼짐 503(안 뺌)
- 기존 "그림 고르기" 버튼 이름을 "내 파일 선택"으로(사용자 요청)
- Nest POST /studio/characters/:id/portrait/generate, FastAPI POST /portrait, 요청 한도 portraitAi 10분 6장, 코레딧 기록 op:portraitAi

## 상세

**배경**
사용자 요청("캐릭터 제작할 때 2번 외형에서 그림 고르기 → 내 파일 선택, 추가: ai로 직접 만들기 — webUI로 4가지 형태의 모델 중 하나 골라서 스타일이나 생김새 선택사항 택해서 제작, 25코레딧").

**변경 범위**
apps/api(studio-portrait-ai 서비스·컨트롤러, credits, rate-limit), services/ai(portrait 서비스·스키마·라우트), apps/web(portrait-ai 패널, 업로더, 액션), e2e/tests/portrait-ai.spec.ts, docs

**기술 포인트**
- 실제 엔진 실측(WebUI): 애니메이션 남성(갈색 머리·초록 눈·카드 외형 "안경·점·마른 체형"·"책을 들고") 약 66초, 실사풍 여성(단발 정장) 약 66초 — 둘 다 고른 대로, 23KB·14KB
- 실사풍은 실제 사진처럼 보여 초상 자동 검수가 실존 인물 사진 가능성으로 운영자 확인(PENDING)에 넣을 수 있다 — 기존 규칙
- 남에게 보이는 초상이라 성인 모드는 두지 않음

**안 한 것**
만든 그림을 저장 전에 미리 보고 고르는 단계는 없음(만들면 바로 초상으로 — 마음에 안 들면 다시 25 코레딧). 여러 장 한 번에 만들기 없음

## 결과

**동작 확인**
- e2e 전체 110개 통과(새 portrait-ai 2개·persona-recommend 3개 포함), API 단위 185개, 타입 검사
- 실제 엔진으로 두 화풍 생성 확인

**리스크**
없음

**후속**
develop 병합(사용자 확인 후)

**관련 문서**
docs/guidance/studio-workshop.md, API_DOCUMENTATION.md, OPERATIONS.md, DATABASE.md, CHARACTERS.md, TESTING.md
