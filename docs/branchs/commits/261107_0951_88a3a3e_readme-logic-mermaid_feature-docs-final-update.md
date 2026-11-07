# 로직 구조를 mermaid 계층도와 YAML 파이프라인으로 바꾸고 배포 상태를 반영

| 항목 | 내용 |
|------|------|
| Subject | `docs(readme): 로직 구조를 mermaid 계층도와 YAML 파이프라인으로 바꾸고 배포 상태를 반영` |
| Full SHA | `88a3a3e868f70053fe169a629e0c40e749083013` |
| Short SHA | `88a3a3e` |
| Branch | `feature/docs-final-update` |
| Parent | `1b1880b` |
| Date | 2026-11-07 09:51:11 +0900 |

## 주 내용

- README 로직 구조의 텍스트 상자를 mermaid 계층도(화면·신뢰 경계·저장·AI)와 한 턴 단계 YAML로 바꿨다
- "지금 올라가 있는 배포" mermaid를 더했고, 배포 상태·시험 수·저장소 구성·문서 지도를 지금에 맞췄다

## 상세

**배경**
사용자가 README 로직 구조를 텍스트보다 깔끔한 mermaid나 스크립트 구조로 바꾸라고 했다(2026-11-07).

**변경 범위**
`README.md`. 시스템 구조 그림의 모델 칸을 "NVIDIA API → Ollama 예비"로 고쳤다. "지금 되는 것"에 대화 모델 백엔드·배포 행을 더했다. API 시험 226 → 232, AI unittest 71 줄 추가.

**기술 포인트**
`<!-- logic-structure -->`·`<!-- logic-mermaid -->` 표지는 그대로 두었다.

**안 한 것**
그림 파일(PNG)은 다시 만들지 않았다.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0.

**리스크**
README 그림(`deploy-topology.png`)은 GPU 서버 목표 구성이라 지금 배포와 다르다(설명에 적음).

**후속**
없음.
