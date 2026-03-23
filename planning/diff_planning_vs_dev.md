# HANDOOF - 기획 vs 구현 비교 보고서

> 작성일: 2026-03-23 | 기준 기획서: handoof.md v0.2 | 기준 코드: cardgame/dev/src/

---

## 요약

| 구분 | 항목 수 |
|------|---------|
| 기획과 동일하게 구현됨 | 9 |
| 기획과 다르게 구현됨 | 7 |
| 기획에 있으나 미구현 | 7 |
| 기획에 없으나 추가 구현됨 | 5 |

---

## 1. 기획과 동일하게 구현된 항목 ✅

**1-1.** 덱 구성 60장 (일반 52장 + 조커 4장 + 특수 카드 4장) 동일하게 구현됨
→ `deck.ts: buildDeck()`

**1-2.** 초기 손패 7장 배분 동일하게 구현됨
→ `gameLogic.ts: INITIAL_HAND_SIZE = 7`

**1-3.** 총 3라운드 진행 동일하게 구현됨
→ `gameLogic.ts: TOTAL_ROUNDS = 3`

**1-4.** 플레이 턴 타이머 20초, 도전 타이머 10초 동일하게 구현됨
→ `gameLogic.ts: PLAY_TIMER = 20, CHALLENGE_TIMER = 10`

**1-5.** 연속 패스 최대 2회 제한 동일하게 구현됨
→ `gameLogic.ts: MAX_PASS_STREAK = 2`

**1-6.** 도전 점수 (성공 +3/-2, 실패 -2/+3) 동일하게 구현됨
→ `scoring.ts: applyChallengeScores()`

**1-7.** 타입 모델 (Card, Player, PlayedHand, HandType, GamePhase) 기획서 명세와 동일하게 구현됨
→ `types.ts`

**1-8.** 버린 파일에서 카드 뽑기 가능 동일하게 구현됨
→ `gameStore.ts: drawCard(fromDiscard: boolean)`

**1-9.** 핸드아웃 보너스 +10 동일하게 구현됨
→ `gameStore.ts: _endRound()` 내 `handoutBonus = 10`

---

## 2. 기획과 다르게 구현된 항목 ⚠️

**2-1. 라운드 종료 점수 계산 방식이 다름** ← 치명적 불일치

| | 기획 / UI 표시 | 실제 구현 (`_endRound`) |
|-|------|----------|
| 손패 합산 | 남은 손패 카드 값 합산 점수 **부여** | 남은 손패 카드 값을 **패널티로 차감** (`-floor(val/5)`) |
| 플러시/스트레이트/트리플 보너스 | 라운드 종료 시 적용 (+5/+5/+8) | `calcRoundScore()` 함수는 존재하나 `_endRound()`에서 **호출되지 않음** → 보너스 0점 |

> `i18n.ts` 의 점수 설명(플러시 +5, 스트레이트 +5, 트리플 +8)은 인게임 규칙 화면에 표시되지만 **실제 게임 로직과 다름** — 유저에게 잘못된 정보가 노출되는 상태

→ `gameStore.ts: _endRound()` / `scoring.ts: calcRoundScore()`

**2-2. 플레이어 수 2인 고정**

| | 기획 | 실제 구현 |
|-|------|----------|
| 인원 | 2~4인 | 플레이어 1명 + AI 1명 하드코딩 |

→ `gameStore.ts: HUMAN_IDX = 0, AI_IDX = 1`, `dealHands(deck, 2, ...)`

**2-3. 게임 화면 전환이 라우트가 아닌 상태값으로 구현됨**

| | 기획 | 실제 구현 |
|-|------|----------|
| 화면 전환 | URL 라우트 (`/lobby`, `/room/:id` 등 5개) | `GameScreen = 'main' \| 'game' \| 'result'` 상태값 |
| 로비 화면 | 별도 존재 | 없음 |

→ `types.ts: GameScreen`, `App.tsx`

**2-4. 드로우 파일 소진 시 라운드 종료가 아닌 재셔플로 처리됨**

| | 기획 | 실제 구현 |
|-|------|----------|
| 드로우 파일 소진 | 즉시 라운드 종료 | 버린 파일을 셔플해 드로우 파일로 재활용 후 계속 진행 |

→ `gameStore.ts: drawCard()`, `aiTakeTurn()` 내 재셔플 로직

**2-5. AI가 Open Issue에 있었으나 이미 구현됨 (단일 난이도)**

| | 기획 | 실제 구현 |
|-|------|----------|
| AI 난이도 | Open Issue (Easy/Normal/Hard 미정) | 단일 난이도, 도전 확률 20% 고정, 패스 확률 25% 고정, 블러핑 20% |

→ `ai.ts`

**2-6. React 버전이 기획 스택과 다름**

| | 기획 | 실제 구현 |
|-|------|----------|
| React | React 18 | React 19.2.4 (`package.json`) |

**2-7. 렌더링 라이브러리가 다름**

| | 기획 | 실제 구현 |
|-|------|----------|
| 게임 렌더링 | Phaser.js 3 | 순수 React + CSS (Phaser.js 미사용) |

