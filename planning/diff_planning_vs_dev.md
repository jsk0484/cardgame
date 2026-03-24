# HANDOOF - 기획 vs 구현 비교 보고서

> 작성일: 2026-03-23 | 최종 수정: 2026-03-23 | 기준 기획서: handoof.md v0.2 | 기준 코드: cardgame/dev/src/ + backend/

---

## 요약

| 구분 | 항목 수 |
|------|---------|
| 기획과 동일하게 구현됨 | 17 |
| 기획과 다르게 구현됨 | 3 |
| 기획에 있으나 미구현 | 5 |
| 기획에 없으나 추가 구현됨 | 6 |
| 버그 (미해결) | 8 |
| 버그 (해결됨) | 5 |

---

## 1. 기획과 동일하게 구현된 항목 ✅

**1-1.** 덱 구성 60장 (일반 52장 + 조커 4장 + 특수 카드 4장)
→ `deck.ts: buildDeck()`

**1-2.** 초기 손패 7장 배분
→ `gameLogic.ts: INITIAL_HAND_SIZE = 7`

**1-3.** 총 3라운드 진행
→ `gameLogic.ts: TOTAL_ROUNDS = 3`

**1-4.** 플레이 턴 타이머 20초, 도전 타이머 10초
→ `gameLogic.ts: PLAY_TIMER = 20, CHALLENGE_TIMER = 10`

**1-5.** 연속 패스 최대 2회 제한
→ `gameLogic.ts: MAX_PASS_STREAK = 2`

**1-6.** 도전 점수 (성공 +3/-2, 실패 -2/+3)
→ `scoring.ts: applyChallengeScores()`

**1-7.** 타입 모델 (Card, Player, PlayedHand, HandType, GamePhase)
→ `types.ts`

**1-8.** 버린 파일에서 카드 뽑기 가능
→ `gameStore.ts: drawCard(fromDiscard)`

**1-9.** 핸드아웃 보너스 +10
→ `backend/src/index.ts: endRound()`

**1-10.** WebSocket / Socket.io 실시간 멀티플레이어
→ `backend/src/index.ts`, `src/socket.ts`, `src/store/multiStore.ts`

**1-11.** 방 시스템 (공개방 자동매칭, 비공개방 6자리 코드)
→ `backend/src/rooms.ts`, `src/screens/LobbyScreen.tsx`, `src/screens/WaitingScreen.tsx`

**1-12.** 특수 카드 handoof (손패 교환), nullify (직전 플레이 무효화), black_joker (카드 탈취) 효과
→ `backend/src/index.ts: play_cards` 이벤트 핸들러

**1-13.** 라운드 종료 시 `calcRoundScore()` 연동 (플러시/스트레이트/트리플 보너스 포함) — 백엔드 + 싱글 모두
→ `backend/src/game/scoring.ts`, `backend/src/index.ts: endRound()`, `src/store/gameStore.ts: _endRound()`

**1-14.** 이모지 전송
→ `src/components/EmojiBar.tsx`, `backend: send_emoji / emoji_sent`

**1-15.** 드로우 파일 소진 시 라운드 종료 (백엔드 + 싱글 모두) ✅
→ `backend/src/index.ts`, `src/store/gameStore.ts: drawCard(), aiTakeTurn()`

**1-16.** PlayArea 도전 전 카드 앞면 숨김 (`revealed` 로직) ✅
→ `src/components/PlayArea.tsx: revealed = !!challengeResult || phase === 'end'`

**1-17.** AI `black_joker` 카드 탈취 시 AI 손패에 정상 추가 ✅
→ `src/store/gameStore.ts: aiTakeTurn() — black_joker 처리`

---

## 2. 기획과 다르게 구현된 항목 ⚠️

**2-1. Room 상태를 Redis가 아닌 메모리(Map)에 저장**

| | 기획 | 실제 구현 |
|-|------|----------|
| 저장소 | Redis (TTL 관리, 서버 재시작 생존) | `Map<string, GameRoom>` (서버 재시작 시 모든 방 소멸) |

→ `backend/src/rooms.ts`

