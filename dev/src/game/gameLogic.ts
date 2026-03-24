import type { Card, Player, PlayedHand, HandType, GamePhase } from '../types';
import { determineActualHandType } from './scoring';

export const PLAY_TIMER = 20;
export const CHALLENGE_TIMER = 10;
export const MAX_PASS_STREAK = 2;
export const TOTAL_ROUNDS = 3;
export const INITIAL_HAND_SIZE = 7;

export function canPlay(cards: Card[]): boolean {
  if (cards.length === 1) return cards[0].isSpecial; // 1장은 특수카드만
  return cards.length === 3;
}

function countMatchesDeclared(count: number, declaredType: HandType): boolean {
  if (declaredType === 'single') return count === 1;
  if (declaredType === 'special') return true;
  return count === 3; // triple, flush, straight
}

export function buildPlayedHand(
  playerId: string,
  cards: Card[],
  declaredType: HandType
): PlayedHand {
  const hasRedJoker = cards.some(c => c.rank === 'red_joker');
  const actualType = determineActualHandType(cards);
  const isBluff = hasRedJoker
    ? false
    : !countMatchesDeclared(cards.length, declaredType) || declaredType !== actualType;
  return { playerId, cards, declaredType, actualType, isBluff };
}

export function shouldEndRound(hand: Card[], drawPile: Card[]): boolean {
  return hand.length === 0 || drawPile.length === 0;
}

export function getNextTurn(current: number, numPlayers: number): number {
  return (current + 1) % numPlayers;
}

export function getPhaseTimer(phase: GamePhase): number {
  if (phase === 'play') return PLAY_TIMER;
  if (phase === 'challenge') return CHALLENGE_TIMER;
  return 0;
}

export function isGameOver(_players: Player[], round: number): boolean {
  return round > TOTAL_ROUNDS;
}

export function getWinner(players: Player[]): Player {
  return players.reduce((best, p) => (p.score > best.score ? p : best), players[0]);
}
