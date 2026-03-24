export interface ShopItem {
  id: string;
  type: 'card_back' | 'emote';
  name: string;
  price: number;
  backStyle?: string; // CSS background for card backs
  emoji?: string;     // emoji character for emotes
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

  // ── 감정 이모지 (EmojiBar용) ────────────────────────────────
  { id: 'emote_devil',   type: 'emote', name: '악마',  price: 75,  emoji: '😈' },
  { id: 'emote_party',   type: 'emote', name: '파티',  price: 50,  emoji: '🥳' },
  { id: 'emote_sleep',   type: 'emote', name: '졸음',  price: 50,  emoji: '😴' },
  { id: 'emote_skull',   type: 'emote', name: '해골',  price: 75,  emoji: '💀' },
  { id: 'emote_clown',   type: 'emote', name: '광대',  price: 100, emoji: '🤡' },
  { id: 'emote_cry',     type: 'emote', name: '울음',  price: 50,  emoji: '😭' },
  { id: 'emote_sparkle', type: 'emote', name: '반짝',  price: 75,  emoji: '🤩' },
  { id: 'emote_cold',    type: 'emote', name: '냉동',  price: 75,  emoji: '🥶' },
  { id: 'emote_mind',    type: 'emote', name: '폭발',  price: 100, emoji: '🤯' },
  { id: 'emote_mask',    type: 'emote', name: '마스크', price: 150, emoji: '🎭' },
];

export function getItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.id === id);
}

// Default emojis always available (free)
export const DEFAULT_EMOJIS = ['😎', '🤔', '😂', '😤', '👀'];
