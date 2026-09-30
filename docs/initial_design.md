좋아. 아래 문서는 지금까지 논의한 **통통(TONGTONG)**을 실제 구현팀에 바로 넘길 수 있는 수준으로 정리한 **Next.js + Firebase 기반 MVP 상세 설계서**야. 핵심은 정치 성향을 판정하거나 특정 방향으로 유도하지 않고, **정책 콘텐츠를 보고 → 근거를 확인하고 → 자신의 판단을 기록하고 → 시간이 지나 다시 판단하는 서비스**로 설계했다.

# 통통(TONGTONG)

## Firebase 기반 MVP 상세 설계서

Version 0.1  
Target: Mobile-first Web App / PWA  
Frontend: Next.js  
Backend: Firebase

---

# 1. 서비스 정의

통통은 청소년·청년이 자신과 관련된 정책·사회 이슈를 짧은 콘텐츠로 접하고, 근거를 직접 확인하며 자신의 판단이 어떻게 변하는지를 기록하는 인터랙티브 콘텐츠 서비스다.

핵심 경험은 다음과 같다.

```
카드 등장
   ↓
← 관심 없음 / 관심 있음 →
                 ↓
              숏츠
                 ↓
             첫 판단
                 ↓
           인터랙티브 게임
                 ↓
      ┌──────────┼──────────┐
      │          │          │
    근거자료     AI 질문     인물
                            ↓
                         임통
      └──────────┼──────────┘
                 ↓
             최종 판단
                 ↓
              저장
                 ↓
          일정 시간 후 재방문
                 ↓
              재평가
                 ↓
          판단 변화 히스토리
```

통통의 핵심 가치는 "정답을 알려주는 것"보다

**내가 왜 그렇게 생각했고, 새로운 정보를 본 뒤 생각이 어떻게 변했는지 확인하는 것**

이다.

---

# 2. 핵심 사용자 구분

앱 최초 진입 시 사용자가 직접 선택한다.

```
나는 지금

[ 청소년 ]
[ 청년 ]
```

생년월일을 반드시 받을 필요는 없다.

Firebase에는 다음만 저장한다.

```
audienceType:
  | "youth"
  | "young_adult"
```

## 청소년

주요 콘텐츠:

- 교육
- 진학
- 직업계고
- 학교 밖 청소년
- 교통
- 문화
- 청소년 복지
- 직업 체험
- 디지털 교육
- 진로

## 청년

추가 상황을 복수 선택한다.

```
lifeStages: [
  "college",
  "job_seeking",
  "employed",
  "living_alone",
  "military",
  "startup",
  "housing",
  "asset_building"
]
```

예:

```
현재 나와 가까운 것은?

□ 대학생
□ 취업 준비
□ 첫 직장
□ 자취
□ 군복무/전역
□ 창업
□ 주거
□ 자산형성
```

이 정보는 **정치 성향 추정에 사용하지 않는다.**

콘텐츠 추천은 생활 상황과 관심 주제 중심으로만 한다.

---

# 3. 전체 시스템 구조

```
                    ┌────────────────────┐
                    │     Next.js PWA    │
                    │  tongtong frontend │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   Firebase Auth        Cloud Firestore     Firebase Storage
          │                   │                   │
          │                   │                   │
          └──────────────┬────┴──────────────┬────┘
                         │                   │
                         ▼                   ▼
                 Cloud Functions       Firebase Analytics
                         │
               ┌─────────┼───────────┐
               │         │           │
               ▼         ▼           ▼
             AI/RAG    집계 처리     알림 처리
               │
               ▼
         승인된 근거자료 DB
```

외부 서비스 연결:

```
통통
 │
 ├─ 인물 정보 → im.jamtong.kr
 │
 ├─ 업적/정책 관련 → jamtong.kr
 │
 └─ 원문 → 정부기관/국회/공식자료
```

---

# 4. 사용할 Firebase 서비스

## 4.1 Firebase Authentication

용도:

- 사용자 식별
- 판단 히스토리 저장
- 관심카드 저장
- 기기 변경 후 복구

### 권장 방식

첫 진입:

```
Anonymous Authentication
```

로그인 강제 없음.

사용자가 데이터를 계속 보존하고 싶을 때:

```
Google
Apple
Email
```

등과 연결.

구조:

```
anonymous UID
     ↓
사용자가 계정 연결
     ↓
기존 판단 이력 유지
```

