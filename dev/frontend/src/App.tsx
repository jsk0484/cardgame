import React from 'react';
import { useGameStore } from './store/gameStore';
import MainScreen from './screens/MainScreen';
import GameScreen from './screens/GameScreen';
import ResultScreen from './screens/ResultScreen';
import './App.css';

const App: React.FC = () => {
  const screen = useGameStore(s => s.screen);

  return (
    <div className="app">
      {screen === 'main' && <MainScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'result' && <ResultScreen />}
    </div>
  );
};

export default App;
