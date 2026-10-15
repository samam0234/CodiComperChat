import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 웹 자동 테스트(e2e)는 별도 빌드 폴더를 써서 개발 서버의 .next와 부딪히지 않는다. 평소에는 기본값(.next)
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Next가 실행할 때마다 tsconfig를 고쳐 쓰므로, e2e는 매번 생성하는 별도 파일(gitignore)을 쓴다
  typescript: { tsconfigPath: process.env.NEXT_DIST_DIR ? "tsconfig.e2e.json" : "tsconfig.json" },
  // 로컬 네트워크의 다른 기기(폰 등)에서 개발 서버에 접속할 때 HMR 등
  // dev 전용 리소스가 cross-origin으로 막히지 않게 허용한다.
  // 팀원마다 IP가 다르므로 필요하면 이 배열에 자신의 LAN IP를 추가한다.
  allowedDevOrigins: ["192.168.45.24"],
};

export default nextConfig;
