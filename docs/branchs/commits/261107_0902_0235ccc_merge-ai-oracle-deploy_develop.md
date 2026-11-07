# claude/project-thread-pz0x5f into develop

| 항목 | 내용 |
|------|------|
| Subject | `merge: claude/project-thread-pz0x5f into develop` |
| Full SHA | `0235cccd8b1a2a0a26b465823fe9b9c037fdd42b` |
| Short SHA | `0235ccc` |
| Branch | `develop` |
| Parent | `96d01e6, 0d246c9` |
| Date | 2026-11-07 09:02:50 +0900 |

## 주 내용

- `claude/project-thread-pz0x5f`(Oracle VM AI 서버 배포, NVIDIA 호스팅 API 대화와 CPU Ollama 예비, 프리미엄 환경변수 샘플, 배포 상태 문서)를 병합했다

## 상세

**배경**
사용자가 "병합하고 배포 상태 업데이트"를 요청했다(2026-11-07). 같은 코드로 서버에 AI를 올려 `ai-deploy.sh` 6단계를 통과했다.

**변경 범위**
`deploy/oracle/`(ai compose·Dockerfile·배포 스크립트), `scripts/deploy-ai-oracle.mjs`, `services/ai/app/services/llm.py`·`main.py`와 시험 2개, 안내 문서, 배포 상태 문서.

**안 한 것**
푸시는 하지 않았다.

## 결과

**동작 확인**
병합 뒤 시험 결과는 다음 기록 커밋 뒤에 따로 돌려 보고한다(병합과 시험을 한 명령으로 묶지 않음).

**리스크**
AI 서비스 코드(`llm.py`)가 바뀌었다.

**후속**
푸시, 웹 배포.
