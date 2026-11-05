# LICENSE와 SECURITY를 고도화하고 전체 이력을 검사

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): LICENSE와 SECURITY를 고도화하고 전체 이력을 검사` |
| Full SHA | `9858ad72b4e2d16f5e34e5e9aefcd1857ca26ea4` |
| Short SHA | `9858ad7` |
| Branch | `feature/license-security` |
| Parent | `249f6ee` |
| Date | 2026-11-06 00:04:38 +0900 |

## 주 내용

- `LICENSE`를 용어·권리·허용·금지·종료·책임으로 나눠 다시 썼다
- `SECURITY.md`에 위협과 대응 표, 직접 확인하는 법, 사고 대응 순서를 넣었다
- 전체 git 이력의 비밀값과 큰 파일을 처음으로 검사했다

## 상세

**배경**
사용자가 `LICENSE`와 `SECURITY.md`를 최대로 고도화하라고 요청했다(2026-11-06). 저장소가 공개와 비공개 어느 쪽이든 맞는 문구가 필요했다.

**변경 범위**
`LICENSE`, `SECURITY.md`, `THIRD_PARTY_NOTICES.md`.

**기술 포인트**
권리의 뜻은 유지했다. 새로 넣은 것은 2차 저작물·모델 미세 조정·데이터셋 금지, 공개 때 받은 사본, 의견, 허락 종료, 책임 제한이다. 권리자 이름과 준거법은 사용자 결정과 법률 검토가 필요해 넣지 않고 메모로 남겼다.

**안 한 것**
변호사 검토. 권리자 이름 기입.

## 결과

**동작 확인**
`npm audit --omit=dev` 0건. 전체 이력의 키 형식 검색 0건, `.env` 파일 없음, 가장 큰 파일은 `package-lock.json` 약 284KB.

**리스크**
이력 검색은 정규식이라 모든 형식을 보장하지 못한다. 라이선스 문안의 법적 효력은 확인하지 못했다.

**후속**
법률 검토, GitHub secret scanning.

**관련 문서**
[SECURITY.md](../../../SECURITY.md)
