# HANDOOF - 웹 멀티플레이어 카드게임 기획서

> 버전: v1.0 | 작성일: 2026-03-24 | 기준: 현재 구현 코드 (cardgame/dev/)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 게임명 | HANDOOF |
| 장르 | 실시간 멀티플레이어 블러핑 카드게임 |
| 플랫폼 | 웹 브라우저 (PC 우선, 모바일 반응형 예정) |
| 플레이 인원 | 2인 (1 vs AI 또는 1 vs 1 온라인) |
| 한 판 소요 시간 | 약 10 ~ 20분 (3라운드) |
| 배포 | Vercel (프론트) + Railway (백엔드) |

---

## 2. 게임 컨셉

HANDOOF는 **손패 관리(Hand Management)** + **블러핑(Bluffing)** 기반 카드게임이다.

- 플레이어는 손패를 숨기며 카드 조합을 선언하고 낸다.
- 선언한 조합이 거짓일 수 있으며, 상대가 **"도전"** 으로 이를 검증한다.
- 버린 카드는 공개 정보가 되어 상대가 가져갈 수 있다.
- 특수 카드로 손패 교환, 직전 플레이 무효화, 카드 탈취가 가능하다.
- 3라운드 후 **점수 합산이 높은 플레이어가 승리**한다.

---

## 3. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프론트엔드 | React 19 + TypeScript | Vite 번들러, 경로: `cardgame/dev/` |
| 상태 관리 | Zustand | `gameStore` (싱글), `multiStore` (멀티), `langStore` (언어) |
| 실시간 통신 | Socket.io (WebSocket) | 클라이언트: `src/socket.ts` |
| 백엔드 | Node.js + Express | `backend/src/index.ts` |
| 룸 관리 | 메모리 Map | 서버 재시작 시 방 소멸 (Redis 미도입) |
| 다국어 | 커스텀 i18n | `src/i18n.ts`, 한국어/영어 토글 |
| 배포 | Vercel + Railway | |

---

## 4. 데이터 모델

### 4-1. Card

```ts
type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
          | 'red_joker' | 'black_joker' | 'handoof' | 'nullify';

interface Card {
  id: string;        // 예: "spade_7", "joker_red_0"
  suit: Suit;
  rank: Rank;
  isSpecial: boolean;
}
```

카드 점수값 (`getCardValue`): A=1, 2~10=face, J=11, Q=12, K=13, 조커=15, 특수카드=0

### 4-2. Player

```ts
interface Player {
  id: string;
  nickname: string;
  hand: Card[];         // 본인만 조회 가능
  handCount: number;    // 상대에게 노출되는 보유 장수
  score: number;
  passStreak: number;   // 연속 패스 횟수 (최대 2)
  isConnected: boolean;
}
```

### 4-3. PlayedHand (테이블에 낸 패)

```ts
type HandType = 'single' | 'flush' | 'straight' | 'triple' | 'straight_flush' | 'special';

interface PlayedHand {
  playerId: string;
  cards: Card[];
  declaredType: HandType;   // 플레이어가 선언한 조합
  actualType: HandType;     // 실제 조합 (도전 시 공개)
  isBluff: boolean;         // declaredType !== actualType
}
```

### 4-4. PlayLogEntry (인게임 로그)

```ts
interface PlayLogEntry {
  id: number;
  round: number;
  playerName: string;
  declaredType: string;
  cardCount: number;
  challenged: boolean | null;   // null=대기, false=도전없음, true=도전발생
  challengeSuccess: boolean | null;
  delta: number | null;         // 이번 도전으로 발생한 점수 변화
}
```

### 4-5. GamePhase

```ts
type GamePhase = 'draw' | 'play' | 'nl_counter' | 'challenge' | 'end';
```

| 페이즈 | 설명 |
|--------|------|
| `draw` | 드로우 파일 또는 버린 파일에서 카드 1장 뽑기 |
| `play` | 손패에서 카드 제출 또는 패스 (타이머 20초) |
| `nl_counter` | 상대 특수 카드 발동 전 nullify 반응 대기창 |
| `challenge` | 직전 플레이에 도전 여부 선택 (타이머 10초) |
| `end` | 턴 종료, 다음 플레이어로 전환 |

---

## 5. 카드 구성

### 5-1. 기본 덱 (총 60장)

| 구성 | 수량 |
|------|------|
| 일반 카드 (4 모양 × 13장) | 52장 |
| 조커 (red_joker × 2, black_joker × 2) | 4장 |
| 특수 카드 (handoof × 2, nullify × 2) | 4장 |
| **합계** | **60장** |

### 5-2. 모양(Suit) 구성