특히 청소년 사용자를 고려해 불필요한 개인정보는 수집하지 않는다.

---

# 4.2 Cloud Firestore

통통의 핵심 데이터베이스.

주요 데이터:

- 정책 카드
- 주장
- 근거자료
- 게임
- 사용자 판단
- 판단 이력
- 관심 카드
- 사용자 상태
- AI 질문 기록
- 콘텐츠 업데이트 기록

---

# 4.3 Firebase Storage

저장 대상:

```
/videos
/thumbnails
/images
/source-previews
/avatar-assets
```

예:

```
/videos/cards/card_001/main.mp4
/thumbnails/cards/card_001.webp
/images/cards/card_001/diagram.webp
```

정부 원문 PDF 자체는 가급적 복제하지 않고 원본 URL을 유지한다.

필요할 경우:

```
/source-previews/
```

에는 썸네일 또는 서비스 내부 요약 이미지 정도만 저장한다.

---

# 4.4 Cloud Functions

서버 측 처리 담당.

주요 기능:

```
판단 기록
판단 변화 계산
콘텐츠 통계
AI 질문
RAG
콘텐츠 publish 처리
추천 후보 생성
알림
데이터 integrity 검증
```

---

# 4.5 Firebase Analytics

제품 개선용.

수집 이벤트 예:

```
card_impression
card_pass
card_open
video_start
video_complete
initial_judgment
game_start
game_complete
source_open
ask_ai
person_open
final_judgment
card_saved
card_revisit
judgment_changed
```

정치적 성향 프로파일 생성에는 사용하지 않는다.

---

# 4.6 Firebase App Check

외부 봇이 다음 API를 대량 호출하는 것을 막는다.

특히:

```
AI 질문
판단 API
콘텐츠 조회 API
```

에 중요하다.

---

# 5. Firestore 전체 Collection 설계

MVP 핵심 Collection:

```
/users
/cards
/topics
/persons
/sources
/cardStats
/contentUpdates
```

사용자 하위 Collection:

```
/users/{uid}/judgments
/users/{uid}/savedCards
/users/{uid}/interactions
/users/{uid}/aiThreads
```

---

# 6. users

```
/users/{uid}
```

예:

```
{
  "audienceType": "young_adult",

  "lifeStages": [
    "job_seeking",
    "living_alone"
  ],

  "interests": [
    "housing",
    "employment",
    "asset"
  ],

  "onboardingCompleted": true,

  "createdAt": "...",
  "updatedAt": "...",
  "lastActiveAt": "..."
}
```

## 절대 저장하지 않는 값

MVP에서는 다음 값을 만들지 않는다.

```
progressiveScore
conservativeScore
governmentSupportScore
candidateAffinity
politicalPreference
```

정책별 판단은 존재하지만 사용자를 정치 성향으로 합산하지 않는다.

---

# 7. cards

가장 중요한 Collection.

```
/cards/{cardId}
```

예:

```
{
  "id": "young_future_savings_2026",

  "status": "published",

  "audience": [
    "young_adult"
  ],

  "title": "월 50만 원씩 3년. 실제 얼마가 될까?",

  "shortTitle": "청년미래적금",

  "hook": "월 50만 원씩 3년 넣으면 정부도 돈을 더 얹어준다?",

  "category": "asset",

  "topics": [
    "saving",
    "finance",
    "youth_policy"
  ],

  "lifeStages": [
    "college",
    "job_seeking",
    "employed",
    "asset_building"
  ],

  "difficulty": 1,

  "estimatedSeconds": 45,

  "contentType": "policy",

  "origin": {
    "introducedAt": "2026-01-01",
    "expandedAt": null,
    "previousPolicyId": null
  },

  "policyStatus": "active",

  "applicationStatus": "scheduled",

  "applicationWindow": {
    "startAt": "...",
    "endAt": "..."
  },

  "publishedAt": "...",
  "updatedAt": "..."
}
```

---

# 8. 카드 콘텐츠 구조

카드 내부 콘텐츠를 한 문서에 너무 크게 넣지 않고 구조화한다.

```
/cards/{cardId}
   ├ metadata
   ├ shortVideo
   ├ initialQuestion
   ├ game
   ├ explanation
   ├ sourceIds
   ├ personIds
   ├ suggestedQuestions
   └ finalQuestion
```

예:

