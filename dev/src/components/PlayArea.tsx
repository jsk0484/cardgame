import React from 'react';
import type { PlayedHand, ChallengeResult, GamePhase } from '../types';
import CardComponent from './Card';
import './PlayArea.css';

interface PlayAreaProps {
  lastPlay: PlayedHand | null;
  playerName?: string;
  aiName?: string;
  phase?: GamePhase;
  challengeResult?: ChallengeResult | null;
}

const PlayArea: React.FC<PlayAreaProps> = ({ lastPlay, playerName = 'Player', aiName = 'AI', phase, challengeResult }) => {
  const revealed = !!challengeResult || phase === 'end';

  return (
    <div className="play-area">
      <div className="play-area-label">Last Play</div>
      {lastPlay ? (
        <div className="play-area-content">
          <div className="play-area-player">
            {lastPlay.playerId === 'human' ? playerName : aiName} declared:{' '}
            <span className="declared-type">{lastPlay.declaredType}</span>
            {' '}· {lastPlay.cards.length} card(s)
          </div>
          {revealed ? (
            <div className="play-area-cards">
              {lastPlay.cards.map(card => (
                <CardComponent key={card.id} card={card} small />
              ))}
            </div>
          ) : (
            <div className="play-area-hidden">
              {lastPlay.cards.map((_, i) => (
                <div key={i} className="card-back-small" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="play-area-empty">No cards played yet</div>
      )}
    </div>
  );
};

export default PlayArea;
