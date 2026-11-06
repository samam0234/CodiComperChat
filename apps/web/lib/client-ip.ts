import "server-only";

import { headers } from "next/headers";

// 웹 서버가 대신 API를 부르면 API가 보는 IP는 늘 웹 서버의 주소다. 그대로 두면 IP 기준 한도(로그인·가입·안내 도우미)가
// 모든 이용자를 한 사람으로 세어 사이트 전체가 막힌다. 그래서 실제 이용자 IP를 X-Forwarded-For로 넘기고,
// API는 사설·루프백 주소에서 온 요청의 이 헤더만 믿는다(main.ts의 trust proxy).
// 운영에서는 웹 앞단(프록시·로드밸런서)이 이 헤더를 자기가 본 주소로 덮어써야 이용자가 스스로 IP를 꾸며 한도를 피하지 못한다.
export async function forwardedFor(): Promise<Record<string, string>> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
  if (!ip) return {};
  // 웹과 API가 다른 기계일 때(웹은 Vercel, API는 Oracle 서버) API 앞의 Caddy는 바깥에서 온 X-Forwarded-For를 덮어쓴다.
  // 공유 비밀(WEB_PROXY_TOKEN)을 함께 보내면 Caddy가 "우리 웹 서버가 보낸 것"으로 보고 이 IP를 그대로 넘긴다
  // (deploy/oracle/Caddyfile). 같은 기계·사설망 구성에서는 비워 둔다
  const token = process.env.WEB_PROXY_TOKEN;
  return token ? { "X-Forwarded-For": ip, "X-Web-Proxy-Token": token } : { "X-Forwarded-For": ip };
}