**2-2. 멀티플레이어 인원이 2인 빠른매칭으로 제한됨**

| | 기획 | 실제 구현 |
|-|------|----------|
| 자동 시작 조건 | 4인 OR 30초 경과 | **2인 이상 + 10초 경과** OR 4인 즉시 시작 |

→ `backend/src/index.ts:354-364`

**2-3. red_joker 효과가 부분만 구현됨**

| | 기획 | 실제 구현 |
|-|------|----------|
| 효과 | 낼 때 suit + rank 자유 선언 | `isBluff = false` 처리만 함 (도전 면제). 선언 UI 없음 |

→ `backend/src/index.ts:38`

---

## 3. 기획에 있으나 미구현된 항목 ❌

**3-1. 재접속 처리 미구현**
- 기획: 연결 끊김 시 60초 유예, 재접속 시 게임 복귀
- 현재: 끊김 감지 후 `isConnected: false` 표시만 함, 재접속 이벤트 핸들러 없음
→ `backend/src/index.ts: disconnect` 핸들러 — reconnect 로직 없음

**3-2. 텍스트 채팅 미구현**
- 기획: 텍스트 채팅 (비속어 필터 적용)
- 현재: 이모지만 구현됨

**3-3. 관전 모드 미구현**
- 기획: 진행 중인 방 관전 가능
- 현재: 없음

**3-4. 모바일 반응형 / 배포 미완성**
- 기획: 모바일 반응형 + PWA 검토 + Vercel/Railway 배포
- 현재: `.vercel/project.json`, `railway.toml` 설정파일은 존재하나 반응형 CSS 미작업

**3-5. PostgreSQL 미구현**
- 기획: 유저 정보, 점수 기록 영구 저장
- 현재: 없음 (게임 종료 시 데이터 소멸)

---

## 4. 기획에 없으나 추가 구현된 항목 ➕

**4-1.** 다국어 지원 (한국어 / 영어 토글)
→ `src/i18n.ts`, `src/components/LangToggle.tsx`

**4-2.** 인게임 규칙 모달
→ `src/components/RulesModal.tsx`

**4-3.** 무승부(Tie) 처리 및 점수 차이 표시
→ `src/screens/ResultScreen.tsx`, `src/screens/MultiResultScreen.tsx`

**4-4.** 싱글 플레이 vs AI (M1 범위 외 추가)
→ `src/game/ai.ts`, `src/store/gameStore.ts`

**4-5.** `/health`, `/rooms` REST API 엔드포인트
→ `backend/src/index.ts:25-33`

**4-6.** 선언 블록 UX — 턴 시작 시 닫혀있고, 카드 선택 후 열기 버튼 누르면 확장
→ `src/screens/GameScreen.tsx`, `src/screens/MultiGameScreen.tsx: declareOpen` 상태

---

## 5. 버그 (미해결) ❌

**5-1. PlayArea 카드 장수(뒷면) 노출 — 선언 타입만 보여야 함**

`PlayArea.tsx`에서 도전 전 앞면 공개는 수정됨 (`revealed` 로직 ✅).
그러나 카드 뒷면(`card-back-small`)을 장수만큼 렌더링 중 → **장수가 그대로 노출됨**.

```tsx
// PlayArea.tsx:34-39 (잔존 문제)
<div className="play-area-hidden">
  {lastPlay.cards.map((_, i) => (
    <div key={i} className="card-back-small" />  // 장수 노출
  ))}
</div>
// + 텍스트로도 "{lastPlay.cards.length} card(s)" 표시 중 (line 25)
```

기획 의도: **선언 타입 텍스트만** 표시, 장수 포함 모든 카드 정보 숨김

| 표시 정보 | 기획 의도 | 현재 구현 |
|----------|----------|----------|
| 선언한 조합 타입 | ✅ 공개 | ✅ 공개 |
| 카드 장수 | ❌ 숨김 | ❌ 뒷면 개수 + 텍스트로 공개 중 |
| 실제 카드 앞면 | ❌ 숨김 (도전 전) | ✅ 도전 전 숨김 (수정됨) |
| 실제 카드 앞면 | ✅ 공개 (도전 후) | ✅ 도전 후 공개 (수정됨) |

