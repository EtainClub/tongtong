import { OAuth2Client } from "google-auth-library";

import { Refusal } from "@/lib/guard/refusal";

const client = new OAuth2Client();

/**
 * Cloud Scheduler가 부른 요청인지 본다 (임통 guard/cron과 같다).
 * Scheduler는 지정한 서비스 계정으로 서명한 OIDC 토큰을 싣는다. audience와 서명자를 모두 확인한다.
 */
export async function verifyCron(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new Refusal(401, "cron-auth-missing");
  const audience = process.env.CRON_AUDIENCE;
  const serviceAccount = process.env.CRON_SERVICE_ACCOUNT;
  if (!audience || !serviceAccount) throw new Error("cron environment is not configured");
  let email: string | undefined;
  try {
    email = (await client.verifyIdToken({ idToken: token, audience })).getPayload()?.email;
  } catch {
    throw new Refusal(401, "cron-auth-invalid");
  }
  if (email !== serviceAccount) throw new Refusal(403, "cron-wrong-caller");
}
