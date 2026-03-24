import type { Card, Suit } from '../types';

const SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club'];
const RANKS: (1|2|3|4|5|6|7|8|9|10|11|12|13)[] = [1,2,3,4,5,6,7,8,9,10,11,12,13];

let cardIdCounter = 0;

function makeId(): string {
  return `card_${++cardIdCounter}_${Math.random().toString(36).slice(2,6)}`;
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];

  // 52 standard cards
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: makeId(),
        suit,
        rank,
        isSpecial: false,
      });
    }
  }

  // 2 red jokers + 2 black jokers
  deck.push({ id: makeId(), suit: 'joker', rank: 'red_joker', isSpecial: true });
  deck.push({ id: makeId(), suit: 'joker', rank: 'red_joker', isSpecial: true });
  deck.push({ id: makeId(), suit: 'joker', rank: 'black_joker', isSpecial: true });
  deck.push({ id: makeId(), suit: 'joker', rank: 'black_joker', isSpecial: true });

  // 2 handoof + 2 nullify
  deck.push({ id: makeId(), suit: 'joker', rank: 'handoof', isSpecial: true });
  deck.push({ id: makeId(), suit: 'joker', rank: 'handoof', isSpecial: true });
  deck.push({ id: makeId(), suit: 'joker', rank: 'nullify', isSpecial: true });
  deck.push({ id: makeId(), suit: 'joker', rank: 'nullify', isSpecial: true });

  return deck; // total 60 cards
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealHands(deck: Card[], numPlayers: number, cardsEach: number): { hands: Card[][], remaining: Card[] } {
  const shuffled = shuffle(deck);
  const hands: Card[][] = [];
  let idx = 0;
  for (let p = 0; p < numPlayers; p++) {
    hands.push(shuffled.slice(idx, idx + cardsEach));
    idx += cardsEach;
  }
  return { hands, remaining: shuffled.slice(idx) };
}
