# LICENSE·SECURITY·THIRD_PARTY_NOTICES 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(legal): LICENSE·SECURITY·THIRD_PARTY_NOTICES 추가` |
| Full SHA | `24a52d4b5167b006b993ff8568b5cb92917770cf` |
| Short SHA | `24a52d4` |
| Branch | `feature/docs-overall-update` |
| Parent | `7b8ae15` (develop) |
| Date | 2026-10-25T00:04:09+09:00 |

## 주 내용

- LICENSE: 독점(모든 권리 보유). apps/api/package.json의 UNLICENSED와 맞춤. 제3자 구성요소·이용자 콘텐츠는 이 라이선스 밖임을 명시
- SECURITY.md: 취약점 비공개 신고, 신뢰 경계(Nest), 코드에서 확인한 보안 장치(계정·세션·요청·브라우저·비밀·콘텐츠 안전), 알려진 한계, 공개 전 필수 체크리스트, 비밀값 유출 시 절차
- THIRD_PARTY_NOTICES.md: 설치된 패키지의 실제 라이선스 표기(Node·Python), 모델 3종의 사용 제한 확인 항목, WebUI(AGPL-3.0)는 배포물에 넣지 않는다는 점

## 상세

**배경**
사용자 지시("root에다 License, Security 관련한 문서도 추가 — 현재 구축된 기반의 내용을 잘 반영").

**변경 범위**
LICENSE, SECURITY.md, THIRD_PARTY_NOTICES.md

**기술 포인트**
- 라이선스는 사용자에게 선택을 묻지 않고 기존 UNLICENSED 표기에 맞춰 독점으로 함 — 권리자 법적 이름은 비워 두고 LICENSE 끝에 채울 곳을 표시
- SECURITY는 코드를 읽고 확인한 것만 적음: scrypt·JWT 7일·세대 무효화·해시 토큰·AdminGuard DB 역할·매직 넘버 검사·nonce CSP 등. 없는 것(HSTS·FastAPI 인증·본인인증·성인 운영 체계)은 한계와 공개 전 체크리스트로 분리
- 발견한 위험: Gemma 사용 금지 정책이 성적 콘텐츠 생성을 제한할 가능성 — 성인 모드가 이 모델로 장면 설계·검수를 하므로 원문 확인 전에는 성인 모드 공개 금지로 적음(확정이 아니라 확인 필요). compose의 postgres가 약한 비밀번호로 모든 인터페이스에 열리는 점도 기록

**안 한 것**
보안 신고 전용 연락처와 LICENSE의 권리자 법적 이름은 정해지지 않아 비워 둠(문서에 표시). 라이선스 원문·모델 정책은 법률 검토 필요

## 결과

**동작 확인**
- 문서 상대 링크 검사 0건
- 패키지 라이선스는 설치된 package.json·메타데이터에서 읽음

**리스크**
법률 문서가 아니라 개발자 정리본 — 공개 전 법률 검토

**후속**
전체 문서 갱신 커밋, develop 병합·푸시

**관련 문서**
LICENSE, SECURITY.md, THIRD_PARTY_NOTICES.md
