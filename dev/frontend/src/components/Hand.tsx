import React from 'react';
import type { Card as CardType } from '../types';
import CardComponent from './Card';
import './Hand.css';

interface HandProps {
  cards: CardType[];
  selectedIds?: string[];
  onSelectCard?: (cardId: string) => void;
  faceDown?: boolean;
  label?: string;
}

const Hand: React.FC<HandProps> = ({ cards, selectedIds = [], onSelectCard, faceDown = false, label }) => {
  return (
    <div className="hand-container">
      {label && <div className="hand-label">{label} ({cards.length} cards)</div>}
      <div className="hand-cards">
        {cards.length === 0 && <div className="hand-empty">No cards</div>}
        {cards.map(card => (
          <CardComponent
            key={card.id}
            card={card}
            faceDown={faceDown}
            selected={!faceDown && selectedIds.includes(card.id)}
            onClick={onSelectCard ? () => onSelectCard(card.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default Hand;
