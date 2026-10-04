"use client";

import { usePathname } from "next/navigation";

import { PLAN_ENTRY_OPEN } from "@/content/paths";
import { useUserData } from "@/lib/firebase/user-data";

/*
 * 앱의 주요 화면 — 상단 바(넓은 화면)와 하단 탭(작은 화면)이 같은 목록을 쓴다.
 * 잼통 하단 탭과 같은 모양: 선 아이콘 + 글자, 지금 탭은 navy (잼통 BottomNav).
 */

export type AppTab = { href: string; label: string; icon: React.ReactNode; active: (path: string) => boolean };

/** 한 장씩 따라가는 흐름 — 다른 곳으로 새지 않게 앱 머리·탭을 숨긴다. */
const FLOWS = ["/card/", "/plan/new"];

export function useAppChrome(): { pathname: string; inFlow: boolean; onboarded: boolean; tabs: AppTab[] } {
  const pathname = usePathname();
  const data = useUserData();
  const onboarded = data.ready && Boolean(data.profile);
  const tabs: AppTab[] = [
    { href: "/", label: "피드", icon: <FeedIcon />, active: (p) => p === "/" },
    // 청사진은 청년만, 공개 견본이 있을 때만 (청사진 설계 7.1).
    ...(PLAN_ENTRY_OPEN && data.profile?.audienceType === "young_adult"
      ? [{ href: "/plan", label: "청사진", icon: <PlanIcon />, active: (p: string) => p.startsWith("/plan") }]
      : []),
    { href: "/saved", label: "저장", icon: <SavedIcon />, active: (p) => p.startsWith("/saved") },
    { href: "/me", label: "내 기록", icon: <MeIcon />, active: (p) => p.startsWith("/me") },
  ];
  return { pathname, inFlow: FLOWS.some((prefix) => pathname.startsWith(prefix)), onboarded, tabs };
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** 겹친 카드 — 넘겨 보는 더미. */
function FeedIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="7" width="14" height="13" rx="2.5" />
      <path d="M8 4h8" />
    </svg>
  );
}

/** 시간축 위의 점 — 청사진. */
function PlanIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 4v16" />
      <circle cx="6" cy="7" r="1.6" />
      <circle cx="6" cy="17" r="1.6" />
      <path d="M10 7h8M10 12h6M10 17h8" />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg {...iconProps}>
      <path d="M7 4h10v16l-5-3.5L7 20z" />
    </svg>
  );
}

function MeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
    </svg>
  );
}
