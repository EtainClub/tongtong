# 통통 — 설계 검토 및 개선 제안

- 작성일: 2026-09-29
- 대상: `initial_concept.md`(청년 카드 10개), `initial_design.md`(Firebase MVP 설계 73장)
- 기준 프로젝트: `~/devel-src/jamtong`(잼통 — 디자인 시스템·콘텐츠 스키마·AI 안내), `~/devel-src/jamtong-punch`(임통 — 원장·집계·운영)
- 상태: 코드 착수 전 검토

---

## 0. 이 문서의 위치

원 설계서는 **무엇을 만들 것인가**를 정한다. 이 문서는 자매 서비스 두 개가 이미 운영하며 치른 비용을 근거로
**무엇을 그대로 가져오고, 무엇을 바꾸고, 무엇을 미루는가**를 다룬다.

방향에는 동의한다. 바꾸자는 것은 대부분 **런타임·저장 위치·판단 모델** 세 가지다.

---

## 1. 총평

### 잘 잡힌 것

| 항목 | 평가 |
|---|---|
| 첫 판단 → 조사 → 최종 판단 → 재평가 | 제품의 본체. 다른 정책 앱에 없는 축이다. |
| 판단을 overwrite하지 않는다 (72장 2) | 옳다. 변화 자체가 데이터다. |
| 사실 신뢰와 정책 평가 분리 (15장) | 이 제품의 생명선. 잼통의 `assertionType` 분리와 같은 결정이다. |
| 콘텐츠 상태 ≠ 정책 상태 (41장) | 옳다. |
| 정치 성향 점수를 만들지 않는다 (6·27·70장) | 필드가 없으면 누가 넣을 수도 없다 — 임통 원칙 1과 같다. |
| 게임 유형을 섞는다 (concept 말미) | 돈 맞히기 / 나는 대상인가 / 누가 받나 — 스와이프 피로를 막는 실제 장치다. |

### 핵심 문제

> **자매 서비스가 이미 버린 구조를 다시 설계했다.**

| 원 설계 | 자매 서비스에서 일어난 일 |
|---|---|
| Cloud Functions 9개 (53장) | 임통 rev.2가 Functions → **App Hosting Route Handler**로 옮겼다. 런타임·배포·에뮬레이터가 하나로 준다. |
| 판단마다 `cardStats` 트랜잭션 (35장) | 임통 rev.2가 **원장 + 단일 작성자 롤업**으로 바꿨다. 인기 문서에 쓰기가 몰리면 문서당 쓰기 한계에 걸린다. |
| Firestore 카드 + Admin CMS (Phase 2) | 잼통은 **git의 TS 모듈 + zod**. 정정 이력·검토·롤백을 git이 공짜로 준다. 카드 10개에 CMS는 이르다. |
| RAG · 임베딩 · chunk · aiCache (29–33장) | 잼통은 **후보 목록 grounding + Haiku + 4겹 가드**로 끝냈다. 카드 1장의 근거는 프롬프트 하나에 다 들어간다. |

**결론: 설계는 유지하되, 백엔드는 자매 서비스의 것을 복사해서 시작한다.** Phase 1·2(Firebase 구성, Admin CMS)가 거의 사라진다.

---

## 2. 판단 모델 — 가장 먼저 고쳐야 할 것

코드보다 먼저 정해야 한다. 스키마가 여기서 나온다.

### 2.1 concept와 design이 서로 다른 척도를 말한다

- concept: 첫 판단·최종 판단 **둘 다** "이 설명이 얼마나 믿을 만한가" (신뢰 1축)
- design 15장: 신뢰(`trustScore`)와 정책 평가(`policyOpinion`) **2축**
- design 14장 `judgments` 문서: `value` 하나뿐, 축 필드 없음 → 두 축을 저장할 자리가 없다

### 2.2 신뢰 1축만으로는 측정할 것이 없다

