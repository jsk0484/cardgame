import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { useMultiStore } from './store/multiStore';
import MainScreen from './screens/MainScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';
import LobbyScreen from './screens/LobbyScreen';
import WaitingScreen from './screens/WaitingScreen';
import MultiGameScreen from './screens/MultiGameScreen';
import MultiResultScreen from './screens/MultiResultScreen';
import './App.css';

const App: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const singleScreen = useGameStore(s => s.screen);
  const multiScreen = useMultiStore(s => s.screen);
  const [hasUpdate, setHasUpdate] = useState(false);
  const initialVersion = useRef<number | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        const data = await res.json();
        if (initialVersion.current === null) {
          initialVersion.current = data.v;
        } else if (data.v !== initialVersion.current) {
          setHasUpdate(true);
        }
      } catch {}
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const updateBanner = hasUpdate && (
    <div className="update-banner" onClick={() => window.location.reload()}>
      새 버전이 배포됐습니다 — 클릭해서 새로고침
    </div>
  );

  if (mode === 'multi') {
    if (multiScreen === 'lobby') return <>{updateBanner}<LobbyScreen onSinglePlayer={() => setMode('single')} /></>;
    if (multiScreen === 'waiting') return <>{updateBanner}<WaitingScreen /></>;
    if (multiScreen === 'game') return <>{updateBanner}<MultiGameScreen /></>;
    if (multiScreen === 'result') return <>{updateBanner}<MultiResultScreen onBack={() => setMode('single')} /></>;
  }

  return (
    <div className="app">
      {updateBanner}
      {singleScreen === 'main' && <MainScreen onMultiplayer={() => setMode('multi')} />}
      {singleScreen === 'game' && <GameScreen />}
      {singleScreen === 'result' && <ResultScreen />}
    </div>
  );
};

export default App;