→ `package.json` — Phaser.js 의존성 없음

---

## 3. 기획에 있으나 미구현된 항목 ❌

**3-1. 멀티플레이어 (WebSocket / Socket.io) 미구현**
- 기획: Socket.io 기반 실시간 2~4인 멀티플레이
- 현재: 로컬 싱글플레이 (vs AI)만 존재
- 영향: 이벤트 명세 전체, Redis 키 구조, 방 매칭 흐름 모두 미착수

**3-2. 방 시스템 미구현**
- 기획: 공개방 자동매칭, 비공개방 6자리 코드 초대, 관전 모드
- 현재: 방 개념 없음

**3-3. 특수 카드 효과 미구현**
- 기획:
  - `handoof`: 상대와 손패 전체 교환
  - `nullify`: 직전 `lastPlay` 무효화
- 현재: 덱에 카드 존재, UI 규칙 화면에 설명 노출, **실제 사용 시 일반 카드처럼 처리됨 (효과 없음)**
→ `deck.ts`, `i18n.ts` 에는 정의됨 / `gameStore.ts` 에 효과 처리 로직 없음

**3-4. 조커 효과 미구현**
- 기획:
  - `red_joker`: suit + rank 자유 선언
  - `black_joker`: 상대 손패 1장 랜덤 탈취
- 현재: 덱에 카드 존재, UI 규칙 화면에 설명 노출, **실제 사용 시 일반 카드처럼 처리됨 (효과 없음)**
→ `deck.ts`, `i18n.ts` 에는 정의됨 / `gameStore.ts` 에 효과 처리 로직 없음

**3-5. 이모지 / 채팅 미구현**
- 기획: 인게임 빠른 이모지 5종 + 텍스트 채팅 (비속어 필터)
- 현재: 없음

**3-6. 백엔드 / DB 미구현**
- 기획: Node.js + Express, Redis, PostgreSQL
- 현재: 순수 프론트엔드만 존재 (`package.json` 에 서버 의존성 없음)

**3-7. 모바일 반응형 / 배포 미완성 (M5 미착수)**
- 기획: 모바일 반응형 + PWA 검토 + Vercel/Railway 배포
- 현재: 미착수

---

## 4. 기획에 없으나 추가 구현된 항목 ➕

**4-1. 다국어 지원 (한국어 / 영어 토글)**
- `i18n.ts`, `LangToggle.tsx`, `langStore.ts`
- 인게임 UI 텍스트 전체 한/영 전환 기능 구현됨

**4-2. 인게임 규칙 모달**
- `RulesModal.tsx`
- `?` 버튼으로 언제든 규칙 + 콤보 예시 + 특수 카드 설명 확인 가능

**4-3. 무승부(Tie) 처리**
- `ResultScreen.tsx`: `human.score === ai.score` 시 무승부 화면 표시
- 기획에는 무승부 케이스 미정의

**4-4. 점수 차이 표시**
- `ResultScreen.tsx: won_by(pts)`, `lost_by(pts)` — 몇 점 차이로 이겼는지 표시
- 기획에는 없는 UX

**4-5. HTML title이 "frontend"로 설정됨**
- `index.html: <title>frontend</title>`
- 배포 전 "HANDOOF"로 변경 필요

---

## 5. 현재 개발 단계 판단

| 마일스톤 | 기획 목표 | 상태 |
|---------|----------|------|
| M1 | 카드 데이터 모델 + 덱 셔플/배분 + 점수 계산 함수 | 🟡 완료 (단, `calcRoundScore` 미연동) |
| M2 | Socket.io 서버 + 룸/턴 관리 | ❌ 미착수 |
| M3 | React 게임 화면 + 카드 렌더링 + Socket 연동 | 🟡 화면/렌더링 완료, Socket 없음 |
| M4 | 도전/블러핑 + 특수 카드 + 타이머 + 재접속 | 🟡 도전/타이머 완료, 특수 카드 효과 미구현 |
| M5 | 매칭 + 초대 + 모바일 + 배포 | ❌ 미착수 |

---

## 6. 수정 권고 (우선순위순)

| 우선순위 | 항목 | 위치 |
|---------|------|------|
| 🔴 높음 | UI 규칙 설명과 실제 점수 로직 불일치 수정 — `_endRound()`에서 `calcRoundScore()` 연동 | `gameStore.ts` |
| 🔴 높음 | 특수 카드 (handoof, nullify) 효과 구현 | `gameStore.ts` |
| 🔴 높음 | 조커 (red_joker, black_joker) 효과 구현 | `gameStore.ts` |
| 🟡 중간 | `index.html` title "frontend" → "HANDOOF" 변경 | `index.html` |
| 🟡 중간 | 멀티플레이어 서버 착수 (M2) | 신규 파일 |
| 🟢 낮음 | AI 난이도 분기 추가 | `ai.ts` |
| 🟢 낮음 | 드로우 파일 소진 시 동작 기획과 맞출지 결정 (재셔플 유지 or 라운드 종료) | `gameStore.ts` |
