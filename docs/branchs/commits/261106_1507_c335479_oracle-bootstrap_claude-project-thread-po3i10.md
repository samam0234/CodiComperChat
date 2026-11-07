# Oracle VM 원커맨드 부트스트랩 스크립트 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): Oracle VM 원커맨드 부트스트랩 스크립트 추가` |
| Full SHA | `c335479b4865c4293d360ddcfe321623f6551886` |
| Short SHA | `c335479` |
| Branch | `claude/project-thread-po3i10` |
| Parent | `c28deab` |
| Date | 2026-11-06 15:07:26 +0000 |

## 주 내용
- deploy/oracle/bootstrap.sh: VM 원커맨드 부트스트랩(준비·레포·.env 생성·기동·확인)
- deploy-guide.html 3단계와 DEPLOYMENT.md에 안내 추가

## 확인
- bash -n 통과, .env 값 치환(& ? 포함)과 compose의 공백·꺾쇠 값 처리 시험
- 실제 VM 실행은 하지 못함
