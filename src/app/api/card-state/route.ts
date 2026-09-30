import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { recordCardAction } from "@/lib/server/store";
import { cardActionInput } from "@/lib/user-state";

export const runtime = "nodejs";

/** 저장·저장 취소·넘기기·완료. */
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const { uid } = await verifyCaller(req);
    const parsed = cardActionInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    return Response.json(await recordCardAction(uid, parsed.data.cardId, parsed.data.action));
  } catch (error) {
    return refusalResponse(error);
  }
}
