import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useLangStore } from '../store/langStore';
import './MainScreen.css';

const MainScreen: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const setNicknameStore = useGameStore(s => s.setNickname);
  const startGame = useGameStore(s => s.startGame);
  const t = useLangStore(s => s.t);

  const handleStart = () => {
    setNicknameStore(nickname.trim() || 'Player');
    startGame();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="main-screen">
      <div className="main-card">
        <div className="main-logo">
          <span className="logo-suit">♠</span>
          <span className="logo-title">HANDOOF</span>
          <span className="logo-suit">♥</span>
        </div>
        <p className="main-subtitle">{t.subtitle}</p>

        {/* How to Play */}
        <div className="main-rules">
          <h3>{t.rules_title}</h3>
          <ul>
            {t.rules.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        {/* Scoring */}
        <div className="main-rules">
          <h3>{t.scoring_title}</h3>
          <ul>
            {t.scoring.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        {/* Special Cards */}
        <div className="main-rules">
          <h3>{t.special_title}</h3>
          <ul>
            {t.special.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        <div className="main-form">
          <input
            type="text"
            placeholder={t.nickname_placeholder}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            className="main-input"
          />
          <button className="btn btn-primary btn-large" onClick={handleStart}>
            {t.play_vs_ai}
          </button>
        </div>

        <p className="main-version">{t.deck_info}</p>
      </div>
    </div>
  );
};

export default MainScreen;
