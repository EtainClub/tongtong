import { getApps, initializeApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// App Hosting·에뮬레이터·테스트는 환경변수로 프로젝트를 알려 준다. 로컬 `next dev`는
// 알려 주지 않아서, 그대로 두면 Admin SDK가 개발자의 gcloud 기본 프로젝트를 읽는다 —
// 다른 서비스의 데이터베이스를 조용히 건드리게 된다. 그때는 이 앱의 프로젝트로 고정한다. (임통과 같다)
const runtimeNamesProject = Boolean(process.env.FIREBASE_CONFIG || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT);
if (!getApps().length) {
  initializeApp(runtimeNamesProject ? undefined : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

export const auth = getAuth();
export const db = getFirestore();
export const appCheck = getAppCheck();
