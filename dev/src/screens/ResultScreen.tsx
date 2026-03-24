import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useLangStore } from '../store/langStore';
import { useAuthStore } from '../store/authStore';
import './ResultScreen.css';

const ResultScreen: React.FC = () => {
  const players = useGameStore(s => s.players);
  const gameWinner = useGameStore(s => s.gameWinner);
  const playAgain = useGameStore(s => s.playAgain);
  const setNickname = useGameStore(s => s.setNickname);
  const t = useLangStore(s => s.t);
  const { user, recordWin } = useAuthStore();
  const recordedRef = useRef(false);

  const human = players[0];
  const ai = players[1];
  const humanWon = human.score > ai.score;
  const tie = human.score === ai.score;

  useEffect(() => {
    if (humanWon && user && !recordedRef.current) {
      recordedRef.current = true;
      recordWin('ai');
    }
  }, []);

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="result-screen">
      <div className="result-card">
        <div className="result-trophy">
          {tie ? '🤝' : humanWon ? '🏆' : '😔'}
        </div>
        <h1 className="result-title">
          {tie ? t.tie : `${gameWinner} ${t.wins}`}
        </h1>
        <p className="result-subtitle">{t.final_scores}</p>

        <div className="result-scores">
          {sorted.map((player, i) => (
            <div
              key={player.id}
              className={`result-player${i === 0 ? ' result-winner' : ''}`}
            >
              <div className="result-rank">{i === 0 ? '#1' : '#2'}</div>
              <div className="result-player-info">
                <div className="result-player-name">{player.nickname}</div>
                <div className="result-player-tag">
                  {player.id === 'ai' ? t.ai_opponent : t.you}
                </div>
              </div>
              <div className="result-player-score">{player.score} pts</div>
            </div>
          ))}
        </div>

        <div className="result-diff">
          {!tie && (
            <p>
              {humanWon
                ? t.won_by(human.score - ai.score)
                : t.lost_by(ai.score - human.score)}
            </p>
          )}
          {humanWon && user && (
            <div className="result-reward">★ +20 코인 획득! (총 {user.coins}코인)</div>
          )}
          {humanWon && !user && (
            <div className="result-reward-hint">로그인하면 승리 기록과 코인이 저장됩니다</div>
          )}
        </div>

        <div className="result-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={() => { setNickname(human.nickname); playAgain(); }}
          >
            {t.play_again}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            {t.main_menu}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
