/** 한국 날짜 "YYYY-MM-DD". 하루 단위 집계와 코호트는 모두 이 날짜를 쓴다. */
export const kstDate = (now = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now);

/** 두 "YYYY-MM-DD" 사이의 날 수 (b − a). */
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** "YYYY-MM-DD"에서 days만큼 옮긴 날. */
export const shiftDate = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
