import { Card, HandType } from '../types';

export function getCardValue(card: Card): number {
  if (card.isSpecial) return 0;
  const r = card.rank;
  if (r === 'red_joker' || r === 'black_joker') return 15;
  if (typeof r === 'number') return r; // A=1, 2-10 face value, J=11, Q=12, K=13
  return 0;
}

export function isFlush(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  const suits = cards.map(c => c.suit).filter(s => s !== 'joker');
  if (suits.length === 0) return false;
  return suits.every(s => s === suits[0]);
}

export function isStraight(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  const numericRanks = cards
    .map(c => (typeof c.rank === 'number' ? (c.rank as number) : null))
    .filter((r): r is number => r !== null)
    .sort((a, b) => a - b);
  if (numericRanks.length < 3) return false;
  for (let i = 1; i < numericRanks.length; i++) {
    if (numericRanks[i] !== numericRanks[i - 1] + 1) return false;
  }
  return true;
}

export function isTriple(cards: Card[]): boolean {
  if (cards.length !== 3) return false;
  return cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
}

export function determineActualHandType(cards: Card[]): HandType {
  if (cards.length === 1) {
    if (cards[0].isSpecial) return 'special';
    return 'single';
  }
  if (cards.some(c => c.isSpecial)) return 'special';
  if (isTriple(cards)) return 'triple';
  if (isFlush(cards)) return 'flush';
  if (isStraight(cards)) return 'straight';
  return 'single'; // fallback
}

export function calcRoundScore(cards: Card[], isHandout: boolean = false): number {
  let score = cards.reduce((sum, c) => sum + getCardValue(c), 0);
  if (isFlush(cards)) score += 5;
  if (isStraight(cards)) score += 5;
  if (isTriple(cards)) score += 8;
  if (isHandout) score += 10;
  return score;
}

export function applyChallengeScores(
  currentScores: { [playerId: string]: number },
  challengerId: string,
  blufferId: string,
  challengeSuccess: boolean
): { [playerId: string]: number } {
  const updated = { ...currentScores };
  if (challengeSuccess) {
    // Bluff was caught: challenger +3, bluffer -2
    updated[challengerId] = (updated[challengerId] ?? 0) + 3;
    updated[blufferId] = (updated[blufferId] ?? 0) - 2;
  } else {
    // Bluff held (no bluff or challenge failed): challenger -2, bluffer +3
    updated[challengerId] = (updated[challengerId] ?? 0) - 2;
    updated[blufferId] = (updated[blufferId] ?? 0) + 3;
  }
  return updated;
}