```
{
  "shortVideo": {
    "storagePath": "videos/cards/young_future_savings_2026/main.mp4",
    "duration": 15,
    "caption": "..."
  },

  "initialQuestion": {
    "type": "trust",
    "question": "이 설명이 얼마나 신뢰가 가나요?"
  },

  "game": {
    "type": "multiple_choice",
    "question": "정부가 추가하는 돈은?",
    "options": [
      "없다",
      "매월 1만원",
      "조건에 따라 납입액의 일정 비율",
      "정부도 똑같이 50만원"
    ],
    "answer": 2
  }
}
```

---

# 9. 카드 게임 Type

MVP에서 모든 인터랙션을 범용 Game Engine 형태로 만든다.

```
type GameType =
  | "multiple_choice"
  | "slider"
  | "yes_no"
  | "eligibility"
  | "guess_amount"
  | "choose_person"
  | "sort"
  | "before_after"
  | "budget"
```

## 예 1

```
guess_amount
```

교통비 환급액 맞히기.

## 예 2

```
eligibility
```

'나도 대상인가?'.

## 예 3

```
budget
```

20만원 문화비를 원하는 활동에 분배.

이 방식으로 새로운 정책 콘텐츠를 만들 때 프런트 코드를 변경할 필요가 거의 없다.

---

# 10. sources

```
/sources/{sourceId}
```

모든 중요한 주장은 Source에 연결한다.

예:

```
{
  "type": "government",

  "publisher": "금융위원회",

  "title": "청년미래적금 관련 보도자료",

  "url": "...",

  "publishedAt": "...",

  "retrievedAt": "...",

  "sourceStatus": "verified",

  "summary": "...",

  "quotes": [],

  "relatedCardIds": [
    "young_future_savings_2026"
  ]
}
```

source type:

```
government
assembly
law
statistics
research
news
video
interview
other
```

---

# 11. Claim 모델

정책 카드의 문장을 Source와 연결하기 위해 Claim 단위를 둔다.

```
/cards/{cardId}/claims/{claimId}
```

예:

```
{
  "text": "월 최대 50만원까지 납입할 수 있다.",

  "sourceIds": [
    "fsc_2026_xxx"
  ],

  "verification": "verified",

  "importance": "high"
}
```

verification:

```
verified
partially_verified
disputed
unknown
outdated
```

이 구조가 나중에 매우 중요하다.

정책 내용이 변경되면 카드 전체를 다시 만드는 게 아니라 해당 Claim을 갱신할 수 있다.

---

# 12. 사람 연결

카드 영상에 등장하거나 발언한 사람이 있을 수 있다.

```
{
  "personIds": [
    "person_x"
  ]
}
```

통통 자체에 모든 인물 데이터를 복사하지 않는다.

```
/persons/{personId}
```

에는 최소한의 연결정보만 유지한다.

```
{
  "name": "...",

  "profileImage": "...",

  "imtongUrl": "https://im.jamtong.kr/person/xxxx"
}
```

사용자가 클릭하면 임통으로 이동한다.

---

# 13. 사용자 판단 데이터

가장 중요한 사용자 데이터다.

한 사용자가 같은 카드에 여러 번 판단할 수 있다.

따라서 단일 값으로 overwrite하면 안 된다.

---

# 14. judgments 구조

```
/users/{uid}/judgments/{judgmentId}
```

예:

```
{
  "cardId": "young_future_savings_2026",

  "phase": "initial",

  "value": 4,

  "reasonCodes": [],

  "createdAt": "...",

  "sessionId": "abc"
}
```

자료를 본 뒤:

```
{
  "cardId": "young_future_savings_2026",

  "phase": "final",

  "value": 2,

  "reasonCodes": [
    "eligibility_too_narrow"
  ],

  "createdAt": "...",

  "sessionId": "abc"
}
```

재방문:

```
{
  "phase": "revisit",
  "value": 3
}
```

---

# 15. 판단 Scale

정책 자체에 대한 의견과 사실 주장에 대한 신뢰는 구분해야 한다.

## 사실 주장

```
trustScore

5 매우 신뢰
4 대체로 신뢰
3 판단 보류
2 다소 의심
1 매우 의심
```

## 정책 평가

```
policyOpinion

5 매우 긍정
4 대체로 긍정
3 판단 보류
2 대체로 부정
1 매우 부정
```

