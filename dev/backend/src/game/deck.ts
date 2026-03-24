import { Card, Suit, Rank } from '../types';

let cardIdCounter = 0;

function makeId(prefix: string): string {
  return `${prefix}_${++cardIdCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildDeck(): Card[] {
  const suits: Suit[] = ['spade', 'heart', 'diamond', 'club'];
  const cards: Card[] = [];

  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({
        id: makeId(`${suit}_${rank}`),
        suit,
        rank: rank as Rank,
        isSpecial: false,
      });
    }
  }

  // Jokers
  cards.push({ id: makeId('joker_red'), suit: 'joker', rank: 'red_joker', isSpecial: true });
  cards.push({ id: makeId('joker_red'), suit: 'joker', rank: 'red_joker', isSpecial: true });
  cards.push({ id: makeId('joker_black'), suit: 'joker', rank: 'black_joker', isSpecial: true });
  cards.push({ id: makeId('joker_black'), suit: 'joker', rank: 'black_joker', isSpecial: true });

  // Special
  cards.push({ id: makeId('special_handoof'), suit: 'joker', rank: 'handoof', isSpecial: true });
  cards.push({ id: makeId('special_handoof'), suit: 'joker', rank: 'handoof', isSpecial: true });
  cards.push({ id: makeId('special_nullify'), suit: 'club', rank: 'nullify', isSpecial: true });
  cards.push({ id: makeId('special_nullify'), suit: 'club', rank: 'nullify', isSpecial: true });

  return shuffle(cards); // total 60 cards
}

export function dealHands(
  deck: Card[],
  numPlayers: number,
  handSize: number
): { hands: Card[][]; remaining: Card[] } {
  const d = [...deck];
  const hands: Card[][] = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push(d.splice(0, handSize));
  }
  return { hands, remaining: d };
}
