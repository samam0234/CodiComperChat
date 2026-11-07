# develop into main

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main` |
| Full SHA | `8a8ba49cd3ac3c90afae09bda55c99e6ad1574b8` |
| Short SHA | `8a8ba49` |
| Branch | `main` |
| Parent | `a8eb49f, ea1339d` |
| Date | 2026-11-07 14:17:03 +0900 |

## 주 내용

- `develop`을 `main`에 병합했다: 다른 세션의 기여 가이드(`feature/contributing`)와 위 문서 보강

## 상세

**배경**
사용자 요청(2026-11-07). 병합되지 않은 로컬·원격 브랜치를 모두 확인했고 나머지는 이미 `develop`에 들어 있었다(앞선 커밋 수 0).

**변경 범위**
문서만. `main`은 Vercel 웹 배포의 원천이지만 웹 코드는 바뀌지 않았다.

**안 한 것**
서버 재배포는 하지 않았다(코드 변경 없음).

## 결과

**동작 확인**
충돌 없음. 병합 전 문서 검사 통과.

**리스크**
없음.

**후속**
푸시.
