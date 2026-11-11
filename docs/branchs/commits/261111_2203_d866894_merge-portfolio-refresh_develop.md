# feature/portfolio-refresh-20261111 into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/portfolio-refresh-20261111 into develop (no-ff)` |
| Full SHA | `d866894860bc60ab51cadf2089729eb51291c438` |
| Short SHA | `d866894` |
| Branch | `develop` |
| Parent | `68ff09f, f9d6f33` |
| Date | 2026-11-11 22:03:49 +0900 |

## 주 내용

- 포트폴리오 메인을 실제 제품 화면·개발 기록 중심으로 재구성하고 최근 구현과 운영 상태를 구분했다.
- 프레임워크와 개발 기록 상세 페이지를 추가해 정적 12페이지를 생성한다.
- README와 제품·포트폴리오 프레임워크 PNG·SVG 이미지 3종을 추가했다.
- Word·PDF·16장 발표자료와 기획 시트, 사이트·API·RAG 복사본을 함께 갱신했다.
- 문서 생성기를 갱신하고 경로·다운로드·데이터 동기화 검증 명령을 추가했다.

## 상세

**배경**
포트폴리오 곳곳에 챗봇이 로컬에서만 동작한다는 예전 안내가 남아 있었고 대화 편집·기억·스트리밍·호스팅 장애 대응 기록이 빠져 있었다.

**변경 범위**
PortFolio과 docs/Architecture/portfolio.md. 제품 앱과 기획 원본은 수정하지 않았다. 다른 세션과 별도 worktree에서 작업했다.

**기술 포인트**
portfolio.json에서 사이트·API·RAG·문서를 생성한다. 프레임워크 이미지는 설명용 도식이며 실제 제품 캡처는 그대로 사용한다. 시트의 기존 9개 탭과 모든 수식·조건부 서식·병합 범위를 대조해 보존했다. Rails 시험의 예전 테이블 37개·관계 40개 기대값을 현재 38개·41개로 정정하고 새 상세 페이지 검증을 추가했다.

**안 한 것**
제품 AI 품질 재평가·운영 api/ai 재배포·기존 제품 E2E 실패 3건 수정은 이 작업에 포함하지 않는다. 속도 개선을 실측 결과처럼 표시하지 않았다.

## 결과

**동작 확인**
Astro 12페이지 빌드, verify_portfolio.py의 경로·이미지·다운로드 4종·데이터·RAG 검사 통과. Rails 9개·44검증 통과, Flask pytest 16개 통과. Word를 LibreOffice로 렌더링하고 PDF·PPTX 이미지와 변경 시트를 확인했다. PPTX 패키지·레이아웃·글꼴·재가져오기 검증 통과.

**리스크**
컴퓨터 사용 도구가 브라우저 URL을 확인하지 못해 브라우저 상호작용 검증이 중단됐다. LangChain community 유지 종료 경고가 남는다. 운영 챗봇의 Oracle 데이터는 별도 배포가 필요하며 이번 작업의 저장소 스냅샷과 즉시 같아지지 않는다.

**후속**
요청받은 develop·main 병합 및 동시 푸시 후 기존 Vercel 포트폴리오 프로젝트에 정적 파일 재배포. Oracle 포트폴리오 백엔드·지식 자료 반영은 별도 서버 배포 시 적용한다.

**관련 문서**
PortFolio/README.md, docs/Architecture/portfolio.md, docs/AGENT_HANDOVER.md, docs/trainings/oracle-deploy-latency.md.
