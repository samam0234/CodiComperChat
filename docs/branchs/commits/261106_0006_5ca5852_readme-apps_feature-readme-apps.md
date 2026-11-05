# 앱별 README에 구조와 동작 설명을 넣음

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 앱별 README에 구조와 동작 설명을 넣음` |
| Full SHA | `5ca585290620ea926f5fba9f795df4627f10ac63` |
| Short SHA | `5ca5852` |
| Branch | `feature/readme-apps` |
| Parent | `2bf57a5` |
| Date | 2026-11-06 00:06:09 +0900 |

## 주 내용

- `apps/api`, `apps/web`, `console`, `services/ai`, `e2e`의 README에 구조도와 동작 설명을 넣었다
- 콘솔 README에 빠져 있던 그림 신고 화면을 넣었다

## 상세

**배경**
앱별 README가 실행 명령과 목록 위주라 구조를 이해하기 어려웠다.

**변경 범위**
앱별 README 다섯 개.

**기술 포인트**
mermaid를 썼다. GitHub에서 그대로 그려지고 코드와 함께 고칠 수 있다. 수치와 경로는 코드에서 다시 읽어 적었다.

**안 한 것**
코드 변경.

## 결과

**동작 확인**
문서만 바뀌었다. 링크 검사는 문서 묶음 끝에서 한다. mermaid가 GitHub에서 실제로 그려지는지는 푸시 뒤에 봐야 한다.

**리스크**
없음.

**후속**
루트 README.

**관련 문서**
[apps/api/README.md](../../../apps/api/README.md)
