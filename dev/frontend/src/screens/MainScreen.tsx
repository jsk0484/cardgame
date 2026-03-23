import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import './MainScreen.css';

const MainScreen: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const setNicknameStore = useGameStore(s => s.setNickname);
  const startGame = useGameStore(s => s.startGame);

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
        <p className="main-subtitle">The Bluffing Card Game</p>

        <div className="main-rules">
          <h3>How to Play</h3>
          <ul>
            <li>Draw 1 card each turn from draw or discard pile</li>
            <li>Play 1–3 cards and declare a hand type</li>
            <li>Opponent can Challenge your declaration</li>
            <li>Bluff caught: challenger +3 / bluffer -2</li>
            <li>Bluff holds: challenger -2 / bluffer +3</li>
            <li>Max 2 consecutive passes</li>
            <li>3 rounds — highest cumulative score wins!</li>
          </ul>
        </div>

        <div className="main-form">
          <input
            type="text"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            className="main-input"
          />
          <button className="btn btn-primary btn-large" onClick={handleStart}>
            ▶ Play vs AI
          </button>
        </div>

        <p className="main-version">60-card deck · Local single-player</p>
      </div>
    </div>
  );
};

export default MainScreen;
