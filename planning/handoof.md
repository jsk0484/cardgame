# HANDOOF - 웹 멀티플레이어 카드게임 기획서

> 버전: v0.2 | 작성일: 2026-03-23 | 대상 독자: 프론트엔드 / 백엔드 개발자

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 게임명 | HANDOOF |
| 장르 | 실시간 멀티플레이어 카드게임 |
| 플랫폼 | 웹 브라우저 (PC / 모바일 반응형) |
| 플레이 인원 | 2 ~ 4인 |
| 한 판 소요 시간 | 약 15 ~ 30분 (라운드 3판) |
| 타겟 유저 | 10대 후반 ~ 30대, 캐주얼 카드게임 팬 |

---

## 2. 게임 컨셉 요약

HANDOOF는 **손패 관리(Hand Management)** + **블러핑(Bluffing)** 기반 카드게임이다.
- 플레이어는 손패 7장을 숨기며 조합을 만들어 점수를 쌓는다.
- 내기 시 선언한 패 조합이 거짓일 수 있으며, 상대가 "도전"으로 이를 검증한다.
- 버린 카드는 공개 정보가 되어 상대가 가져갈 수 있다.

---

## 3. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프론트엔드 | React 18 + TypeScript | Vite 번들러 |
| 게임 렌더링 | Phaser.js 3 | 카드 애니메이션, 드래그&드롭 |
| 상태 관리 | Zustand | 게임 상태 전역 관리 |
| 실시간 통신 | Socket.io (WebSocket) | 클라이언트 ↔ 서버 |
| 백엔드 | Node.js 20 + Express | REST API + Socket.io 서버 |
| 게임 룸 관리 | Redis | 방 상태, 턴 타이머, 세션 |
| DB | PostgreSQL | 유저 정보, 점수 기록 |
| 배포 | Vercel (FE) + Railway (BE) | |

---

## 4. 데이터 모델

### 4-1. Card

```ts
type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
           | 'red_joker' | 'black_joker' | 'handoof' | 'nullify';

interface Card {
  id: string;       // 고유 ID (예: "spade_7", "joker_red_0")
  suit: Suit;
  rank: Rank;
  isSpecial: boolean;
}
```

### 4-2. Player

```ts
interface Player {
  id: string;           // socket ID
  nickname: string;
  hand: Card[];         // 본인만 조회 가능 (서버에서 필터링)
  handCount: number;    // 상대에게 공개되는 손패 수
  score: number;        // 누적 점수
  passStreak: number;   // 연속 패스 횟수 (max 2)
  isConnected: boolean;
}
```

### 4-3. GameRoom

```ts
type RoomStatus = 'waiting' | 'playing' | 'finished';
type TurnPhase  = 'draw' | 'play' | 'challenge' | 'end';

interface GameRoom {
  roomId: string;           // 6자리 코드
  isPublic: boolean;
  players: Player[];        // 최대 4인
  spectators: string[];     // socket ID 목록
  status: RoomStatus;
  round: number;            // 1 ~ 3
  currentTurn: number;      // players 배열 인덱스
  phase: TurnPhase;
  drawPile: Card[];         // 뒷면 덱
  discardPile: Card[];      // 버린 패 더미 (공개)
  lastPlay: PlayedHand | null;
  turnTimer: number;        // 남은 초 (서버 기준)
}
```

### 4-4. PlayedHand (테이블에 낸 패)

```ts
type HandType = 'single' | 'flush' | 'straight' | 'triple' | 'special';

interface PlayedHand {
  playerId: string;
  cards: Card[];
  declaredType: HandType;   // 플레이어가 선언한 조합 유형
  actualType: HandType;     // 실제 조합 유형 (도전 시 공개)
  isBluff: boolean;         // declaredType !== actualType
}
```

---

## 5. 카드 구성

### 5-1. 기본 덱 (총 60장)

| 구성 | 수량 |
|------|------|
| 일반 카드 (4 슈트 × 13장) | 52장 |
| 조커 | 4장 |
| 특수 카드 | 4장 |
| **합계** | **60장** |

| 슈트 | 색상 | 테마 |
|------|------|------|
| spade | 흑 | 공격 |
| heart | 적 | 회복 |
| diamond | 황금 | 점수 |
| club | 녹 | 방해 |

### 5-2. 특수 카드

| id | 수량 | 효과 | 서버 이벤트 |
|----|------|------|------------|
| `handoof` | 2장 | 손패 전체를 지정 상대와 교환 | `emit('swap_hand', { targetId })` |
| `nullify` | 2장 | 직전 `lastPlay`를 무효화, 해당 카드 드로우 파일 맨 아래로 | `emit('nullify_play')` |

