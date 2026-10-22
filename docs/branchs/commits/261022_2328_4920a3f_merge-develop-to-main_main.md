# merge: develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `4920a3f0662f09ec55271b8c8a205f8fbf3d0fee` |
| Short SHA | `4920a3f` |
| Branch | `main` |
| Parent | `bc275a6`, `f1a2c07` |
| Date | 2026-10-22T23:28:45+09:00 |

## 주 내용

- `develop`를 `main`에 `--no-ff`로 병합
- 개발 통합 브랜치 전체(초기 커밋 이후 381개 커밋)를 main에 합류. 웹·API·AI 서비스·운영 콘솔·대화 모델/코레딧/명령어/글 꾸미기·테마·인기·마이페이지·e2e·문서

## 상세

**배경**
사용자 지시("이거 main 병합하고 푸시해보자")에 따라 develop을 main에 병합했다. main은 초기 커밋(저장소 초기화·기획 원본)뿐이었고 develop에만 있는 커밋 381개가 합류한다.

**변경 범위**
저장소 전체(690개 파일)

**기술 포인트**
`--no-ff` 사용. main에는 develop에 없는 커밋이 없어 충돌 없음. 문서의 배포 절차(release/* 검증 후 main)는 따로 거치지 않고 develop에서 직접 병합했다(사용자 요청). 병합 직전 develop 꼭대기에서 전체 e2e 74개·단위 테스트 172개·타입 검사·린트 통과를 확인했다.

**안 한 것**
없음

## 결과

**동작 확인**
`git merge --no-ff` 정상 완료, 충돌 없음

**리스크**
없음

**후속**
없음

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
