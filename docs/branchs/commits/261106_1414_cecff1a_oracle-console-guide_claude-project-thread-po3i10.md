# Oracle 콘솔 화면 안내 페이지 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): Oracle 콘솔 화면 안내 페이지 추가` |
| Full SHA | `cecff1a85ad4ea40d40e8cd0e4cce8b41c65976d` |
| Short SHA | `cecff1a` |
| Branch | `claude/project-thread-po3i10` |
| Parent | `903cbc2` |
| Date | 2026-11-06 14:14:58 +0000 |

## 주 내용
- `docs/web_management/oracle-console-guide.html`: Oracle 인스턴스 생성·80/443 열기 화면을 다시 그린 모형과 번호 안내
- 문서로 확인한 문구와 추정 문구를 구분하고 일치도 점검표를 둠
- `deploy-guide.html` 1·2단계와 `docs/DEPLOYMENT.md`에서 링크, 80·443은 규칙 두 개로 명시

## 확인
- Playwright로 1280·390px 렌더, 가로 스크롤 없음
- 실제 Oracle 콘솔은 보지 못함(커넥터 미로그인): 화면 일치는 보증하지 않음