### 5-3. 조커

| id | 효과 | 서버 이벤트 |
|----|------|------------|
| `red_joker` | 낼 때 suit + rank 자유 선언 | `emit('play_joker', { declaredSuit, declaredRank })` |
| `black_joker` | 지정 플레이어 손패 1장 랜덤 탈취 | `emit('steal_card', { targetId })` |

---

## 6. 게임 흐름 & 상태 전이

```
WAITING ──(모두 준비)──► PLAYING
                            │
              ┌─────────────▼──────────────┐
              │         라운드 루프          │
              │                            │
              │  [DRAW phase]              │
              │   ├─ 드로우 파일 뽑기       │
              │   └─ 버린 파일 맨 위 뽑기  │
              │         ↓                  │
              │  [PLAY phase – 20초]       │
              │   ├─ 1~3장 선언 후 제출    │
              │   └─ 패스 (연속 2회 불가)  │
              │         ↓                  │
              │  [CHALLENGE phase – 10초]  │
              │   ├─ "도전!" 선언          │
              │   └─ 패스                  │
              │         ↓                  │
              │  [END phase]               │
              │   └─ 다음 플레이어 턴 시작 │
              └────────────────────────────┘
                            │
              (손패 0장 OR 드로우 파일 소진)
                            ↓
                     라운드 점수 계산
                            │
                   (3라운드 완료 시)
                            ↓
                        FINISHED
```

---

## 7. 점수 계산 로직

점수는 **라운드 종료 시** 서버에서 계산 후 클라이언트에 broadcast.

```ts
function calcRoundScore(player: Player, isHandout: boolean): number {
  const hand = player.hand;
  let score = hand.reduce((sum, c) => sum + getCardValue(c), 0);

  if (isFlush(hand))    score += 5;   // 같은 슈트 3장+
  if (isStraight(hand)) score += 5;   // 연속 숫자 3장+
  if (isTriple(hand))   score += 8;   // 같은 숫자 3장
  if (isHandout)        score += 10;  // 라운드 먼저 종료

  return score;
}

function getCardValue(card: Card): number {
  if (card.isSpecial) return 0;
  if (card.rank === 'red_joker' || card.rank === 'black_joker') return 15;
  return Number(card.rank); // A=1, J=11, Q=12, K=13
}
```

**도전 점수** (즉시 적용):

| 결과 | 도전자 | 허풍 플레이어 |
|------|--------|--------------|
| 도전 성공 (허풍 적발) | +3 | -2 |
| 도전 실패 (허풍 통과) | -2 | +3 |

**3라운드 합산 점수가 가장 높은 플레이어가 승리.**

---

## 8. Socket.io 이벤트 명세

### 클라이언트 → 서버 (emit)

| 이벤트 | payload | 설명 |
|--------|---------|------|
| `create_room` | `{ nickname, isPublic }` | 방 생성 |
| `join_room` | `{ roomId, nickname }` | 방 참가 |
| `ready` | — | 준비 완료 토글 |
| `draw_card` | `{ from: 'draw' \| 'discard' }` | 카드 뽑기 |
| `play_cards` | `{ cards: Card[], declaredType: HandType }` | 카드 제출 |
| `pass` | — | 패스 |
| `challenge` | — | 도전 선언 |
| `play_special` | `{ card: Card, payload: object }` | 특수 카드 사용 |
| `send_emoji` | `{ emoji: string }` | 이모지 전송 |
| `send_chat` | `{ message: string }` | 채팅 전송 |

### 서버 → 클라이언트 (on)

| 이벤트 | payload | 설명 |
|--------|---------|------|
| `room_updated` | `GameRoom` | 방 상태 변경 |
| `game_started` | `{ hand: Card[], order: string[] }` | 게임 시작, 초기 손패 지급 |
| `turn_started` | `{ playerId, phase, timer }` | 턴 시작 |
| `card_drawn` | `{ playerId, from, card? }` | 카드 뽑기 결과 (본인만 card 공개) |
| `cards_played` | `{ playedHand: PlayedHand }` | 카드 제출 |
| `challenge_result` | `{ success, actualType, scoreDeltas }` | 도전 결과 |
| `round_ended` | `{ scores, hands }` | 라운드 종료, 점수 |
| `game_ended` | `{ winner, finalScores }` | 게임 종료 |
| `timer_tick` | `{ seconds }` | 타이머 틱 (1초마다) |
| `player_disconnected` | `{ playerId, reconnectDeadline }` | 연결 끊김 |
| `error` | `{ code, message }` | 에러 |

