import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { deleteUserData } from "@/lib/server/store";

export const runtime = "nodejs";

/** scope=judgments는 판단 기록만, scope=blueprints는 청사진만, scope=account는 계정까지 지운다. (임통 /api/me) */
export async function DELETE(req: Request) {
  try {
    checkOrigin(req);
    const scope = new URL(req.url).searchParams.get("scope");
    if (scope !== "judgments" && scope !== "blueprints" && scope !== "account") throw new Refusal(400, "invalid-delete-scope");
    const { uid } = await verifyCaller(req);
    return Response.json(await deleteUserData(uid, scope));
  } catch (error) {
    return refusalResponse(error);
  }
}
