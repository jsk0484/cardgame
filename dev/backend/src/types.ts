export type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker';
export type Rank = 1|2|3|4|5|6|7|8|9|10|11|12|13 | 'red_joker' | 'black_joker' | 'handoof' | 'nullify';
export type HandType = 'single' | 'flush' | 'straight' | 'triple' | 'special';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type TurnPhase = 'draw' | 'play' | 'challenge' | 'end';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isSpecial: boolean;
}

export interface Player {
  id: string;          // socket ID
  nickname: string;
  hand: Card[];
  handCount: number;
  score: number;
  passStreak: number;
  isConnected: boolean;
}

export interface PlayedHand {
  playerId: string;
  cards: Card[];
  declaredType: HandType;
  actualType: HandType;
  isBluff: boolean;
}

export interface GameRoom {
  roomId: string;
  isPublic: boolean;
  players: Player[];
  status: RoomStatus;
  round: number;
  currentTurn: number;
  phase: TurnPhase;
  drawPile: Card[];
  discardPile: Card[];
  lastPlay: PlayedHand | null;
  turnTimer: number;
  timerInterval: ReturnType<typeof setInterval> | null;
}
