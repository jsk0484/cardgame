export type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker';
export type Rank =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
  | 'red_joker' | 'black_joker' | 'handoof' | 'nullify';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isSpecial: boolean;
}

export interface Player {
  id: string;
  nickname: string;
  hand: Card[];
  handCount: number;
  score: number;
  passStreak: number;
  isConnected: boolean;
}

export type HandType = 'single' | 'flush' | 'straight' | 'triple' | 'straight_flush' | 'special';

export interface PlayedHand {
  playerId: string;
  cards: Card[];
  declaredType: HandType;
  actualType: HandType;
  isBluff: boolean;
}

export type GamePhase = 'draw' | 'play' | 'nl_counter' | 'challenge' | 'end';
export type GameScreen = 'main' | 'game' | 'result';

export interface GameState {
  screen: GameScreen;
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  lastPlay: PlayedHand | null;
  round: number;
  currentTurn: number; // index into players array
  phase: GamePhase;
  timer: number;
  selectedCards: string[]; // card ids selected by human player
  declaredHandType: HandType;
  roundWinner: string | null;
  gameWinner: string | null;
  message: string;
  challengeResult: ChallengeResult | null;
}

export interface ChallengeResult {
  success: boolean; // challenger succeeded
  challengerId: string;
  blufferId: string;
  message: string;
}

export interface PlayLogEntry {
  id: number;
  round: number;
  playerName: string;
  declaredType: string;
  cardCount: number;
  cards: Card[];
  challenged: boolean | null;
  challengeSuccess: boolean | null;
  delta: number | null;
  // Score changes for all affected players
  deltas?: Array<{ name: string; delta: number }>;
}
