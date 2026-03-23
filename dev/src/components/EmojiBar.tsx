import React, { useState } from 'react';
import './EmojiBar.css';

const EMOJIS = ['😎', '🤔', '😂', '😤', '👀'];

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
        {EMOJIS.map(e => (
          <button key={e} className="emoji-btn" onClick={() => handleClick(e)}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiBar;
