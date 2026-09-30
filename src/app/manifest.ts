import type { MetadataRoute } from "next";

/** 홈 화면에 추가했을 때의 모습. 모바일 웹이 기본이라 설치 경로를 비워 두지 않는다. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "통통",
    short_name: "통통",
    description: "정책을 보고, 따져보고, 내 생각이 어떻게 바뀌는지 기록해요.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfcfc",
    theme_color: "#fdfcfc",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
