# 수요 큰 정책 3개 원문 대조 (2026-10-08)

청사진 견본을 넓히려고 새로 쓴 정책 항목 3개의 claim을 출처 원문과 대조한 기록이다.
claim은 원문을 보고 썼고, 대조도 AI(Claude)가 출처 페이지를 읽어 했다. **`verified: true`로 바꾸는 것은 편집자가 원문을 직접 확인한 뒤**다. 그때까지 세 항목은 초안(`publishStatus: "draft"`)이라 운영 화면에 나오지 않는다.

| 판정 | 뜻 |
|---|---|
| 맞음 | 출처 원문에 같은 내용이 있다 |
| **확인할 것** | 공식 원문을 열지 못했거나 원문끼리 다르다 — 편집자가 원문을 보고 정한다 |

## 왜 이 셋인가 — 수요

- 앱 안 신호(`pnpm metrics 60`, 2026-08-10 ~ 10-08)는 아직 작다 — 방문 41, 빈칸 요청 0, 지역 정책 열람 0. 가장 많이 열린 카드는 청년월세(9)·청년미래적금(7)으로 **주거·자산** 쪽이다.
- 그래서 정책 자체의 규모와 앱 관심사를 함께 보고 골랐다. 온통청년 전국 단위 정책 664건(2026-10-08 조회) 가운데:
  1. **장병내일준비적금** — 병으로 복무하는 거의 모든 청년이 대상인 자산 정책. 군 복무 견본(`military-return`)의 복무 기간 칸이 비어 있다.
  2. **국가근로장학금** — 대학생 생활비. 대학생 견본 셋(`campus-living-alone`·`military-return`·`master-to-industry`)에 바로 들어간다.
  3. **주거안정장학금** — 앱에서 가장 많이 본 주제(주거)이고, 청년월세 지원과 달리 대학생 기초·차상위를 직접 겨냥한다.

## 요약

| 항목 | 상태 | claim | 출처 |
|---|---|---|---|
| 장병내일준비적금 `soldier-savings` | 초안 | 7 | 국방부 안내, 병무청 공지(2026-01-09 수정) |
| 국가근로장학금 `national-work-scholarship` | 초안 | 6 | 한국장학재단 FAQ·선발기준·신청 일정, 정책브리핑 기자단(2024) |
| 주거안정장학금 `housing-stability-scholarship` | 초안 | 6 | 교육부 정책브리핑 2건(2025-02-04, 2025-11-24) |

- claim 19개 중 맞음 **17개**, 확인할 것 **2개**(`national-work-scholarship` `who`, `priority`).
- 세 항목 모두 카드는 없다. 청사진 칸에만 쓴다.

## 확인할 것

| 항목·claim | 무엇 |
|---|---|
| `national-work-scholarship` `who` | 한국장학재단의 "신청대상(지원자격)" 탭 본문을 열지 못했다. 2024-08-16 정책브리핑 기자단 기사("학자금 지원 9구간 이하, 직전학기 학점 C0(70점/100점 만점) 수준 이상인, 대학교 재학생")에 기댔다. 2026년 기준을 재단 원문으로 확인할 것 |
| `national-work-scholarship` `priority` | 재단 선발기준 페이지는 우선순위를 "8구간 이하"까지 적는데(3순위 7~8구간), 위 기사는 신청 자격을 "9구간 이하"로 적는다. 9구간은 신청은 되지만 순위 밖인지 확인할 것 |

## 맞음

### 장병내일준비적금 — [국방부](https://www.mnd.go.kr/mnd/288/subview.do), [병무청 공지](https://www.mma.go.kr/board/boardView.do?mc=usr0000379&gesipan_id=2&gsgeul_no=1518779)

| claim | 원문 |
|---|---|
| `who` | "병 급여 및 복무관리 체계를 적용받는 자로 한정함" — 현역·상근예비역(국방부), 대체복무요원(법무부), 사회복무요원(병무청) |
| `period` | "육군·해병대·상근예비역(~18개월), 해군(~20개월), 공군·사회복무요원(~21개월), 대체복무요원(~24개월)", "'24. 6월부터는 최소 1개월 이상부터 가입 가능" |
| `limit` | 1인 2계좌(동일 은행 불가), 2025년 1월부터 계좌당 월 30만원·개인별 월 55만원, 5만원 단위 |
| `matching` | (국방부) 2024년부터 원금의 100%, (병무청) "(’24년~) 입금액의 100%" |
| `example-2026` | "(’26. 1월 소집자 월 55만원 납입시 : 원금 1,155만원→사회복귀준비금 1,155만원 지원)" — 사회복무요원 공지 |
| `interest` | 기본 은행이자 5% 수준, 비과세 |
| `early-close` | 만기 전 해지하면 이자소득 비과세 혜택과 정부지원금을 받을 수 없다 |