카드 본문은 통통이 검증한 FACT다. "이 설명을 얼마나 믿나"의 최종값이 올라가면 그건 **통통이 설득에 성공했다**는 뜻이지 사용자의 생각이 자랐다는 뜻이 아니다. `+2 변화`가 사실상 "우리를 믿게 됐다"의 점수가 된다.

**제안 — 대상을 Hook으로 바꾸고, 축을 단계에 맞춘다.**

| 단계 | 묻는 것 | 축 |
|---|---|---|
| 첫 판단 | **Hook 문장**("월세 최대 480만 원?")을 얼마나 믿나 | `trust` |
| 사실 공개 후 | Hook이 정확했나 — 정확 / 과장 / 오해 소지 | `hookAccuracy` (선택형, 척도 아님) |
| 최종 판단 | 이 정책을 어떻게 보나 | `opinion` |
| 재평가 | 같은 `opinion` + (변경이 있었다면) 무엇이 달라졌나 | `opinion` |

Hook은 일부러 과장된 문장이라("최대", "수백만 원") 첫 신뢰가 흔들리는 것이 자연스럽고, 사실 공개 뒤 "과장이었다"를 고르는 것 자체가 미디어 리터러시 경험이 된다. 정책 평가는 첫 판단에서 묻지 않는다 — 아무것도 모르는 상태의 찬반은 소음이다.

### 2.3 "모르겠음"은 가운데 값이 아니다

5단계의 3을 "모르겠음"으로 두면 `모르겠음 → 대체로 신뢰`가 `+1`로 계산된다. 임통 rev.3이 같은 이유로 **"잘 모름"을 분모에서 뺐다.**

```ts
value: 1 | 2 | 3 | 4 | 5 | null   // null = 모르겠음. delta 계산에서 제외
```

척도는 `매우 의심 · 다소 의심 · 중립 · 대체로 신뢰 · 매우 신뢰` + 별도 버튼 `모르겠음`.

### 2.4 별(★)을 쓰지 않는다

별은 품질 평점으로 읽힌다. "정책에 별 2개"는 "나쁜 정책"이 되고, 판단 척도가 아니라 리뷰가 된다. 잼통 디자인 시스템에도 없다 → 5칸 세그먼트 척도(8장).

### 2.5 변화를 성과로 보여주지 않는다

`+2 변화`, `direction: "increased"`, My Page의 "생각이 변한 카드 9"는 **바꾸는 것이 잘한 것**이라는 신호를 준다. 사용자가 두 번째 판단에서 일부러 다른 값을 고르게 된다(요구 특성). 표시는 처음/지금 두 값을 나란히 두는 것으로 끝내고, 부호와 칭찬을 붙이지 않는다. "그대로다"도 동등한 결과로 보여준다.

### 2.6 판단에 카드 버전을 박는다

재평가의 핵심은 "정책이 바뀐 뒤 생각이 바뀌었나"인데, design의 `judgment`에는 **그때 본 카드 버전이 없다.** 없으면 변화의 원인을 나중에 가를 수 없다.

### 2.7 모든 카드가 판단을 가질 필요는 없다

concept 06(일경험)은 탐색 카드라 믿을 Hook도 평가할 정책도 약하다. `judgment` 단계를 카드별로 켜고 끈다(4.2 `flow`).

---

## 3. 법률·윤리 리스크 — 출시 게이트

잼통 검토·임통 11장과 같은 성격이다. 스키마 전에 정해야 하는 것만 적는다. 법률 판단은 전문가 확인이 필요하다.

