import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로컬 네트워크의 다른 기기(폰 등)에서 개발 서버에 접속할 때 HMR 등
  // dev 전용 리소스가 cross-origin으로 막히지 않게 허용한다.
  // 팀원마다 IP가 다르므로 필요하면 이 배열에 자신의 LAN IP를 추가한다.
  allowedDevOrigins: ["192.168.45.24"],
};

export default nextConfig;