이 두 값은 절대 하나로 합치지 않는다.

예:

```
주장이 사실이라는 것은 믿지만
정책 자체에는 반대
```

가 가능해야 한다.

---

# 16. 판단 변화 계산

Cloud Function:

```
calculateJudgmentChange()
```

입력:

```
initial = 2
final = 4
```

결과:

```
delta = +2
direction = "increased"
```

UI:

```
처음
★★☆☆☆

자료 확인 후
★★★★☆

+2 변화
```

---

# 17. Latest Judgment

히스토리를 매번 모두 읽으면 비용이 커진다.

따라서 user 문서 아래에 최신 상태를 별도 유지한다.

```
/users/{uid}/cardStates/{cardId}
```

예:

```
{
  "initialValue": 2,
  "latestValue": 4,

  "judgmentCount": 3,

  "lastJudgmentAt": "...",

  "saved": true,

  "completed": true,

  "lastSeenContentVersion": 4
}
```

히스토리는 `judgments`.

현재 상태는 `cardStates`.

역할을 분리한다.

---

# 18. 카드 저장

```
/users/{uid}/savedCards/{cardId}
```

예:

```
{
  "savedAt": "...",

  "reason": "manual",

  "notifyUpdate": true
}
```

---

# 19. Interaction 기록

사용자 행동을 매번 Analytics만으로 처리하지 않는다.

개인화에 필요한 핵심 신호만 Firestore에도 기록한다.

```
/users/{uid}/interactions/{interactionId}
```

예:

```
{
  "cardId": "xxx",

  "type": "source_open",

  "createdAt": "..."
}
```

type:

```
impression
pass
open
video_complete
game_complete
source_open
ai_question
person_open
save
revisit
```

단순 노출은 Analytics 위주로 보내고 Firestore 저장은 최소화하는 것이 좋다.

---

# 20. Tinder 방식 카드 Feed

프런트는 다음 API 성격의 Function을 호출한다.

```
getFeed()
```

입력:

```
{
  "limit": 10
}
```

서버 고려 요소:

```
audienceType
lifeStages
interests
이미 본 카드
PASS 여부
saved 여부
신규성
정책 상태
콘텐츠 품질
```

---

# 21. Feed Scoring

초기에는 ML이 필요 없다.

간단한 가중치 방식이면 충분하다.

```
score =

audience match           +40
lifeStage match          +25
interest match           +20
new content              +10
recent policy update     +10
already completed        -40
passed recently          -50
```

정치적 선호에 따라 추천하지 않는다.

---

# 22. PASS 처리

왼쪽 Swipe:

```
type = pass
```

단, 영구 차단하지 않는다.

```
passedAt
cooldownUntil
```

예:

```
30일 후
```

정책이 크게 바뀌면 다시 보여줄 수 있다.

---

# 23. Swipe Up — 나중에 보기

추가 인터랙션을 추천한다.

```
← PASS

→ PLAY

↑ SAVE
```

사용자 입장에서는:

```
왼쪽  관심 없음
오른쪽 지금 보기
위쪽   나중에 보기
```

---

# 24. 콘텐츠 Version

정책은 계속 바뀐다.

모든 card에는:

```
version
```

을 둔다.

예:

```
{
  "version": 4
}
```

사용자가 마지막으로 본 버전:

```
lastSeenContentVersion = 2
```

현재:

```
version = 4
```

그러면:

```
새로운 정보 +2
```

표시 가능.

---

# 25. contentUpdates

```
/contentUpdates/{updateId}
```

예:

```
{
  "cardId": "xxx",

  "fromVersion": 3,
  "toVersion": 4,

  "title": "가입 대상 조건 변경",

  "summary": "...",

  "important": true,

  "createdAt": "..."
}
```

저장한 사용자에게:

> 저장한 정책에 새로운 정보가 있습니다.

라고 알려줄 수 있다.

---

# 26. 재평가 시스템

조건:

```
saved == true
AND
card.version > lastSeenVersion
```

또는 일정 시간이 지난 경우:

```
lastJudgmentAt + 90 days
```

재방문 시:

```
3개월 전에 이렇게 판단했습니다.

★★★★☆

지금은 어떻게 생각하세요?
```

---

# 27. 내 생각 화면

읽기 최적화를 위해 aggregate 데이터를 생성한다.

```
/users/{uid}/summary/current
```

예:

