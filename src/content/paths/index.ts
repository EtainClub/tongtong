import { pathSchema, type Path } from "../path-schema";
import { SHOW_DRAFTS } from "../policies";
import { RAW_PATHS } from "./raw";

/** 모든 경로 견본(초안 포함). 모양이 틀리면 빌드가 멈춘다. */
export const ALL_PATHS: Path[] = RAW_PATHS.map((raw) => pathSchema.parse(raw));

/** 앱이 쓰는 견본 — 운영에서는 공개된 것만 (모든 칸의 항목이 공개여야 공개할 수 있다, validatePath). */
export const PATHS: Path[] = SHOW_DRAFTS ? ALL_PATHS : ALL_PATHS.filter((path) => path.publishStatus === "published");

/**
 * 피드 머리·내 기록의 청사진 진입점을 열까 (청사진 설계 7.1, 부록 A-12).
 * 공개 견본이 하나도 없으면 대부분이 빈 화면을 만난다 — 초안을 보여 주는 개발 환경에서도 공개 견본으로만 정한다.
 */
export const PLAN_ENTRY_OPEN = ALL_PATHS.some((path) => path.publishStatus === "published");

export function findPath(id: string): Path | undefined {
  return PATHS.find((path) => path.id === id);
}