| # | 리스크 | 왜 | 조치 |
|---|---|---|---|
| 1 | **정책 평가는 민감정보일 수 있다** | 개인정보보호법 23조의 "정치적 견해". 익명 UID라도 구글 계정을 연결하면 개인과 결합된다. | `opinion` 첫 저장 전 **별도 동의**. 동의 안 하면 기기 안에만 저장. `DELETE /api/me`(임통 6.4) 첫날부터. |
| 2 | **만 14세 미만** | 법정대리인 동의 없이 개인정보 처리 불가. 청소년 트랙의 상당수가 해당. | 청소년 트랙은 **만 14세 이상**으로 시작하거나, 14세 미만은 서버 저장 없이 로컬 전용. 생년월일 대신 "만 14세 이상입니다" 확인 1회. |
| 3 | **자매 서비스 연결** | 잼통은 한 정치인의 업적 위키, 임통은 범진보 사용자 대상이고 인물 사진 타격 게임을 가졌다. 청소년이 통통 → 임통 게임으로 두 번 탭에 도달하면 안 된다. | 통통에서 임통으로는 **인물 아카이브 페이지만** 연결. 청소년 트랙에서는 임통 링크 자체를 끈다. 잼통 링크는 "이 정책이 만들어진 과정" 라벨로만. |
| 4 | **"중립" 주장** | 정부 혜택 정책 10개 + 잼통 연결 + 잼통 팔레트. 밖에서는 청년 대상 정부 홍보로 읽힌다. 설계서가 중립을 말할수록 발견됐을 때 타격이 크다. | 잼통이 택한 방식대로 **관점을 밝힌다**: `/about`에 자매 관계를 적고, 카드마다 "비판·한계" 근거를 최소 1개 둔다(4.2 `counterpoints`). |
| 5 | **자격 판정 책임** | "나도 돼?"·AI "나는 가입할 수 있어?"가 틀리면 신청을 놓친 사용자가 생긴다. | 결과 문구를 "가능성 높음 / 확인 필요"로 한정하고 공식 신청처 링크로 끝낸다. "대상입니다"라고 말하지 않는다. |
| 6 | **집계 공개** | 표본 작은 분포는 의미 없고, 판단 **전에** 보이면 앵커링이 된다. | 최종 판단 **이후에만**, n ≥ 30일 때만, "통통 사용자 응답이며 여론조사가 아닙니다"(34장 유지). |

---

## 4. 데이터 모델

### 4.1 콘텐츠는 git으로 — Firestore `cards`·`sources`·`claims`·`topics`·`persons`·`contentUpdates` 삭제

잼통 `src/content/schema.ts`의 `sourceSchema`·`claimSchema`를 그대로 가져온다.

- `claim.sourceIds.min(1)` — 근거 없는 Claim은 스키마가 막는다
- `assertionType: FACT | CLAIM | INTERPRETATION | OPINION` — design의 `verification` 5종보다 이게 먼저다. `outdated`는 상태가 아니라 날짜(4.3)
- `source.license: public | quotable | link-only` — design 4.3 "PDF를 복제하지 않는다"를 스키마로
- `pnpm validate`가 카드마다 불변식을 검사(잼통 `validate-content.ts`)

Firestore rules에서 콘텐츠 규칙이 사라지고, `publishCard()`·`updateApplicationStatus()`·Admin Phase가 사라진다. 카드가 50개를 넘고 편집자가 개발자가 아니게 되면 그때 임통처럼 Firestore CMS로 옮긴다.

### 4.2 카드 스키마 (제안)

```ts
card = {
  id, audience: ("youth" | "young_adult")[], category, lifeStages[],
  hook, shortTitle,

  // 판단 흐름을 카드별로 — 2.7
  flow: { trust: boolean, opinion: boolean },

  claims: Claim[],                    // 잼통 claimSchema + validFrom/validUntil (4.3)
  sources: Source[],
  counterpoints: Claim[],             // 비판·한계. min(1) — 3장 4번
  game: Game,                         // discriminated union, answer는 claimId를 가리킨다
  reveal: { claimIds: string[] },     // 게임 뒤 공개할 사실
  suggestedQuestions: string[],

  policy: {
    history: { date, kind: "introduced" | "expanded" | "changed" | "renamed" | "ended",
               summary, sourceIds }[],                  // origin/introducedAt/expandedAt 대체
    applications: { label: "2차", startAt, endAt, url, sourceIds }[],  // 회차가 여럿
  },

  revisions: { version, date, material: boolean, summary, claimIds }[],   // contentUpdates 대체
  reviewedAt,
  links: { jamtong?: string, imtongPersonIds?: string[] },
}
```

