import type { MetricEvent } from "@/lib/metrics/events";

/**
 * 측정 이벤트를 보낸다. 화면을 떠나는 순간에도 가도록 keepalive.
 * 실패해도 알리지 않는다 — 측정 때문에 앱이 멈추거나 오류가 뜨면 안 된다. 합계가 조금 빠질 뿐이다.
 * 개발 서버(next dev)에서는 보내지 않는다 — 로컬도 운영 Firestore를 쓰므로 개발하며 누른 것이 운영 지표에 섞인다.
 */
export function track(event: MetricEvent) {
  if (process.env.NODE_ENV !== "production") return;
  void fetch("/api/metrics", { method: "POST", body: JSON.stringify(event), keepalive: true, headers: { "content-type": "application/json" } }).catch(
    () => undefined,
  );
}
