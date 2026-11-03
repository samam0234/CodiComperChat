# 성인 그림 차단과 신고·HTTPS 강화

| 항목 | 내용 |
|------|------|
| Subject | `feat(api): 성인 그림 차단과 신고·HTTPS 강화를 넣다` |
| Full SHA | `bd6bbe0a68d45e99727b50ac13ac2d2eaa3d4ea4` |
| Short SHA | `bd6bbe0` |
| Branch | `feature/launch-safety` |
| Parent | `d8bd1db` |
| Date | 2026-10-25 19:17:53 +0900 |

## 주 내용

- 성인 그림 검수에 실사 유사도 90 이상을 막는 기준을 더했다. 미성년자 설정·어려 보이는 인물·실사풍 잠금은 그대로다
- 성인 확인은 생년월일·동의·이메일 인증을 유지한다. 본인인증은 넣지 않았다
- 코디포토넷 그림·웹툰 신고, 운영 콘솔 「그림 신고」에서 접근 차단·계정 정지를 할 수 있다
- FastAPI는 내부 토큰 또는 루프백만 받는다. 운영 서버는 `REQUIRE_HTTPS=1`과 개발용 스위치 꺼짐을 요구하고, https 응답에 HSTS를 붙인다
- 운영 비밀값 생성기(`scripts/generate-prod-secrets.mjs`)는 표준 출력만 한다. 값은 발급·커밋하지 않았다

## 상세

**배경**
공개 전 남은 일 중 배포 구조는 보류하고, 법률·정책의 안전 하한(미성년자·실사), HTTPS 강화, 성인 콘텐츠 신고·검토·접근 차단을 코드로 고정하라는 요청.

**변경 범위**
apps/api(신고·정지·HTTPS·운영 기동 검사, 마이그레이션 `20261025180000_content_safety`), apps/web(신고 버튼·약관·처리방침), console(그림 신고 화면·공개 호스트 IP 제한), services/ai(검수 점수·내부 인증), docker-compose(Postgres를 127.0.0.1에만), docs·SECURITY·THIRD_PARTY_NOTICES

**기술 포인트**
- 실사 유사도는 그림 검수 모델의 0–100 점수다. 특정 사진과의 지문 비교는 아니다. `realistic` 불리언과 실사풍 화풍 잠금도 유지한다
- Gemma 사용 금지 정책 4항(성적 만족을 위한 생성 금지, 예술 목적 예외)을 원문 기준으로 문서에 적었다. 성인 모드 대화·장면 설계가 예외에 드는지는 확인되지 않아 공개하지 않는다고 적었다
- 개발 DB에 마이그레이션을 적용했다. 켜 둔 서버는 재시작해야 이 코드가 돈다

**안 한 것**
배포 대상·GPU 서버, TLS 인증서, 운영 비밀값 실제 발급, 본인인증, 결제 재개, 성인 모드를 Gemma에서 떼는 일

## 결과

**동작 확인**
- API 타입 검사, 웹·콘솔 `tsc --noEmit` 통과
- API 단위: 안전·신고 시험 12개 통과. 그림 검수 규칙 unittest 6개 통과
- 브라우저에서 신고 버튼을 눌러 보는 확인은 하지 않음

**리스크**
- 유사도 90은 모델 판정이라 놓치거나 정상 그림을 막을 수 있다. 막을 때는 기존처럼 코레딧을 돌려준다
- 약관·처리방침은 동작에 맞춘 초안이다. 법률 검토를 대신하지 않는다
- `REQUIRE_HTTPS`와 콘솔 IP 제한은 운영(`NODE_ENV=production`)의 공개 호스트에서만 동작한다. 로컬호스트는 그대로다

**후속**
TLS를 끝내는 앞단 프록시, 운영 비밀값 발급, Gemma 정책의 성인 모드 허용 여부, develop 병합(사용자 확인 후)

**관련 문서**
[SECURITY.md](../../../SECURITY.md), [THIRD_PARTY_NOTICES.md](../../../THIRD_PARTY_NOTICES.md), [docs/plan/OPERATIONS.md](../../plan/OPERATIONS.md), [docs/guidance/environment.md](../../guidance/environment.md), [docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
