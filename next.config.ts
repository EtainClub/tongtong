import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import type { NextConfig } from "next";

/**
 * 빌드 신원 — 잼통과 같은 방식. 사람이 읽는 버전(package.json)과 배포를 가리는 커밋 해시를 함께 굽는다.
 * "화면이 이상해요"를 받았을 때 어느 빌드인지 알려고 내 기록 맨 아래에 적는다 (lib/build-info).
 * 버전은 이정표에서만 올리고, 해시는 배포마다 저절로 달라진다.
 */
function buildInfo() {
  const pkg = JSON.parse(readFileSync("./package.json", "utf8")) as { version: string };
  // App Hosting은 저장소를 체크아웃해 빌드하므로 대개 .git이 있다. 없어도 빌드는 깨지지 않게 빈 값으로.
  let commit = "";
  try {
    commit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    commit = "";
  }
  return { NEXT_PUBLIC_APP_VERSION: pkg.version, NEXT_PUBLIC_BUILD_COMMIT: commit };
}

const nextConfig: NextConfig = {
  env: {
    ...buildInfo(),
    // App Check — reCAPTCHA Enterprise 사이트 키(tongtong-web). 브라우저로 나가는 값이라 비밀이 아니다.
    // 키의 허용 도메인: localhost, tongtongs.web.app, tongtongs.firebaseapp.com, 기본 hosted.app, tt.jamtong.kr. 도메인이 늘면 키에 추가한다.
    // 이 값이 있으면 서버도 App Check를 강제한다 (lib/guard/identity).
    NEXT_PUBLIC_APPCHECK_SITE_KEY: "6LcFcdUtAAAAANjIcttDvQVUIs4k1XiWBAg9HUM4",
    // 웹 푸시 인증서의 공개 키(VAPID, 로드맵 M7-B). 브라우저가 푸시 구독에 쓰는 값이라 비밀이 아니다.
    // Firebase 콘솔 → 프로젝트 설정 → Cloud Messaging → 웹 푸시 인증서. 비밀 키는 Firebase가 갖고 있다.
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: "BO9CGJ8PFqqn3nyZ1DfaXX1dQqBs-iBSOHlKmo-VXqa_uuOwO94MM28NuZmvlgd7_w2qYPJpak_82PF5gjJdd9k",
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
