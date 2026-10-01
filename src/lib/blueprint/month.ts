import { z } from "zod";

import { kstDate } from "@/lib/date";

/*
 * 청사진의 시간은 달(YYYY-MM)이다 (청사진 설계 4.2). 몇 년 뒤를 날짜까지 적는 것은 거짓 정밀도다.
 * 화면은 반기로 묶는다 — 1–6월은 상반기, 7–12월은 하반기.
 */

export const YearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "YYYY-MM");
export type YearMonth = z.infer<typeof YearMonth>;

/** 0년 1월부터 센 달 번호 — 비교와 덧셈에 쓴다. */
export const monthIndex = (ym: YearMonth) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;

export const fromIndex = (index: number): YearMonth => `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;

export const addMonths = (ym: YearMonth, months: number) => fromIndex(monthIndex(ym) + months);

/** 한국 시간 이번 달. */
export const currentMonth = (now = new Date()): YearMonth => kstDate(now).slice(0, 7);

/** 날짜·시각 문자열(정책 신청 회차)이 속한 달 — 한국 시간. */
export const monthOf = (value: string): YearMonth => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value.slice(0, 7) : currentMonth(new Date(value)));

/** 반기 번호. 같은 반기면 같다. */
export const halfIndex = (ym: YearMonth) => Math.floor(monthIndex(ym) / 6);

export function halfLabel(index: number): string {
  return `${Math.floor(index / 2)} ${index % 2 === 0 ? "상반기" : "하반기"}`;
}

/** 두 기간 [aFrom, aTo]와 [bFrom, bTo]가 한 달이라도 겹치는가. 끝이 없으면 시작 달 하나다. */
export function overlaps(aFrom: YearMonth, aTo: YearMonth | undefined, bFrom: YearMonth, bTo: YearMonth | undefined): boolean {
  return monthIndex(aFrom) <= monthIndex(bTo ?? bFrom) && monthIndex(bFrom) <= monthIndex(aTo ?? aFrom);
}