- **`game.answer`가 claimId를 가리킨다.** 정답이 근거 없이 코드에 박히지 않는다. 정책이 바뀌면 claim 하나만 고치면 게임 정답이 따라온다.
- **`policy.history`**: concept가 요구한 origin/introducedAt/expandedAt을 이벤트 배열로. 청년내일저축계좌처럼 "이전부터 운영 → 2026 확대"를 한 줄씩 적을 수 있고, 어느 정부의 정책인지 라벨 대신 날짜와 출처로만 말한다.
- **`applications` 배열**: 청년미래적금만 해도 1차·2차가 있다. design의 `applicationWindow` 단수로는 안 된다.
- **`revisions[].material`**: design 24장은 버전 차이를 그대로 "새 정보 +2"로 센다. 오탈자 수정도 알림이 된다. `material: true`인 개정만 센다.

### 4.3 상태는 저장하지 않고 날짜에서 계산한다

`policyStatus` / `applicationStatus` / `application.status` 세 필드가 겹친다(7·41·42장). 전부 날짜의 함수다.

```ts
applicationState(app, now) → "upcoming" | "open" | "closed"
claimState(claim, now)     → validUntil < now ? "expired" : "current"
```

크론(`updateApplicationStatus`)이 필요 없고, 상태가 날짜와 어긋날 수 없다. 만료된 claim은 잼통 `pending` 색으로 "기준일 지남" 표식.

### 4.4 사용자 데이터 — 카드당 문서 하나로 줄인다

design은 사용자 아래 `cardStates`·`judgments`·`savedCards`·`interactions`·`aiThreads`·`summary` 6종이다. 대부분 중복이다.

| design | 제안 | 이유 |
|---|---|---|
| `judgments` + `cardStates` | **`cardStates/{cardId}` 하나**, 판단은 그 안의 배열 | 사용자×카드당 판단은 많아야 수십 건. 1문서 읽기로 히스토리가 나온다 |
| `savedCards` | `cardStates.saved` | 17장과 18장이 같은 값을 두 번 저장 |
| `interactions` | 삭제 → Analytics | `pass` 쿨다운만 `cardStates.passedAt`으로 |
| `summary/current` | 삭제 → 클라이언트 계산 | `cardStates` 전량이 수백 문서 이하 |
| `aiThreads` | 기본 **저장 안 함** | 질문에 나이·소득이 섞인다. 3장 1번 |

```ts
/users/{uid}                     { audienceType, lifeStages[], interests[], consent: { opinion: Timestamp | null }, ageConfirmed14 }
/users/{uid}/cardStates/{cardId} {
  saved, passedAt, completedAt, lastSeenVersion,
  judgments: {
    phase: "initial" | "final" | "revisit",
    axis: "trust" | "hookAccuracy" | "opinion",
    value: 1..5 | null | "accurate" | "exaggerated" | "misleading",
    cardVersion, reasonCodes[], at, sessionId
  }[]
}
/judgmentLedger/{autoId}         // 집계용 원장. uid 대신 해시, 임통 4.1 형식
/cardStats/{cardId}              // 롤업만 쓴다
```

### 4.5 쓰기 경로와 규칙

design 37장 규칙은 `/users/{userId}` 문서만 매치한다. Firestore 규칙은 하위 컬렉션에 상속되지 않아 `cardStates`가 **전부 거부**되고, 반대로 `{document=**}`로 열면 클라이언트가 판단을 마음대로 써서 54장의 "서버가 integrity 보장"이 무너진다.

