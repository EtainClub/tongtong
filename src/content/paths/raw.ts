import { phdStem } from "./phd-stem";
import { startupInCollege } from "./startup-in-college";

/**
 * 경로 견본 원본 (청사진 설계 4.5). `pnpm validate`가 이것을 받아 오류를 한꺼번에 모은다.
 * 순서가 청사진 만들기 첫 화면의 순서다.
 */
export const RAW_PATHS: unknown[] = [phdStem, startupInCollege];