| 모양 | 색상 | 비고 |
|------|------|------|
| ♠ 스페이드 | 흑 | |
| ♥ 하트 | 적 | |
| ♦ 다이아몬드 | 황금 | |
| ♣ 클럽 | 녹 | |

### 5-3. 특수 카드

| 카드 | 색상 | 효과 |
|------|------|------|
| HF (handoof) | 보라 `#9c27b0` | 지정 상대와 손패 전체 교환 |
| NL (nullify) | 시안 `#00bcd4` | 직전 lastPlay를 무효화, 해당 카드 드로우 파일 맨 아래로 반환 |
| RJ (red_joker) | 딥오렌지 `#ff5722` | `isBluff = false` 처리 → 도전 시 항상 도전 실패. (suit/rank 자유 선언 UI 미구현) |
| BJ (black_joker) | 블루그레이 `#607d8b` | 지정 상대 손패 1장 랜덤 탈취 |

> 특수 카드는 discardPile에 들어가지 않으며 점수값 = 0.

---

## 6. 게임 흐름

### 6-1. 전체 흐름

```
[메인화면]
  ├─ 싱글 플레이 → [GameScreen] (vs AI)
  └─ 멀티 플레이 → [LobbyScreen] → [WaitingScreen] → [MultiGameScreen]
                                                            ↓
                                                   [MultiResultScreen]
```

### 6-2. 라운드 루프

```
게임 시작 (손패 7장 배분)
    │
    ▼
┌───────────────────────────────────────┐
│             라운드 루프                │
│                                       │
│  [DRAW] 드로우 파일 또는 버린 파일 뽑기 │
│         ↓                             │
│  [PLAY] 카드 제출 (1~3장) 또는 패스    │
│         (연속 패스 최대 2회)           │
│         ↓                             │
│  [CHALLENGE] 도전 선택 (10초)          │
│         ├─ 도전 → 도전 결과 공개       │
│         └─ 스킵 → 다음 턴             │
└───────────────────────────────────────┘
         │
    손패 0장 OR 드로우 파일 소진
         ↓
    라운드 점수 계산
         │
    3라운드 후 → 최종 결과 화면
```

### 6-3. 도전(Challenge) 상세

| 상황 | 결과 |
|------|------|
| 도전 성공 (블러프 적발) | 도전자 +3점, 허풍 플레이어 -선언조합보너스점. 블러퍼가 낸 카드 전부 손패로 회수 (특수 카드 제외) |
| 도전 실패 (정직한 플레이) | 도전자 -2점, 정직한 플레이어 +선언조합보너스점 |

> **회수 규칙 (5-17 B)**: 도전 성공 시 블러퍼가 낸 카드를 전부 자신의 손패로 되돌려 받음 — 패널티 카드가 증가하므로 블러핑 리스크 상승. 특수 카드는 제외.

---

## 7. 점수 계산

### 7-1. 도전 점수 (즉시 적용)

`applyChallengeScores(scores, challengerId, blufferId, success, declaredType)`

| 상황 | 도전자 | 상대 |
|------|--------|------|
| 도전 성공 (허풍 적발) | **+3** | **-콤보보너스** |
| 도전 실패 (정직 통과) | **-2** | **+콤보보너스** |

콤보 보너스값 (`getComboBonus`):

| 조합 | 보너스 |
|------|--------|
| single | 0 |
| flush | 3 |
| straight | 5 |
| triple | 8 |
| straight_flush | 15 |
| special | 0 |

### 7-2. 라운드 점수 (라운드 종료 시)

`calcRoundScore(cards, isHandout)`

| 조건 | 점수 |
|------|------|
| 핸드아웃 (손패 0장으로 라운드 종료) | **+5** |
| 남은 손패가 triple | +8 |
| 남은 손패가 straight_flush | +15 |
| 남은 손패가 flush | +3 |
| 남은 손패가 straight | +5 |
| 그 외 | 0 |

> **TODO (5-17)**: 현재 구현에서 남은 카드 패널티(음수)가 `_endRound()` 레벨에서 적용되는지 백엔드와 싱글 양쪽 일관성 확인 필요.

### 7-3. 패턴 인식 (HandType 판별)

`determineActualHandType(cards)`:

| 조건 | HandType |
|------|----------|
| 1장 + 특수 카드 | special |
| 특수 카드 포함 | special |
| 3장, 같은 rank | triple |
| straight + flush 동시 | straight_flush |
| 같은 suit 3장+ | flush |
| 연속 숫자 3장+ | straight |
| 나머지 | single |

### 7-4. 점수 예시

