"use client";

import Link from "next/link";

import { useAppChrome } from "@/features/ui/appTabs";

/*
 * 모바일 하단 탭 (청사진 설계 12장 "탭 구조" — 2026-10-04 결정).
 *
 * 작은 화면(sm 미만)에서만 보인다. 넓은 화면은 상단 바의 링크를 쓴다.
 * 한 장씩 따라가는 흐름(카드, 청사진 만들기)과 온보딩 전에는 숨긴다 — 흐름 중간에 다른 곳으로 새지 않게.
 * 잼통 하단 탭과 같은 모양 — 선 아이콘 + 글자, 지금 탭은 navy.
 * 높이는 globals.css의 --bottom-nav — 화면 아래에 붙는 알림이 탭에 가리지 않게 같은 값을 쓴다.
 */
export function BottomNav() {
  const { pathname, inFlow, onboarded, tabs } = useAppChrome();
  if (!onboarded || inFlow) return null;

  return (
    <nav
      data-bottom-nav
      aria-label="주요 화면"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {tabs.map((tab) => {
          const active = tab.active(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 transition-colors ${active ? "text-navy" : "text-ash hover:text-smoke"}`}
              >
                {tab.icon}
                <span className={`text-[11px] ${active ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
