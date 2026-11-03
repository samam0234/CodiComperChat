# 취약점이 있는 운영 의존성을 올리다

| 항목 | 내용 |
|------|------|
| Subject | `fix(deps): 취약점이 있는 운영 의존성을 올리다` |
| Full SHA | `a2a3830b386c20dba1df5ecb0b1b350972755b62` |
| Short SHA | `a2a3830` |
| Branch | `feature/dep-audit` |
| Parent | `3c7cbd1` |
| Date | 2026-11-03 13:00:11 +0900 |

## 주 내용

- Next.js 16.3.5 → 16.4.4 (치명 취약점 포함, 웹·콘솔)
- Nodemailer 7 → 10.3 (메이저 업데이트, SMTP 명령 주입 등)
- `npm audit fix`로 간접 의존성 정리
- 운영 의존성의 알려진 취약점 14건 → 0건

## 상세

**배경**
공개 전 필수 점검의 "의존성 점검" 항목. `npm audit --omit=dev`에서 치명 1, 높음 11, 보통 2건이 나왔다.

**변경 범위**
package-lock.json, apps/api·apps/web·console의 package.json. 코드 변경 없음.

**기술 포인트**
Nodemailer는 메이저 변경이지만 이 저장소는 `createTransport(url)`과 `sendMail`만 쓴다.

**안 한 것**
개발 의존성의 남은 경고는 운영에 들어가지 않아 강제 업데이트하지 않았다.

## 결과

**동작 확인**
`npm audit --omit=dev` 0건. API 타입 검사와 웹·콘솔 `tsc --noEmit` 통과. 메일을 포함한 전체 시험은 병합 전 통합 단계에서 돌린다.

**리스크**
프레임워크 업데이트라 화면 동작은 e2e로 확인해야 한다.

**후속**
Python 쪽 점검 결과는 SECURITY.md에 적는다.

**관련 문서**
[SECURITY.md](../../../SECURITY.md)
