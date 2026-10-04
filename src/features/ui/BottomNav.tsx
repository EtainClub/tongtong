"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PLAN_ENTRY_OPEN } from "@/content/paths";
import { useUserData } from "@/lib/firebase/user-data";

/*
 * 모바일 하단 탭 (청사진 설계 12장 "탭 구조" — 2026-10-04 결정).
 *
 * 작은 화면(sm 미만)에서만 보인다. 넓은 화면은 지금처럼 머리 링크를 쓴다.
 * 한 장씩 따라가는 흐름(카드, 청사진 만들기)과 온보딩 전에는 숨긴다 — 흐름 중간에 다른 곳으로 새지 않게.
 * 지금 탭은 색이 아니라 굵기와 위쪽 선으로 보인다(무채색 규칙).
 * 높이는 globals.css의 --bottom-nav — 화면 아래에 붙는 알림이 탭에 가리지 않게 같은 값을 쓴다.
 */

type Tab = { href: string; label: string; active: (path: string) => boolean };

const FLOWS = ["/card/", "/plan/new"];

export function BottomNav() {
  const pathname = usePathname();
  const data = useUserData();

  if (!data.ready || !data.profile) return null;
  if (FLOWS.some((prefix) => pathname.startsWith(prefix))) return null;

  const tabs: Tab[] = [
    { href: "/", label: "피드", active: (p) => p === "/" },
    // 청사진은 청년만, 공개 견본이 있을 때만 (청사진 설계 7.1).
    ...(PLAN_ENTRY_OPEN && data.profile.audienceType === "young_adult" ? [{ href: "/plan", label: "청사진", active: (p: string) => p.startsWith("/plan") }] : []),
    { href: "/saved", label: "저장", active: (p) => p.startsWith("/saved") },
    { href: "/me", label: "내 기록", active: (p) => p.startsWith("/me") },
  ];

  return (
    <nav
      data-bottom-nav
      aria-label="주요 화면"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone bg-eggshell pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {tabs.map((tab) => {
          const active = tab.active(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 items-center justify-center border-t-2 text-[14px] ${active ? "border-ink font-semibold text-ink" : "border-transparent text-graphite"}`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
