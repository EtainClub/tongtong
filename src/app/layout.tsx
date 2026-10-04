import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/lib/firebase/auth";
import { UserDataProvider } from "@/lib/firebase/user-data";
import { VisitBeacon } from "@/features/metrics/VisitBeacon";
import { BottomNav } from "@/features/ui/BottomNav";
import { SITE_URL } from "@/lib/site";

/* 본문은 Pretendard(globals.css에서 CDN), 수치는 IBM Plex Mono — 잼통과 같다. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // 공유 미리보기 이미지의 절대 주소를 만든다.
  metadataBase: new URL(SITE_URL),
  title: { default: "통통", template: "%s · 통통" },
  description: "정책을 보고, 근거를 따져보고, 내 판단이 어떻게 바뀌는지 기록합니다.",
  openGraph: { type: "website", locale: "ko_KR", siteName: "통통" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`h-full antialiased ${plexMono.variable}`}>
      <body className="min-h-full bg-canvas text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-eggshell"
        >
          본문으로 건너뛰기
        </a>
        {/* 익명 로그인은 화면 전체가 공유한다 — 피드·카드·내 기록이 같은 사용자를 쓴다. */}
        <AuthProvider>
          <UserDataProvider>
            {children}
            <BottomNav />
          </UserDataProvider>
          <VisitBeacon />
        </AuthProvider>
      </body>
    </html>
  );
}