→ `src/components/PlayArea.tsx:25, 34-39` 수정 필요

**5-2. 서버가 `cards_played`에 실제 카드 데이터 전송 중 — 클라이언트 치팅 가능**

```ts
// backend/src/index.ts:164 (잔존 문제)
cards: playedHand.cards,  // 네트워크로 실제 카드 전송
```
UI에서는 숨기더라도 DevTools Network 탭으로 상대 패 확인 가능.
`cardCount: number`만 전송하고 카드 배열은 제거해야 함.

**5-3. Pass 버튼에 score가 표시됨 (passStreak이어야 함)**
```tsx
// MultiGameScreen.tsx:264 (버그)
<button onClick={pass}>Pass ({me?.score ?? 0})</button>
// 수정 필요 → Pass ({me?.passStreak ?? 0}/2)
```
`MultiPlayer` 타입에 `passStreak` 필드 자체가 없어서 서버에서 내려줘야 함.

**5-4. `multiStore.ts: lastPlay: any` — 타입 미정의**
→ `src/store/multiStore.ts:24`

**5-5. 점수 계산 방향 — 남은 카드 값 패널티(음수) 미적용**
- 기획 변경 확정: 남은 카드 값은 패널티(음수)로 처리
- 현재: `backend/src/game/scoring.ts`와 `src/store/gameStore.ts` 모두 양수 합산 중
- 적용 필요 코드:
  ```ts
  let score = -hand.reduce((sum, c) => sum + getCardValue(c), 0);
  ```
→ `backend/src/game/scoring.ts: calcRoundScore()`, `src/store/gameStore.ts: _endRound()`

**5-6. 특수 카드가 `discardPile`에 진입함**
- 특수 카드는 사용 후 버린 파일로 가지 않아야 함 (재획득 불가 또는 버린 파일에서 뽑기 불가)
- 현재: 특수 카드도 일반 카드와 동일하게 `discardPile`에 push됨
→ `backend/src/index.ts: play_cards 핸들러`, `src/store/gameStore.ts: playCards()`

**5-7. 턴마다 획득 점수 미표시**
- 도전 결과 또는 라운드 종료 시 내가 이번 턴/라운드에서 얼마를 얻었는지 화면에 표시 없음
- 메시지 바에 텍스트로만 처리 중 — 시각적 강조 없음
- 개선 방향: 점수 변화 시 플레이어 점수 옆에 `+N / -N` 애니메이션 표시
→ `src/screens/GameScreen.tsx`, `src/screens/MultiGameScreen.tsx`

**5-8. 닉네임 없이 시작 가능**
- 현재: 닉네임 빈칸이면 `'Player'`로 자동 대체하여 시작됨
- 개선 방향: 닉네임 미입력 시 시작 버튼 비활성화 또는 입력 경고 표시
→ `src/screens/MainScreen.tsx`, `src/screens/LobbyScreen.tsx`

**5-9. `MultiGameScreen` 일부 텍스트 영어 하드코딩**
- `'Round'`, `'Draw Pile'`, `'Discard'`, `'Declare:'`, `'Play'`, `'Pass'`, `'Challenge!'`, `'No Challenge'`, `'Leave'` 등이 `i18n` 미연동 상태로 영어 고정
- `GameScreen`은 `t.*` 사용 중이나 `MultiGameScreen`은 직접 문자열 사용
→ `src/screens/MultiGameScreen.tsx` 전체 — `useLangStore` 연동 필요

**5-10. 특수 카드 색상 — 카드별 고유 색 지정 필요 (숫자 카드와 겹치지 않게)**

현재 4종 특수 카드 모두 `suit: 'joker'` → `purple` 단일 색으로 처리됨.

**숫자 카드 점유 색상 (사용 불가):**
`black` (spade) / `red` (heart) / `#cc8800` (diamond) / `green` (club)

**확정 특수 카드 색상:**

