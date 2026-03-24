import React from 'react';
import type { PlayedHand, ChallengeResult } from '../types';
import CardComponent from './Card';
import { useLangStore } from '../store/langStore';
import './PlayArea.css';

interface PlayAreaProps {
  lastPlay: PlayedHand | null;
  playerName?: string;
  aiName?: string;
  challengeResult?: ChallengeResult | null;
}

const PlayArea: React.FC<PlayAreaProps> = ({ lastPlay, playerName = 'Player', aiName = 'AI', challengeResult }) => {
  const t = useLangStore(s => s.t);
  const isSpecialPlay = lastPlay?.cards?.some(c => c.isSpecial) || lastPlay?.declaredType === 'special';
  const revealed = !!challengeResult || isSpecialPlay;
  const declaredLabel = t.hand_types[lastPlay?.declaredType as keyof typeof t.hand_types] ?? lastPlay?.declaredType ?? '';

  return (
    <div className="play-area">
      <div className="play-area-label">{t.last_play}</div>
      {lastPlay ? (
        <div className="play-area-content">
          <div className="play-area-player">
            {lastPlay.playerId === 'human' ? playerName : aiName}{' '}
            <span className="declared-label">{t.declared_label}</span>{' '}
            <span className="declared-type">{declaredLabel}</span>
          </div>
          {revealed && lastPlay.cards?.length > 0 ? (
            <div className="play-area-cards">
              {lastPlay.cards.map(card => (
                <CardComponent key={card.id} card={card} small />
              ))}
            </div>
          ) : !revealed ? (
            <div className="play-area-hidden">
              <div className="card-back-unknown">?</div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="play-area-empty">{t.no_play_yet}</div>
      )}
    </div>
  );
};

export default PlayArea;
