# merge: feature/photonet-sd into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/photonet-sd into develop (no-ff)` |
| Full SHA | `5e285398bbd8ad0601b35946ce1e0c150c7aa0c8` |
| Short SHA | `5e28539` |
| Branch | `develop` |
| Parent | `945346f`, `276fe2d` |
| Date | 2026-10-24T04:38:42+09:00 |

## 주 내용

- `feature/photonet-sd`를 `develop`에 `--no-ff`로 병합
- 코디포토넷 실제 그림 생성(로컬 Stable Diffusion WebUI, Animagine XL 4.0 + SD 1.5, 그림 검수), 버튼 줄과 입력창 간격, 커뮤니티 시각 버그 수정

## 상세

**배경**
사용자 지시("커밋 작업은 시행하고 나서 최종적으로 develop에 병합하기")에 따라 feature/photonet-sd(간격 조정 + Stable Diffusion 연결)를 병합했다. 푸시는 하지 않았다.

**변경 범위**
services/ai, apps/api, apps/web, scripts, e2e, docs

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용. develop에서 바로 나온 브랜치라 충돌이 없다. 병합 전 전체 e2e 87개·단위 테스트 172개·타입 검사·린트 통과.

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