| 카드 | 배정 색상 | 비고 |
|------|----------|------|
| HANDOOF | `#9c27b0` (보라) | suit: joker 유지 |
| Nullify | `#00bcd4` (시안) | suit: joker로 변경 필요 (현재 club) |
| Red Joker | `#ff5722` (딥 오렌지) | red와 구분, suit: joker 유지 |
| Black Joker | `#607d8b` (블루그레이) | black과 구분, suit: joker 유지 |

**수정 위치:**
- `src/components/Card.tsx` — `SUIT_COLORS['joker']` 단일값 → rank별 분기 처리
- `src/i18n.ts` — `special_cards` 각 항목의 `color`, `suit` 값 위 표와 통일

**5-17. 점수 밸런스 — 먼저 손패 비우면 이득이 너무 큼**

현재 라운드 종료 시 남은 카드 합산 패널티가 커서 핸드아웃(먼저 비우기) 전략이 압도적으로 유리.

**검토 중인 두 가지 방향 (결정 필요):**

| 방향 | 내용 | 영향 |
|------|------|------|
| A. 남은 카드 패널티 제거 | `calcRoundScore()`에서 penalty 항 제거. 점수 = 콤보 감면 + 핸드아웃 보너스만 | 라운드 종료 점수 편차 줄어듦, 도전 점수가 핵심이 됨 |
| B. 도전 성공 시 낸 카드 회수 ← **확정** | 블러프 적발 시: 블러퍼가 낸 카드 전부를 자신의 손패로 되돌려 받음 (버린 파일에 가지 않음) + 기존 점수(-2/+3) 유지 | 블러핑 리스크 증가, 도전 가치 상승, 손패 비우기 전략 견제 |

**B 방향 구현 상세:**
- `resolveChallenge()`에서 `challengeSuccess === true`(블러프 적발)일 때:
  - 현재: `lastPlay.cards`를 `discardPile`에 push
  - 변경: `lastPlay.cards`를 블러퍼의 `hand`에 다시 push (`discardPile` 추가 안 함)
- 단, 특수 카드(`isSpecial`)는 회수 대상에서 제외 (이미 효과 발동됨)
- 싱글 플레이 `_resolveChallenge()`와 백엔드 `resolveChallenge()` 모두 수정 필요

→ 방향 결정 후 `backend/src/game/scoring.ts: calcRoundScore()`, `backend/src/index.ts: resolveChallenge()` 수정

---

**5-18. 2장 낼 수 없도록 검증 추가**

현재 `countMatchesDeclared(count, declaredType)`가 single(1장), triple/flush/straight(3장)만 정의되어 있으나, **2장 제출 자체를 막는 서버 검증이 없음** → 2장 내면 자동으로 bluff 처리되지만 진행은 됨.

**수정 방향:**
- `play_cards` 핸들러에 유효 장수 검증 추가: 특수 카드가 아닌 경우 `validCards.length !== 1 && validCards.length !== 3` 이면 에러 반환
- 프론트에서도 Play 버튼: 선택 카드가 1장 또는 3장일 때만 활성화 (현재는 `selectedCards.length > 0` 조건만 있음)

→ `backend/src/index.ts: play_cards 핸들러`, `src/screens/GameScreen.tsx`, `src/screens/MultiGameScreen.tsx`

---

**5-19. i18n 한국어 — "슈트" → "모양", 점수 설명 음수 표기 정리**

**"슈트" → "모양" 변경 필요 위치:**
- `scoring[1]`: `'플러시 (같은 슈트 3장): 패널티 -5 감면'` → `'플러시 (같은 모양 3장): 패널티 5 감면'`
- `combos[1].desc`: `'같은 슈트 3장'` → `'같은 모양 3장'`
- `special_cards[2].desc` (RJ): `'어떤 슈트·숫자로도 선언 가능'` → `'어떤 모양·숫자로도 선언 가능'`

