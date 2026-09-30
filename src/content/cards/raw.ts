import { everyoneTransitCard } from "./everyone-transit-card";
import { examFeeSupport } from "./exam-fee-support";
import { workExperience } from "./work-experience";
import { youngFutureSavings } from "./young-future-savings";
import { youthChallenge } from "./youth-challenge";
import { youthCulturePass } from "./youth-culture-pass";
import { youthHousingDreamAccount } from "./youth-housing-dream-account";
import { youthJobLeap } from "./youth-job-leap";
import { youthMonthlyRent } from "./youth-monthly-rent";
import { youthTomorrowSavings } from "./youth-tomorrow-savings";

/**
 * 파싱 전 원본. `pnpm validate`가 이것을 받아 오류를 한꺼번에 모은다.
 * 앱은 index.ts의 CARDS를 쓴다 — 거기서는 틀린 카드 하나가 빌드를 멈춘다.
 * 새 카드는 여기에 추가한다. 순서가 피드의 기본 순서다 (initial_concept.md의 01–10).
 */
export const RAW_CARDS: unknown[] = [
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
];
