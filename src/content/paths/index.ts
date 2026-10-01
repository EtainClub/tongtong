import { pathSchema, type Path } from "../path-schema";
import { SHOW_DRAFTS } from "../policies";
import { RAW_PATHS } from "./raw";

/** 모든 경로 견본(초안 포함). 모양이 틀리면 빌드가 멈춘다. */
export const ALL_PATHS: Path[] = RAW_PATHS.map((raw) => pathSchema.parse(raw));

/** 앱이 쓰는 견본 — 운영에서는 공개된 것만 (모든 칸의 항목이 공개여야 공개할 수 있다, validatePath). */
export const PATHS: Path[] = SHOW_DRAFTS ? ALL_PATHS : ALL_PATHS.filter((path) => path.publishStatus === "published");

export function findPath(id: string): Path | undefined {
  return PATHS.find((path) => path.id === id);
}
