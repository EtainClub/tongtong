"use client";

import Image from "next/image";
import Link from "next/link";

import { useAppChrome } from "@/features/ui/appTabs";

/*
 * 상단 바 — 로고와 이름. 잼통 AppTopBar와 같은 모양(높이 56, 반투명, 아래 선).
 * 넓은 화면에서는 주요 화면 링크를 오른쪽에 둔다(작은 화면은 하단 탭).
 * 카드 흐름·청사진 만들기, 온보딩 화면에서는 숨긴다.
 */
export function TopBar() {
  const { pathname, inFlow, onboarded, tabs } = useAppChrome();
  if (inFlow || (!onboarded && pathname === "/")) return null;

  return (
    <header data-top-bar className="sticky top-0 z-40 border-b border-stone bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-3 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icons/icon-192.png" alt="" aria-hidden width={28} height={28} priority className="h-7 w-7 rounded-[8px]" />
          <span className="text-[17px] font-bold tracking-tight text-ink">통통</span>
        </Link>
        {onboarded && (
          <nav aria-label="주요 화면" className="hidden items-center gap-1 sm:flex">
            {tabs.map((tab) => {
              const active = tab.active(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-pill px-3 py-1.5 text-[14px] transition-colors ${active ? "bg-taupe font-semibold text-navy" : "text-graphite hover:bg-taupe"}`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
