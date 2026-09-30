import { clientIp, takeRate } from "@/lib/ask/limits";
import { CORRECTION_HOURLY_LIMIT, correctionInput } from "@/lib/correction";
import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { recordCorrection } from "@/lib/server/store";

export const runtime = "nodejs";

/** 정정 요청 접수. */
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const { uid } = await verifyCaller(req);
    const parsed = correctionInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    takeRate([`correction:uid:${uid}`, `correction:ip:${clientIp(req)}`], Date.now(), {
      limit: CORRECTION_HOURLY_LIMIT,
      code: "correction-rate-limited",
    });
    const result = await recordCorrection(uid, parsed.data);
    console.info("correction-received", { cardId: parsed.data.cardId, id: result.id });
    return Response.json(result);
  } catch (error) {
    return refusalResponse(error);
  }
}
