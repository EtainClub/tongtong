/**
 * 여섯 지표 한 화면 (로드맵 M8). `pnpm metrics [일수=7]`
 *
 * metrics/{날짜} 합계만 읽는다 — 누가 했는지는 애초에 없다. 청사진은 문서를 읽어 합계만 낸다(청사진 설계 B3). gcloud 기본 자격(ADC)으로 운영 Firestore를 읽는다.
 * 에뮬레이터로 보려면 FIRESTORE_EMULATOR_HOST를 넣고 실행한다.
 */
import { CARDS } from "../src/content/cards";
import type { Blueprint, Version } from "../src/lib/blueprint/model";
import { kstDate } from "../src/lib/date";
import { db } from "../src/lib/firebase/admin";
import { buildBlueprintReport, PLACEMENT_MIN, REVISE_WINDOW_DAYS, type BlueprintReport, type BlueprintWithVersions } from "../src/lib/metrics/blueprint-report";
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

  printBlueprints(buildBlueprintReport(await readBlueprints(), new Date()), frac);
  console.log("");
}

/**
 * 청사진은 기간과 상관없이 전부 읽는다 — 30일 재수정은 만든 날로 센다.
 * 문서를 읽지만 합계만 낸다(buildBlueprintReport). 목표·메모·판단은 출력에 없다.
 */
async function readBlueprints(): Promise<BlueprintWithVersions[]> {
  const [blueprints, versions] = await Promise.all([db.collectionGroup("blueprints").get(), db.collectionGroup("versions").get()]);
  const byParent = new Map<string, BlueprintWithVersions["versions"]>();
  for (const doc of versions.docs) {
    const parent = doc.ref.parent.parent;
    if (parent?.parent.id !== "blueprints") continue;
    const list = byParent.get(parent.path) ?? [];
    list.push(doc.data() as Version);
    byParent.set(parent.path, list);
  }
  return blueprints.docs.map((doc) => ({ blueprint: doc.data() as Blueprint, versions: byParent.get(doc.ref.path) ?? [] }));
}

function printBlueprints(report: BlueprintReport, frac: (r: Rate) => string) {
  const rate = (r: { numerator: number; denominator: number }): Rate => ({ ...r, rate: r.denominator ? r.numerator / r.denominator : null });
  console.log(`\n청사진          ${report.total}개 (지금 쓰는 것 ${report.active})`);
  for (const [path, count] of Object.entries(report.byPath).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${(path === "direct" ? "직접 적기" : path).padEnd(22)} ${String(count).padStart(4)}`);
  }
  console.log(`30일 안에 다시 고침 ${frac(rate(report.revised30))}   만든 지 ${REVISE_WINDOW_DAYS}일 지난 청사진 가운데`);

  const checks = Object.entries(report.checks).sort((a, b) => a[0].localeCompare(b[0]));
  if (checks.length) {
    console.log(`\n점검 처리                반영  이대로  닫힘(지금)`);
    for (const [kind, c] of checks) console.log(`  ${kind.padEnd(22)} ${String(c.fixed).padStart(4)}  ${String(c.kept).padStart(6)}  ${String(c.dismissed).padStart(10)}`);
  }

  if (report.placementsByPolicy) {
    console.log(`\n항목별 배치 (운영 내부용)`);
    for (const [id, count] of Object.entries(report.placementsByPolicy).sort((a, b) => b[1] - a[1])) console.log(`  ${id.padEnd(30)} ${String(count).padStart(4)}`);
  } else {
    console.log(`항목별 배치는 청사진이 ${PLACEMENT_MIN}개 이상일 때만 봐요.`);
  }
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