```
{
  "totalCards": 31,
  "savedCards": 9,
  "revisitedCards": 4,
  "judgmentChanges": 7,

  "categoryCounts": {
    "housing": 8,
    "employment": 7,
    "finance": 4
  }
}
```

정치 성향 점수는 생성하지 않는다.

---

# 28. AI 질문 시스템

카드 화면:

```
AI에게 따져보기
```

추천 질문:

```
나도 받을 수 있어?
왜 이런 정책을 만들었어?
실제 받을 수 있는 돈은?
누가 제외돼?
비판이나 한계는?
예전 정책과 뭐가 달라?
```

---

# 29. AI 질문 Architecture

```
사용자 질문
    ↓
Cloud Function
    ↓
cardId 확인
    ↓
관련 Claim 검색
    ↓
관련 Source 검색
    ↓
Evidence 추출
    ↓
LLM
    ↓
근거 포함 답변
```

중요한 원칙:

**일반 웹 지식보다 해당 카드에 등록된 검증 Source를 우선한다.**

---

# 30. Evidence Chunk

긴 원문은 chunk 단위로 관리할 수 있다.

```
/sources/{sourceId}/chunks/{chunkId}
```

예:

```
{
  "text": "...",

  "section": "가입 대상",

  "embedding": [],

  "order": 4
}
```

질문:

```
나는 35살인데 받을 수 있어?
```

검색:

```
가입 연령 관련 chunk
```

→ AI에게 전달.

---

# 31. AI Answer 구조

AI 답변은 텍스트만 반환하지 않는다.

```
{
  "answer": "...",

  "citations": [
    {
      "sourceId": "xxx",
      "label": "금융위원회"
    }
  ],

  "confidence": "high"
}
```

UI:

```
답변

...

근거
[금융위원회 ①]
[정책 안내서 ②]
```

---

# 32. AI Conversation 저장

```
/users/{uid}/aiThreads/{threadId}
```

```
{
  "cardId": "xxx",
  "createdAt": "..."
}
```

messages는 subcollection:

```
/messages/{messageId}
```

---

# 33. AI 비용 절감

동일 질문은 반복될 가능성이 높다.

별도 cache:

```
/aiCache/{hash}
```

hash:

```
cardId + cardVersion + normalizedQuestion
```

정책 카드 버전이 바뀌면 cache가 자동 무효화된다.

---

# 34. Aggregate 통계

사용자 개별 판단과 전체 통계를 분리한다.

```
/cardStats/{cardId}
```

예:

```
{
  "participants": 3921,

  "trust": {
    "1": 314,
    "2": 536,
    "3": 1002,
    "4": 1438,
    "5": 631
  }
}
```

사용자에게 표시한다면:

```
통통 사용자들의 응답이며
여론조사가 아닙니다.
```

라고 명시한다.

---

# 35. 통계 업데이트

사용자가 판단할 때 클라이언트가 직접:

```
participants++
```

하면 안 된다.

Cloud Function에서 Transaction으로 처리한다.

```
onJudgmentCreated
```

---

# 36. Firebase Security Rules 기본 원칙

사용자 문서:

```
본인만 read/write
```

카드:

```
published card = everyone read
client write = forbidden
```

source:

```
everyone read
client write = forbidden
```

통계:

```
everyone read
client write = forbidden
```

---

# 37. Security Rules 개념

```
match /users/{userId} {

  allow read, write:
    if request.auth != null
    && request.auth.uid == userId;

}
```

카드:

```
match /cards/{cardId} {

  allow read:
    if resource.data.status == "published";

  allow write:
    if false;
}
```

콘텐츠 변경은 Admin SDK 또는 관리 시스템만 가능하게 한다.

---

# 38. 판단 데이터 검증

다음처럼 아무 숫자나 넣지 못하게 한다.

```
value >= 1
value <= 5
```

또한:

```
phase ∈ [
 initial,
 final,
 revisit
]
```

같은 validation을 Rule에서 둔다.

---

# 39. 관리자 기능

별도 Admin 웹앱 또는 `/admin`.

Admin custom claim:

```
admin: true
```

기능:

```
카드 생성
Draft
Preview
Publish
Archive

Source 추가
Claim 연결

게임 설정

영상 업로드

Person 연결

Policy 상태 변경

Content Version 증가
```

---

# 40. 콘텐츠 workflow

