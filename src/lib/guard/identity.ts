import { appCheck, auth } from "@/lib/firebase/admin";
import { Refusal } from "@/lib/guard/refusal";

export type Caller = { uid: string; isAnonymous: boolean };

/**
 * 사이트 키가 설정돼 있으면 App Check를 강제한다 (next.config.ts). 에뮬레이터에서만 건너뛴다.
 *
 * 따로 스위치를 두지 않는다 — 키는 있는데 강제가 꺼져 있으면 켜져 있다고 착각하게 된다.
 * 클라이언트는 같은 키로 토큰을 받아 x-firebase-appcheck에 싣는다 (lib/firebase/api).
 */
const enforceAppCheck = Boolean(process.env.NEXT_PUBLIC_APPCHECK_SITE_KEY) && !process.env.FIREBASE_AUTH_EMULATOR_HOST;
async function verifyAppCheck(req: Request) {
  const token = req.headers.get("x-firebase-appcheck");
  if (!token) throw new Refusal(401, "app-check-missing");
  try {
    await appCheck.verifyToken(token);
  } catch {
    throw new Refusal(401, "app-check-invalid");
  }
}

export async function verifyCaller(req: Request): Promise<Caller> {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!bearer) throw new Refusal(401, "auth-missing");
  let decoded;
  try {
    decoded = await auth.verifyIdToken(bearer);
  } catch {
    throw new Refusal(401, "auth-invalid");
  }
  if (enforceAppCheck) await verifyAppCheck(req);
  return { uid: decoded.uid, isAnonymous: decoded.firebase?.sign_in_provider === "anonymous" };
}
