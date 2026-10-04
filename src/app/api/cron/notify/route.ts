import { verifyCron } from "@/lib/guard/cron";
import { refusalResponse } from "@/lib/guard/refusal";
import { sendDailyNotifications } from "@/lib/server/notify-store";

export const runtime = "nodejs";

/** Cloud Scheduler가 하루 한 번 부른다 (로드맵 M7-B, README "운영 정보"). 실패는 로그에 ERROR로 남아 Scheduler 재시도에 맡긴다. */
export async function POST(req: Request) {
  try {
    await verifyCron(req);
    return Response.json(await sendDailyNotifications());
  } catch (error) {
    return refusalResponse(error);
  }
}