**점수 설명 음수 표기 정리** — 패널티 항목(음수)은 첫 줄만, 나머지는 양수/감면으로 표기:
- `scoring[0]`: `'라운드 종료 시 손패에 남은 카드 합산 → 패널티 (음수, A=1 J=11 Q=12 K=13 조커=15)'` ← 이것만 마이너스
- `scoring[1]`: `'패널티 -5 감면'` → `'플러시 (같은 모양 3장): 패널티 5 감면'` (마이너스 기호 제거)
- `scoring[2]`: `'패널티 -5 감면'` → `'스트레이트 (연속 숫자 3장): 패널티 5 감면'`
- `scoring[3]`: `'패널티 -8 감면'` → `'트리플 (같은 숫자 3장): 패널티 8 감면'`

→ `src/i18n.ts: ko.scoring, ko.combos, ko.special_cards`

---

**5-16. 상대 handCount 실시간 노출 — 낸 장수 추론 가능**

상대가 카드를 내면 `broadcastRoom()`이 즉시 `handCount` 변경값을 전송.
플레이어가 낸 전후 장수 차이를 보고 몇 장을 냈는지 바로 알 수 있음 → triple/single 구분 가능 → 블러핑 의미 훼손.

예) 상대 handCount: 5 → 4 = 1장 냈음 = single이 확실
예) 상대 handCount: 5 → 2 = 3장 냈음 = triple/flush/straight 확실

**수정 방향:**
- `cards_played` 이벤트 emit 시점까지 상대의 `handCount` 변경을 **숨기거나 지연**
- 또는 challenge phase 종료 후에만 실제 handCount 반영
- 간단한 대안: 상대가 play phase일 때 handCount 대신 `?` 표시 (실제 값은 challenge 해소 후 갱신)

→ `backend/src/index.ts: broadcastRoom()` — 상대 `handCount` 마스킹 처리
→ `src/screens/MultiGameScreen.tsx` — 상대 카드 수 표시 조건 추가

---

**5-12. 턴 종료 시 lastPlay 카드 미공개 — skip 시에도 보여야 함**

현재 `revealed = !!challengeResult || phase === 'end'` 조건 때문에:
- 도전 발생 → `challengeResult` 세팅 → 카드 공개 ✅
- 도전 스킵 → `skipChallenge()`가 바로 `nextTurn()` 호출 → `challengeResult` null, `phase` 변경 → 카드 미공개 ❌

기획 의도: 도전 여부에 관계없이 **턴 종료 시 마지막으로 낸 카드를 잠깐 공개** 후 다음 턴으로 넘어가야 함

**수정 방향:**
- `skipChallenge()` 실행 시 `challenge_result` 이벤트(또는 별도 `turn_reveal` 이벤트)를 먼저 emit하여 카드 공개
- 1~1.5초 대기 후 `nextTurn()` 호출
- `PlayArea.tsx: revealed` 조건에 `revealedAfterSkip` 상태 추가

→ `backend/src/index.ts: skipChallenge()`, `src/components/PlayArea.tsx`

---

**5-13. 도전 실패 시 점수 체계 확인 필요**

현재 `resolveChallenge()`에서 도전 결과 점수:
- 블러프 적발(도전 성공): 도전자 +3, 낸 사람 -2
- 블러프 아님(도전 실패): 도전자 -2, 낸 사람 +3

**확인 필요 사항:** 도전 실패 시 낸 사람이 받는 `+3`이 **선언한 조합 타입에 관계없이 고정**임.
- 현재: single이든 triple이든 +3 고정
- 검토: 선언 타입(single/flush/straight/triple)에 따라 점수를 차등 지급해야 하는지?
  - 예) single +1, flush/straight +2, triple +3
  - 또는 현재 고정 +3 유지

→ 기획 의도 확인 후 `backend/src/index.ts: resolveChallenge()`, `applyChallengeScores()` 수정 여부 결정

---

**5-14. 인게임 플레이 로그 없음**

게임 중 낸 카드 기록(로그)이 없어 지난 플레이를 확인할 수 없음.

**표시 항목:**
- 누가 어떤 조합을 선언했는지 (`nickname declared [triple]`)
- 도전이 있었는지, 결과 (성공/실패)
- 해당 턴 점수 변화 (`+3 / -2`)
- NL로 무효화된 플레이

**구현 방향:**
- 각 `cards_played`, `challenge_result`, `nullify` 이벤트 발생 시 로그 항목 추가
- 화면 우측 또는 하단에 스크롤 가능한 로그 패널 표시
- 로그는 라운드 단위로 유지

