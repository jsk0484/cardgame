import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { SHOP_ITEMS, DEFAULT_EMOJIS } from '../store/shopItems';
import './EmojiBar.css';

interface FloatingEmoji {
  id: number;
  emoji: string;
  fromAi: boolean;
}

interface Props {
  onSend?: (emoji: string) => void;
  aiEmoji?: string | null;
}

let emojiIdCounter = 0;

const EmojiBar: React.FC<Props> = ({ onSend, aiEmoji }) => {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const ownedItems = useAuthStore(s => s.user?.ownedItems ?? []);

  // Default emojis + purchased emotes
  const purchasedEmojis = SHOP_ITEMS
    .filter(item => item.type === 'emote' && ownedItems.includes(item.id))
    .map(item => item.emoji!);
  const allEmojis = [...DEFAULT_EMOJIS, ...purchasedEmojis];

  const handleClick = (emoji: string) => {
    const id = ++emojiIdCounter;
    setFloating(prev => [...prev, { id, emoji, fromAi: false }]);
    setTimeout(() => setFloating(prev => prev.filter(e => e.id !== id)), 1800);
    onSend?.(emoji);
  };

  React.useEffect(() => {
    if (!aiEmoji) return;
    const id = ++emojiIdCounter;
    setFloating(prev => [...prev, { id, emoji: aiEmoji, fromAi: true }]);
    setTimeout(() => setFloating(prev => prev.filter(e => e.id !== id)), 1800);
  }, [aiEmoji]);

  return (
    <div className="emoji-bar">
      <div className="emoji-floating-area">
        {floating.map(f => (
          <span key={f.id} className={`emoji-float ${f.fromAi ? 'emoji-float-ai' : 'emoji-float-player'}`}>
            {f.emoji}
          </span>
        ))}
      </div>
      <div className="emoji-buttons">
        {allEmojis.map((e, i) => (
          <button key={i} className="emoji-btn" onClick={() => handleClick(e)}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiBar;
