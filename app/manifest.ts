import type { MetadataRoute } from "next";

// 홈 화면에 앱처럼 설치할 때 쓰는 정보. (아이폰은 설치한 앱에서만 웹 푸시가 온다)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "J의 외출",
    short_name: "J의 외출",
    description: "약속 시각만 넣으면 몇 시에 집을 나서 어떤 열차를 타야 하는지 알려주는 약속 출발 플래너",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e5d6fb",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