- 참고: 병무청 공지는 사회복무요원이 **소집해제 뒤** 중도해지해도 지원금은 받을 수 있다고 적는다("적금을 소집해제 이후 중도해지하여도 지원금 지급 가능(단, 이자 비과세 혜택 등 미부여)"). `early-close`는 복무 중 해지 기준이다 — 편집자가 문장을 좁힐지 정한다.
- 국방부 페이지에는 기준일이 없다(첨부 리플릿 파일명은 2025-01).

### 국가근로장학금 — [한국장학재단 FAQ](https://www.kosaf.go.kr/ko/scholarnf.do?pg=scholarship05_04_09p), [선발기준](https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_04_04), [신청 일정](https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_04_01&ttab1=5)

| claim | 원문 |
|---|---|
| `wage-2026` | 2026년 1학기 기준 교내근로 "시간당 10,320원", 교외근로 "시간당 12,790원" |
| `hours` | "1일 최대 8시간, 월당 최대 80시간", "(방학 기간에는 주당 최대 40시간)" |
| `every-semester` | "국가근로장학금은 학기별로 운영되므로 매 학기 별로 새로 신청해야 합니다." |
| `rounds-2026-2` | 2026년 2학기 1차 2026. 5. 22.(금) 9시 ~ 6. 22.(월) 18시. 2차·추가 신청 운영 여부는 대학마다 다르다 |

### 주거안정장학금 — [정책브리핑 2025-11-24](https://www.korea.kr/news/policyNewsView.do?newsId=148955106), [정책브리핑 2025-02-04](https://www.korea.kr/news/policyNewsView.do?newsId=148939202)

| claim | 원문 |
|---|---|
| `who` | "기초차상위 학생", "원거리* 진학자", "단, 만 39세 이하 미혼인 자" |
| `distance` | "대학소재지 기준 부모님의 주소지가 다른 교통권에 있는 경우", 서울 캠퍼스와 성남 주소는 같은 수도권이라 원거리가 아니다(2025-02-04 Q&A) |
| `amount` | "학기 중 최대 월 20만 원 한도 내 주거관련 비용 지원", "연간 최대 240만 원 지원" |
| `actual-cost` | "학생이 제출한 주거안정장학금 지급 요청서 검토 후 월 지급 한도 내에서 학생이 지출한 비용(실비)을 개별 지급", 임차료·보증금·기숙사비, 주택임차차입금 이자, 수선유지비, 수도·전기·관리비 |
| `since` | "2025학년도 주거안정장학금", "올해부터" (2025-02-04) |
| `apply` | "한국장학재단 누리집 및 모바일앱에서 신청", "반드시 학생 본인이 직접 신청" |

## 공개한 뒤 견본에 넣을 칸

세 항목을 공개(`publishStatus: "published"`, claim `verified: true`)한 뒤 아래 칸을 넣는다. 공개 견본은 초안 항목을 가리킬 수 없어서(`validatePath`) 지금은 넣지 않았다.

```ts
// military-return — 복무 중
{ id: "soldier-savings", policyId: "soldier-savings", milestoneId: "service", fromOffset: 0, toOffset: 11, role: "asset", why: "복무하는 동안 적금을 들어 전역 때 원금만큼 매칭지원금을 받는다." },
// military-return — 복학 뒤
{ id: "work-scholarship", policyId: "national-work-scholarship", milestoneId: "return", fromOffset: 12, toOffset: 35, role: "funding", why: "학기 중 교내·교외에서 일하며 생활비를 번다." },
// campus-living-alone — 학부 내내
{ id: "work-scholarship", policyId: "national-work-scholarship", milestoneId: "freshman", fromOffset: 0, toOffset: 47, role: "funding", why: "학기 중 교내·교외에서 일하며 생활비를 번다." },
{ id: "housing-scholarship", policyId: "housing-stability-scholarship", milestoneId: "freshman", fromOffset: 0, toOffset: 47, role: "housing", why: "기초·차상위이고 부모님과 다른 지역 대학에 다니면 월세·관리비를 실비로 받는다." },
// master-to-industry — 학부 4학년
{ id: "work-scholarship", policyId: "national-work-scholarship", milestoneId: "senior", fromOffset: 0, toOffset: 11, role: "funding", why: "학부 마지막 해 생활비를 학교 안에서 번다." },
```

- `campus-living-alone`에는 청년월세 지원(`rent`)과 주거안정장학금이 함께 놓인다. 둘을 함께 받을 수 있는지는 원문에서 찾지 못했다 — 넣기 전에 확인할 것.
