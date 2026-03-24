import React, { useEffect, useRef } from 'react';
import { useMultiStore } from '../store/multiStore';
import { useAuthStore } from '../store/authStore';
import './MultiResultScreen.css';

interface MultiResultScreenProps {
  onBack: () => void;
}

const MultiResultScreen: React.FC<MultiResultScreenProps> = ({ onBack }) => {
  const { gameWinner, finalScores, myId, disconnect } = useMultiStore();
  const { user, recordWin } = useAuthStore();
  const recordedRef = useRef(false);

  const sorted = [...finalScores].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;
  const myEntry = finalScores.find(p => p.id === myId);
  const iWon = myEntry?.score === topScore && myEntry?.score > 0;
  const isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;

  useEffect(() => {
    if (iWon && !isTie && user && !recordedRef.current) {
      recordedRef.current = true;
      recordWin('multi');
    }
  }, []);

  const handlePlayAgain = () => {
    disconnect();
    // disconnect resets screen to 'lobby' which re-renders LobbyScreen
  };

  const handleMainMenu = () => {
    disconnect();
    onBack();
  };

  return (
    <div className="mresult-screen">
      <div className="mresult-card">
        <div className="mresult-trophy">
          {isTie ? '🤝' : iWon ? '🏆' : '😔'}
        </div>
        <h1 className="mresult-title">
          {isTie ? "It's a Tie!" : gameWinner ? `${gameWinner} Wins!` : 'Game Over'}
        </h1>
        <p className="mresult-subtitle">Final Scores</p>

        <div className="mresult-scores">
          {sorted.map((player, i) => (
            <div
              key={player.id}
              className={`mresult-player${i === 0 && !isTie ? ' mresult-winner' : ''}${player.id === myId ? ' mresult-me' : ''}`}
            >
              <div className="mresult-rank">
                {i === 0 && !isTie ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="mresult-player-info">
                <div className="mresult-player-name">
                  {player.nickname}
                  {player.id === myId && <span className="mresult-you-tag"> (You)</span>}
                </div>
              </div>
              <div className="mresult-player-score">{player.score} pts</div>
            </div>
          ))}
        </div>

        {myEntry && (
          <div className="mresult-my-result">
            {isTie
              ? 'Nobody wins this time...'
              : iWon
              ? 'You won! Great bluffing skills!'
              : `You scored ${myEntry.score} points.`}
          </div>
        )}
        {iWon && !isTie && user && (
          <div className="mresult-reward">★ +50 코인 획득! (총 {user.coins}코인)</div>
        )}
        {iWon && !isTie && !user && (
          <div className="mresult-reward-hint">로그인하면 승리 기록과 코인이 저장됩니다</div>
        )}

        <div className="mresult-actions">
          <button className="mresult-btn mresult-btn-primary" onClick={handlePlayAgain}>
            Play Again
          </button>
          <button className="mresult-btn mresult-btn-secondary" onClick={handleMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiResultScreen;
