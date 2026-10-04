# 통통

정책을 보고, 근거를 따져보고, 내 판단이 어떻게 바뀌는지 기록하는 모바일 웹앱.
잼통·임통의 자매 서비스이고 같은 디자인 시스템과 근거 문법(source·claim)을 쓴다.

- 기획: [`docs/initial_concept.md`](docs/initial_concept.md), [`docs/initial_design.md`](docs/initial_design.md)
- 검토와 로드맵: [`docs/design-review.md`](docs/design-review.md) — 판단 모델·데이터 모델·법적 게이트의 근거
- 청년 청사진: [`docs/blueprint-design.md`](docs/blueprint-design.md) — 정책 항목·카드 두 층, 장기 플랜 설계

## 실행

```bash
pnpm install
pnpm emulators          # 터미널 1 — Firestore·Auth 에뮬레이터 (demo-tongtong)
pnpm dev:emulator       # 터미널 2 — 에뮬레이터에 붙은 next dev
```

실제 프로젝트(`tongtongs`)로는 `pnpm dev`. 서버(Admin SDK)는 로컬 gcloud 자격 증명(ADC)으로, AI는 `.env.local`의 `ANTHROPIC_API_KEY`로 붙는다.

- 에뮬레이터 UI: http://localhost:4000 (Firestore 문서·Auth 사용자를 직접 본다). 데이터는 끄면 사라진다.
- 개발 서버(`pnpm dev`·`pnpm dev:emulator`)는 초안 항목·카드·견본도 보여 준다. 운영 빌드는 공개(`published`)만 — 아래 "빌드".

## 검사

```bash
pnpm check              # 콘텐츠 검증 + 타입 + 린트 + 단위 테스트
pnpm test:emulator      # 보안 규칙 + 서버 쓰기 계층 (에뮬레이터를 스스로 띄운다)
```