- `users/{uid}` 프로필: 클라이언트 쓰기 + 필드 검증
- `cardStates`: 클라이언트 **읽기 전용**. 쓰기는 `POST /api/judgment`(Admin SDK)만
- `/api/judgment`: auth → 카드 존재(번들된 콘텐츠에서 조회, 읽기 0) → 값 검증(zod) → `sessionId` 멱등 → `cardStates` arrayUnion + `judgmentLedger` 1건. 한 배치.
- `cardStats`: 임통의 롤업 크론이 원장에서 합산. 판단 요청은 통계 문서를 건드리지 않는다.
- 규칙 테스트는 임통 `tests/firestore.rules.test.ts`를 본떠 첫 커밋부터.

### 4.6 인덱스

콘텐츠가 git으로 가면 design 55장의 `cards`·`contentUpdates` 인덱스가 없어진다. 남는 것은 원장 롤업 커서용 하나.

---

## 5. 아키텍처

### 5.1 런타임 — 잼통·임통과 동일

| 영역 | 결정 |
|---|---|
| 프레임워크 | Next.js 16, React 19, TypeScript, Tailwind 4 + 잼통 토큰 |
| 호스팅 | Firebase App Hosting (`minInstances: 0`) |
| 서버 로직 | Route Handler + Admin SDK — `/api/judgment`, `/api/ask`, `/api/me`, `/api/cron/rollup` |
| 크론 | Cloud Scheduler → `/api/cron/*` (임통 3.3 호출자 검증 그대로) |
| 인증 | Anonymous → Google 연결 (design 4.1 유지) |
| 콘텐츠 | `src/content/cards/*.ts` + zod |

design 53장의 Functions 9개는 이렇게 흩어진다.

| Function | 어디로 |
|---|---|
| `getFeed` | 클라이언트 정렬 (5.2) |
| `recordJudgment` · `calculateJudgmentChange` | `/api/judgment` · 표시 시 계산 |
| `askCardAI` | `/api/ask` |
| `updateCardStats` | `/api/cron/rollup` |
| `publishCard` · `updateApplicationStatus` | 삭제 (git · 날짜 계산) |
| `buildUserSummary` · `recordInteraction` | 삭제 (클라이언트 계산 · Analytics) |

### 5.2 피드는 서버가 필요 없다

카드 10–50장은 빌드 때 번들된다. 21장 가중치는 클라이언트에서 `cardStates`와 합쳐 정렬하면 된다. 서버 `getFeed`는 카드 수백 장, 또는 추천 로직을 숨겨야 할 이유가 생길 때.

### 5.3 숏츠 — 영상 파일 대신 claim에서 그리는 카드

design 45·46장은 카드마다 mp4를 Storage에 두고 3장씩 프리로드한다. 문제가 셋이다.

1. **정책이 바뀌면 영상을 다시 만들어야 한다.** "새 정보 +1"과 정면충돌한다. claim은 고쳤는데 영상은 옛 금액을 말한다.
2. **이그레스 비용.** 15초 720p ≈ 3–5MB × 3장 프리로드 × 사용자 수.
3. 모바일 자동재생은 무음이 기본이라 자막이 필수 — 사실상 글자다.

**제안:** 숏츠를 **claim을 참조하는 키네틱 타이포그래피 씬**으로 만든다. 텍스트·숫자는 claim에서 읽고, 모션은 잼통 모션 토큰으로. 금액이 바뀌면 다음 빌드에서 숏츠도 바뀐다. 무게는 수 KB.

같은 대본으로 실제 영상을 뽑아 **유튜브 숏츠로 배포**한다(잼통 `docs/shorts/`, 임통 로드맵의 "관심 없는 사람에게 닿기"). 영상은 유입 채널, 앱 안은 살아 있는 카드.

### 5.4 AI — RAG 대신 grounding

잼통 `src/lib/agent/`(grounding·guard)를 가져온다.

