import { Refusal } from "@/lib/guard/refusal";

/*
 * AI 따져보기 남용 방지 (잼통 lib/agent/guard의 3·4겹).
 *
 * 공개 엔드포인트는 누구나 운영자 돈으로 부를 수 있다. 1·2겹(Origin, 로그인+App Check)은
 * /api/ask가 먼저 본다. 여기서는 사람 단위 한도와 전체 일일 총량을 센다.
 *
 * 프로세스 메모리에 센다 — 인스턴스가 여럿이면 한도가 배수가 된다. 트래픽이 커지면
 * 공유 저장소로 옮긴다. 이 파일만 고치면 되도록 호출부와 분리해 둔다.
 * ⚠ 마지막 방어선은 코드가 아니라 Anthropic Console의 월 지출 한도다.
 */

const PER_KEY_LIMIT = Number(process.env.ASK_HOURLY_LIMIT ?? 20); // uid·IP 각각 1시간당
const WINDOW_MS = 60 * 60 * 1000;
const DAILY_LIMIT = Number(process.env.ASK_DAILY_LIMIT ?? 500);

const hits = new Map<string, number[]>();
let daily = { day: "", count: 0 };

/**
 * 한 사람의 한도. 익명 uid는 새로 만들기 쉬우므로 uid와 IP 둘 다 센다 —
 * 둘 중 하나라도 넘으면 막는다. 다른 엔드포인트는 키에 접두어를 붙이고 자기 한도·코드를 넘긴다.
 */
export function takeRate(keys: string[], now = Date.now(), { limit = PER_KEY_LIMIT, code = "ask-rate-limited" } = {}) {
  const windows = keys.map((key) => (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS));
  if (windows.some((w) => w.length >= limit)) throw new Refusal(429, code);
  keys.forEach((key, i) => hits.set(key, [...windows[i], now]));

  if (hits.size > 5000) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
}

/** 전체 일일 총량. 모델을 실제로 부르기 직전에만 센다. */
export function takeDailyBudget(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  if (daily.day !== day) daily = { day, count: 0 };
  if (daily.count >= DAILY_LIMIT) throw new Refusal(503, "ask-daily-budget");
  daily.count += 1;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

/** 테스트 전용. */
export function resetLimits() {
  hits.clear();
  daily = { day: "", count: 0 };
}
