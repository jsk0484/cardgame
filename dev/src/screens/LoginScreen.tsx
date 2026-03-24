import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import './LoginScreen.css';

interface LoginScreenProps {
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const { login, register, loading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    clearError();
    let ok = false;
    if (mode === 'login') {
      ok = await login(username.trim(), password);
    } else {
      ok = await register(username.trim(), password, nickname.trim() || username.trim());
    }
    if (ok) onBack();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const switchMode = () => {
    clearError();
    setMode(m => m === 'login' ? 'register' : 'login');
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">♠ HANDOOF ♥</div>
        <div className="login-tabs">
          <button className={`login-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { clearError(); setMode('login'); }}>로그인</button>
          <button className={`login-tab${mode === 'register' ? ' active' : ''}`} onClick={() => { clearError(); setMode('register'); }}>회원가입</button>
        </div>

        <div className="login-form">
          <input
            className="login-input"
            type="text"
            placeholder="아이디"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            autoComplete="username"
          />
          <input
            className="login-input"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={40}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          {mode === 'register' && (
            <input
              className="login-input"
              type="text"
              placeholder="닉네임 (선택사항)"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
            />
          )}

          {error && <div className="login-error">{error}</div>}

          <button
            className="login-btn"
            onClick={handleSubmit}
            disabled={loading || !username.trim() || !password.trim()}
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>

          <button className="login-switch" onClick={switchMode}>
            {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>

          <div className="login-divider">또는</div>
          <button className="login-guest" onClick={onBack}>
            게스트로 진행 (기록 저장 안 됨)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
