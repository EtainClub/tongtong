import { aiLearningMaterials } from "./ai-learning-materials";
import { bk21Four } from "./bk21-four";
import { everyoneTransitCard } from "./everyone-transit-card";
import { examFeeSupport } from "./exam-fee-support";
import { highSchoolCredit } from "./high-school-credit";
import { highSchoolFreeTuition } from "./high-school-free-tuition";
import { incomeContingentLoan } from "./income-contingent-loan";
import { nationalEmploymentSupport } from "./national-employment-support";
import { nationalScholarship } from "./national-scholarship";
import { outOfSchoolYouth } from "./out-of-school-youth";
import { preStartupPackage } from "./pre-startup-package";
import { stemResearchStipend } from "./stem-research-stipend";
import { studentStartupTeams } from "./student-startup-teams";
import { teenCultureNuri } from "./teen-culture-nuri";
import { tomorrowLearningCard } from "./tomorrow-learning-card";
import { workExperience } from "./work-experience";
import { youngFutureSavings } from "./young-future-savings";
import { youthChallenge } from "./youth-challenge";
import { youthCulturePass } from "./youth-culture-pass";
import { youthHousingDreamAccount } from "./youth-housing-dream-account";
import { youthJeonseLoan } from "./youth-jeonse-loan";
import { youthJobLeap } from "./youth-job-leap";
import { youthMonthlyRent } from "./youth-monthly-rent";
import { youthStartupAcademy } from "./youth-startup-academy";
import { youthStartupTaxRelief } from "./youth-startup-tax-relief";
import { youthTomorrowSavings } from "./youth-tomorrow-savings";

/**
 * 정책 항목 원본 (청사진 설계 2장). `pnpm validate`가 이것을 받아 오류를 한꺼번에 모은다.
 * 앱은 index.ts의 POLICIES를 쓴다 — 거기서는 틀린 항목 하나가 빌드를 멈춘다.
 * 새 정책은 여기에 추가한다. 카드가 없어도 된다 — 카드는 cards/raw.ts에 따로 등록한다.
 */
export const RAW_POLICIES: unknown[] = [
  youngFutureSavings,
  youthMonthlyRent,
  everyoneTransitCard,
  youthHousingDreamAccount,
  examFeeSupport,
  workExperience,
  youthCulturePass,
  youthChallenge,
  youthTomorrowSavings,
  youthJobLeap,
  highSchoolFreeTuition,
  highSchoolCredit,
  aiLearningMaterials,
  teenCultureNuri,
  outOfSchoolYouth,
  // 카드 없는 항목 — 청사진 박사·창업 경로 (청사진 설계 9.3, 2026-10-01 작성, 2026-10-04 원문 대조 뒤 공개).
  nationalScholarship,
  incomeContingentLoan,
  stemResearchStipend,
  bk21Four,
  studentStartupTeams,
  preStartupPackage,
  youthStartupAcademy,
  youthStartupTaxRelief,
  // 카드 없는 항목 — 청사진 취업 경로 (청사진 설계 9.3, 2026-10-04 작성·원문 대조 뒤 공개).
  tomorrowLearningCard,
  nationalEmploymentSupport,
  youthJeonseLoan,
];
