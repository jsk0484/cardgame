import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useLangStore } from '../store/langStore';
import Hand from '../components/Hand';
import Pile from '../components/Pile';
import PlayArea from '../components/PlayArea';
import type { HandType } from '../types';
import './GameScreen.css';

const HAND_TYPES: HandType[] = ['single', 'flush', 'straight', 'triple', 'special'];

const GameScreen: React.FC = () => {
  const state = useGameStore(s => s);
  const t = useLangStore(s => s.t);
  const {
    players, drawPile, discardPile, lastPlay,
    round, currentTurn, phase, timer,
    selectedCards, declaredHandType,
    message, challengeResult,
    drawCard, selectCard, setDeclaredHandType,
    playCards, pass, challenge, skipChallenge,
    tickTimer,
  } = state;

  const human = players[0];
  const ai = players[1];
  const isHumanTurn = currentTurn === 0;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if ((phase === 'play' || phase === 'challenge') && isHumanTurn) {
      timerRef.current = setInterval(() => { tickTimer(); }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, isHumanTurn, tickTimer]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const canDraw = phase === 'draw' && isHumanTurn;
  const canPlay = phase === 'play' && isHumanTurn && selectedCards.length > 0;
  const canPass = phase === 'play' && isHumanTurn;
  const canChallenge = phase === 'challenge' && isHumanTurn && lastPlay?.playerId === 'ai';
  const canSkipChallenge = phase === 'challenge' && isHumanTurn && lastPlay?.playerId === 'ai';
  const timerWarning = timer <= 5 && timer > 0 && (phase === 'play' || phase === 'challenge') && isHumanTurn;

  return (
    <div className="game-screen">
      {/* Header */}
      <div className="game-header">
        <div className="game-round">{t.round} {round} / 3</div>
        <div className="score-bar">
          <div className="score-item">
            <span className="score-name">{human.nickname}</span>
            <span className="score-val">{human.score}</span>
          </div>
          <div className="score-divider">vs</div>
          <div className="score-item">
            <span className="score-name">{ai.nickname}</span>
            <span className="score-val">{ai.score}</span>
          </div>
        </div>
        {(phase === 'play' || phase === 'challenge') && isHumanTurn && (
          <div className={`timer-display${timerWarning ? ' timer-warning' : ''}`}>
            {phase === 'challenge' ? t.timer_challenge : t.timer_play}: {timer}s
          </div>
        )}
      </div>

      {/* AI opponent section */}
      <div className="opponent-section">
        <div className="opponent-info">
          <span className="opponent-name">{ai.nickname}</span>
          {!isHumanTurn && <span className="turn-indicator">{t.thinking}</span>}
        </div>
        <div className="opponent-hand">
          {Array.from({ length: ai.handCount }).map((_, i) => (
            <div key={i} className="ai-card-back" />
          ))}
          {ai.handCount === 0 && <span className="empty-hand-text">{t.no_cards}</span>}
        </div>
        <div className="opponent-stats">
          {t.score}: {ai.score} | {t.cards}: {ai.handCount}
        </div>
      </div>

      {/* Middle section: piles + table */}
      <div className="table-section">
        <div className="piles-area">
          <Pile
            cards={drawPile}
            label={t.draw_pile}
            faceDown
            onClick={canDraw ? () => drawCard(false) : undefined}
            disabled={!canDraw}
          />
          <Pile
            cards={discardPile}
            label={t.discard}
            faceDown={false}
            onClick={canDraw && discardPile.length > 0 ? () => drawCard(true) : undefined}
            disabled={!canDraw || discardPile.length === 0}
          />
        </div>
        <div className="play-area-wrapper">
          <PlayArea
            lastPlay={lastPlay}
            playerName={human.nickname}
            aiName={ai.nickname}
          />
        </div>
      </div>

      {/* Message area */}
      <div className={`message-bar${challengeResult ? (challengeResult.success ? ' message-success' : ' message-fail') : ''}`}>
        {message}
      </div>

      {/* Player hand */}
      <div className="player-section">
        <Hand
          cards={human.hand}
          selectedIds={selectedCards}
          onSelectCard={phase === 'play' && isHumanTurn ? selectCard : undefined}
          label={`${human.nickname}'s Hand`}
        />
      </div>

      {/* Controls */}
      <div className="controls">
        {phase === 'play' && isHumanTurn && (
          <div className="hand-type-selector">
            <span className="hand-type-label">{t.declare}</span>
            {HAND_TYPES.map(ht => (
              <button
                key={ht}
                className={`btn btn-type${declaredHandType === ht ? ' btn-type-active' : ''}`}
                onClick={() => setDeclaredHandType(ht)}
              >
                {t.hand_types[ht]}
              </button>
            ))}
          </div>
        )}

        <div className="action-buttons">
          {canDraw && (
            <div className="draw-hint">{t.draw_hint}</div>
          )}

          {phase === 'play' && isHumanTurn && (
            <>
              <button className="btn btn-play" onClick={playCards} disabled={!canPlay}>
                {t.play} ({selectedCards.length})
              </button>
              <button className="btn btn-pass" onClick={pass} disabled={!canPass}>
                {t.pass} ({human.passStreak}/2)
              </button>
            </>
          )}

          {phase === 'challenge' && isHumanTurn && lastPlay?.playerId === 'ai' && (
            <>
              <button className="btn btn-challenge" onClick={challenge} disabled={!canChallenge}>
                {t.challenge}
              </button>
              <button className="btn btn-skip" onClick={skipChallenge} disabled={!canSkipChallenge}>
                {t.no_challenge}
              </button>
            </>
          )}

          {phase === 'challenge' && isHumanTurn && lastPlay?.playerId === 'human' && (
            <div className="waiting-text">{t.waiting_ai_challenge}</div>
          )}

          {!isHumanTurn && phase !== 'end' && (
            <div className="waiting-text">{t.ai_thinking}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
