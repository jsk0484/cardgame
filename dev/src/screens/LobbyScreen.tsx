import React, { useState } from 'react';
import { useMultiStore } from '../store/multiStore';
import LangToggle from '../components/LangToggle';
import './LobbyScreen.css';

interface LobbyScreenProps {
  onSinglePlayer: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onSinglePlayer }) => {
  const { nickname, setNickname, createRoom, joinRoom, quickMatch } = useMultiStore();
  const [roomCode, setRoomCode] = useState('');
  const [inputNick, setInputNick] = useState(nickname);

  const handleNick = () => setNickname(inputNick.trim() || 'Player');
  const nickOk = inputNick.trim().length > 0;

  const handleQuickMatch = () => {
    handleNick();
    quickMatch();
  };

  const handleCreate = () => {
    handleNick();
    createRoom(false);
  };

  const handleJoin = () => {
    if (roomCode.length !== 6) return;
    handleNick();
    joinRoom(roomCode);
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-top-bar">
        <LangToggle />
      </div>
      <div className="lobby-card">
        <div className="lobby-logo">
          <span className="lobby-suit">♠</span>
          <span className="lobby-title">HANDOOF</span>
          <span className="lobby-suit">♥</span>
        </div>
        <p className="lobby-subtitle">Multiplayer</p>

        <div className="lobby-nick">
          <input
            className="lobby-input"
            value={inputNick}
            onChange={e => setInputNick(e.target.value)}
            placeholder="Nickname"
            maxLength={20}
            onBlur={handleNick}
            onKeyDown={e => e.key === 'Enter' && handleNick()}
          />
        </div>

        <div className="lobby-actions">
          <button className="btn btn-primary btn-large" onClick={handleQuickMatch} disabled={!nickOk}>
            Quick Match
          </button>

          <div className="lobby-divider">or</div>

          <button className="btn btn-secondary" onClick={handleCreate} disabled={!nickOk}>
            + Create Private Room
          </button>

          <div className="lobby-join">
            <input
              className="lobby-input lobby-code-input"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Room Code (6 chars)"
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button
              className="btn btn-secondary btn-join"
              onClick={handleJoin}
              disabled={roomCode.length !== 6}
            >
              Join
            </button>
          </div>

          <div className="lobby-divider">or</div>

          <button className="btn btn-ghost" onClick={onSinglePlayer}>
            Single Player vs AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
