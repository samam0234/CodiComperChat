# 제3자에게 나가는 데이터와 웹·API 분리 때의 IP 신뢰를 적는다

| 항목 | 내용 |
|------|------|
| Subject | `docs(security): 제3자에게 나가는 데이터와 웹·API 분리 때의 IP 신뢰를 적는다` |
| Full SHA | `5a3d752a0b9f1c78a19a214836695c0dec892403` |
| Short SHA | `5a3d752` |
| Branch | `feature/docs-gap-fill` |
| Parent | `518bac4` |
| Date | 2026-11-07 14:12:50 +0900 |

## 주 내용

- `SECURITY.md`에 "제3자에게 나가는 데이터" 표(NVIDIA·Anthropic·xAI·Vercel·Oracle·Let's Encrypt)와 "웹과 API가 다른 기계일 때의 IP 신뢰" 절을 더했다
- 초상 검수·성인 대화 행에 `LLM_BACKEND`에 따라 달라진다는 단서를 달았다

## 상세

**배경**
`llm.py`·`image_moderation.py`를 읽어 보니 `LLM_BACKEND=openai`에서는 프리미엄이 아닌 모든 호출과 그림 검수 입력이 호스팅 API로 간다. 서비스 처리방침의 국외 이전 표에는 Anthropic·xAI만 있어 NVIDIA·Vercel·Oracle이 빠져 있다.

**변경 범위**
`SECURITY.md`.

**기술 포인트**
처리방침 문구는 법률 검토 영역이라 고치지 않고 불일치를 사용자 몫(U11)으로 표시했다. 공급자 약관(보관·학습 사용)은 확인하지 못했다고 적었다.

**안 한 것**
처리방침 페이지 수정, 코드 가드.

## 결과

**동작 확인**
문서 수정만. 표의 사실은 코드와 서버 설정에서 확인했다.

**리스크**
사용자가 처리방침을 고치기 전까지 공개하면 안내와 실제가 어긋난다.

**후속**
TASKS U11·T05, THIRD_PARTY.