→ `src/screens/GameScreen.tsx`, `src/screens/MultiGameScreen.tsx`, CSS 추가

---

**5-15. NL(Nullify) — 상대 특수 카드 반응형 사용 불가**

현재 NL은 **자기 턴 play phase**에서만 낼 수 있음 → 상대가 handoof/black_joker를 낼 때 즉시 반응 불가.

기획 의도: 상대가 특수 카드를 내면, NL 보유 플레이어가 **효과 발동 전에 즉시 NL로 카운터** 가능해야 함.

**구현 방향:**
- 상대가 특수 카드(`isSpecial`) 플레이 시 → 서버가 즉시 `nextTurn()`하지 않고 `'nullify_window'` 이벤트 emit
- NL 보유 플레이어는 3~5초 창 내에 `play_nullify` 이벤트 전송 가능
- 응답 없으면 → 특수 카드 효과 정상 발동 후 `nextTurn()`
- NL로 카운터 성공 시 → 특수 카드 효과 취소, lastPlay 무효화, 다음 턴 진행

**영향 범위:**
- `backend/src/index.ts: play_cards 핸들러` — 특수 카드 감지 후 분기
- `src/store/multiStore.ts` — `nullify_window` 이벤트 핸들러 추가
- `src/screens/MultiGameScreen.tsx` — NL 사용 가능 시 팝업/버튼 표시
- `src/store/gameStore.ts` — 싱글 플레이 AI 대응 로직 추가

→ 신규 게임 메카닉, 설계 확정 후 구현

---

**5-11. 메인 화면에 콤보 예시 섹션 없음**
- 현재: `RulesModal.tsx`에는 싱글/플러시/스트레이트/트리플 카드 예시(`♥3 ♥7 ♥K` 등)가 있으나 `MainScreen.tsx`에는 없음
- 현재 MainScreen 구성: 규칙 설명 → 점수 설명 → 특수 카드 미니 비주얼 (콤보 예시 없음)
- 추가 방향: RulesModal의 `combos` 섹션과 동일하게 mini-card 예시 표시 (`t.combos` 데이터 재사용)
→ `src/screens/MainScreen.tsx` — combos 섹션 추가, `src/screens/MainScreen.css` — 스타일 추가

---

## 5-B. 버그 (해결됨) ✅

| # | 내용 | 수정 파일 |
|---|------|----------|
| ✅ | `index.html` title "frontend" → "HANDOOF" | `dev/index.html` |
| ✅ | PlayArea 카드 앞면 공개 → 도전 전 숨김 (`revealed` 로직) | `src/components/PlayArea.tsx` |
| ✅ | AI `black_joker` 카드 탈취 시 AI 손패 미추가 → 카드 소멸 버그 | `src/store/gameStore.ts` |
| ✅ | `calcRoundScore()` `_endRound()`에서 미호출 → 콤보 보너스 0점 | `src/store/gameStore.ts` |
| ✅ | 드로우 파일 소진 시 재셔플 계속 진행 → 즉시 라운드 종료로 수정 | `src/store/gameStore.ts` |

---

## 6. 현재 개발 단계

| 마일스톤 | 기획 목표 | 상태 |
|---------|----------|------|
| M1 | 카드 모델 + 덱 + 점수 함수 | 🟡 완료 (점수 계산 패널티 반전 미적용) |
| M2 | Socket.io 서버 + 룸/턴 관리 | ✅ 완료 |
| M3 | React 화면 + 카드 렌더링 + Socket 연동 | ✅ 완료 |
| M4 | 도전/블러핑 + 특수 카드 + 타이머 | 🟡 완료 (red_joker UI, 재접속, 특수 카드 버린 파일 미처리) |
| M5 | 매칭 + 초대 + 모바일 + 배포 | 🟡 매칭/초대 완료, 모바일/배포 미착수 |

---

## 7. 수정 권고 (우선순위순)

