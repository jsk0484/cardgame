import { Card, HandType } from '../types';

export function getCardValue(card: Card): number {
  if (card.isSpecial) return 0;
  const r = card.rank;
  if (r === 'red_joker' || r === 'black_joker') return 15;
  if (typeof r === 'number') return r;
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

export function isStraightFlush(cards: Card[]): boolean {
  return isStraight(cards) && isFlush(cards);
}

export function getComboBonus(type: HandType): number {
  if (type === 'straight_flush') return 15;
  if (type === 'triple') return 8;
  if (type === 'straight') return 5;
  if (type === 'flush') return 3;
  return 0;
}

export function determineActualHandType(cards: Card[]): HandType {
  if (cards.length === 1) {
    if (cards[0].isSpecial) return 'special';
    return 'single';
  }
  if (cards.some(c => c.isSpecial)) return 'special';
  if (isTriple(cards)) return 'triple';
  if (isStraightFlush(cards)) return 'straight_flush';
  if (isFlush(cards)) return 'flush';
  if (isStraight(cards)) return 'straight';
  return 'single';
}

export function calcRoundScore(cards: Card[], isHandout: boolean = false): number {
  if (isHandout) return 5;
  if (cards.length === 0) return 0;
  if (isTriple(cards)) return 8;
  if (isStraightFlush(cards)) return 15;
  if (isFlush(cards)) return 3;
  if (isStraight(cards)) return 5;
  return 0;
}

export function applyChallengeScores(
  currentScores: { [playerId: string]: number },
  challengerId: string,
  blufferId: string,
  challengeSuccess: boolean,
  declaredType: HandType = 'single'
): { [playerId: string]: number } {
  const updated = { ...currentScores };
  if (challengeSuccess) {
    // Bluff caught: challenger +3, bluffer -comboBonus
    const penalty = getComboBonus(declaredType);
    updated[challengerId] = (updated[challengerId] ?? 0) + 3;
    updated[blufferId] = (updated[blufferId] ?? 0) - penalty;
  } else {
    // Challenge failed (honest play): challenger -2 (fixed), honest player +comboBonus
    const bonus = getComboBonus(declaredType);
    updated[challengerId] = (updated[challengerId] ?? 0) - 2;
    updated[blufferId] = (updated[blufferId] ?? 0) + bonus;
  }
  return updated;
}
