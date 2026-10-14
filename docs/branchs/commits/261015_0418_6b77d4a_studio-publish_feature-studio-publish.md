# 운영자 발행·내리기와 공방 캐릭터 지식 파일 내보내기 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(studio): 운영자 발행·내리기와 공방 캐릭터 지식 파일 내보내기 추가` |
| Full SHA | `6b77d4ad74f59716945fd7d5f030fa1dce2dbdb0` |
| Short SHA | `6b77d4a` |
| Branch | `feature/studio-publish` |
| Parent | `cecea44` (feature/studio-test) |
| Date | 2026-10-15T04:18:43+09:00 |

## 주 내용

- `POST /studio/characters/:id/publish`, `/unpublish`: 운영자(ADMIN)만, 아니면 403
- 발행 조건: 필수 단계 완성 + 지금 카드로 3턴 테스트 통과(카드 지문), 다른 캐릭터와 이름이 겹치면 409
- 카드 → 캐릭터 만들기/고치기(비밀·해금 조건은 서버 전용 필드로), 초안과 연결
- 페르소나 지식 파일 `data/personas/studio-<초안 id>.json`(비밀 제외) 쓰기, 저장소 즉시 재확인(`invalidate`)
- `/auth/me`에 `role`, `npm run user:role -- <이메일> <admin|user>`
- `persona:build`는 공방 캐릭터를 건너뜀
- 발행 단위 테스트 6개, API 문서·페르소나 README 갱신

## 상세

**배경**
기획서 §5.4(운영자 도구), §6.1(발행은 테스트 통과 후), §9.2(v1에는 유저 광장 없음)에 따라 초안·테스트는 로그인한 누구나, 발행은 운영자만 하게 했다. 앞서 만든 페르소나 RAG와 이어지게, 발행하면 카드 전체가 그 캐릭터의 지식 파일이 된다.

**변경 범위**
apps/api(studio, persona-rag 저장소, auth 응답, scripts), `docs/API_DOCUMENTATION.md`, `apps/api/data/personas/README.md`

**기술 포인트**
- 지식 파일 이름은 캐릭터 이름이 아니라 초안 id로 짓는다. 저장소는 파일 안의 `character` 값으로 찾으므로, 이름을 바꿔 다시 발행해도 파일이 하나로 유지된다.
- 파일은 `_`로 시작하는 임시 파일(저장소가 건너뜀)에 쓴 뒤 rename한다. 반쯤 쓴 파일을 읽지 않는다.
- 지식 파일을 DB 공개보다 먼저 쓴다. 공개되는 순간 RAG가 준비돼 있어 첫 대화부터 테스트와 같은 캐릭터가 된다.
- 권한은 서버가 DB의 role로 판단한다. `/auth/me`의 role은 웹이 버튼을 보여 줄지 정하는 용도다.
- `persona:build`가 공방 캐릭터에도 `<이름>.json`을 만들면 같은 캐릭터 파일이 둘이 되어 어느 쪽이 읽힐지 불확실하다. 그래서 `draft: null` 조건으로 뺐다.

**안 한 것**
- 웹 화면(다음 브랜치), 남이 만든 초안을 운영자가 발행하는 검수 흐름(v1은 운영자 자신의 초안만)

## 결과

**동작 확인**
- 임시 API(4998, 임시 지식 폴더) + 실제 Ollama:
  - `/auth/me` role, USER 발행 403, 3턴 테스트 통과
  - 승격 후 ADMIN, 남의 초안 403, 발행 200, `studio-<id>.json` 생성(비밀 없음)
  - 공개 목록·상세에 보임(비밀 없음), 통과 뒤 카드를 고치면 재발행 409, 발행된 초안 삭제 409
  - 재테스트 후 재발행이 같은 캐릭터 id 유지, 발행 캐릭터와 실제 대화 200, 내리기로 목록·파일 제거
- `user:role` 없는 이메일은 안내 후 exit 1
- 단위 테스트 61개, `typecheck:api`, oxlint 통과

**리스크**
지식 파일은 git에 올라가지 않는 로컬 파일이다. 서버를 옮기면 공방 캐릭터는 다시 발행해야 RAG가 붙는다(그 전에는 카드 원문 방식으로 대화한다).

**후속**
웹 공방(`/studio`, `/studio/[id]`)

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md), [apps/api/data/personas/README.md](../../../apps/api/data/personas/README.md)
