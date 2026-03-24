import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useLangStore } from '../store/langStore';
import { useAuthStore } from '../store/authStore';
import LangToggle from '../components/LangToggle';
import LoginScreen from './LoginScreen';
import ShopScreen from './ShopScreen';
import './MainScreen.css';

interface MainScreenProps {
  onMultiplayer?: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onMultiplayer }) => {
  const [nickname, setNickname] = useState('');
  const [restored, setRestored] = useState(false);
  const [manualLogin, setShowLogin] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const setNicknameStore = useGameStore(s => s.setNickname);
  const startGame = useGameStore(s => s.startGame);
  const t = useLangStore(s => s.t);
  const { user, logout, restore } = useAuthStore();

  // Restore session, then decide whether to show login
  useEffect(() => {
    restore().then(() => setRestored(true));
  }, []);

  // Show login overlay if not logged in yet (after restore attempt), or manually triggered
  const showLogin = (restored && !user) || manualLogin;

  // When logged in, auto-fill nickname from account
  useEffect(() => {
    if (user) setNickname(user.nickname);
  }, [user]);

  const handleStart = () => {
    setNicknameStore(nickname.trim() || (user?.nickname ?? 'Player'));
    startGame();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="main-screen">
      {showLogin && <LoginScreen onBack={() => { setShowLogin(false); }} />}
      {showShop && <ShopScreen onClose={() => setShowShop(false)} />}
      <div className="main-card">
        <div className="main-top-bar">
          <LangToggle />
          {user ? (
            <div className="main-user-bar">
              <span className="main-user-info">
                <span className="main-user-name">{user.nickname}</span>
                <span className="main-user-stat">🏆 {user.wins}승</span>
                <span className="main-user-stat">★ {user.coins}코인</span>
              </span>
              <button className="main-shop-btn" onClick={() => setShowShop(true)}>상점</button>
              <button className="main-user-logout" onClick={logout}>로그아웃</button>
            </div>
          ) : (
            <button className="main-login-btn" onClick={() => setShowLogin(true)}>로그인 / 가입</button>
          )}
        </div>
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

        {/* Combos */}
        <div className="main-rules">
          <h3>{t.combos_title}</h3>
          <div className="main-combo-list">
            {t.combos.map((c, i) => (
              <div key={i} className="main-combo-row">
                <div className="main-combo-info">
                  <span className="main-combo-label">{c.label}</span>
                  <span className="main-combo-desc">{c.desc}</span>
                </div>
                <div className="main-combo-example">
                  {c.example.map((card, j) => (
                    <span key={j} className={`main-mini-card ${getSuitClass(card)}`}>{card}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
          <div className="main-special-list">
            {t.special_cards.map((c, i) => (
              <div key={i} className="main-special-row">
                <div className="main-sc-visual" style={{ '--card-color': c.color } as React.CSSProperties}>
                  <span className="main-sc-rank">{c.rank}</span>
                  <span className="main-sc-suit">★</span>
                </div>
                <div className="main-sc-info">
                  <span className="main-sc-name">{c.name} <span className="main-sc-count">{c.count}</span></span>
                  <span className="main-sc-desc">{c.desc}</span>
                </div>
              </div>
            ))}
          </div>
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
          {onMultiplayer && (
            <button className="btn btn-multiplayer btn-large" onClick={onMultiplayer}>
              Multiplayer
            </button>
          )}
        </div>

        <p className="main-version">{t.deck_info}</p>
      </div>
    </div>
  );
};

function getSuitClass(card: string): string {
  if (card.startsWith('♥') || card.startsWith('♦')) return 'mini-red';
  if (card.startsWith('♣')) return 'mini-green';
  return 'mini-black';
}

export default MainScreen;
