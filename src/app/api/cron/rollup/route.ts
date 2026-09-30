import { verifyCron } from "@/lib/guard/cron";
import { refusalResponse } from "@/lib/guard/refusal";
import { rollupCardStats } from "@/lib/server/rollup";

export const runtime = "nodejs";

/** Cloud Scheduler가 주기적으로 부른다. 실패는 로그에 ERROR로 남아 Scheduler 재시도에 맡긴다. */
export async function POST(req: Request) {
  try {
    await verifyCron(req);
    return Response.json(await rollupCardStats());
  } catch (error) {
    return refusalResponse(error);
  }
}
