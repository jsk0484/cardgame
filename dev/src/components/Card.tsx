import React from 'react';
import type { Card as CardType } from '../types';
import './Card.css';

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
  joker: '★',
};

const SUIT_COLORS: Record<string, string> = {
  spade: 'black',
  heart: 'red',
  diamond: '#cc8800',
  club: 'green',
  joker: 'purple',
};

function getRankDisplay(card: CardType): string {
  if (card.rank === 'red_joker') return 'RJ';
  if (card.rank === 'black_joker') return 'BJ';
  if (card.rank === 'handoof') return 'HF';
  if (card.rank === 'nullify') return 'NL';
  if (card.rank === 1) return 'A';
  if (card.rank === 11) return 'J';
  if (card.rank === 12) return 'Q';
  if (card.rank === 13) return 'K';
  return String(card.rank);
}

const CardComponent: React.FC<CardProps> = ({ card, faceDown = false, selected = false, onClick, small = false }) => {
  if (faceDown) {
    return (
      <div
        className={`card card-back${small ? ' card-small' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="card-back-pattern">🂠</div>
      </div>
    );
  }

  const suitColor = SUIT_COLORS[card.suit] || 'black';
  const rankDisplay = getRankDisplay(card);
  const suitSymbol = SUIT_SYMBOLS[card.suit] || '?';

  return (
    <div
      className={`card card-face${selected ? ' card-selected' : ''}${small ? ' card-small' : ''}${card.isSpecial ? ' card-special' : ''}`}
      style={{ '--suit-color': suitColor } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="card-corner card-corner-tl">
        <span className="card-rank">{rankDisplay}</span>
        <span className="card-suit-symbol">{suitSymbol}</span>
      </div>
      <div className="card-center-symbol">{suitSymbol}</div>
      <div className="card-corner card-corner-br">
        <span className="card-rank">{rankDisplay}</span>
        <span className="card-suit-symbol">{suitSymbol}</span>
      </div>
    </div>
  );
};

export default CardComponent;
