import React, { useState } from 'react';
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

  if (mode === 'multi') {
    if (multiScreen === 'lobby') return <LobbyScreen onSinglePlayer={() => setMode('single')} />;
    if (multiScreen === 'waiting') return <WaitingScreen />;
    if (multiScreen === 'game') return <MultiGameScreen />;
    if (multiScreen === 'result') return <MultiResultScreen onBack={() => setMode('single')} />;
  }

  return (
    <div className="app">
      {singleScreen === 'main' && <MainScreen onMultiplayer={() => setMode('multi')} />}
      {singleScreen === 'game' && <GameScreen />}
      {singleScreen === 'result' && <ResultScreen />}
    </div>
  );
};

export default App;
