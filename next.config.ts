import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 버스 데이터는 서버에서 파일로 읽으므로 배포 번들에 포함시킨다.
  outputFileTracingIncludes: {
    "/api/plan": ["./lib/data/bus.json"],
  },
  // 같은 와이파이의 폰에서 http://<컴퓨터 IP>:3000 으로 개발 서버를 열어 볼 수 있게 한다. (개발 중에만 적용)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  /* config options here */
};

export default nextConfig;
