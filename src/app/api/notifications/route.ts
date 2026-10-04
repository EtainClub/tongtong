import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { notifyInput } from "@/lib/notify";
import { saveNotifySettings } from "@/lib/server/notify-store";

export const runtime = "nodejs";

/** 알림 설정 저장 (로드맵 M7-B). 켤 때 이 기기의 푸시 토큰을 함께 받는다. 모두 끄면 기기 토큰을 지운다. */
export async function PUT(req: Request) {
  try {
    checkOrigin(req);
    const { uid } = await verifyCaller(req);
    const parsed = notifyInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    const { token, ...settings } = parsed.data;
    return Response.json(await saveNotifySettings(uid, settings, token));
  } catch (error) {
    return refusalResponse(error);
  }
}
