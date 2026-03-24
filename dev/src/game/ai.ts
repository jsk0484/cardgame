import type { Card, HandType, PlayedHand } from '../types';
import { determineActualHandType } from './scoring';

const COMBO_TYPES: HandType[] = ['flush', 'straight', 'triple'];

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
 * Only plays 3 regular cards or 1 special card.
 */
export function aiChoosePlay(
  hand: Card[],
  _lastPlay: PlayedHand | null
): { cards: Card[]; declaredType: HandType } | null {
  if (hand.length === 0) return null;

  // Play NL only if last play had a special card; play other specials freely
  const specials = hand.filter(c => c.isSpecial);
  const nlCards = specials.filter(c => c.rank === 'nullify');
  const nonNlSpecials = specials.filter(c => c.rank !== 'nullify');
  const lastHasSpecial = _lastPlay?.cards.some(c => c.isSpecial) ?? false;

  // Use NL to counter a special last play (30% chance)
  if (nlCards.length > 0 && lastHasSpecial && Math.random() < 0.3) {
    return { cards: [nlCards[0]], declaredType: 'special' };
  }
  // Play other specials (HF/BJ/RJ) freely
  if (nonNlSpecials.length > 0 && Math.random() < 0.3) {
    return { cards: [nonNlSpecials[0]], declaredType: 'special' };
  }

  // Need at least 3 non-special cards
  const normals = hand.filter(c => !c.isSpecial);
  if (normals.length < 3) {
    // Only specials left — play one
    if (specials.length > 0) return { cards: [specials[0]], declaredType: 'special' };
    return null;
  }

  // 25% chance to pass
  if (Math.random() < 0.25) return null;

  // Try triples first
  const tripleGroups = findTriples(normals);
  if (tripleGroups.length > 0 && Math.random() < 0.5) {
    const cards = pickRandom(tripleGroups);
    return { cards, declaredType: 'triple' };
  }

  // Try flush or straight
  const flush = findFlush(normals);
  if (flush && Math.random() < 0.5) return { cards: flush, declaredType: 'flush' };
  const straight = findStraight(normals);
  if (straight && Math.random() < 0.5) return { cards: straight, declaredType: 'straight' };

  // Pick any 3 random normals and bluff a combo type
  const indices = getRandomIndices(normals.length, 3);
  const cards = indices.map(i => normals[i]);
  const actual = determineActualHandType(cards);
  // 30% chance to bluff a different combo type
  let declared: HandType = actual === 'single' ? pickRandom(COMBO_TYPES) : actual;
  if (actual !== 'single' && Math.random() < 0.3) {
    declared = pickRandom(COMBO_TYPES.filter(t => t !== actual));
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

function findFlush(hand: Card[]): Card[] | null {
  const bySuit: { [suit: string]: Card[] } = {};
  for (const c of hand) {
    if (!bySuit[c.suit]) bySuit[c.suit] = [];
    bySuit[c.suit].push(c);
  }
  for (const cards of Object.values(bySuit)) {
    if (cards.length >= 3) return cards.slice(0, 3);
  }
  return null;
}

function findStraight(hand: Card[]): Card[] | null {
  const nums = hand
    .filter(c => typeof c.rank === 'number')
    .sort((a, b) => (a.rank as number) - (b.rank as number));
  for (let i = 0; i <= nums.length - 3; i++) {
    if ((nums[i+1].rank as number) === (nums[i].rank as number) + 1 &&
        (nums[i+2].rank as number) === (nums[i].rank as number) + 2) {
      return [nums[i], nums[i+1], nums[i+2]];
    }
  }
  return null;
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
