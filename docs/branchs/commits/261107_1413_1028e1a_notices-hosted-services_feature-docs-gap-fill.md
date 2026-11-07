# 운영에서 쓰는 NVIDIA 호스팅 API와 외부 서비스를 고지 문서에 더한다

| 항목 | 내용 |
|------|------|
| Subject | `docs(notices): 운영에서 쓰는 NVIDIA 호스팅 API와 외부 서비스를 고지 문서에 더한다` |
| Full SHA | `1028e1a1ef206bcd6a585ed3c5ac4386488fcd1a` |
| Short SHA | `1028e1a` |
| Branch | `feature/docs-gap-fill` |
| Parent | `ebe5c08` |
| Date | 2026-11-07 14:13:12 +0900 |

## 주 내용

- `THIRD_PARTY_NOTICES.md` 모델 표에 NVIDIA 호스팅 `gemma-4-31b-it` 행을, 새 "2-0. 운영에서 쓰는 외부 서비스" 표(Vercel·Oracle·NVIDIA·Let's Encrypt·sslip.io·GitHub)를 더했다
- 구성 요소 mermaid에 두 노드를 더했다

## 상세

**배경**
2026-11-07 배포로 외부 서비스에 기대게 됐는데 고지 문서에는 로컬 모델만 있었다.

**변경 범위**
`THIRD_PARTY_NOTICES.md`.

**기술 포인트**
각 약관을 읽었다고 쓰지 않고 "확인하지 못했다"와 확인할 항목만 적었다(무료 요금제의 상업적 이용, 입력 보관·학습 사용, 무료 한도).

**안 한 것**
법적 판단은 하지 않았다.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 171개 실패 0.

**리스크**
없음.

**후속**
TASKS U11~U12.
