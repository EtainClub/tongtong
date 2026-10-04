/*
 * 통통 서비스 워커 (로드맵 M7). 의존성 없이 직접 쓴다.
 *
 * - 화면(HTML 이동): 네트워크 먼저. 받으면 캐시에 넣고, 끊기면 캐시에서, 그것도 없으면 /offline.
 * - /_next/static·아이콘·브랜드 이미지: 캐시 먼저 — 파일 이름에 해시가 있어 바뀌지 않는다.
 * - /api, 다른 도메인(Firestore·Auth·App Check), GET 아닌 요청: 건드리지 않는다. 판단은 온라인일 때만.
 * - 앱이 "precache" 메시지로 저장한 카드 주소를 보내면, 그 화면과 화면이 쓰는 정적 파일을 미리 담는다.
 *
 * 알림(푸시)은 M7-B에서 더한다.
 */

const PAGES = "tongtong-pages-v1";
const STATIC = "tongtong-static-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("tongtong-") && key !== PAGES && key !== STATIC).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/");

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (isStatic(url)) event.respondWith(cacheFirst(request));
});

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) ?? (await cache.match(OFFLINE_URL)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

/** 화면 하나와 그 화면이 부르는 정적 파일(스크립트·스타일)을 담는다. 실패해도 다른 주소는 계속한다. */
async function precachePage(path) {
  const pages = await caches.open(PAGES);
  const response = await fetch(path, { credentials: "same-origin" });
  if (!response.ok) return;
  const html = await response.clone().text();
  await pages.put(path, response);
  const assets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((match) => match[1]);
  const statics = await caches.open(STATIC);
  await Promise.all(
    [...new Set(assets)].map(async (asset) => {
      if (await statics.match(asset)) return;
      const file = await fetch(asset);
      if (file.ok) await statics.put(asset, file);
    }),
  );
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "precache" || !Array.isArray(data.paths)) return;
  const paths = data.paths.filter((path) => typeof path === "string" && path.startsWith("/") && !path.startsWith("//"));
  event.waitUntil(Promise.allSettled(paths.map(precachePage)));
});
