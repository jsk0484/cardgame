import type { Card, HandType, PlayedHand } from '../types';
import { determineActualHandType } from './scoring';
import { canPlay } from './gameLogic';

const HAND_TYPES: HandType[] = ['single', 'flush', 'straight', 'triple'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * AI decides whether to draw from draw pile (true) or discard pile (false).
 * Prefers discard pile slightly if it has a card.
 */
export function aiChooseDrawSource(discardPile: Card[]): 'draw' | 'discard' {
  if (discardPile.length > 0 && Math.random() < 0.35) return 'discard';
  return 'draw';
}

/**
 * AI picks cards to play from its hand.
 * Returns null if AI decides to pass.
 */
export function aiChoosePlay(
  hand: Card[],
  _lastPlay: PlayedHand | null
): { cards: Card[]; declaredType: HandType } | null {
  if (hand.length === 0) return null;

  // 25% chance to pass
  if (Math.random() < 0.25) return null;

  // Try to find a valid combination to play
  // Attempt triples first if available
  const tripleGroups = findTriples(hand);
  if (tripleGroups.length > 0 && Math.random() < 0.4) {
    const cards = pickRandom(tripleGroups);
    return { cards, declaredType: 'triple' };
  }

  // Try 2-3 card plays
  const numCards = randomInt(1, Math.min(3, hand.length));
  const indices = getRandomIndices(hand.length, numCards);
  const cards = indices.map(i => hand[i]);

  if (!canPlay(cards)) {
    // Fallback: play single card
    return { cards: [hand[0]], declaredType: 'single' };
  }

  const actual = determineActualHandType(cards);
  // Sometimes bluff (declare a different type)
  let declared: HandType = actual;
  if (Math.random() < 0.2 && actual === 'single' && cards.length >= 2) {
    declared = pickRandom(HAND_TYPES.filter(t => t !== actual));
  }

  return { cards, declaredType: declared };
}

/**
 * AI decides whether to challenge the last play.
 * Returns true if AI challenges.
 */
export function aiShouldChallenge(_lastPlay: PlayedHand | null): boolean {
  if (!_lastPlay) return false;
  return Math.random() < 0.20; // 20% challenge rate
}

function findTriples(hand: Card[]): Card[][] {
  const groups: { [rank: string]: Card[] } = {};
  for (const card of hand) {
    const key = String(card.rank);
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }
  return Object.values(groups).filter(g => g.length >= 3).map(g => g.slice(0, 3));
}

function getRandomIndices(max: number, count: number): number[] {
  const indices: number[] = [];
  const pool = Array.from({ length: max }, (_, i) => i);
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    indices.push(pool.splice(idx, 1)[0]);
  }
  return indices;
}
