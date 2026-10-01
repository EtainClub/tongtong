import { blueprintCreateInput, blueprintPatchInput } from "@/lib/blueprint/apply";
import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { archiveBlueprint, createBlueprint, updateBlueprint } from "@/lib/server/blueprint-store";

export const runtime = "nodejs";

/** 청사진 만들기 — REV.1. */
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const { uid } = await verifyCaller(req);
    const parsed = blueprintCreateInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    return Response.json(await createBlueprint(uid, parsed.data));
  } catch (error) {
    return refusalResponse(error);
  }
}

/** 청사진 고치기 — op 목록을 REV 하나로. */
export async function PATCH(req: Request) {
  try {
    checkOrigin(req);
    const { uid } = await verifyCaller(req);
    const parsed = blueprintPatchInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    return Response.json(await updateBlueprint(uid, parsed.data));
  } catch (error) {
    return refusalResponse(error);
  }
}

/** 청사진 보관 — ?id= */
export async function DELETE(req: Request) {
  try {
    checkOrigin(req);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new Refusal(400, "invalid-body");
    const { uid } = await verifyCaller(req);
    return Response.json(await archiveBlueprint(uid, id));
  } catch (error) {
    return refusalResponse(error);
  }
}