---

## 9. 에러 코드

| code | 상황 |
|------|------|
| `NOT_YOUR_TURN` | 턴이 아닌 플레이어가 액션 시도 |
| `INVALID_CARDS` | 손패에 없는 카드 제출 |
| `INVALID_PHASE` | 현재 phase에서 불가한 액션 |
| `PASS_LIMIT` | 연속 패스 2회 초과 시도 |
| `ROOM_FULL` | 방이 꽉 찬 상태에서 입장 시도 |
| `GAME_IN_PROGRESS` | 게임 중 재접속 아닌 신규 입장 시도 |

---

## 10. UI 화면 구성

### 10-1. 화면 목록

| 화면 | 라우트 | 설명 |
|------|--------|------|
| 메인 | `/` | 닉네임 입력, 플레이 모드 선택 |
| 로비 | `/lobby` | 공개방 목록, 방 만들기 |
| 대기실 | `/room/:roomId` | 참가자 목록, 준비 버튼 |
| 게임 | `/game/:roomId` | 인게임 |
| 결과 | `/result/:roomId` | 최종 점수, 재매칭 |

### 10-2. 게임 화면 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  [상대 닉네임] 손패: ■■■■■■■       [타이머: 20]     │
│                                                     │
│        [ 드로우 파일 ]   [ 버린 파일 (공개) ]        │
│                                                     │
│  ──────────── 테이블 (lastPlay 표시) ──────────────  │
│                                                     │
│  [내 손패: 카드 드래그&드롭 가능]                    │
│                                                     │
│          [내기]    [패스]    [도전!]                 │
│  [이모지: 😎 🤔 😂 😤 👀]   [채팅창]                │
└─────────────────────────────────────────────────────┘
```

### 10-3. 카드 컴포넌트 상태

| 상태 | 표시 |
|------|------|
| 기본 | 정면 표시 |
| 선택됨 | 위로 8px 이동, 테두리 강조 |
| 상대 손패 | 뒷면 (suit/rank 숨김) |
| 버린 파일 | 정면, 스택으로 최상위만 보임 |
| 비활성 | 반투명 (내 턴 아닐 때) |

---

## 11. 서버 룸 관리 (Redis 키 구조)

```
room:{roomId}           → GameRoom JSON (TTL: 2시간)
room:{roomId}:timer     → 남은 초 (TTL: 20초, 턴마다 갱신)
session:{socketId}      → { playerId, roomId } (TTL: 70초)
reconnect:{playerId}    → 재접속 유예 여부 (TTL: 60초)
```

---

## 12. 방 매칭 흐름

```
공개방 빠른 매칭:
1. 클라이언트: emit('join_room', { roomId: 'quick', nickname })
2. 서버: waiting 상태 공개방 조회 → 없으면 자동 생성
3. 4인 OR 30초 경과 시 게임 자동 시작

비공개방:
1. 호스트: emit('create_room', { isPublic: false })
2. 서버: 6자리 roomId 발급 → 클라이언트에 반환
3. 친구: emit('join_room', { roomId: '6자리 코드' })
4. 호스트가 수동으로 게임 시작
```

---

## 13. 개발 마일스톤

| 단계 | 내용 | 산출물 |
|------|------|--------|
| M1 | 카드 데이터 모델 + 덱 셔플/배분 로직 + 점수 계산 함수 | 단위 테스트 통과 |
| M2 | Socket.io 서버 + 룸/턴 관리 + 기본 이벤트 명세 구현 | wscat / Postman 검증 |
| M3 | React 게임 화면 + Phaser 카드 렌더링 + Socket 연동 | 2인 로컬 플레이 가능 |
| M4 | 도전/블러핑 로직 + 특수 카드 + 타이머 + 재접속 처리 | 4인 멀티 정상 동작 |
| M5 | 공개방 매칭 + 방 코드 초대 + 모바일 반응형 + 배포 | 프로덕션 배포 |

---

## 14. 미결 사항 (Open Issues)

- [ ] AI 봇 로직 설계 (싱글 플레이, 홀수 인원 패딩용)
- [ ] 랭킹 / ELO 시스템 도입 여부
- [ ] 도전 가능 시간: 현재 10초 → 조정 필요 여부 확인
- [ ] 4인 게임 시 도전 대상 범위 (직전 플레이어만 vs 모든 플레이어)
- [ ] 특수 카드 HANDOOF 대상 선택 UI 플로우 확정 필요
- [ ] PWA 지원 여부

---

> 궁금한 사항은 기획 담당자에게 문의. 본 문서는 M 단계 완료마다 업데이트됩니다.
