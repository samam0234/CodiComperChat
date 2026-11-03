# 상시 서버 후보 비교와 Ubuntu 설치 스크립트

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): 상시 서버 후보 비교와 Ubuntu 설치 스크립트` |
| Full SHA | `368d1ad3ead873c1c23047a4e452a271d72879c7` |
| Short SHA | `368d1ad` |
| Branch | `feature/deploy-server-setup` |
| Parent | `3ec9bc4` |
| Date | 2026-11-03 17:32:14 +0900 |

## 주 내용

- 상시 서버 후보 비교 문서와 Ubuntu 서버 설치 스크립트를 넣었다

## 상세

**배경**
2026-11-03 사용자 결정: 상시 서버. 비용이 드는 계약은 하지 않고 고를 수 있게 준비했다.

**변경 범위**
`deploy/server-setup.sh`, `docs/web_management/hosting-options.md`, 배포 문서의 링크.

**기술 포인트**
Hetzner 약관 8.2항이 포르노·음란물 게시를 금지해 성인 모드 공개와 부딪힌다. 후보 표에 적었다.

**안 한 것**
서버 계약, 실서버 실행, 지연 측정. 국내 업체 정가는 찾지 못했다.

## 결과

**동작 확인**
`bash -n` 문법 검사만 했다. 실서버에서 돌려 보지 않았다.

**리스크**
스크립트는 처음 돌릴 때 출력을 읽어야 한다. 값은 2026-11-03 기준이다.

**후속**
사용자가 업체를 고르면 실제 설치와 배포 후 확인을 한다.

**관련 문서**
[hosting-options.md](../../web_management/hosting-options.md)
