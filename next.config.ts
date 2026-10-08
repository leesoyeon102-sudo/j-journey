import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 버스 데이터는 서버에서 파일로 읽으므로 배포 번들에 포함시킨다.
  outputFileTracingIncludes: {
    "/api/plan": ["./lib/data/bus.json"],
  },
  /* config options here */
};

export default nextConfig;