```
Draft
  ↓
Evidence 입력
  ↓
Claim 연결
  ↓
Shorts 등록
  ↓
Game 설정
  ↓
Review
  ↓
Published
  ↓
Updated
  ↓
Archived
```

status:

```
draft
review
published
archived
```

---

# 41. 정책 상태는 별도로 관리

콘텐츠 상태와 정책 상태를 혼동하지 않는다.

```
policyStatus:
 planned
 accepting
 active
 closed
 ended
 changed
```

예:

```
콘텐츠: published
정책: application closed
```

가능.

---

# 42. 신청기간 모델

```
{
  "application": {
    "status": "open",

    "startAt": "...",

    "endAt": "...",

    "url": "..."
  }
}
```

시간이 지나면 Cloud Function이 자동으로 상태를 업데이트할 수 있다.

---

# 43. 카드 Content JSON 예시

```
{
  "id": "youth_monthly_rent_2026",

  "title": "월세 최대 480만원?",

  "audience": ["young_adult"],

  "category": "housing",

  "version": 3,

  "video": {
    "duration": 15,
    "path": "..."
  },

  "initialQuestion": {
    "type": "trust"
  },

  "game": {
    "type": "eligibility",

    "steps": [
      {
        "field": "age",
        "question": "몇 살인가요?"
      },
      {
        "field": "livingApart",
        "question": "부모와 따로 살고 있나요?"
      }
    ]
  },

  "sourceIds": [
    "molit_2026_1234"
  ],

  "suggestedQuestions": [
    "나도 받을 수 있어?",
    "소득 기준은?",
    "지금 신청 가능해?"
  ]
}
```

---

# 44. 홈 Feed Query

Firestore에서 복잡한 추천을 직접 query하지 않는 것이 좋다.

Cloud Function:

```
getFeed
```

에서:

1. 사용자 profile 읽기
2. 후보 카드 조회
3. 필터링
4. scoring
5. 10\~20개 반환

---

# 45. Feed Prefetch

모바일 UX를 위해:

```
현재 카드
다음 카드
다다음 카드
```

영상까지 미리 preload한다.

단 데이터 사용량을 고려해:

```
Wi-Fi
모바일
절약모드
```

정책을 둘 수 있다.

---

# 46. 숏츠 영상 처리

권장:

```
9:16
720x1280 이상
H.264
10~30초
```

Storage:

```
/cards/{id}/video.mp4
```

썸네일:

```
/cards/{id}/thumb.webp
```

---

# 47. 데이터 캐싱

Next.js:

```
card metadata
topic
person
```

은 CDN/ISR 캐싱 활용.

사용자 데이터:

```
judgments
saved
cardState
```

는 client-side Firestore realtime 또는 query 사용.

---

# 48. Offline/PWA

통통은 PWA에 매우 잘 맞는다.

오프라인 캐시 대상:

```
최근 카드 metadata
저장 카드
내 판단 history
thumbnail
```

인터넷 재연결 시 sync.

---

# 49. Notification

MVP 2단계부터 FCM.

예:

```
저장한 카드에 새 정보가 생겼습니다.

3개월 전에 판단한 정책을
다시 확인해볼까요?
```

사용자 선택:

```
정책 업데이트 알림
재평가 알림
신청 마감 알림
```

---

# 50. 청소년 → 청년 전환

user:

```
{
  "audienceType": "youth"
}
```

사용자가 자신의 상황을 바꾸면:

```
청년 모드로 변경
```

기존 데이터 유지.

```
청소년 때 판단했던 기록도 그대로 존재
```

따라서 몇 년간 사용할 경우:

```
16세
교육 정책

18세
진학 정책

20세
장학금

23세
취업

25세
주거

27세
자산
```

자신의 판단 변화를 장기간 볼 수 있다.

---

# 51. 개인정보 최소화

가능한 한 저장하지 않는다.

MVP에 굳이 필요 없는 정보:

```
실명
학교명
회사명
주소
정확한 생년월일
주민번호
전화번호
정당 선호
후보 선호
```

필요한 것은 대부분:

```
청소년/청년

현재 생활상태

관심영역

판단 기록
```

뿐이다.

---

# 52. 추천의 핵심 원칙

추천 알고리즘은 사용자의:

```
생활단계
관심주제
이미 본 콘텐츠
저장 콘텐츠
```

위주로 동작한다.