| 상황 | 점수 |
|------|------|
| 손패 0장 먼저 비우기 (핸드아웃) | +5 |
| flush 선언 & 성공, 상대 도전 실패 | +3 |
| triple 선언 & 블러프 적발 | -8 |
| 도전 성공 | +3 |
| 도전 실패 | -2 |

**3라운드 합산 점수가 가장 높은 플레이어 승리.**

---

## 8. 화면 구성

### 8-1. 화면 목록

| 화면 | 파일 | 설명 |
|------|------|------|
| 메인 | `MainScreen.tsx` | 닉네임 입력, 싱글/멀티 선택, 규칙 확인 |
| 로비 | `LobbyScreen.tsx` | 공개방 빠른 매칭, 비공개방 코드 입장/생성 |
| 대기실 | `WaitingScreen.tsx` | 참가자 목록, 준비 버튼, 방 코드 공유 |
| 싱글 게임 | `GameScreen.tsx` | 1 vs AI 인게임 |
| 멀티 게임 | `MultiGameScreen.tsx` | 1 vs 1 온라인 인게임 |
| 싱글 결과 | `ResultScreen.tsx` | 최종 점수, 재시작 |
| 멀티 결과 | `MultiResultScreen.tsx` | 최종 점수, 재매칭 |

### 8-2. 인게임 레이아웃

```
┌──────────────────────────────────────────────┐
│  [상대 닉네임]  손패: ■■■■■■    [타이머]     │
│                                              │
│    [드로우 파일]    [버린 파일(공개)]          │
│                                              │
│  ─────────── [플레이 에어리어] ─────────────  │
│             (도전 전: ? 박스)                 │
│                                              │
│  ─────────── [플레이 로그 패널] ─────────────  │
│  R1 Player TRIPLE ×3 ✓ +3                   │
│  R1 AI     FLUSH  ×3 —                      │
│                                              │
│  [내 손패]                                   │
│                                              │
│   [내기▾]  [패스]  [도전!]  [이모지]         │
└──────────────────────────────────────────────┘
```

### 8-3. 플레이 에어리어 (PlayArea)

- 도전 페이즈 전: 카드 `?` 박스로 숨김 (장수/뒷면 모두 비공개)
- 도전 결과 후 / 라운드 종료 후: 앞면 공개
- 선언 타입만 텍스트로 표시

### 8-4. 플레이 로그 패널

형식: `R{라운드} {플레이어} {선언타입} ×{장수} {결과}`

| 결과 심볼 | 의미 |
|-----------|------|
| `…` | 대기 중 (도전 창 열림) |
| `—` | 도전 없이 스킵 |
| `✓ +N` | 도전 성공 (허풍 적발), 점수 변화 |
| `✗ -N` | 도전 실패, 점수 변화 |

---

## 9. 컴포넌트 목록

| 컴포넌트 | 파일 | 역할 |
|---------|------|------|
| Card | `components/Card.tsx` | 단일 카드 렌더링. 특수 카드 고유 색상 적용 |
| Hand | `components/Hand.tsx` | 손패 카드 목록, 선택 상태 관리 |
| Pile | `components/Pile.tsx` | 드로우/버린 파일 더미 표시 |
| PlayArea | `components/PlayArea.tsx` | 테이블 위 낸 패 표시, 공개/숨김 전환 |
| EmojiBar | `components/EmojiBar.tsx` | 5종 이모지 전송 버튼 |
| RulesModal | `components/RulesModal.tsx` | 게임 규칙 모달 |
| LangToggle | `components/LangToggle.tsx` | 한국어/영어 전환 버튼 |

---

## 10. Socket.io 이벤트 명세

### 클라이언트 → 서버

| 이벤트 | payload | 설명 |
|--------|---------|------|
| `create_room` | `{ nickname, isPublic }` | 방 생성 |
| `join_room` | `{ roomId, nickname }` | 방 참가 (공개방: `'quick'`) |
| `ready` | — | 준비 완료 토글 |
| `draw_card` | `{ from: 'draw' \| 'discard' }` | 카드 뽑기 |
| `play_cards` | `{ cards: Card[], declaredType: HandType }` | 카드 제출 |
| `pass` | — | 패스 |
| `challenge` | — | 도전 선언 |
| `send_emoji` | `{ emoji: string }` | 이모지 전송 |

### 서버 → 클라이언트