- **컨텍스트**: 해당 카드의 claims + sources 요약 + counterpoints + `applications` + **오늘 날짜**. 카드 1장은 수천 토큰 — 임베딩·chunk·벡터 검색이 필요 없다. 프롬프트 캐싱으로 반복 비용을 줄인다.
- **인용**: 모델이 `claimId`를 **후보 목록에서 고른다**(잼통 grounding 원칙). 환각 출처가 구조적으로 나올 수 없다.
- **자료 밖 질문**: "등록된 자료에 없습니다" + 공식 출처 링크. 일반 지식으로 채우지 않는다.
- **자격 질문**: 판정하지 않고 `eligibility` 게임으로 돌려보낸다(3장 5번).
- **"지금 신청할 수 있어?"**: 날짜를 주지 않으면 모델이 틀린다. `applicationState(now)` 결과를 컨텍스트에 넣는다.
- **가드**: 잼통 `guard.ts` 4겹(Origin · 주제 선별 · IP 한도 · 일일 총량) + Anthropic Console 월 한도.
- **모델**: 잼통 `/api/ask`와 같은 `claude-haiku-4-5`. 청소년 트랙은 시스템 프롬프트를 따로 둔다.
- `aiCache`(33장): 추천 질문만 캐시할 가치가 있다. 그것도 빌드 때 미리 생성해 카드에 넣으면(`suggestedAnswers`, 사람이 검수) AI 호출 0이 된다. 자유 질문은 캐시 적중률이 낮다.

---

## 6. 콘텐츠 10개 검토

사실 수치 자체는 이 검토에서 검증하지 않았다. 아래는 **문서 안의 불일치와 게임 설계**만 본 것이다.

| # | 카드 | 문제 | 제안 |
|---|---|---|---|
| 01 | 청년미래적금 | 게임 정답 C가 숏츠 문장("납입액의 일정 비율")을 그대로 옮겨 **읽기만 하면 맞힌다.** | `guess_amount`: "월 50만 원 × 36개월, 3년 뒤 정부 기여금은?" 슬라이더 → 공개 **108만 원(6%) / 216만 원(12%)**. 2차 신청 **10/7–16**이 오늘(9/29) 기준 8일 뒤 — 출시 타이밍 카드. |
| 02 | 청년월세 | 게임 A–D 중 B만 조건에 맞아 정답이 자명하다. | 게임을 바로 "나도 돼?" `eligibility`로. 답변은 **클라이언트에서만 계산하고 저장하지 않는다.** |
| 03 | 모두의카드 | "9월 이용분까지 정액형 기준금액 인하" — **오늘로 만료되는 claim.** | 첫 `validUntil` 사례. 입력값(월 교통비)도 저장하지 않는다. |
| 04 | 청약통장 | "추가 반전"(청년주택드림대출)이 다른 정책이다. 연령도 20–39세로 다르다. | 별도 카드로 분리하고 `links`로 잇는다. 한 카드 = 한 정책. |
| 05 | 응시료 지원 | 숏츠는 "**1년에** 몇 번"을 묻고 근거는 "**1인당 총** 3회". 질문과 정답이 다른 것을 묻는다. | **정정(M2 조사):** 한국산업인력공단 안내는 "1인당 **연간** 3회"다. 질문이 맞고 컨셉의 근거 문장이 틀렸다. 이런 불일치를 잡으려면 `game.answer → claimId`(4.2)가 필요하다 — 그 판단은 유효하다. |
| 06 | 일경험 | 믿을 Hook·평가할 정책이 약하고 AI 질문이 없다. 공개할 사실이 없다. | `flow: { trust: false, opinion: false }` 탐색 카드. 직무 선택 결과를 청년일경험포털 링크로. |
| 07 | 문화예술패스 | 대상이 2006·2007년생뿐인데 Hook은 청년 일반처럼 읽힌다. 예산 게임은 사실을 공개하지 않는다. | `eligibility`(출생연도) 먼저 → 대상이면 지역별 금액으로 `budget`. 비대상이면 "동생·친구에게 공유". |
| 08 | 청년도전지원 | UX 원칙("쉬었으니 문제" 금지)이 좋다. 숏츠에 질문 문장이 없고 AI 질문도 없다. | 원칙을 카드 `tone` 메모로 남겨 AI 프롬프트에도 전달. |
| 09 | 내일저축계좌 | 게임 정답(저소득 근로청년)이 정책 설명과 동일해 자명하다. | "내가 월 10만 원 넣으면 3년 뒤 얼마?" `guess_amount`가 이 정책의 반전을 더 잘 보여준다. 매칭 비율은 claim으로 확인 후. |
| 10 | 도약장려금 | **가장 좋은 카드.** 이름에서 오는 오해를 게임이 푼다. | 첫 출시 3장에 넣는다. counterpoint("기업만 좋은 정책?")가 이미 AI 질문에 있다. |

