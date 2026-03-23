import React from 'react';
import { useMultiStore } from '../store/multiStore';
import './WaitingScreen.css';

const WaitingScreen: React.FC = () => {
  const { roomId, players, myId, startGame, disconnect } = useMultiStore();
  const isHost = players[0]?.id === myId;

  const handleCopyCode = () => {
    if (roomId) navigator.clipboard.writeText(roomId).catch(() => {});
  };

  return (
    <div className="waiting-screen">
      <div className="waiting-card">
        <h2 className="waiting-title">Waiting Room</h2>

        <div className="waiting-code-area">
          <div className="waiting-code-label">Room Code</div>
          <div className="waiting-code" onClick={handleCopyCode} title="Click to copy">
            {roomId ?? '------'}
          </div>
          <p className="waiting-hint">Share this code with friends to join</p>
        </div>

        <div className="waiting-players">
          {players.map((p, i) => (
            <div key={p.id} className={`waiting-player${!p.isConnected ? ' waiting-player-dc' : ''}`}>
              <span className="waiting-player-num">{i + 1}</span>
              <span className="waiting-player-name">{p.nickname}</span>
              <span className="waiting-player-badges">
                {i === 0 && <span className="badge badge-host">HOST</span>}
                {p.id === myId && <span className="badge badge-you">YOU</span>}
                {!p.isConnected && <span className="badge badge-dc">DC</span>}
              </span>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="waiting-player waiting-player-empty">
              <span className="waiting-player-num">{players.length + i + 1}</span>
              <span className="waiting-player-name">Waiting for player...</span>
            </div>
          ))}
        </div>

        <div className="waiting-actions">
          {isHost && players.length >= 2 && (
            <button className="btn btn-primary btn-large" onClick={startGame}>
              Start Game
            </button>
          )}
          {isHost && players.length < 2 && (
            <p className="waiting-need-more">Need at least 2 players to start</p>
          )}
          {!isHost && (
            <p className="waiting-need-more">Waiting for host to start the game...</p>
          )}
          <button className="btn btn-secondary" onClick={disconnect}>
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingScreen;
