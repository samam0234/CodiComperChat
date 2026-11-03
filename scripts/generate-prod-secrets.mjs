// 운영용 비밀값을 표준 출력으로만 만든다. 파일에 쓰지 않고, git에 올리지 않는다.
//   node scripts/generate-prod-secrets.mjs
// 출력된 값을 운영 환경에만 넣는다. 개발용 .env 값을 운영에서 재사용하지 않는다.

import { randomBytes } from "node:crypto";

const secret = () => randomBytes(48).toString("base64url");

console.log("# 이 출력은 터미널에만 남긴다. 채팅·커밋·로그에 붙이지 않는다.");
console.log(`AUTH_SECRET=${secret()}`);
console.log(`AI_SERVICE_TOKEN=${secret()}`);
console.log("# DB 비밀번호, SMTP 비밀번호, 토스 비밀 키는 각 서비스에서 새로 발급한다.");
console.log("# 운영: NODE_ENV=production  APP_ENV=production  REQUIRE_HTTPS=1");
console.log("# 끄기: LLM_FAKE IMAGE_FAKE MODEL_PREMIUM_FAKE BILLING_PROVIDER=mock MAIL_OUTBOX_DIR");