| 우선순위 | 항목 | 위치 |
|---------|------|------|
| 🔴 높음 | 점수 계산 반전: 남은 카드 값 → 패널티(음수)로 수정 | `backend/src/game/scoring.ts`, `src/store/gameStore.ts` |
| 🔴 높음 | 특수 카드 사용 후 `discardPile`에 들어가지 않도록 처리 | `backend/src/index.ts`, `src/store/gameStore.ts` |
| 🔴 높음 | `PlayArea` 카드 장수 및 뒷면 제거 → 선언 타입 텍스트만 표시 | `src/components/PlayArea.tsx:25, 34-39` |
| 🔴 높음 | `cards_played` 이벤트에서 `cards` 배열 제거 → `cardCount`만 전송 (치팅 방지) | `backend/src/index.ts:164` |
| 🟡 중간 | 특수 카드 4종 고유 색상 적용 (HF: 보라, NL: 시안, RJ: 딥오렌지, BJ: 블루그레이) | `src/components/Card.tsx`, `src/i18n.ts` |
| 🟡 중간 | `MultiPlayer` 타입에 `passStreak` 추가 + Pass 버튼 표시값 수정 | `backend/src/index.ts`, `multiStore.ts`, `MultiGameScreen.tsx:264` |
| 🟡 중간 | `multiStore.ts: lastPlay: any` 타입 정의 | `src/store/multiStore.ts:24` |
| 🟡 중간 | 턴마다 획득 점수 시각적 표시 (+N/-N 애니메이션) | `GameScreen.tsx`, `MultiGameScreen.tsx` |
| 🟡 중간 | 닉네임 미입력 시 시작 버튼 비활성화 | `MainScreen.tsx`, `LobbyScreen.tsx` |
| 🟡 중간 | `MultiGameScreen` 영어 하드코딩 텍스트 → `i18n` 연동 | `MultiGameScreen.tsx` |
| 🟡 중간 | red_joker suit/rank 선언 UI 구현 | `src/screens/MultiGameScreen.tsx` |
| 🔴 높음 | 점수 밸런스 — 남은 카드 패널티 제거 또는 도전 성공 시 카드 회수 (방향 결정 필요) | `backend/src/game/scoring.ts`, `backend/src/index.ts` |
| 🔴 높음 | 2장 낼 수 없도록 검증 추가 (서버 + 클라이언트) | `backend/src/index.ts`, `GameScreen.tsx`, `MultiGameScreen.tsx` |
| 🟡 중간 | i18n 한국어 "슈트" → "모양" 변경, 점수 설명 마이너스 표기 정리 | `src/i18n.ts` |
| 🔴 높음 | 상대 handCount 실시간 노출 → 낸 장수 추론 가능 — challenge 해소 전까지 마스킹 | `backend/src/index.ts: broadcastRoom()`, `MultiGameScreen.tsx` |
| 🔴 높음 | 턴 종료 시 lastPlay 카드 공개 (skip 시에도) — `skipChallenge()`에 reveal 딜레이 추가 | `backend/src/index.ts`, `PlayArea.tsx` |
| 🔴 높음 | 도전 실패 시 점수 체계 확인 — 선언 타입별 차등 여부 결정 | `backend/src/index.ts: resolveChallenge()` |
| 🔴 높음 | 인게임 플레이 로그 패널 추가 (선언/도전 결과/점수 변화) | `GameScreen.tsx`, `MultiGameScreen.tsx` |
| 🔴 높음 | NL 반응형 사용 — 상대 특수 카드 발동 전 카운터 창 구현 | `backend/src/index.ts`, `multiStore.ts`, `MultiGameScreen.tsx` |
| 🟡 중간 | 메인 화면에 콤보 예시 섹션 추가 (RulesModal의 combos와 동일, mini-card 비주얼 포함) | `MainScreen.tsx`, `MainScreen.css` |
| 🟡 중간 | 재접속 핸들러 구현 | `backend/src/index.ts` |
| 🟢 낮음 | Redis 도입 (현재 메모리 Map → 서버 재시작 시 방 소멸) | `backend/src/rooms.ts` |
| 🟢 낮음 | 모바일 반응형 CSS | 각 screen CSS |
