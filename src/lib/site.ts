/** 정식 주소. 공유 미리보기·사이트맵·robots가 쓴다. 로컬에서는 dev 서버. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
