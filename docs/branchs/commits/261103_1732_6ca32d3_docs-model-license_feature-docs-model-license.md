# Gemma 4 라이선스를 Apache 2.0으로 정정

| 항목 | 내용 |
|------|------|
| Subject | `docs(legal): Gemma 4 라이선스를 Apache 2.0으로 정정` |
| Full SHA | `6ca32d37f191a998defaa42209d2ff35fdd5db54` |
| Short SHA | `6ca32d3` |
| Branch | `feature/docs-model-license` |
| Parent | `8612c24` |
| Date | 2026-11-03 17:32:13 +0900 |

## 주 내용

- Gemma 4에 금지 정책이 적용된다고 적은 문서를 정정했다. Gemma 4의 라이선스는 Apache 2.0이다
- 성인 모드에서 남은 위험을 국내법과 호스팅 약관으로 다시 적었다

## 상세

**배경**
2026-11-03 사용자가 성인 모드와 Gemma 정책 문제를 최대한 우회할 방안을 요청했다. 대체 모델을 찾다가 전제가 틀렸음을 확인했다.

**변경 범위**
`THIRD_PARTY_NOTICES.md`, `SECURITY.md`, 인수인계, 스택, 모델 전략, 배포 문서.

**기술 포인트**
Gemma 이용약관(2026-04-01 수정)은 Gemma 1~3n에만 적용된다고 적고, Gemma 4는 별도 라이선스로 안내한다. 그 문서는 Apache 2.0 전문이다. `ollama show gemma4:e4b --license`, Google 발표, 모델 카드도 같다.

**안 한 것**
모델 교체(필요 없음), 필터 해제, 법률 판단. 정보통신망법 제44조의7 원문은 확인하지 못했다.

## 결과

**동작 확인**
문서만 바꿨다. 위 출처를 직접 읽었다.

**리스크**
라이선스 확인일 뿐 법률 자문이 아니다. 자기 신고 방식과 음란물 규정은 변호사 확인이 필요하다.

**후속**
성인 모드 공개 여부는 법률 검토 뒤 사용자가 정한다.

**관련 문서**
[THIRD_PARTY_NOTICES.md](../../../THIRD_PARTY_NOTICES.md)
