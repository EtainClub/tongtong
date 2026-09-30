"use client";

import { getToken } from "firebase/app-check";
import { getIdToken, type User } from "firebase/auth";

import { firebaseAppCheck } from "@/lib/firebase/client";

/** 서버가 돌려준 거절 코드. 화면은 이 코드로 문구를 고른다. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

/** ID 토큰(과 있으면 App Check 토큰)을 붙여 /api/*를 부른다. */
export async function apiFetch<T>(user: User, path: string, init: { method: string; body?: unknown }): Promise<T> {
  const appCheck = firebaseAppCheck();
  const [idToken, appCheckToken] = await Promise.all([getIdToken(user), appCheck ? getToken(appCheck) : null]);
  const response = await fetch(path, {
    method: init.method,
    headers: {
      authorization: `Bearer ${idToken}`,
      "content-type": "application/json",
      ...(appCheckToken ? { "x-firebase-appcheck": appCheckToken.token } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, body.error ?? "request-failed");
  }
  return response.json() as Promise<T>;
}

/**
 * 실패를 사람이 할 수 있는 일로 옮긴다. `messages`는 화면별 거절 코드 문구.
 * 인증·App Check·Origin 거절은 대개 새로고침으로 풀리고, 네트워크 실패는 fetch의 TypeError로 온다.
 * App Check 토큰을 받지 못하면 요청 전에 FirebaseError가 난다 — 보안 확인 실패로 본다.
 */
export function describeError(error: unknown, fallback: string, messages: Record<string, string> = {}): string {
  if (error instanceof ApiError) {
    if (messages[error.code]) return messages[error.code];
    if (error.status === 401 || error.status === 403) return SECURITY_FAILED;
    if (error.status >= 500) return "서버에 잠시 문제가 있어요. 조금 뒤에 다시 시도해 주세요.";
    return fallback;
  }
  if (error instanceof TypeError) return "인터넷 연결을 확인한 뒤 다시 시도해 주세요.";
  return SECURITY_FAILED;
}

const SECURITY_FAILED = "보안 확인에 실패했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.";
