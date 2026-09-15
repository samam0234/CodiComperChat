# apps/api

코디컴퍼챗 도메인/상태 API. Nest.js 12 (TypeScript, ESM).

```bash
# 저장소 루트에서
npm install
npm run dev:api        # http://localhost:4000
npm run build:api
npm run test:api:e2e
```

현재는 **라우트 뼈대**다. `GET /health`만 실제로 응답하고, 나머지는 501 + 한국어 미구현 사유를 돌려준다.

- 엔드포인트 목록·현황: [../../docs/API_DOCUMENTATION.md](../../docs/API_DOCUMENTATION.md)
- 계층 규칙(Controller → Service → Repository): [../../docs/Architecture/layers.md](../../docs/Architecture/layers.md)
- 폴더 구조: [../../docs/plan/PROJECT_STRUCTURE.md](../../docs/plan/PROJECT_STRUCTURE.md)

## 주의

- **ESM이다.** 상대 import에는 `.js` 확장자를 붙인다 (`./app.module.js`). TS 파일을 가리켜도 `.js`로 쓴다.
- 테스트는 Jest가 아니라 **vitest**, 린트는 ESLint가 아니라 **oxlint**다.
- FastAPI(`services/ai`)는 이 앱만 내부망에서 호출한다. 웹이 직접 호출하지 않는다 (기획서 §7.1).
