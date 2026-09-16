# LAN IP로 접속 시 HMR 차단되는 문제 해결

| 항목 | 내용 |
|------|------|
| Subject | `fix(web): LAN IP로 접속 시 HMR 차단되는 문제 해결` |
| Full SHA | `36c5dc58f3f9804667c97158f1385164bc069153` |
| Short SHA | `36c5dc5` |
| Branch | `fix/web-lan-dev-origin` |
| Parent | `da2cf89` |
| Date | 2026-09-16 21:26:14 +0900 |

## 주 내용

- `apps/web/next.config.ts`에 `allowedDevOrigins: ["192.168.45.24"]` 추가

## 상세

**배경**
사용자가 "헤더 햄버거 메뉴를 눌러도 안 열린다"고 보고했다. `localhost:3000`을 Playwright로 직접 클릭해 재현을 두 번 시도했으나(각각 캐시 있는 상태, 캐시/쿠키 완전히 비운 새 브라우저 컨텍스트) 둘 다 `data-open`·`inert`·`aria-expanded`가 정상 토글되고 메뉴도 스크린샷상 정상이었다 — 컴포넌트 코드는 원인이 아니었다.

처음엔 이번 세션 내내 반복한 `git checkout` 브랜치 전환이 dev 서버의 Fast Refresh 상태를 꼬이게 했을 거라 추정하고 서버를 재시작했지만 재발했다. 사용자가 실제 브라우저 콘솔 에러를 전달했다:

```
WebSocket connection to 'ws://192.168.45.24:3000/_next/hmr?id=...' failed
```

`192.168.45.24`는 이 개발 머신 자신의 LAN IP다(`ipconfig`로 확인). 사용자가 `localhost` 대신 이 IP로 접속하고 있었고, dev 서버 로그에도 이미 힌트가 있었다: `Blocked cross-origin request to Next.js dev resource /_next/hmr from "192.168.45.24"` + `allowedDevOrigins`를 추가하라는 Next.js 자체 안내.

**변경 범위**
`apps/web/next.config.ts` (3줄)

**기술 포인트**
- Next.js는 dev 서버가 `localhost` 외의 출처에서 HMR·dev 전용 리소스를 요청받으면 기본적으로 차단한다(CSRF류 공격 방지). 페이지 자체(SSR HTML, 정적 청크)는 정상 로드되어 화면은 멀쩡해 보이지만, HMR 웹소켓만 막힌다 — 이번 건 그것만으로는 클릭이 안 먹는 이유를 완전히 설명 못 해서(HMR과 hydration은 별개), 최종적으로는 `allowedDevOrigins` 추가 후 실제 LAN IP로 접속해 클릭까지 재현하는 것으로 검증했다.
- 재현 우선순위를 `localhost` → 사용자가 준 에러 로그 → 정확한 접속 경로(LAN IP) 순으로 좁혀 간 것이 핵심이었다. 로컬에서 안 터지는 버그는 "사용자가 실제로 보는 화면"과 같은 경로로 재현해야 한다는 교훈.

**안 한 것**
- `allowedDevOrigins`에 서브넷 전체(`192.168.45.0/24`)나 다른 팀원 IP를 미리 넣지 않았다. 이 IP는 이 개발 머신 것이라 다른 사람이 그대로 쓸 값이 아니다 — 필요한 사람이 자기 IP를 추가하라고 주석에 남겼다.

## 결과

**동작 확인**
- Playwright로 `http://192.168.45.24:3000/`에 직접 접속해 실제 마우스 좌표로 클릭 → `dataOpen: "true"`, `inert` 해제, 콘솔에 `[HMR] connected` (이전엔 연결 실패)
- 서버 로그에서 cross-origin 경고 재확인 → 더 이상 안 뜸

**리스크**
- 개발 전용 설정이다. 이 IP가 나중에 DHCP로 바뀌면 다시 막힐 수 있다 — 그때 재발하면 원인을 알고 있으니 빠르게 고칠 수 있다.

**후속**
없음. 사용자 확인 대기.

**관련 문서**
`apps/web/components/site-header.tsx`, `apps/web/components/site-drawer.tsx`
