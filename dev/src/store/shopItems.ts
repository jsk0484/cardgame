export interface ShopItem {
  id: string;
  type: 'card_back' | 'card_emoji';
  name: string;
  price: number;
  backStyle?: string; // CSS background for card backs
  emoji?: string;     // emoji character for card_emoji items
}

export const SHOP_ITEMS: ShopItem[] = [
  // ── 카드 뒷면 ──────────────────────────────────────────────
  {
    id: 'back_red',
    type: 'card_back',
    name: '레드 뒷면',
    price: 100,
    backStyle: 'repeating-linear-gradient(45deg,#6a1a1a,#6a1a1a 4px,#c0392b 4px,#c0392b 8px)',
  },
  {
    id: 'back_forest',
    type: 'card_back',
    name: '포레스트 뒷면',
    price: 100,
    backStyle: 'repeating-linear-gradient(45deg,#1a4a1a,#1a4a1a 4px,#27ae60 4px,#27ae60 8px)',
  },
  {
    id: 'back_galaxy',
    type: 'card_back',
    name: '갤럭시 뒷면',
    price: 200,
    backStyle: 'linear-gradient(135deg,#0a0a2a 0%,#1a0a4a 40%,#3a0a6a 70%,#6a0a8a 100%)',
  },
  {
    id: 'back_gold',
    type: 'card_back',
    name: '골드 뒷면',
    price: 300,
    backStyle: 'repeating-linear-gradient(45deg,#5a3a00,#5a3a00 4px,#c9920a 4px,#c9920a 8px)',
  },
  {
    id: 'back_ocean',
    type: 'card_back',
    name: '오션 뒷면',
    price: 150,
    backStyle: 'linear-gradient(135deg,#003366 0%,#006699 50%,#0099cc 100%)',
  },
  {
    id: 'back_pink',
    type: 'card_back',
    name: '핑크 뒷면',
    price: 150,
    backStyle: 'repeating-linear-gradient(45deg,#6a1a4a,#6a1a4a 4px,#e91e8c 4px,#e91e8c 8px)',
  },

  // ── 카드 이모지 ──────────────────────────────────────────────
  { id: 'emoji_fire',      type: 'card_emoji', name: '불꽃',  price: 50,  emoji: '🔥' },
  { id: 'emoji_star',      type: 'card_emoji', name: '별',    price: 50,  emoji: '⭐' },
  { id: 'emoji_diamond',   type: 'card_emoji', name: '다이아', price: 75,  emoji: '💎' },
  { id: 'emoji_lightning', type: 'card_emoji', name: '번개',  price: 75,  emoji: '⚡' },
  { id: 'emoji_moon',      type: 'card_emoji', name: '달',    price: 75,  emoji: '🌙' },
  { id: 'emoji_cherry',    type: 'card_emoji', name: '벚꽃',  price: 100, emoji: '🌸' },
  { id: 'emoji_crown',     type: 'card_emoji', name: '왕관',  price: 150, emoji: '👑' },
  { id: 'emoji_rainbow',   type: 'card_emoji', name: '무지개', price: 200, emoji: '🌈' },
];

export function getItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.id === id);
}
