import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "통통이 어떤 정보를 왜 받고, 얼마나 두고, 어떻게 지우는지.",
};

/**
 * 개인정보처리방침 (개인정보 보호법 30조).
 * 적힌 항목은 코드가 실제로 받는 것과 같아야 한다 — 받는 것을 바꾸면 이 페이지도 같이 고친다.
 *   users/{uid}, users/{uid}/cardStates, users/{uid}/blueprints(+versions), corrections, metrics(합계), aiCache(추천 질문 답), Cloud Logging(30일)
 */
const OPERATOR_EMAIL = "etainclub@gmail.com";
const EFFECTIVE = "2026년 10월 1일";

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-24">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <h1 className="mt-6 text-[28px] leading-tight font-bold tracking-tight">개인정보처리방침</h1>
      <p className="mt-3 text-[14px] text-smoke">시행일 {EFFECTIVE}</p>

      <p className="mt-8 text-[16px] leading-relaxed">
        통통은 이름·생년월일·전화번호를 받지 않습니다. 정책을 보고 판단한 기록을 본인에게 돌려주는 데 필요한 것만 받고, 정치 성향을 점수로 만들거나
        추천에 쓰지 않습니다.
      </p>

      <Section title="1. 받는 정보와 쓰는 곳">
        <Table
          rows={[
            ["익명 계정 식별자", "처음 열 때 자동으로 만들어져요. 내 기록을 내 기기와 잇는 데 써요."],
            ["청소년·청년 구분, 만 14세 이상 확인", "보여 줄 카드를 고르는 데 써요."],
            ["생활 상황, 관심 주제 (선택)", "카드 순서에만 써요."],
            ["판단 기록 — 처음 본 문장을 얼마나 믿었는지, 사실을 본 뒤 어땠는지", "내 기록·판단 이력에 보여 주고, 누가 답했는지 알 수 없는 전체 분포(30명 넘게 모인 카드만)에 써요."],
            ["정책 평가와 그 이유", "청년이 따로 동의한 경우에만 저장해요. 정치적 견해로 볼 수 있어서예요. 청소년의 정책 평가는 저장하지 않아요."],
            ["저장·패스·보류한 카드", "피드 순서와 저장한 카드 목록에 써요."],
            [
              "청사진 (만든 경우) — 목표, 지금 학적·단계, 만 나이(선택), 이정표, 넣은 정책과 그 상태·메모, 고친 기록",
              "내 청사진을 보여 주고 무엇이 왜 바뀌었는지 남기는 데만 써요. 다른 사람에게 보이지 않고, 집계나 추천에 쓰지 않아요. 청년만 만들 수 있고, 내 기록에서 청사진만 따로 지울 수 있어요.",
            ],
            [
              "알림을 켠 경우 — 켠 알림 종류, 이 기기의 푸시 토큰, 이미 보낸 알림 목록",
              "저장한 카드의 새 정보·다시 판단할 때·신청 마감, 그리고 청사진에 넣은 정책의 신청 마감·지난 신청·내용 변경을 하루 한 번까지 보내는 데만 써요. 기본은 모두 꺼져 있고, 알림에는 정책 이름과 날짜만 담아요 — 청사진의 목표·메모는 담지 않아요. 푸시 토큰은 Google Firebase 클라우드 메시징으로 알림을 보내는 데 쓰고, 알림을 모두 끄면 바로 지워요.",
            ],
            ["정정 요청 내용, 회신 받을 연락처 (선택)", "카드 내용을 확인하고 고치는 데만 써요. 운영자만 봐요."],
            ["Google 계정 연결 시 — 이메일·이름·프로필 사진 주소", "로그인 확인에만 써요. 판단 기록에는 남기지 않아요."],
          ]}
        />
        <p className="mt-4 text-[15px] leading-relaxed text-graphite">
          <strong className="font-medium text-ink">자동으로 남는 것.</strong> 서버 접속 기록(IP 주소, 요청 시각)은 오류 확인과 남용 방지를 위해 30일 동안
          남았다가 지워져요. 봇을 막기 위해 Google reCAPTCHA가 브라우저 정보를 확인해요. 이용 통계는 날짜별·카드별 합계만 남기고 누가 했는지는 남기지
          않아요. 재방문을 세기 위해 이 브라우저가 처음 온 날짜만 브라우저 안에 저장해요. 정책 페이지에서 내용을 미리 본 정책도 브라우저 안에만
          기억해요 — 그 정책 카드를 열 때 처음 문장을 묻지 않기 위해서예요. 서버로 보내지 않아요.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite">
          <strong className="font-medium text-ink">기기에 남는 사본.</strong> 인터넷이 끊겨도 저장한 카드와 내 기록을 볼 수 있도록, 내 기록(판단·저장·청사진)의
          사본과 화면 파일을 이 브라우저 안에 담아 둬요. 다른 사람이 같은 기기·브라우저를 쓰면 볼 수 있으니, 함께 쓰는 기기라면 브라우저의 사이트 데이터를
          지우세요. 서버의 기록을 지워도 이 사본은 브라우저 데이터를 지울 때까지 남을 수 있어요.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite">
          <strong className="font-medium text-ink">AI에게 묻기.</strong> 질문은 답을 만들기 위해 Anthropic에 보내지고, 통통은 질문과 답을 저장하지 않아요.
          카드에 적힌 추천 질문의 답만 7일 동안 모아 두고 다시 써요 — 누가 물었는지는 남기지 않아요.
        </p>
      </Section>

      <Section title="2. 얼마나 두고, 어떻게 지우나요">
        <p className="text-[15px] leading-relaxed">
          계정을 지울 때까지 둬요. <Link href="/me" className="underline underline-offset-4">내 기록</Link>에서 언제든 할 수 있어요.
        </p>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-graphite">
          <li>기록 내려받기 — 내 프로필과 판단 기록을 파일로 받아요.</li>
          <li>판단 기록 지우기 — 판단과 저장한 카드를 지워요.</li>
          <li>계정까지 지우기 — 계정, 모든 기록, 내가 보낸 정정 요청을 바로 지워요.</li>
          <li>정책 평가 저장 동의 철회 — 저장된 정책 평가를 바로 지워요.</li>
        </ul>
      </Section>

      <Section title="3. 맡기는 곳과 나라 밖으로 가는 정보">
        <p className="text-[15px] leading-relaxed">다른 곳에 팔거나 넘기지 않아요. 서비스를 돌리기 위해 아래 회사에 처리를 맡겨요.</p>
        <Table
          rows={[
            ["Google LLC (Firebase)", "계정·기록 저장(서울 리전), 앱 서버(대만 리전), 로그인 확인, 봇 방지(reCAPTCHA). 서비스를 쓰는 동안 네트워크로 전송돼요."],
            ["Anthropic PBC (미국)", "AI에게 묻기의 답을 만들어요. 질문을 보낼 때만 전송돼요. 이 기능을 쓰지 않으면 보내지 않아요."],
          ]}
        />
        <p className="mt-3 text-[14px] text-graphite">
          각 회사의 처리 방침:{" "}
          <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            Firebase ↗
          </a>{" "}
          ·{" "}
          <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            Anthropic ↗
          </a>
        </p>
      </Section>

      <Section title="4. 만 14세 미만">
        <p className="text-[15px] leading-relaxed">
          통통은 만 14세 이상만 쓸 수 있어요. 만 14세 미만의 정보는 법정대리인의 동의가 있어야 받을 수 있어서, 받지 않아요. 청소년은 시작할 때 만 14세
          이상인지 확인해요.
        </p>
      </Section>

      <Section title="5. 개인정보 보호책임자와 문의">
        <p className="text-[15px] leading-relaxed">
          통통 운영자 ·{" "}
          <a href={`mailto:${OPERATOR_EMAIL}`} className="underline underline-offset-4">
            {OPERATOR_EMAIL}
          </a>
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite">도움이 더 필요하면 아래 기관에 문의할 수 있어요.</p>
        <ul className="mt-2 flex flex-col gap-1 text-[14px] text-graphite">
          <li>개인정보분쟁조정위원회 1833-6972 · kopico.go.kr</li>
          <li>개인정보침해신고센터 118 · privacy.kisa.or.kr</li>
          <li>대검찰청 1301 · spo.go.kr</li>
          <li>경찰청 182 · ecrm.police.go.kr</li>
        </ul>
      </Section>

      <Section title="6. 바뀌면">
        <p className="text-[15px] leading-relaxed">이 방침을 바꾸면 시행 7일 전부터 이 페이지에 알려요. 받는 정보가 늘어나면 다시 동의를 받아요.</p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-[18px] font-bold tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col">
      {rows.map(([term, detail]) => (
        <div key={term} className="border-t border-stone py-3">
          <dt className="text-[15px] font-medium">{term}</dt>
          <dd className="mt-1 text-[14px] leading-relaxed text-graphite">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}