**게임 품질 기준(제안):** 숏츠만 보고 맞힐 수 있으면 게임이 아니라 퀴즈 확인이다. 정답률 목표 30–60%를 Analytics `game_complete`로 측정하고, 80%를 넘는 게임은 고친다.

---

## 7. UX 흐름

### 7.1 스와이프

- 잼통 원칙: **드래그로만 되는 조작 금지.** 카드 아래 `관심 없음` · `저장` · `보기` 버튼을 둔다. 스와이프는 지름길.
- ↑ 저장(23장)은 모바일에서 페이지 스크롤·풀투리프레시와 충돌한다. 버튼으로만.
- `pass`는 **정책에 대한 의견이 아니다.** 어떤 집계에도 넣지 않는다고 명시.

### 7.2 카드 안 단계 수

`숏츠 → 첫 판단 → 게임 → 공개 → 원자료 → AI → 최종 → 저장`은 8단계다. 스와이프 피드에서 들어온 사용자에게 길다.

- 필수 경로: **Hook → 숏츠 → 첫 판단 → 게임 → 공개 → 최종 판단** (6단계, 목표 60초)
- 원자료 · AI · 인물은 공개 화면의 **곁가지**. 안 눌러도 최종 판단으로 간다.
- 저장은 단계가 아니라 **항상 떠 있는 버튼**.
- 단계 표시는 잼통 `mono-sm` "03 / 06".

### 7.3 재평가

- 트리거: `saved && material revision after lastSeenVersion` 또는 `+90일` (26장 유지)
- 화면: "지난번 판단"을 먼저 보여주지 **않는다.** 먼저 바뀐 내용(`revisions[].summary`)을 보고, 판단하고, 그 **다음에** 지난 값을 나란히 보여준다. 먼저 보여주면 일관성 편향으로 같은 값을 누른다.
- 웹 푸시(49장): iOS는 **홈 화면에 설치한 PWA에서만** 된다. 첫 재평가 채널은 `/saved`의 "새 정보" 배지 + 선택적 이메일로 잡고, FCM은 그 뒤.

---

## 8. 디자인 시스템 적용

잼통 `docs/design-system/`을 그대로 쓴다. 통통에서 새로 정해야 하는 것만 적는다.

| 요소 | 규칙 적용 |
|---|---|
| **판단 척도** | 5칸 세그먼트, `radius-pill`, 무채색. 선택된 칸만 `ink` 채움. 색을 쓰지 않는다 — 판단은 데이터가 아니라 입력이다. `모르겠음`은 별도 pill. |
| **처음 vs 지금** | 이건 데이터다 → 잼통 색 의미 그대로: **`navy` = 지금(주인공), `burgundy` = 처음(대조군)**. 색만으로 구분하지 않는다 — 실선/점선을 함께. |
| **돈** | 모든 금액은 `mono`. 게임 공개 숫자는 `KeyNumber` + `EvidenceChip`(claim 연결). |
| **만료·미검증 claim** | `pending`. "틀림"이 아니라 "기준일 지남 / 확인 전". |
| **신청 기간** | `StatusBadge` (upcoming / open / closed) — 날짜 계산 결과. |
| **Hook 카드** | `radius-card-lg`, 그림자 없음, `stone` 헤어라인. 드래그 중에는 전환을 끈다(잼통 모션 규칙). |
| **"통!" 공개 애니메이션** | `cubic-bezier(0.16, 1, 0.3, 1)`, 250–400ms. `prefers-reduced-motion`에서는 최종 상태만. |
| **숏츠** | 씬 전환 320–420ms, 사용자가 멈출 수 있어야 한다(자동 넘김 규칙). |

