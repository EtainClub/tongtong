import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { metricEventSchema } from "@/lib/metrics/events";
import { recordMetric } from "@/lib/metrics/store";

export const runtime = "nodejs";

/**
 * 측정 이벤트 접수 (로드맵 M8). 로그인·쿠키·IP를 읽지 않는다 — 누가 보냈는지 알 필요가 없다.
 * 몸통은 정해진 몇 가지 모양뿐이고 200자를 넘지 않는다.
 */
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const text = await req.text();
    if (text.length > 200) throw new Refusal(400, "invalid-body");
    const parsed = metricEventSchema.safeParse(JSON.parse(text));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    await recordMetric(parsed.data);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof SyntaxError) return refusalResponse(new Refusal(400, "invalid-body"));
    return refusalResponse(error);
  }
}
