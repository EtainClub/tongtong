/**
 * 여섯 지표 한 화면 (로드맵 M8). `pnpm metrics [일수=7]`
 *
 * metrics/{날짜} 합계만 읽는다 — 누가 했는지는 애초에 없다. gcloud 기본 자격(ADC)으로 운영 Firestore를 읽는다.
 * 에뮬레이터로 보려면 FIRESTORE_EMULATOR_HOST를 넣고 실행한다.
 */
import { CARDS } from "../src/content/cards";
import { kstDate } from "../src/lib/date";
import { db } from "../src/lib/firebase/admin";
import { buildReport, reportDates, type DailyDoc, type Rate } from "../src/lib/metrics/report";

const days = Number(process.argv[2] ?? 7);
const today = kstDate();
const { period, cohorts } = reportDates(today, days);

const read = async (dates: string[]): Promise<DailyDoc[]> => {
  const snapshots = await db.getAll(...dates.map((date) => db.doc(`metrics/${date}`)));
  return snapshots.filter((s) => s.exists).map((s) => ({ date: s.id, ...(s.data() as Omit<DailyDoc, "date">) }));
};

async function main() {
  const [docs, cohortDocs] = await Promise.all([read(period), read(cohorts)]);
  const report = buildReport(docs, cohortDocs, today);

  const pct = (r: Rate) => (r.rate === null ? "—" : `${(r.rate * 100).toFixed(1)}%`);
  const frac = (r: Rate) => `${pct(r).padStart(6)}  (${r.numerator}/${r.denominator})`;
  const title = (id: string) => CARDS.find((c) => c.id === id)?.shortTitle ?? id;

  console.log(`\n통통 지표 — 최근 ${days}일 (${period.at(-1)} ~ ${today}, KST)\n`);
  console.log(`방문            처음 ${report.visits.first} · 다시 ${report.visits.return}`);
  console.log(`첫 판단 도달률   ${frac(report.firstJudgment)}`);
  console.log(`게임 정답률      ${frac(report.gameCorrect)}   정답이 없는 게임은 빼고`);
  console.log(`원자료 클릭률    ${frac(report.sourceClick)}   사실 공개에 닿은 카드 가운데`);
  console.log(`최종 판단 도달률 ${frac(report.finalJudgment)}`);
  console.log(`30일 재방문      ${frac(report.return30)}   ${cohorts.at(-1)} ~ ${cohorts[0]}에 처음 온 사람`);
  console.log(`재평가 응답률    ${frac(report.revisitResponse)}`);

  const rows = Object.entries(report.perCard).sort((a, b) => b[1].open - a[1].open);
  if (rows.length) {
    console.log(`\n카드별           열람  첫 판단  최종 판단  정답률  원자료`);
    for (const [id, c] of rows) {
      console.log(`${title(id).padEnd(14)} ${String(c.open).padStart(5)}  ${pct(c.firstJudgment).padStart(7)}  ${pct(c.finalJudgment).padStart(9)}  ${pct(c.gameCorrect).padStart(6)}  ${pct(c.sourceClick).padStart(6)}`);
    }
  }
  console.log("");
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
