import React, { useState } from 'react';
import { useMultiStore } from '../store/multiStore';
import { useLangStore } from '../store/langStore';
import Hand from '../components/Hand';
import PlayArea from '../components/PlayArea';
import EmojiBar from '../components/EmojiBar';
import type { Card, HandType } from '../types';
import './MultiGameScreen.css';

const HAND_TYPES: HandType[] = ['single', 'flush', 'straight', 'triple', 'special'];

const MultiGameScreen: React.FC = () => {
  const t = useLangStore(s => s.t);
  const {
    players,
    myId,
    myHand,
    drawPileCount,
    discardPile,
    lastPlay,
    currentPlayerId,
    phase,
    timer,
    round,
    message,
    error,
    drawCard,
    playCards,
    pass,
    challenge,
    skipChallenge,
    sendEmoji,
    disconnect,
  } = useMultiStore();

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [declaredType, setDeclaredType] = useState<HandType>('single');
  const [declareOpen, setDeclareOpen] = useState(false);

  const me = players.find(p => p.id === myId);
  const opponents = players.filter(p => p.id !== myId);

  const isMyTurn = currentPlayerId === myId;
  const canDraw = isMyTurn && phase === 'draw';
  const canPlay = isMyTurn && phase === 'play' && selectedCards.length > 0 && declareOpen;
  const canPass = isMyTurn && phase === 'play';

  // Determine if it's my challenge turn
  const lastPlayPlayerIdx = players.findIndex(p => p.id === lastPlay?.playerId);
  const expectedChallengerIdx = lastPlayPlayerIdx >= 0
    ? (lastPlayPlayerIdx + 1) % players.length
    : -1;
  const canChallenge =
    phase === 'challenge' &&
    expectedChallengerIdx >= 0 &&
    players[expectedChallengerIdx]?.id === myId;

  const timerWarning = timer <= 5 && timer > 0;

  // 턴이 넘어와 play phase가 되면 선언 블록 초기화
  React.useEffect(() => {
    if (phase === 'play' && isMyTurn) setDeclareOpen(false);
  }, [phase, isMyTurn]);

  const handleSelectCard = (cardId: string) => {
    if (phase !== 'play' || !isMyTurn) return;
    setSelectedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const handlePlayCards = () => {
    if (!canPlay) return;
    const cardsToPlay: Card[] = myHand.filter(c => selectedCards.includes(c.id));
    playCards(cardsToPlay, declaredType);
    setSelectedCards([]);
  };

  const handleDrawCard = (from: 'draw' | 'discard') => {
    if (!canDraw) return;
    drawCard(from);
  };

  const topDiscardCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  // Build a pseudo PlayedHand for PlayArea
  const displayedLastPlay = lastPlay
    ? {
        playerId: lastPlay.playerId,
        cards: lastPlay.cards ?? [],
        declaredType: lastPlay.declaredType as HandType,
        actualType: lastPlay.declaredType as HandType,
        isBluff: false,
      }
    : null;

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.nickname ?? id;

  return (
    <div className="multi-game-screen">
      {/* Header */}
      <div className="mg-header">
        <div className="mg-round">{t.round} {round} / 3</div>
        <div className="mg-scores">
          {players.map(p => (
            <div key={p.id} className={`mg-score-item${p.id === myId ? ' mg-score-me' : ''}`}>
              <span className="mg-score-name">{p.nickname}{p.id === myId ? ' (You)' : ''}</span>
              <span className="mg-score-val">{p.score}</span>
            </div>
          ))}
        </div>
        <div className="mg-header-right">
          {(canDraw || isMyTurn) && (
            <div className={`mg-timer${timerWarning ? ' mg-timer-warning' : ''}`}>
              {phase === 'challenge' ? t.timer_challenge : phase === 'draw' ? t.draw_pile : t.timer_play}: {timer}s
            </div>
          )}
          <button className="mg-leave-btn" onClick={disconnect}>Leave</button>
        </div>
      </div>

      {/* Opponents */}
      <div className="mg-opponents">
        {opponents.map(opp => (
          <div
            key={opp.id}
            className={`mg-opponent${currentPlayerId === opp.id ? ' mg-opponent-active' : ''}${!opp.isConnected ? ' mg-opponent-dc' : ''}`}
          >
            <div className="mg-opp-header">
              <span className="mg-opp-name">{opp.nickname}</span>
              {currentPlayerId === opp.id && (
                <span className="mg-opp-turn-tag">
                  {phase === 'challenge' ? 'Deciding...' : 'Thinking...'}
                </span>
              )}
              {!opp.isConnected && <span className="mg-opp-dc-tag">Disconnected</span>}
            </div>
            <div className="mg-opp-hand">
              {Array.from({ length: opp.handCount }).map((_, i) => (
                <div key={i} className="mg-card-back" />
              ))}
              {opp.handCount === 0 && <span className="mg-empty-hand">No cards</span>}
            </div>
            <div className="mg-opp-stats">
              {t.score}: {opp.score} | {t.cards}: {opp.handCount}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="mg-table">
        {/* Draw pile */}
        <div
          className={`mg-pile${canDraw ? ' mg-pile-clickable' : ''}`}
          onClick={() => handleDrawCard('draw')}
        >
          <div className="mg-pile-label">{t.draw_pile}</div>
          <div className="mg-pile-visual">
            {drawPileCount > 0 ? (
              <>
                {drawPileCount > 2 && <div className="mg-pile-shadow mg-pile-shadow-3" />}
                {drawPileCount > 1 && <div className="mg-pile-shadow mg-pile-shadow-2" />}
                <div className={`mg-pile-top mg-pile-back${canDraw ? ' mg-pile-glow' : ''}`} />
              </>
            ) : (
              <div className="mg-pile-empty">Empty</div>
            )}
          </div>
          <div className="mg-pile-count">{drawPileCount} cards</div>
        </div>

        {/* Discard pile */}
        <div
          className={`mg-pile${canDraw && topDiscardCard ? ' mg-pile-clickable' : ''}`}
          onClick={() => topDiscardCard && handleDrawCard('discard')}
        >
          <div className="mg-pile-label">{t.discard}</div>
          <div className="mg-pile-visual">
            {topDiscardCard ? (
              <div className={`mg-pile-top mg-pile-face${canDraw ? ' mg-pile-glow' : ''}`}>
                <span className={`mg-pile-rank${topDiscardCard.suit === 'heart' || topDiscardCard.suit === 'diamond' ? ' red' : ''}`}>
                  {topDiscardCard.isSpecial
                    ? topDiscardCard.rank === 'handoof' ? 'HF' : 'NL'
                    : topDiscardCard.rank === 'red_joker' ? 'RJ'
                    : topDiscardCard.rank === 'black_joker' ? 'BJ'
                    : String(topDiscardCard.rank)}
                </span>
                <span className="mg-pile-suit">
                  {topDiscardCard.suit === 'spade' ? '♠'
                    : topDiscardCard.suit === 'heart' ? '♥'
                    : topDiscardCard.suit === 'diamond' ? '♦'
                    : topDiscardCard.suit === 'club' ? '♣'
                    : '★'}
                </span>
              </div>
            ) : (
              <div className="mg-pile-empty">Empty</div>
            )}
          </div>
          <div className="mg-pile-count">{discardPile.length} cards</div>
        </div>

        {/* Play area */}
        <div className="mg-play-area-wrapper">
          <PlayArea
            lastPlay={displayedLastPlay}
            playerName={me?.nickname ?? 'You'}
            aiName={opponents[0]?.nickname ?? 'Opponent'}
          />
          {displayedLastPlay && (
            <div className="mg-last-play-by">
              by {getPlayerName(displayedLastPlay.playerId)}
            </div>
          )}
        </div>
      </div>

      {/* Message bar */}
      {error && <div className="mg-message mg-message-error">{error}</div>}
      {!error && <div className="mg-message">{message}</div>}

      {/* Player hand */}
      <div className="mg-player-section">
        <div className="mg-player-label">
          {me?.nickname ?? 'Your'} Hand
          {me && <span className="mg-player-stats"> — {t.score}: {me.score} | {t.cards}: {myHand.length}</span>}
        </div>
        <Hand
          cards={myHand}
          selectedIds={selectedCards}
          onSelectCard={isMyTurn && phase === 'play' ? handleSelectCard : undefined}
          label=""
        />
      </div>

      {/* Controls */}
      <div className="mg-controls">
        {/* Hand type selector */}
        {isMyTurn && phase === 'play' && (
          <div className="mg-hand-type-selector">
            {!declareOpen ? (
              <button
                className="mg-btn mg-btn-declare-open"
                onClick={() => setDeclareOpen(true)}
                disabled={selectedCards.length === 0}
              >
                {t.declare} ▾
              </button>
            ) : (
              <>
                <span className="mg-hand-type-label">{t.declare}</span>
                {HAND_TYPES.map(ht => (
                  <button
                    key={ht}
                    className={`mg-btn-type${declaredType === ht ? ' mg-btn-type-active' : ''}`}
                    onClick={() => setDeclaredType(ht)}
                  >
                    {t.hand_types[ht]}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* Emoji bar */}
        <div className="mg-emoji-area">
          <EmojiBar onSend={sendEmoji} />
        </div>

        {/* Action buttons */}
        <div className="mg-action-buttons">
          {canDraw && (
            <div className="mg-draw-hint">{t.draw_hint}</div>
          )}

          {isMyTurn && phase === 'play' && (
            <>
              <button className="mg-btn mg-btn-play" onClick={handlePlayCards} disabled={!canPlay}>
                {t.play} ({selectedCards.length})
              </button>
              <button className="mg-btn mg-btn-pass" onClick={pass} disabled={!canPass}>
                {t.pass} ({me?.passStreak ?? 0}/2)
              </button>
            </>
          )}

          {canChallenge && (
            <>
              <button className="mg-btn mg-btn-challenge" onClick={challenge}>
                {t.challenge}
              </button>
              <button className="mg-btn mg-btn-skip" onClick={skipChallenge}>
                {t.no_challenge}
              </button>
            </>
          )}

          {!isMyTurn && phase !== 'end' && (
            <div className="mg-waiting-text">
              {currentPlayerId
                ? `Waiting for ${getPlayerName(currentPlayerId)}...`
                : 'Waiting...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiGameScreen;