| 이벤트 | payload | 설명 |
|--------|---------|------|
| `room_updated` | `RoomInfo` | 방 상태 변경 |
| `game_started` | `{ hand, players, round }` | 게임 시작, 초기 손패 지급 |
| `turn_started` | `{ playerId, phase, timer }` | 턴 시작 |
| `card_drawn` | `{ playerId, from, card? }` | 카드 뽑기 (본인만 card 공개) |
| `cards_played` | `{ playedHand: { playerId, cardCount, declaredType } }` | 카드 제출 (cards 배열 미포함, 치팅 방지) |
| `challenge_result` | `{ success, actualType, scoreDeltas, blufferCards? }` | 도전 결과 |
| `round_ended` | `{ scores, hands }` | 라운드 종료, 점수 |
| `game_ended` | `{ winner, finalScores }` | 게임 종료 |
| `emoji_sent` | `{ playerId, emoji }` | 이모지 수신 |
| `error` | `{ code, message }` | 에러 |

---

## 11. 방 매칭 흐름

```
공개방 빠른 매칭:
1. emit('join_room', { roomId: 'quick', nickname })
2. 서버: waiting 상태 공개방 조회 → 없으면 신규 생성
3. 2인 이상 + 10초 경과 시 게임 자동 시작

비공개방:
1. emit('create_room', { isPublic: false })
2. 서버: 6자리 roomId 발급 → 클라이언트 반환
3. 초대 코드로 상대방 입장
4. 방장이 수동으로 게임 시작
```

---

## 12. 싱글 플레이 (vs AI)

- `gameStore.ts`에서 모든 게임 로직을 클라이언트 사이드로 처리
- AI 로직: `src/game/ai.ts`
- AI 행동: 블러프 감지, 도전 결정, 카드 선택, 특수 카드 사용
- AI는 `players[1]` (AI_IDX = 1)

---

## 13. 다국어 지원 (i18n)

- `src/i18n.ts`: 한국어 / 영어 키-값 딕셔너리
- `langStore.ts`: 현재 언어 상태 (`'ko'` | `'en'`)
- `LangToggle` 컴포넌트로 언어 전환

> **TODO (5-19)**: "슈트" → "모양" 용어 통일, 점수 설명의 마이너스 표기 정리 필요.

---

## 14. 미결 / 잔여 항목

### 🔴 높음 (버그 / 게임 밸런스)

| # | 항목 | 위치 |
|---|------|------|
| 5-17 | 도전 성공 시 블러퍼 낸 카드 손패 회수 (특수 카드 제외) | `backend/src/index.ts: resolveChallenge()`, `gameStore.ts: _resolveChallenge()` |
| 5-18 | 2장 낼 수 없도록 검증 (서버 reject + 클라이언트 Play 버튼 비활성화) | `backend/src/index.ts`, `GameScreen.tsx`, `MultiGameScreen.tsx` |
| 5-16 | 상대 handCount 마스킹 — challenge 해소 전 보유 장수 숨김 | `backend/src/index.ts: broadcastRoom()` |
| 5-12 | 턴 종료 시 lastPlay 카드 공개 — skipChallenge에 reveal 딜레이 추가 | `backend/src/index.ts: skipChallenge()`, `PlayArea.tsx` |
| 5-13 | 도전 점수 — 선언 타입별 차등 적용 확인 (현재 고정 +3/-2인지 가변인지) | `backend/src/game/scoring.ts`, `gameStore.ts` |
| 5-15 | NL 반응형 카운터 — 상대 특수 카드 발동 전 nullify_window 구현 | 신규 설계 (`nl_counter` 페이즈 이미 타입 정의됨) |

### 🟡 중간 (UX / 기능 개선)

| # | 항목 | 위치 |
|---|------|------|
| 5-19 | i18n "슈트" → "모양", 점수 설명 마이너스 표기 정리 | `src/i18n.ts` |
| — | 턴마다 점수 시각적 표시 (+N/-N 애니메이션) | `GameScreen.tsx`, `MultiGameScreen.tsx` |
| — | red_joker suit/rank 자유 선언 UI | `GameScreen.tsx`, `MultiGameScreen.tsx` |
| — | 메인 화면에 콤보 예시 섹션 추가 | `MainScreen.tsx` |
| — | 재접속 처리 | `backend/src/index.ts`, `multiStore.ts` |

### 🟢 낮음 (인프라 / 반응형)

| # | 항목 |
|---|------|
| — | Redis 도입 (현재 메모리 Map, 서버 재시작 시 방 소멸) |
| — | 모바일 반응형 CSS |
| — | AI 난이도 조정 |

---

## 15. 변경 이력

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v0.1 | 2026-03-22 | 최초 기획 |
| v0.2 | 2026-03-23 | Phaser.js 제거, React 순수 렌더링으로 전환. 구현 현황 반영 |
| v1.0 | 2026-03-24 | 현재 구현 기반 전면 재작성. 실제 tech stack / 점수 로직 / 화면 목록 반영. PlayLogEntry, nl_counter 페이즈, 5-17 B옵션 등 최신 결정사항 포함 |
