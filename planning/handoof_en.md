# HANDOOF - Web Multiplayer Card Game Design Document

> Version: v0.2 | Date: 2026-03-23 | Audience: Frontend / Backend Developers

---

## 1. Project Overview

| Field | Detail |
|-------|--------|
| Title | HANDOOF |
| Genre | Real-time Multiplayer Card Game |
| Platform | Web Browser (PC / Mobile Responsive) |
| Players | 2 – 4 |
| Session Length | ~15 – 30 min (best of 3 rounds) |
| Target Audience | Late teens – 30s, casual card game fans |

---

## 2. Game Concept

HANDOOF is a card game built on **Hand Management** and **Bluffing**.
- Each player holds 7 cards and forms combinations to score points.
- When playing cards, the declared combination type may be a lie — opponents can call a **Challenge** to verify it.
- Discarded cards become public information and can be picked up by any opponent.

---

## 3. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + TypeScript | Vite bundler |
| Game Rendering | Phaser.js 3 | Card animations, drag & drop |
| State Management | Zustand | Global game state |
| Realtime | Socket.io (WebSocket) | Client ↔ Server sync |
| Backend | Node.js 20 + Express | REST API + Socket.io server |
| Room Management | Redis | Room state, turn timer, sessions |
| Database | PostgreSQL | User data, score history |
| Deploy | Vercel (FE) + Railway (BE) | |

---

## 4. Data Models

### 4-1. Card

```ts
type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
           | 'red_joker' | 'black_joker' | 'handoof' | 'nullify';

interface Card {
  id: string;        // e.g. "spade_7", "joker_red_0"
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
  hand: Card[];         // visible to self only (server filters before broadcast)
  handCount: number;    // visible to all opponents
  score: number;        // cumulative score across rounds
  passStreak: number;   // consecutive pass count (max 2)
  isConnected: boolean;
}
```

### 4-3. GameRoom

```ts
type RoomStatus = 'waiting' | 'playing' | 'finished';
type TurnPhase  = 'draw' | 'play' | 'challenge' | 'end';

interface GameRoom {
  roomId: string;           // 6-character code
  isPublic: boolean;
  players: Player[];        // max 4
  spectators: string[];     // socket IDs
  status: RoomStatus;
  round: number;            // 1 – 3
  currentTurn: number;      // index into players[]
  phase: TurnPhase;
  drawPile: Card[];         // face-down deck
  discardPile: Card[];      // face-up discard stack
  lastPlay: PlayedHand | null;
  turnTimer: number;        // seconds remaining (server-authoritative)
}
```

### 4-4. PlayedHand

```ts
type HandType = 'single' | 'flush' | 'straight' | 'triple' | 'special';

interface PlayedHand {
  playerId: string;
  cards: Card[];
  declaredType: HandType;   // what the player claimed
  actualType: HandType;     // real combination (revealed on Challenge)
  isBluff: boolean;         // declaredType !== actualType
}
```

---

## 5. Card Composition

### 5-1. Base Deck (60 cards total)

| Group | Count |
|-------|-------|
| Standard cards (4 suits × 13 ranks) | 52 |
| Jokers | 4 |
| Special cards | 4 |
| **Total** | **60** |

| Suit | Color | Theme |
|------|-------|-------|
| spade | Black | Attack |
| heart | Red | Recovery |
| diamond | Gold | Score |
| club | Green | Disruption |

### 5-2. Special Cards

| id | Count | Effect | Server Event |
|----|-------|--------|--------------|
| `handoof` | 2 | Swap entire hand with a chosen opponent | `emit('swap_hand', { targetId })` |
| `nullify` | 2 | Invalidate `lastPlay`; those cards go to the bottom of the draw pile | `emit('nullify_play')` |

### 5-3. Jokers

| id | Effect | Server Event |
|----|--------|--------------|
| `red_joker` | Freely declare any suit and rank when played | `emit('play_joker', { declaredSuit, declaredRank })` |
| `black_joker` | Steal 1 random card from a chosen opponent's hand | `emit('steal_card', { targetId })` |

---

## 6. Game Flow & State Transitions

```
WAITING ──(all ready)──► PLAYING
                             │
               ┌─────────────▼───────────────┐
               │          Round Loop          │
               │                             │
               │  [DRAW phase]               │
               │   ├─ draw from draw pile    │
               │   └─ draw from discard pile │
               │          ↓                  │
               │  [PLAY phase – 20 sec]      │
               │   ├─ submit 1–3 cards       │
               │   └─ pass (max 2 in a row)  │
               │          ↓                  │
               │  [CHALLENGE phase – 10 sec] │
               │   ├─ declare "Challenge!"   │
               │   └─ pass                   │
               │          ↓                  │
               │  [END phase]                │
               │   └─ advance to next turn   │
               └─────────────────────────────┘
                             │
               (hand reaches 0 OR draw pile empty)
                             ↓
                      Round Score Calc
                             │
                    (after round 3)
                             ↓
                         FINISHED
```

---

## 7. Scoring Logic

Scores are calculated **server-side** at round end and broadcast to all clients.

```ts
function calcRoundScore(player: Player, isHandout: boolean): number {
  const hand = player.hand;
  let score = hand.reduce((sum, c) => sum + getCardValue(c), 0);

  if (isFlush(hand))    score += 5;   // 3+ cards of the same suit
  if (isStraight(hand)) score += 5;   // 3+ consecutive ranks
  if (isTriple(hand))   score += 8;   // 3 cards of the same rank
  if (isHandout)        score += 10;  // first player to empty their hand

  return score;
}

function getCardValue(card: Card): number {
  if (card.isSpecial) return 0;
  if (card.rank === 'red_joker' || card.rank === 'black_joker') return 15;
  return Number(card.rank); // A=1, J=11, Q=12, K=13
}
```

