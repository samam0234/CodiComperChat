# 미리보기 배포와 공개 전을 나누다

| 항목 | 내용 |
|------|------|
| Subject | `docs(security): 미리보기 배포와 공개 전을 나누다` |
| Full SHA | `d2e2346d10e9359ab14e2212b3ad0581cea599bc` |
| Short SHA | `d2e2346` |
| Branch | `feature/readme-status-sync` |
| Parent | `6c4fcbd` |
| Date | 2026-11-07 23:16:47 +0900 |

## 주 내용

- 보안 문서의 "배포 전·인터넷에 열지 않는다"를 미리보기는 올라가 있고 공개 서비스 전이라고 고쳤다
- 스택·배포 폴더 안내·문서 허브·화면 지도 설명에 현황 문서와 /project를 덧붙였다

## 상세

**배경**
2026-11-07에 미리보기 웹과 API를 올렸는데 보안 문서는 그 전 날짜의 "배포 전"으로 남아 있었다.

**변경 범위**
SECURITY.md, docs/web_management/README.md, docs/plan/CURRENT_STACK.md, docs/README.md, docs/.assets/README.md

**기술 포인트**
공개 전 체크리스트 본문은 고치지 않았다. 상태 문장만 지금 사실로 바꿨다.

**안 한 것**
처리방침 문구. 공개 전 필수 항목 삭제.

## 결과

**동작 확인**
문서 수정만

**리스크**
없음

**후속**
에이전트 읽기 순서

**관련 문서**
[docs/STATUS.md](../STATUS.md)
[SECURITY.md](../../SECURITY.md)