특정 정치인이나 정치적 입장에 대한 반응을 이용해 같은 방향의 콘텐츠를 계속 추천하는 구조는 피한다.

이렇게 해야 통통이 필터버블을 만드는 앱이 아니라 **다양한 정책을 탐색하는 앱**이 된다.

---

# 53. 주요 Cloud Functions

MVP:

```
getFeed()

recordJudgment()

recordInteraction()

calculateJudgmentChange()

askCardAI()

publishCard()

updateCardStats()

updateApplicationStatus()

buildUserSummary()
```

2단계:

```
sendPolicyUpdateNotification()

scheduleReevaluation()

generateSourceEmbeddings()

invalidateAiCache()
```

---

# 54. recordJudgment

단순 client write보다 Callable Function 방식도 고려할 수 있다.

```
recordJudgment({
 cardId,
 phase,
 type,
 value,
 reasonCodes
})
```

서버:

1. auth 확인
2. card 존재 확인
3. value validation
4. judgment append
5. cardState update
6. cardStats transaction
7. summary update

한 요청에서 integrity를 보장한다.

---

# 55. Firestore Index

초기 예상 index:

```
cards
audience + status + publishedAt

cards
category + status + publishedAt

cards
policyStatus + updatedAt

contentUpdates
cardId + createdAt

judgments
cardId + createdAt

interactions
type + createdAt
```

필요한 index만 실제 쿼리에 맞춰 추가한다.

---

# 56. URL 구조

예:

```
/
```

Feed.

```
/card/{cardId}
```

정책 카드 상세.

```
/card/{cardId}/sources
```

근거.

```
/card/{cardId}/ask
```

AI.

```
/saved
```

저장한 카드.

```
/me
```

내 생각.

```
/me/history
```

판단 이력.

```
/topics/{topic}
```

특정 주제.

---

# 57. 잼통 / 임통 연결

예:

카드:

```
청년미래적금
```

관련 정책 설명 또는 성과:

```
jamtong.kr/...
```

관련 인물:

```
im.jamtong.kr/person/...
```

통통이 모든 정보를 복제하지 않는다.

각 서비스의 역할:

```
잼통
무슨 일이 있었나

임통
누가 무슨 말을 했나

통통
나는 어떻게 생각하나
```

---

# 58. 화면 구조

## `/`

```
[TONGTONG]

┌─────────────────────┐
│                     │
│      정책 Hook      │
│                     │
│   월세 480만원?     │
│                     │
└─────────────────────┘

← 관심없음       궁금함 →
```

---

# 59. PLAY 화면

```
[15초 Shorts]

      ↓

이 설명,
얼마나 믿을 만할까요?

★★★★★
```

---

# 60. GAME

```
누가 받을 수 있을까요?

①
②
③
④
```

선택.

애니메이션:

```
통!
```

다음 정보 공개.

---

# 61. INVESTIGATE

```
조금 더 따져볼까요?

[근거자료]

[AI에게 질문]

[이 사람 누구야?]

[관련 정책]
```

---

# 62. FINAL

```
자료를 확인했습니다.

지금 생각은?

★★★★★
```

그리고:

```
처음   ★★☆☆☆
지금   ★★★★☆

+2
```

---

# 63. SAVE

```
이 카드를 저장할까요?

[저장]

다음에 정보가 바뀌면
다시 확인할 수 있습니다.
```

---

# 64. My Page

```
나의 통통

본 카드        37
저장           12
다시 본 카드    6
생각이 변한 카드 9
```

---

# 65. History

```
청년월세

2026.09.29
★★☆☆☆

자료 확인

2026.09.29
★★★★☆

정책 변경

2026.12.11
★★★☆☆
```

---

# 66. 초기 Collection 구조 최종안

```
users
 └ {uid}
    ├ cardStates
    ├ judgments
    ├ savedCards
    ├ interactions
    └ aiThreads

cards
 └ {cardId}
    └ claims

sources
 └ {sourceId}
    └ chunks

topics

persons

cardStats

contentUpdates

aiCache
```

---

# 67. MVP 구현 순서

## Phase 1

Firebase project 구성.

```
Auth
Firestore
Storage
App Check
Analytics
```

---

## Phase 2

Content Admin.

```
Card CRUD
Source CRUD
Claim
Game
Publish
```

---

## Phase 3

사용자 Feed.

```
청소년/청년 onboarding
Swipe
Shorts
Game
```