**Challenge scores** (applied immediately):

| Outcome | Challenger | Bluffer |
|---------|-----------|---------|
| Challenge succeeds (bluff caught) | +3 | -2 |
| Challenge fails (bluff holds) | -2 | +3 |

**Winner**: highest cumulative score after 3 rounds.

---

## 8. Socket.io Event Spec

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ nickname, isPublic }` | Create a new room |
| `join_room` | `{ roomId, nickname }` | Join existing room |
| `ready` | — | Toggle ready state |
| `draw_card` | `{ from: 'draw' \| 'discard' }` | Draw a card |
| `play_cards` | `{ cards: Card[], declaredType: HandType }` | Submit cards |
| `pass` | — | Pass turn |
| `challenge` | — | Declare a challenge |
| `play_special` | `{ card: Card, payload: object }` | Use a special card |
| `send_emoji` | `{ emoji: string }` | Send quick emoji |
| `send_chat` | `{ message: string }` | Send chat message |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room_updated` | `GameRoom` | Room state changed |
| `game_started` | `{ hand: Card[], order: string[] }` | Game begins, initial hand dealt |
| `turn_started` | `{ playerId, phase, timer }` | New turn begins |
| `card_drawn` | `{ playerId, from, card? }` | Draw result (card visible to owner only) |
| `cards_played` | `{ playedHand: PlayedHand }` | Cards submitted to table |
| `challenge_result` | `{ success, actualType, scoreDeltas }` | Challenge resolved |
| `round_ended` | `{ scores, hands }` | Round finished |
| `game_ended` | `{ winner, finalScores }` | Game finished |
| `timer_tick` | `{ seconds }` | Timer update (every 1 sec) |
| `player_disconnected` | `{ playerId, reconnectDeadline }` | Player lost connection |
| `error` | `{ code, message }` | Error response |

---

## 9. Error Codes

| Code | Condition |
|------|-----------|
| `NOT_YOUR_TURN` | Action attempted outside of player's turn |
| `INVALID_CARDS` | Submitted cards not present in hand |
| `INVALID_PHASE` | Action not allowed in current phase |
| `PASS_LIMIT` | Attempted to pass more than 2 turns in a row |
| `ROOM_FULL` | Joining a room that already has 4 players |
| `GAME_IN_PROGRESS` | New join (not reconnect) while game is running |

---

## 10. UI Screens

### 10-1. Screen List

| Screen | Route | Description |
|--------|-------|-------------|
| Main | `/` | Enter nickname, choose play mode |
| Lobby | `/lobby` | Public room list, create room |
| Waiting Room | `/room/:roomId` | Player list, ready button |
| Game | `/game/:roomId` | In-game view |
| Result | `/result/:roomId` | Final scores, rematch option |

### 10-2. Game Screen Layout

```
┌─────────────────────────────────────────────────────┐
│  [Opponent Nickname]  Hand: ■■■■■■■   [Timer: 20]   │
│                                                     │
│        [ Draw Pile ]       [ Discard Pile (open) ]  │
│                                                     │
│  ───────────── Table (lastPlay displayed) ─────────  │
│                                                     │
│  [ My Hand: drag & drop to select cards ]           │
│                                                     │
│          [Play]      [Pass]      [Challenge!]        │
│  [Emoji: 😎 🤔 😂 😤 👀]        [Chat]              │
└─────────────────────────────────────────────────────┘
```

### 10-3. Card Component States

| State | Visual |
|-------|--------|
| Default | Face-up |
| Selected | Shifted up 8px, highlighted border |
| Opponent hand | Face-down (suit/rank hidden) |
| Discard pile | Face-up, stacked — only top card visible |
| Inactive | Semi-transparent (not player's turn) |

---

## 11. Redis Key Structure

```
room:{roomId}           → GameRoom JSON         (TTL: 2 hours)
room:{roomId}:timer     → seconds remaining     (TTL: 20s, reset each turn)
session:{socketId}      → { playerId, roomId }  (TTL: 70s)
reconnect:{playerId}    → reconnect grace flag  (TTL: 60s)
```

---

## 12. Matchmaking Flow

```
Quick Match (public room):
1. Client:  emit('join_room', { roomId: 'quick', nickname })
2. Server:  find waiting public room → create one if none exists
3. Auto-start when 4 players join OR after 30-second timeout

Private Room:
1. Host:    emit('create_room', { isPublic: false })
2. Server:  generate 6-char roomId → return to host
3. Friend:  emit('join_room', { roomId: '<6-char code>' })
4. Host manually triggers game start
```

---

## 13. Development Milestones

| Milestone | Scope | Deliverable |
|-----------|-------|-------------|
| M1 | Card data model + deck shuffle/deal + score calculation functions | Unit tests passing |
| M2 | Socket.io server + room/turn management + full event spec implemented | Verified via wscat / Postman |
| M3 | React game screen + Phaser card rendering + Socket integration | 2-player local game playable |
| M4 | Challenge/bluffing logic + special cards + timer + reconnect handling | 4-player multiplayer stable |
| M5 | Public matchmaking + room code invite + mobile responsive + deployment | Production live |

---

## 14. Open Issues

- [ ] AI bot logic design (single-player mode / odd-player padding)
- [ ] Ranking / ELO system — decision pending
- [ ] Challenge window duration: 10 sec — confirm or adjust
- [ ] In 4-player games: can any player challenge, or only the next player?
- [ ] HANDOOF special card target selection UI flow — needs UX confirmation
- [ ] PWA support consideration

---

> Questions? Contact the lead designer. This document is updated at the end of each milestone.
