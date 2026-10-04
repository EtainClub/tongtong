import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // App Check — reCAPTCHA Enterprise 사이트 키(tongtong-web). 브라우저로 나가는 값이라 비밀이 아니다.
    // 키의 허용 도메인: localhost, tongtongs.web.app, tongtongs.firebaseapp.com, 기본 hosted.app, tt.jamtong.kr. 도메인이 늘면 키에 추가한다.
    // 이 값이 있으면 서버도 App Check를 강제한다 (lib/guard/identity).
    NEXT_PUBLIC_APPCHECK_SITE_KEY: "6LcFcdUtAAAAANjIcttDvQVUIs4k1XiWBAg9HUM4",
  },
  // 서비스 워커(로드맵 M7)는 늘 새로 받는다 — 브라우저가 옛 워커를 붙잡지 않게.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
