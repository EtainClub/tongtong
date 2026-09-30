"use client";

import { useEffect } from "react";

import { daysBetween, kstDate } from "@/lib/date";
import { track } from "@/lib/metrics/track";

const FIRST_KEY = "tongtong:first-visit";
const RETURNED_KEY = "tongtong:returned";
const SESSION_KEY = "tongtong:visit-sent";

/**
 * 방문과 30일 재방문 (로드맵 M8). 아이디 없이 센다 — 이 브라우저가 처음 온 날짜만 기억한다.
 *   탭마다 한 번 visit(first).
 *   첫 방문 뒤 1–30일 안에 다시 오면 returned(첫 방문 날짜)를 딱 한 번.
 * 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)에서는 조용히 세지 않는다.
 */
export function VisitBeacon() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");

      const today = kstDate();
      const first = localStorage.getItem(FIRST_KEY);
      if (!first) {
        localStorage.setItem(FIRST_KEY, today);
        track({ event: "visit", first: true });
        return;
      }
      track({ event: "visit", first: false });
      const age = daysBetween(first, today);
      if (age >= 1 && age <= 30 && !localStorage.getItem(RETURNED_KEY)) {
        localStorage.setItem(RETURNED_KEY, "1");
        track({ event: "returned", cohort: first });
      }
    } catch {
      // 저장소를 쓸 수 없다 — 이 방문은 세지 않는다.
    }
  }, []);
  return null;
}
