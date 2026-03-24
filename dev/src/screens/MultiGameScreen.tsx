import React, { useState, useRef, useEffect } from 'react';
import { useMultiStore } from '../store/multiStore';
import { useLangStore } from '../store/langStore';
import Hand from '../components/Hand';
import PlayArea from '../components/PlayArea';
import EmojiBar from '../components/EmojiBar';
import type { Card, HandType } from '../types';
import './MultiGameScreen.css';

const HAND_TYPES: HandType[] = ['flush', 'straight', 'triple', 'straight_flush'];

type AnnounceType = 'mine' | 'opp' | 'challenge' | 'nl' | 'round';

interface Announcement {
  text: string;
  sub?: string;
  type: AnnounceType;
}

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
    playLog,
    challengeReveal,
    drawCard,
    playCards,
    pass,
    challenge,
    skipChallenge,
    useNullify,
    skipNullify,
    sendEmoji,
    disconnect,
  } = useMultiStore();

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [declaredType, setDeclaredType] = useState<HandType>('flush');
  const [declareOpen, setDeclareOpen] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [scoreFlash, setScoreFlash] = useState<Record<string, number | null>>({});
  const prevScoresRef = useRef<Record<string, number>>({});

  // Turn announcement overlay
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const prevPlayerRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<string>('');
  const annTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAnnounce = (ann: Announcement, duration = 1800) => {
    if (annTimerRef.current) clearTimeout(annTimerRef.current);
    setAnnouncement(ann);
    annTimerRef.current = setTimeout(() => setAnnouncement(null), duration);
  };

  // Trigger announcement on turn change (draw phase)
  useEffect(() => {
    if (!currentPlayerId) return;
    const playerChanged = currentPlayerId !== prevPlayerRef.current;
    if (playerChanged && phase === 'draw') {
      if (currentPlayerId === myId) {
        showAnnounce({ text: t.announce_your_turn, type: 'mine' });
      } else {
        const name = players.find(p => p.id === currentPlayerId)?.nickname ?? currentPlayerId;
        showAnnounce({ text: t.announce_opp_turn(name), type: 'opp' });
      }
    }
    prevPlayerRef.current = currentPlayerId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerId]);

  // Trigger announcement on phase transition
  useEffect(() => {
    if (phase === prevPhaseRef.current) return;
    if (phase === 'challenge') {
      showAnnounce({ text: t.announce_challenge, type: 'challenge' }, 1400);
    } else if (phase === 'nl_counter') {
      showAnnounce({ text: t.announce_nl, type: 'nl' }, 1600);
    }
    prevPhaseRef.current = phase;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Trigger round announcement
  const prevRoundRef = useRef<number>(0);
  useEffect(() => {
    if (round !== prevRoundRef.current && round > 1) {
      showAnnounce({ text: t.announce_round(round), type: 'round' }, 1600);
    }
    prevRoundRef.current = round;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const me = players.find(p => p.id === myId);
  const opponents = players.filter(p => p.id !== myId);

  const isMyTurn = currentPlayerId === myId;
  const canDraw = isMyTurn && phase === 'draw';
  const selectedCardObjects = myHand.filter(c => selectedCards.includes(c.id));
  const isSpecialPlay = selectedCards.length === 1 && selectedCardObjects[0]?.isSpecial;
  const validCount = selectedCards.length === 3 || isSpecialPlay;
  const canPlay = isMyTurn && phase === 'play' && validCount && (isSpecialPlay || (declareOpen && declaredType !== 'single'));
  const canPass = isMyTurn && phase === 'play';

  const lastPlayPlayerIdx = players.findIndex(p => p.id === lastPlay?.playerId);
  const expectedChallengerIdx = lastPlayPlayerIdx >= 0
    ? (lastPlayPlayerIdx + 1) % players.length
    : -1;
  const canChallenge =
    phase === 'challenge' &&
    expectedChallengerIdx >= 0 &&
    players[expectedChallengerIdx]?.id === myId;

  const canUseNl = phase === 'nl_counter' && lastPlay?.playerId !== myId;

  const timerWarning = timer <= 5 && timer > 0;

  // Score delta flash
  useEffect(() => {
    const deltas: Record<string, number | null> = {};
    let changed = false;
    players.forEach(p => {
      const prev = prevScoresRef.current[p.id] ?? p.score;
      const d = p.score - prev;
      if (d !== 0) { deltas[p.id] = d; changed = true; }
      else deltas[p.id] = null;
    });
    if (changed) {
      setScoreFlash(deltas);
      players.forEach(p => { prevScoresRef.current[p.id] = p.score; });
      const id = setTimeout(() => setScoreFlash({}), 1600);
      return () => clearTimeout(id);
    }
  }, [players]);

  // Reset declare when play phase starts
  useEffect(() => {
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
    const effectiveDeclaredType: HandType = isSpecialPlay ? 'special' : declaredType;
    playCards(cardsToPlay, effectiveDeclaredType);
    setSelectedCards([]);
  };

  const handleDrawCard = (from: 'draw' | 'discard') => {
    if (!canDraw) return;
    drawCard(from);
  };

  const topDiscardCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  const displayedLastPlay = lastPlay
    ? {
        playerId: lastPlay.playerId,
        cards: lastPlay.cards ?? [],
        declaredType: lastPlay.declaredType as HandType,
        actualType: lastPlay.declaredType as HandType,
        isBluff: false,
      }
    : null;

  const hasRedJokerSelected = myHand.filter(c => selectedCards.includes(c.id)).some(c => c.rank === 'red_joker');

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.nickname ?? id;

  const timerLabel = phase === 'challenge' ? t.timer_challenge
    : phase === 'draw' ? t.draw_pile
    : t.timer_play;

  return (
    <div className="multi-game-screen">
      {/* Turn Announcement Overlay */}
      {announcement && (
        <div className="ann-overlay" key={announcement.text + announcement.type}>
          <div className={`ann-box ann-${announcement.type}`}>
            <div className="ann-text">{announcement.text}</div>
            {announcement.sub && <div className="ann-sub">{announcement.sub}</div>}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mg-header">
        <div className="mg-round">{t.round} {round} / 3</div>
        <div className="mg-scores">
          {players.map(p => (
            <div key={p.id} className={`mg-score-item${p.id === myId ? ' mg-score-me' : ''}`}>
              <span className="mg-score-name">{p.nickname}{p.id === myId ? ` ${t.you_label}` : ''}</span>
              <div className="score-val-wrap">
                <span className="mg-score-val">{p.score}</span>
                {scoreFlash[p.id] != null && (
                  <span className={`score-delta${(scoreFlash[p.id] ?? 0) > 0 ? ' score-delta-pos' : ' score-delta-neg'}`}>
                    {(scoreFlash[p.id] ?? 0) > 0 ? `+${scoreFlash[p.id]}` : scoreFlash[p.id]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mg-header-right">
          {(canDraw || isMyTurn) && (
            <div className={`mg-timer${timerWarning ? ' mg-timer-warning' : ''}`}>
              {timerLabel}: {timer}s
            </div>
          )}
          <button className="mg-leave-btn" onClick={disconnect}>{t.leave_btn}</button>
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
                  {phase === 'challenge' ? t.deciding : t.thinking}
                </span>
              )}
              {!opp.isConnected && <span className="mg-opp-dc-tag">{t.disconnected}</span>}
            </div>
            <div className="mg-opp-hand">
              {Array.from({ length: opp.handCount }).map((_, i) => (
                <div key={i} className="mg-card-back" />
              ))}
              {opp.handCount === 0 && <span className="mg-empty-hand">{t.no_cards}</span>}
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
              <div className="mg-pile-empty">{t.pile_empty}</div>
            )}
          </div>
          <div className="mg-pile-count">{t.pile_cards(drawPileCount)}</div>
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
              <div className="mg-pile-empty">{t.pile_empty}</div>
            )}
          </div>
          <div className="mg-pile-count">{t.pile_cards(discardPile.length)}</div>
        </div>

        {/* Play area */}
        <div className="mg-play-area-wrapper">
          <PlayArea
            lastPlay={displayedLastPlay}
            playerName={me?.nickname ?? 'You'}
            aiName={opponents[0]?.nickname ?? 'Opponent'}
            challengeResult={challengeReveal ? { success: false, challengerId: '', blufferId: '', message: '' } : null}
          />
          {displayedLastPlay && (
            <div className="mg-last-play-by">
              {t.by} {getPlayerName(displayedLastPlay.playerId)}
            </div>
          )}
        </div>
      </div>

      {/* Message bar */}
      {error && <div className="mg-message mg-message-error">{error}</div>}
      {!error && <div className="mg-message">{message}</div>}

      {/* Play Log Toggle */}
      <div className="play-log-toggle-bar">
        <button className="log-toggle-btn" onClick={() => setShowLog(v => !v)}>
          📋 목록 ({playLog.length}) {showLog ? '▲' : '▼'}
        </button>
      </div>
      {showLog && playLog.length > 0 && (
        <div className="play-log-strip">
          {[...playLog].reverse().map((entry, idx) => (
            <div
              key={entry.id}
              className={`log-entry${entry.challenged === true ? (entry.challengeSuccess ? ' log-caught' : ' log-held') : entry.challenged === false ? ' log-skip-row' : ''}`}
            >
              <span className="log-order">#{playLog.length - idx}</span>
              <span className="log-round">R{entry.round}</span>
              <span className="log-player">{entry.playerName}</span>
              <span className="log-declared">
                {t.hand_types[entry.declaredType as keyof typeof t.hand_types] ?? entry.declaredType}
              </span>
              {entry.cards && entry.cards.length > 0 && (
                <span className="log-cards">
                  {entry.cards.map(c => {
                    const isRed = c.suit === 'heart' || c.suit === 'diamond';
                    const isJoker = c.isSpecial || c.suit === 'joker';
                    const suitSym = c.suit === 'heart' ? '♥' : c.suit === 'diamond' ? '♦' : c.suit === 'spade' ? '♠' : c.suit === 'club' ? '♣' : '★';
                    const chipClass = isJoker ? 'joker' : isRed ? 'red' : 'black';
                    return (
                      <span key={c.id} className={`log-card-chip ${chipClass}`}>
                        {c.rank}{suitSym}
                      </span>
                    );
                  })}
                </span>
              )}
              {entry.challenged === true && (
                <span className="log-result">
                  {entry.challengeSuccess ? '🔴 허풍!' : '🟢 정직'}
                  {entry.deltas && entry.deltas.length > 0
                    ? ' ' + entry.deltas.map(d => `${d.name} ${d.delta > 0 ? '+' : ''}${d.delta}`).join(' / ')
                    : entry.delta != null && entry.delta !== 0
                      ? (entry.delta > 0 ? ` +${entry.delta}` : ` ${entry.delta}`)
                      : ''}
                </span>
              )}
              {entry.challenged === false && (
                <span className="log-skip">
                  패스
                  {entry.deltas && entry.deltas.length > 0
                    ? ' · ' + entry.deltas.map(d => `${d.name} +${d.delta}`).join('')
                    : ''}
                </span>
              )}
              {entry.challenged === null && <span className="log-pending">대기중…</span>}
            </div>
          ))}
        </div>
      )}

      {/* Player hand */}
      <div className="mg-player-section">
        <div className="mg-player-label">
          {me?.nickname ?? 'Your'} {t.hand_label}
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
            {isSpecialPlay ? (
              <span className="mg-hand-type-label">{t.special_hint}</span>
            ) : !declareOpen ? (
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
                    {t.hand_types[ht as keyof typeof t.hand_types] ?? ht}
                  </button>
                ))}
              </>
            )}
            {hasRedJokerSelected && (
              <span className="rj-hint">{t.rj_hint_text}</span>
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

          {canUseNl && (
            <>
              <button className="mg-btn mg-btn-nl-use" onClick={useNullify}>{t.nullify_use}</button>
              <button className="mg-btn mg-btn-skip" onClick={skipNullify}>{t.nullify_skip}</button>
            </>
          )}

          {phase === 'nl_counter' && !canUseNl && (
            <div className="mg-waiting-text">{t.waiting_nullify_opp}</div>
          )}

          {!isMyTurn && phase !== 'end' && phase !== 'nl_counter' && (
            <div className="mg-waiting-text">
              {currentPlayerId
                ? t.waiting_for(getPlayerName(currentPlayerId))
                : t.waiting_for('...')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiGameScreen;
