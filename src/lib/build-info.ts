/**
 * 빌드 신원 — 값은 next.config.ts가 빌드 때 구워 넣는다. 서버와 브라우저가 같은 값을 본다.
 */
export const BUILD = {
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
  commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "",
};

/** 화면에 적는 형태. "0.2.0 (8557f36)" — 해시를 못 구한 빌드는 버전만. */
export function formatVersion(build = BUILD): string {
  return build.commit ? `${build.version} (${build.commit})` : build.version;
}
