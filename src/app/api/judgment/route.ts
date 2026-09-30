import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { judgmentInput } from "@/lib/judgment";
import { recordJudgment } from "@/lib/server/store";

export const runtime = "nodejs";

/** 판단 한 건 기록 (설계 54장 recordJudgment). 규칙은 lib/user-state.applyJudgment. */
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const { uid } = await verifyCaller(req);
    const parsed = judgmentInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    return Response.json(await recordJudgment(uid, parsed.data));
  } catch (error) {
    return refusalResponse(error);
  }
}
