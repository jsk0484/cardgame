import React from 'react';
import { useGameStore } from '../store/gameStore';
import './ResultScreen.css';

const ResultScreen: React.FC = () => {
  const players = useGameStore(s => s.players);
  const gameWinner = useGameStore(s => s.gameWinner);
  const playAgain = useGameStore(s => s.playAgain);
  const setNickname = useGameStore(s => s.setNickname);

  const human = players[0];
  const ai = players[1];
  const humanWon = human.score > ai.score;
  const tie = human.score === ai.score;

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="result-screen">
      <div className="result-card">
        <div className="result-trophy">
          {tie ? '🤝' : humanWon ? '🏆' : '😔'}
        </div>
        <h1 className="result-title">
          {tie ? "It's a Tie!" : `${gameWinner} Wins!`}
        </h1>
        <p className="result-subtitle">Final Scores — 3 Rounds Complete</p>

        <div className="result-scores">
          {sorted.map((player, i) => (
            <div
              key={player.id}
              className={`result-player${i === 0 ? ' result-winner' : ''}`}
            >
              <div className="result-rank">{i === 0 ? '#1' : '#2'}</div>
              <div className="result-player-info">
                <div className="result-player-name">{player.nickname}</div>
                <div className="result-player-tag">{player.id === 'ai' ? 'AI Opponent' : 'You'}</div>
              </div>
              <div className="result-player-score">{player.score} pts</div>
            </div>
          ))}
        </div>

        <div className="result-diff">
          {!tie && (
            <p>
              {humanWon
                ? `You won by ${human.score - ai.score} points!`
                : `AI won by ${ai.score - human.score} points.`}
            </p>
          )}
        </div>

        <div className="result-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={() => {
              setNickname(human.nickname);
              playAgain();
            }}
          >
            Play Again
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
