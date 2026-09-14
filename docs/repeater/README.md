# 인프라 장애·해결 지식

연결 실패, 포트 충돌, DB 끊김 등 **다시 터질 수 있는 이슈**와 해결을 모은다. [../find_debug/](../find_debug/)(일지)에서 정제된 내용을 여기로 올리는 식으로 쓴다.

## 이슈 작성 템플릿

1. 환경 (local / docker)
2. 증상
3. 원인
4. 해결
5. 검증 명령

## 파일명

주제별 하나씩, 예: `docker-postgres-port.md`, `nest-fastapi-internal-network.md`, `prisma-migration-conflict.md`

아직 코드/인프라가 없어 기록된 이슈가 없다. 처음 겪는 인프라 문제부터 이 폴더에 쌓는다.
