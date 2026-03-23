import React from 'react';
import type { Card as CardType } from '../types';
import CardComponent from './Card';
import './Pile.css';

interface PileProps {
  cards: CardType[];
  label: string;
  faceDown?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const Pile: React.FC<PileProps> = ({ cards, label, faceDown = false, onClick, disabled = false }) => {
  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;

  return (
    <div className={`pile-container${disabled ? ' pile-disabled' : ''}`} onClick={disabled ? undefined : onClick}>
      <div className="pile-label">{label}</div>
      <div className="pile-card-area">
        {topCard ? (
          <div className="pile-stack">
            {cards.length > 2 && <div className="pile-shadow pile-shadow-3" />}
            {cards.length > 1 && <div className="pile-shadow pile-shadow-2" />}
            <CardComponent card={topCard} faceDown={faceDown} onClick={onClick && !disabled ? onClick : undefined} />
          </div>
        ) : (
          <div className="pile-empty">
            <span>Empty</span>
          </div>
        )}
      </div>
      <div className="pile-count">{cards.length} card{cards.length !== 1 ? 's' : ''}</div>
    </div>
  );
};

export default Pile;
