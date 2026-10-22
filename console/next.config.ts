import type { NextConfig } from "next";

// 운영자 콘솔. 이용자 사이트(apps/web)와 따로 띄우고(3001), 바깥에 열 때도 따로 막을 수 있게 한다
const nextConfig: NextConfig = {
  // e2e는 별도 빌드 폴더를 써서 개발 서버의 .next와 부딪히지 않는다
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  typescript: { tsconfigPath: process.env.NEXT_DIST_DIR ? "tsconfig.e2e.json" : "tsconfig.json" },
  // 보안 헤더. 검색 엔진에도 노출하지 않는다. 스크립트 출처를 묶는 CSP는 요청마다 nonce가 달라 proxy.ts가 붙인다
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
