import { createHash } from "node:crypto";

import { getMessaging } from "firebase-admin/messaging";

import { CARDS, findCard } from "@/content/cards";
import { PATHS } from "@/content/paths";
import { POLICIES } from "@/content/policies";
import { checkBlueprint, openChecks } from "@/lib/blueprint/check";
import type { Blueprint } from "@/lib/blueprint/model";
import { db } from "@/lib/firebase/admin";
import {
  anyOn,
  composeMessage,
  mergeNotifications,
  pickBlueprintNotifications,
  pickCardNotifications,
  readSettings,
  type NotifyItem,
  type NotifySettings,
} from "@/lib/notify";
import { SITE_URL } from "@/lib/site";
import type { CardState } from "@/lib/user-state";

/*
 * 알림 설정·기기·발송 (로드맵 M7-B, 청사진 설계 B5).
 *
 *   users/{uid}/notify/settings   { updates, revisit, deadlines, blueprint, sent[], updatedAt }  — 본인 읽기만
 *   users/{uid}/devices/{id}      { token, createdAt, lastSeenAt }                               — 아무도 못 읽음
 *
 * 쓰기는 /api/notifications만. 모두 끄면 이 사람의 기기 토큰을 지운다 — 안 쓰는 토큰을 남기지 않는다.
 */

/** 같은 알림을 다시 보내지 않으려고 남기는 key의 수. 오래된 것부터 버린다. */
const SENT_KEEP = 200;

const settingsRef = (uid: string) => db.doc(`users/${uid}/notify/settings`);
const devicesRef = (uid: string) => db.collection(`users/${uid}/devices`);
/** 토큰은 길고 문서 id로 쓸 수 없는 글자가 있어 해시를 id로 쓴다. 같은 기기를 다시 켜면 같은 문서다. */
const deviceId = (token: string) => createHash("sha256").update(token).digest("hex").slice(0, 32);

export async function saveNotifySettings(uid: string, settings: NotifySettings, token: string | undefined, now = new Date()) {
  const at = now.toISOString();
  await settingsRef(uid).set({ ...settings, updatedAt: at }, { merge: true });
  if (!anyOn(settings)) {
    await db.recursiveDelete(devicesRef(uid));
    return { settings, devices: 0 };
  }
  if (token) {
    await devicesRef(uid).doc(deviceId(token)).set({ token, lastSeenAt: at, createdAt: at }, { merge: true });
  }
  return { settings, devices: (await devicesRef(uid).count().get()).data().count };
}

export type Sender = (tokens: string[], message: { title: string; body: string; path: string }) => Promise<{ invalid: string[]; sent: number }>;

/**
 * FCM 웹 푸시. 서비스 워커(public/sw.js)가 notification을 그대로 띄우고 data.path를 같은 출처에서 연다.
 * fcmOptions.link는 FCM이 절대 주소를 요구해 정식 주소로 둔다.
 */
export const fcmSender: Sender = async (tokens, message) => {
  const response = await getMessaging().sendEachForMulticast({
    tokens,
    data: { path: message.path },
    webpush: {
      notification: { title: message.title, body: message.body, icon: "/icons/icon-192.png", lang: "ko" },
      fcmOptions: { link: `${SITE_URL}${message.path}` },
    },
  });
  const invalid = response.responses.flatMap((r, i) =>
    !r.success && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(r.error?.code ?? "") ? [tokens[i]] : [],
  );
  return { invalid, sent: response.successCount };
};

const policyById = new Map(POLICIES.map((policy) => [policy.id, policy]));
const pathById = new Map(PATHS.map((path) => [path.id, path]));

/**
 * 지금 청사진의 알림거리 (청사진 설계 B5). 화면의 점검과 같은 함수(checkBlueprint)로 계산하고,
 * 사용자가 화면에서 닫은 알림(ackedChecks)은 빼고 본다.
 */
async function blueprintItems(uid: string, states: ReadonlyMap<string, CardState>, now: Date): Promise<NotifyItem[]> {
  const active = await db.collection(`users/${uid}/blueprints`).where("status", "==", "active").limit(1).get();
  if (active.empty) return [];
  const blueprint = active.docs[0].data() as Blueprint;
  const completedCards = new Set([...states.values()].filter((state) => state.completedAt).map((state) => state.cardId));
  const checks = checkBlueprint(blueprint, { policies: policyById, paths: pathById, hasCard: (id) => Boolean(findCard(id)), completedCards, now });
  return pickBlueprintNotifications(openChecks(checks, blueprint.ackedChecks), (id) => policyById.get(id)?.name ?? id);
}

/**
 * 하루 한 번(Cloud Scheduler → /api/cron/notify). 켠 사람만, 저장한 카드·지금 청사진만, 한 사람에게 한 건.
 * 보낸 key는 settings.sent에 남겨 다음 날 다시 보내지 않는다. 받지 못하는 토큰은 지운다.
 */
export async function sendDailyNotifications(now = new Date(), send: Sender = fcmSender) {
  const settingsDocs = await db.collectionGroup("notify").get();
  let users = 0;
  let messages = 0;
  for (const doc of settingsDocs.docs) {
    if (doc.id !== "settings") continue;
    const uid = doc.ref.parent.parent!.id;
    const data = doc.data();
    const settings = readSettings(data);
    if (!anyOn(settings)) continue;

    const devices = await devicesRef(uid).get();
    if (devices.empty) continue;

    const states = new Map((await db.collection(`users/${uid}/cardStates`).get()).docs.map((d) => [d.id, d.data() as CardState]));
    const candidates = [...pickCardNotifications(CARDS, states, settings, now), ...(settings.blueprint ? await blueprintItems(uid, states, now) : [])];
    const { items, keys } = mergeNotifications(candidates, new Set<string>(data.sent ?? []));
    if (items.length === 0) continue;

    const message = composeMessage(items);
    const tokens = devices.docs.map((d) => d.data().token as string);
    const result = await send(tokens, message);
    users += 1;
    messages += result.sent;

    await Promise.all(devices.docs.filter((d) => result.invalid.includes(d.data().token)).map((d) => d.ref.delete()));
    if (result.sent > 0) {
      const sent = [...(data.sent ?? []), ...keys].slice(-SENT_KEEP);
      await doc.ref.update({ sent, lastSentAt: now.toISOString() });
    }
  }
  return { users, messages };
}
