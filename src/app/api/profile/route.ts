import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { saveProfile } from "@/lib/server/store";
import { profileInput } from "@/lib/user-state";

export const runtime = "nodejs";

/** 온보딩과 동의 변경. */
export async function PUT(req: Request) {
  try {
    checkOrigin(req);
    const { uid } = await verifyCaller(req);
    const parsed = profileInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    return Response.json(await saveProfile(uid, parsed.data));
  } catch (error) {
    return refusalResponse(error);
  }
}