---

## Phase 4

판단 시스템.

```
Initial
Final
History
Saved
```

---

## Phase 5

근거자료.

```
Claim
Source
원문
```

---

## Phase 6

AI.

```
RAG
Suggested Question
Citation
```

---

## Phase 7

Revisit.

```
Card version
Content update
재평가
History Graph
```

---

# 68. MVP에서 반드시 구현할 것

```
청소년/청년 선택

청년 생활상태 선택

Swipe Feed

Short Video

첫 판단

Interactive Game

Source

AI 질문

임통 연결

최종 판단

판단 History

Saved Card

Card Version
```

---

# 69. MVP에서 나중으로 미룰 것

```
친구 기능
댓글
DM
실시간 채팅
팔로우
랭킹
정치성향 테스트
리더보드
복잡한 AI 추천
```

통통의 가치 검증에는 필요 없다.

---

# 70. 가장 중요한 데이터

서비스에서 가장 가치 있는 데이터는:

```
user → card → judgment → time
```

이다.

즉:

```
누가

어떤 정책을

언제 보고

무엇을 확인했고

어떻게 판단했고

나중에 판단이 어떻게 변했는가
```

이다.

하지만 이것을 사용자의 정치적 성향 점수로 변환하지 않는다.

사용자 자신이 자신의 사고 변화 과정을 돌아볼 수 있도록 사용한다.

---

# 71. 통통의 핵심 데이터 관계

최종적으로는 이렇게 된다.

```
        Person
          │
          │
       Statement
          │
          ▼
Source ─ Claim ─ Card ─ Topic
                  │
                  │
                 User
                  │
          ┌───────┼────────┐
          │       │        │
       Judgment  Save   Interaction
          │
          ▼
        History
```

잼통과 임통까지 연결하면:

```
               JAMTONG
                  │
                정책
                  │
                  ▼
Source ─────── TONGTONG
                  │
                  │
                Person
                  │
                  ▼
                IMTONG
```

---

# 72. 설계의 핵심 원칙

**1. 콘텐츠보다 Source가 먼저다.**

모든 중요한 주장은 근거자료로 끝나야 한다.

**2. 판단을 overwrite하지 않는다.**

사용자의 생각 변화 자체가 데이터다.

**3. 첫 판단과 최종 판단을 분리한다.**

통통에서 가장 중요한 UX다.

**4. 정책 의견과 사실 신뢰도를 분리한다.**

정책을 반대한다고 해당 사실을 거짓이라고 판단하는 것은 아니다.

**5. 콘텐츠는 Version을 가진다.**

정책은 살아 있는 데이터다.

**6. 청소년과 청년은 같은 플랫폼, 다른 Feed를 사용한다.**

사용자가 성장해도 계정과 판단 기록은 이어진다.

**7. 사용자의 정치 성향을 계산하지 않는다.**

생활 상황과 관심사를 이용해 관련 콘텐츠를 찾는다.

**8. AI는 근거자료를 기반으로 답한다.**

통통의 AI는 일반 챗봇보다 "이 카드에 대해 따져보는 도구"에 가깝다.

---

# 73. 최종 MVP 정의

통통 MVP를 한 문장으로 정의하면:

**청소년·청년이 자신과 관련된 정책 콘텐츠를 넘겨보다 관심 있는 주제를 발견하고, 짧은 게임과 근거자료·AI를 통해 스스로 따져본 뒤 자신의 판단과 그 변화 과정을 기록하는 모바일 정책 탐색 서비스.**

그리고 기술적으로는:

**Next.js PWA + Firebase Auth + Firestore + Storage + Cloud Functions + Analytics + App Check**

조합이면 초기 MVP부터 상당한 규모까지 충분히 운영 가능한 구조다.

특히 구현할 때 가장 먼저 제대로 잡아야 할 것은 `cards → claims → sources`**와** `judgments → cardStates`**의 분리**야. 이 두 구조만 처음부터 잘 잡으면 나중에 카드가 수백 개가 되어도 데이터 모델을 크게 뜯어고치지 않아도 된다.

다음 단계로 넘어간다면 이 설계를 바탕으로 **실제 Firestore 컬렉션/문서 JSON 예제, TypeScript 인터페이스, Security Rules, Cloud Functions API 명세까지 코드 직전 수준으로 구체화**하는 것이 가장 자연스럽다.