| 명령 | 무엇 |
|---|---|
| `pnpm validate` | 항목·카드·견본 스키마와 불변식 (claim 근거, `exclusiveWith` 대칭, 견본 칸이 항목 `planning`과 맞는지) |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` | 타입 · ESLint · 단위 테스트(vitest, `src/**/*.test.ts`) |
| `pnpm test:emulator` | `tests/*` — Firestore·Auth 에뮬레이터 위에서 규칙과 쓰기 트랜잭션. 8080·9099 포트가 비어 있어야 한다 |
| `pnpm review` | 원문 대조 목록 `docs/review-checklist.md`를 다시 만든다 (아래 "카드 검수와 공개") |

## 빌드

```bash
pnpm build              # next build — 운영과 같은 빌드
pnpm start              # 빌드 결과를 로컬에서 띄운다 (실제 프로젝트에 붙는다)
```

- 운영 빌드(`NODE_ENV=production`)는 공개 항목·카드·견본만 넣는다. 초안까지 넣으려면 `NEXT_PUBLIC_SHOW_DRAFTS=true` — 운영에서는 쓰지 않는다.
- 카드·정책·견본은 빌드 때 번들된다. 콘텐츠를 고쳤으면 다시 빌드·배포해야 사이트에 나온다.
- 카드·정책 페이지(`generateStaticParams`)와 공유 미리보기 이미지는 빌드 때 만든다.
- `NEXT_PUBLIC_*`은 빌드 때 코드에 박힌다. 배포 빌드는 `apphosting.yaml`의 값(BUILD 가용성)을 쓴다.

## 구조

| 경로 | 무엇 |
|---|---|
| `src/content/policies/*.ts` | 정책 항목 — 사실(claim·출처·신청 회차·개정 이력·청사진 계획 정보). 새 정책은 `raw.ts`에 등록 |
| `src/content/cards/*.ts` | 카드 경험 — 같은 id의 항목 위에 얹는 훅·게임·판단. 새 카드는 `raw.ts`에 등록 |
| `src/content/schema.ts` | 항목·카드 스키마와 불변식 (`pnpm validate`). 앱은 둘을 합친 `Card`를 쓴다(`resolveCard`) |
| `src/lib/judgment.ts` | 판단 모델 — 축·단계·척도 |
| `src/lib/user-state.ts` | 사용자 데이터 쓰기 규칙 (순수 함수) |
| `src/lib/server/store.ts` | Firestore 트랜잭션 — 규칙을 적용하고 쓴다 |
| `src/lib/ask/*` | AI 따져보기 — 카드 claim만으로 근거 구성, 주제 선별, 한도 |
| `src/app/api/*` | 판단·저장·프로필·삭제·AI·정정 요청 API. 클라이언트는 Firestore에 직접 쓰지 않는다 |
| `firestore.rules` | 자기 문서 읽기만 허용. `corrections`는 운영자만(콘솔) |
| `src/app/opengraph-image.tsx` · `card/[id]/opengraph-image.tsx` | 공유 미리보기. 빌드 때 그린다 (서체 `assets/fonts`, 로고 `assets/og`). 판단 값은 싣지 않는다 |

## 환경

로컬은 `.env.local`, 배포는 `apphosting.yaml`(비밀은 Secret Manager).

| 이름 | 무엇 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | 웹 앱 설정. 배포에서는 API 키만 Secret |
| `NEXT_PUBLIC_APPCHECK_SITE_KEY` | `next.config.ts`에 있다. 있으면 서버가 App Check를 강제한다 |
| `ANTHROPIC_API_KEY` | AI 따져보기. 배포: Secret `ANTHROPIC_API_KEY` |
| `ASK_MODEL` | `claude-haiku-4-5` (코드 기본값은 `claude-opus-5-5`) |
| `ASK_HOURLY_LIMIT` · `ASK_DAILY_LIMIT` | 사람(uid·IP)당 시간 한도 20, 전체 일일 500 |
| `NEXT_PUBLIC_SITE_URL` · `EXTRA_ALLOWED_ORIGINS` | API의 Origin 검사 |
| `CRON_AUDIENCE` · `CRON_SERVICE_ACCOUNT` | `/api/cron/*` 호출자 검증 |

## 배포

App Hosting은 GitHub가 아니라 **이 작업 폴더를 그대로 올려** 클라우드에서 빌드한다(`firebase.json`의 `rootDir: "."`). 커밋하지 않은 변경도 올라가므로 main에서, 깨끗한 상태로 배포한다. `.env*`·`node_modules`·`.next`는 올라가지 않는다.

```bash
# 0. 처음 한 번
firebase login
gcloud auth application-default login      # pnpm dev·metrics가 쓰는 ADC

# 1. main에서 깨끗한 상태 확인
git switch main && git status

# 2. 검사 (배포 전 매번)
pnpm check && pnpm test:emulator && pnpm build

# 3. 규칙·인덱스 — firestore.rules·firestore.indexes.json을 바꿨을 때만, 앱보다 먼저
firebase deploy --only firestore:rules,firestore:indexes --project tongtongs

# 4. 앱
firebase deploy --only apphosting:tongtong --project tongtongs

# 5. 원격 저장소 (배포와 별개 — 기록용)
git push origin main
```

- 규칙을 먼저 올리는 이유: 새 앱이 새 컬렉션(예: `blueprints`)을 읽는데 규칙이 아직 옛것이면 읽기가 거절된다. 규칙은 추가만 하는 한 옛 앱과도 맞는다.
- 앱 배포는 클라우드 빌드까지 수 분 걸린다. 진행·로그: Firebase 콘솔 → App Hosting → `tongtong` → 출시(Rollouts). 빌드가 실패하면 이전 판이 그대로 서비스된다.
- 배포 뒤 확인: https://tt.jamtong.kr 에서 피드가 뜨고, 카드 하나를 열어 판단까지 저장되는지(API·App Check). 브라우저 콘솔에 오류가 없는지.
- 되돌리기: 콘솔의 출시 목록에서 이전 출시를 다시 출시하거나, 이전 커밋을 체크아웃해 4를 다시 한다. 규칙은 이전 `firestore.rules`로 3을 다시 한다.
- 환경 변수·Secret은 `apphosting.yaml`에 있다. Secret 값을 바꿀 때: `firebase apphosting:secrets:set <이름> --project tongtongs` 뒤 다시 배포.

### 운영 정보

- 주소: https://tt.jamtong.kr (기본 주소 https://tongtong--tongtongs.asia-east1.hosted.app 도 계속 동작. 백엔드 `tongtong`, `asia-east1`)
- 집계: Cloud Scheduler `tongtong-rollup`(`asia-northeast3`, 매시 정각) → `POST /api/cron/rollup`.
  서비스 계정 `tongtong-scheduler`의 OIDC 토큰으로 부른다. Scheduler 서비스 에이전트에 이 계정의 `serviceAccountTokenCreator`가 있어야 한다 — 없으면 PERMISSION_DENIED(7)로 앱에 닿지도 않는다.
  바로 돌리기: `gcloud scheduler jobs run tongtong-rollup --project tongtongs --location asia-northeast3`
- 지표: `pnpm metrics [일수=7]` — 운영 Firestore의 일별 합계와 청사진 합계를 터미널에 그린다(ADC). 에뮬레이터로 보려면 `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GOOGLE_CLOUD_PROJECT=demo-tongtong pnpm exec tsx scripts/metrics.ts`.

도메인을 바꿀 때 함께 바꿀 것: `apphosting.yaml`의 `NEXT_PUBLIC_SITE_URL`(다른 주소는 `EXTRA_ALLOWED_ORIGINS`로), Firebase Auth 승인 도메인, reCAPTCHA 키 허용 도메인. 빠뜨리면 API가 403/401로 거절해 온보딩부터 막힌다. Scheduler는 기본 주소(hosted.app)로 부르므로 `CRON_AUDIENCE`는 그대로 둔다.

## 준비 상태 (2026-09-29)

- [x] Firestore — Native, `asia-northeast3`
- [x] 익명 로그인 · Google 로그인
- [x] 보안 규칙·인덱스 배포
- [x] App Check — reCAPTCHA Enterprise 키 `tongtong-web` (허용: localhost, tongtongs.web.app, tongtongs.firebaseapp.com, tongtong--tongtongs.asia-east1.hosted.app, tt.jamtong.kr)
- [x] App Hosting 배포 · Secret · Auth 승인 도메인
- [x] 집계 Scheduler
- [x] AI 비용 상한 — Anthropic 선불 충전 + Console hard limit. 코드 한도(인스턴스별)는 보조 장치다
- [x] 사용자 도메인 — tt.jamtong.kr (2026-09-30)
- [x] 출시 (2026-09-30) — 공개 카드 7장. 초안 미리보기(`NEXT_PUBLIC_SHOW_DRAFTS`) 끔
- [x] 청사진 정책 항목 8개·견본 2개 공개, 응시료·청약통장·도전지원은 항목만 공개 (2026-10-04, `docs/source-check-2026-10-04.md`)
- [ ] 카드 3장 공개 — 청년주택드림청약통장·국가기술자격 응시료·청년도전지원사업. 항목은 공개됐고, 카드에 출처 있는 비판·한계가 필요하다

배포 직후 몇 분은 CDN이 이전 판을 줄 수 있다 — 초안 URL이 잠깐 200을 돌려줘도 곧 404로 바뀐다.

## 카드 검수와 공개

1. `pnpm review` → `docs/review-checklist.md`에 정책 항목별로 대조할 claim과 원문 링크가 모인다. `계획 정보` 표시가 붙은 claim은 `planning` 값(나이·기간·회차)과도 맞춰 본다.
2. 원문과 대조한 claim에 `verified: true`, 항목(`src/content/policies/<id>.ts`)에 `reviewedAt: "오늘"`.
3. 모든 claim이 검증되면 항목을 `publishStatus: "published"`로. 카드는 항목이 공개이고 비판·한계가 1개 이상이면 공개할 수 있다 — `pnpm validate`가 조건을 확인한다.
4. 배포. 비판·한계는 공공기관 자료나 공공기관 자료를 인용한 보도에서만 가져오고, 주장이면 `assertedBy`에 발언자를 적는다.

## 정정 요청 처리

카드 공개 화면의 "이 정보가 틀렸나요?"로 들어온 제보는 Firestore `corrections`에 쌓인다 (운영자만 — 보안 규칙이 클라이언트 읽기·쓰기를 막는다).
문서에는 `cardId`·`cardVersion`·`claimId`(선택)·`body`·`contact`(선택)·`status: "open"`이 있다. 접수 로그는 `correction-received`.

1. Firebase 콘솔 → Firestore → `corrections`에서 `status == "open"`을 본다.
2. 원문과 대조한다. 고치면 정책 항목 파일을 고치고 `revisions`에 한 줄 남긴다 (`material: true`면 저장한 사용자에게 "새 정보"가 뜬다).
3. 처리한 문서는 `status`를 `"fixed"` 또는 `"declined"`로 바꾸고, 고치지 않았으면 이유를 `note`에 적는다.

계정을 지우면 그 사용자의 정정 요청도 함께 지운다 (연락처가 있을 수 있다).
