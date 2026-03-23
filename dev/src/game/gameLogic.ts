import type { Card, Player, PlayedHand, HandType, GamePhase } from '../types';
import { determineActualHandType } from './scoring';

export const PLAY_TIMER = 20;
export const CHALLENGE_TIMER = 10;
export const MAX_PASS_STREAK = 2;
export const TOTAL_ROUNDS = 3;
export const INITIAL_HAND_SIZE = 7;

export function canPlay(cards: Card[]): boolean {
  return cards.length >= 1 && cards.length <= 3;
}

export function buildPlayedHand(
  playerId: string,
  cards: Card[],
  declaredType: HandType
): PlayedHand {
  const actualType = determineActualHandType(cards);
  const isBluff = declaredType !== actualType;
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
