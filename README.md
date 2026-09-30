# 통통

정책을 보고, 근거를 따져보고, 내 판단이 어떻게 바뀌는지 기록하는 모바일 웹앱.
잼통·임통의 자매 서비스이고 같은 디자인 시스템과 근거 문법(source·claim)을 쓴다.

- 기획: [`docs/initial_concept.md`](docs/initial_concept.md), [`docs/initial_design.md`](docs/initial_design.md)
- 검토와 로드맵: [`docs/design-review.md`](docs/design-review.md) — 판단 모델·데이터 모델·법적 게이트의 근거

## 실행

```bash
pnpm install
pnpm emulators          # 터미널 1 — Firestore·Auth 에뮬레이터 (demo-tongtong)
pnpm dev:emulator       # 터미널 2 — 에뮬레이터에 붙은 next dev
```

실제 프로젝트(`tongtongs`)로는 `pnpm dev`. 서버(Admin SDK)는 로컬 gcloud 자격 증명(ADC)으로, AI는 `.env.local`의 `ANTHROPIC_API_KEY`로 붙는다.

## 검사

```bash
pnpm check              # 콘텐츠 검증 + 타입 + 린트 + 단위 테스트
pnpm test:emulator      # 보안 규칙 + 서버 쓰기 계층 (에뮬레이터를 스스로 띄운다)
```

## 구조

| 경로 | 무엇 |
|---|---|
| `src/content/cards/*.ts` | 카드 원본. 새 카드는 `raw.ts`에 등록 |
| `src/content/schema.ts` | 카드 스키마와 불변식 (`pnpm validate`) |
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

```bash
pnpm check && firebase deploy --only apphosting:tongtong --project tongtongs
firebase deploy --only firestore:rules,firestore:indexes --project tongtongs   # 규칙을 바꿨을 때
```

- 주소: https://tt.jamtong.kr (기본 주소 https://tongtong--tongtongs.asia-east1.hosted.app 도 계속 동작. 백엔드 `tongtong`, `asia-east1`)
- 집계: Cloud Scheduler `tongtong-rollup`(`asia-northeast3`, 매시 정각) → `POST /api/cron/rollup`.
  서비스 계정 `tongtong-scheduler`의 OIDC 토큰으로 부른다. Scheduler 서비스 에이전트에 이 계정의 `serviceAccountTokenCreator`가 있어야 한다 — 없으면 PERMISSION_DENIED(7)로 앱에 닿지도 않는다.
  바로 돌리기: `gcloud scheduler jobs run tongtong-rollup --project tongtongs --location asia-northeast3`

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
- [ ] 초안 3장 공개 — 청년주택드림청약통장·국가기술자격 응시료·청년도전지원사업. 출처 있는 비판·한계가 필요하다

배포 직후 몇 분은 CDN이 이전 판을 줄 수 있다 — 초안 URL이 잠깐 200을 돌려줘도 곧 404로 바뀐다.

## 카드 검수와 공개

1. `pnpm review` → `docs/review-checklist.md`에 카드별로 대조할 claim과 원문 링크가 모인다.
2. 원문과 대조한 claim에 `verified: true`, 카드에 `reviewedAt: "오늘"`.
3. 모든 claim이 검증되고 비판·한계가 1개 이상이면 `publishStatus: "published"` — `pnpm validate`가 조건을 확인한다.
4. 배포. 비판·한계는 공공기관 자료나 공공기관 자료를 인용한 보도에서만 가져오고, 주장이면 `assertedBy`에 발언자를 적는다.

## 정정 요청 처리

카드 공개 화면의 "이 정보가 틀렸나요?"로 들어온 제보는 Firestore `corrections`에 쌓인다 (운영자만 — 보안 규칙이 클라이언트 읽기·쓰기를 막는다).
문서에는 `cardId`·`cardVersion`·`claimId`(선택)·`body`·`contact`(선택)·`status: "open"`이 있다. 접수 로그는 `correction-received`.

1. Firebase 콘솔 → Firestore → `corrections`에서 `status == "open"`을 본다.
2. 원문과 대조한다. 고치면 카드 파일을 고치고 `revisions`에 한 줄 남긴다 (`material: true`면 저장한 사용자에게 "새 정보"가 뜬다).
3. 처리한 문서는 `status`를 `"fixed"` 또는 `"declined"`로 바꾸고, 고치지 않았으면 이유를 `note`에 적는다.

계정을 지우면 그 사용자의 정정 요청도 함께 지운다 (연락처가 있을 수 있다).
