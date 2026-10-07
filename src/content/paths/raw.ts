import { campusLivingAlone } from "./campus-living-alone";
import { firstJobHome } from "./first-job-home";
import { jobAfterGraduation } from "./job-after-graduation";
import { jobSeekingSafetyNet } from "./job-seeking-safety-net";
import { jobToStartup } from "./job-to-startup";
import { masterToIndustry } from "./master-to-industry";
import { militaryReturn } from "./military-return";
import { phdStem } from "./phd-stem";
import { restartAfterBreak } from "./restart-after-break";
import { startupInCollege } from "./startup-in-college";

/**
 * 경로 견본 원본 (청사진 설계 4.5). `pnpm validate`가 이것을 받아 오류를 한꺼번에 모은다.
 * 순서가 청사진 만들기 첫 화면의 순서다 — 출발 단계가 이른 것(학생)부터 늦은 것(직장)까지.
 */
export const RAW_PATHS: unknown[] = [
  campusLivingAlone,
  militaryReturn,
  phdStem,
  masterToIndustry,
  startupInCollege,
  jobAfterGraduation,
  jobSeekingSafetyNet,
  restartAfterBreak,
  firstJobHome,
  jobToStartup,
];
