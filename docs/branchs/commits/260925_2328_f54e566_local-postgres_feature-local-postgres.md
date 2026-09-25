# 로컬 개발 DB를 Docker에서 D드라이브 설치형 PostgreSQL로 전환

| 항목 | 내용 |
|------|------|
| Subject | `docs(db): 로컬 개발 DB를 Docker에서 D드라이브 설치형 PostgreSQL로 전환` |
| Full SHA | `f54e566082ab8c40610047448194ac0d434b2748` |
| Short SHA | `f54e566` |
| Branch | `feature/local-postgres` |
| Parent | `1212935` (develop) |
| Date | 2026-09-25T23:28:02+09:00 |

## 주 내용

- `docs/guidance/docker-run.md` 맨 위에 "로컬 PostgreSQL" 절차 추가 (설치 → localhost 제한 → 계정·DB 생성 → migrate/seed)
- `docs/plan/CURRENT_STACK.md` DB·포트 항목을 설치형 기준으로 갱신
- `README.md` 빠른 시작과 구조 설명 갱신
- `apps/api/.env.example` 주석을 로컬 PostgreSQL 기준으로 수정

## 상세

**배경**
사용자가 PostgreSQL을 Docker가 아니라 직접 실행하고, 데이터를 C드라이브(Docker WSL2 디스크)가 아닌 D드라이브에 두기를 원했다.

**변경 범위**
문서(`README.md`, `docs/guidance/docker-run.md`, `docs/plan/CURRENT_STACK.md`), `apps/api/.env.example`. 코드 변경 없음

**기술 포인트**
EDB 설치기를 무인 모드로 실행했다. `--enable-components` 등 옵션을 넣으면 설치기가 종료 코드 1로 실패해 최소 인자만 쓰는 절차로 문서화했다. 설치 기본값이 모든 네트워크 허용(`listen_addresses='*'`)이라 `localhost`로 제한했다.

**안 한 것**
`docker-compose.yml`은 지우지 않았다(선택 사항으로 문서화). Docker 볼륨의 옛 데이터(seed 캐릭터 1건)는 옮기지 않고 seed를 다시 넣었다.

## 결과

**동작 확인**
`prisma migrate deploy`·`db seed` 성공, `GET /characters` 200 (유지성 반환).

**리스크**
개발용 비밀번호를 쓰고 있어 배포 환경에서는 반드시 바꿔야 한다. Docker postgres와 동시에 켜면 5432가 충돌한다.

**후속**
배포 계획 문서(docker-topology 등)의 Docker 전제는 컨테이너화 작업 때 함께 정리

**관련 문서**
[docs/guidance/docker-run.md](../../guidance/docker-run.md), [docs/plan/CURRENT_STACK.md](../../plan/CURRENT_STACK.md)