**결정이 필요한 것:** 잼통 팔레트의 출처는 "이재명 대통령 취임 선서 사진"이다(`tokens.json` meta). 형태·규칙은 그대로 쓰되, 청소년·청년 대상 "다양한 정책 탐색 앱"을 표방한다면 **악센트 두 색만 통통 고유값으로 바꾸는 것**을 검토할 가치가 있다. 3장 4번과 같은 문제다.

---

## 9. 설계서에 빠진 것

- **콘텐츠 검수 주기**: 정책 수치는 자주 바뀐다. 카드마다 `reviewedAt`, 90일 지나면 `pnpm validate`가 경고.
- **정정 요청**: 잼통 `/correction`이 이미 있다. 카드 공개 화면에 "이 정보가 틀렸나요?".
- **공유**: 잼통 `opengraph-image.tsx` 패턴. 공유 이미지에는 **판단 값을 넣지 않는다**(민감정보) — Hook과 게임 결과만.
- **측정 지표**: 첫 판단 도달률, 게임 정답률, 원자료 클릭률, 최종 판단 도달률, 30일 재방문, 재평가 응답률. 이 여섯이 제품 가설을 검증한다.
- **데이터 삭제·내보내기**: `DELETE /api/me` + 내 판단 JSON 내보내기. "판단 히스토리 앱"이라면 그 히스토리는 사용자 것이다.

---

## 10. 수정 로드맵

design 67장 7 Phase → 4단계. Phase 1·2(Firebase 구성·Admin CMS)는 자매 서비스 복사로 흡수.

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| **M0 · 뼈대** | 잼통에서 토큰·컴포넌트·`schema.ts`(source/claim)·guard 복사. 카드 스키마(4.2) + `validate`. 카드 **3장**(01·02·10). | `pnpm check` 통과, 카드 3장이 불변식 통과 |
| **M1 · 판단 루프** | 온보딩(청년만) → 피드 → 필수 6단계 → 최종 판단. 익명 인증, `/api/judgment`, `cardStates`, 규칙 테스트, 민감정보 동의. | 60초 안에 한 카드 완주, 규칙 테스트 통과 |
| **M2 · 따져보기** | 원자료 시트, `/api/ask`(grounding·가드), `/me/history`, 카드 10장. | AI 답변 전부 claimId 인용, 자료 밖 질문 거절 |
| **M3 · 다시 보기** | `revisions`, 새 정보 배지, 재평가 화면, 원장 롤업 → `cardStats`, Google 연결. | 카드 1장 개정 → 저장 사용자에게 배지 → 재평가 기록 |
| 이후 | 청소년 트랙(3장 2번 결정 후), FCM, 유튜브 숏츠 배포, Firestore CMS(카드 50장+) | — |

**청년미래적금 2차 신청(10/7–16)에 맞추려면** M0 + M1을 카드 1장으로 먼저 내는 선택지가 있다.

---

## 11. 결론

설계의 제품 부분(첫 판단 → 조사 → 최종 → 재평가, 사실과 의견 분리, 성향 점수 금지)은 그대로 간다.
바꿀 것은 셋이다.

1. **판단 모델** — Hook 신뢰 → 정책 평가로 축을 단계에 맞추고, `모르겠음`을 척도 밖으로, 판단에 카드 버전을 박는다.
2. **백엔드** — Functions·Firestore CMS·RAG 대신 잼통·임통이 이미 운영하는 App Hosting·git 콘텐츠·grounding·원장 롤업.
3. **법적 게이트** — 정책 평가 = 민감정보, 만 14세 미만, 청소년 ↔ 임통 연결. 스키마 전에 정한다.
