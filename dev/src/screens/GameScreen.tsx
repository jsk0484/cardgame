import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useLangStore } from '../store/langStore';
import Hand from '../components/Hand';
import Pile from '../components/Pile';
import PlayArea from '../components/PlayArea';
import LangToggle from '../components/LangToggle';
import RulesModal from '../components/RulesModal';
import EmojiBar from '../components/EmojiBar';
import type { HandType } from '../types';
import './GameScreen.css';

const AI_EMOJIS = ['😎', '🤔', '😂', '😤', '👀'];
const AI_EMOJI_CHANCE = 0.25;

const HAND_TYPES: HandType[] = ['flush', 'straight', 'triple', 'straight_flush'];

const GameScreen: React.FC = () => {
  const state = useGameStore(s => s);
  const playLog = useGameStore(s => s.playLog);
  const t = useLangStore(s => s.t);
  const {
    players, drawPile, discardPile, lastPlay,
    round, currentTurn, phase, timer,
    selectedCards, declaredHandType,
    message, challengeResult,
    drawCard, selectCard, setDeclaredHandType,
    playCards, pass, challenge, skipChallenge, useNullify, skipNullify,
    tickTimer,
  } = state;

  const human = players[0];
  const ai = players[1];
  const isHumanTurn = currentTurn === 0;

  const [showRules, setShowRules] = useState(false);
  const [aiEmoji, setAiEmoji] = useState<string | null>(null);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [scoreFlash, setScoreFlash] = useState<{ human: number | null; ai: number | null }>({ human: null, ai: null });
  const prevScoresRef = useRef({ human: 0, ai: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Turn announcement overlay
  type GsAnnType = 'mine' | 'opp' | 'round' | 'challenge';
  interface GsAnn { title: string; icon: string; type: GsAnnType; scores: string }
  const [gsAnn, setGsAnn] = useState<GsAnn | null>(null);
  const gsAnnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTurnRef = useRef(currentTurn);
  const prevRoundRef = useRef(round);
  const prevPhaseRef = useRef(phase);

  const showGsAnn = (ann: GsAnn, duration = 2200) => {
    if (gsAnnTimerRef.current) clearTimeout(gsAnnTimerRef.current);
    setGsAnn(ann);
    gsAnnTimerRef.current = setTimeout(() => setGsAnn(null), duration);
  };

  // Turn change
  useEffect(() => {
    if (currentTurn === prevTurnRef.current) return;
    prevTurnRef.current = currentTurn;
    if (phase !== 'draw') return;
    const scores = `${human.nickname} ${human.score} : ${ai.score} ${ai.nickname}`;
    if (currentTurn === 0) {
      showGsAnn({ title: t.announce_your_turn, icon: '⭐', type: 'mine', scores });
    } else {
      showGsAnn({ title: t.announce_opp_turn(ai.nickname), icon: '🤖', type: 'opp', scores });
    }
  }, [currentTurn]);

  // Round change
  useEffect(() => {
    if (round === prevRoundRef.current) return;
    prevRoundRef.current = round;
    if (round > 1) {
      showGsAnn({ title: t.announce_round(round), icon: '🎲', type: 'round',
        scores: `${human.nickname} ${human.score} : ${ai.score} ${ai.nickname}` }, 2000);
    }
  }, [round]);

  // Challenge phase
  useEffect(() => {
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;
    if (phase === 'challenge' && lastPlay?.playerId === 'ai') {
      showGsAnn({ title: t.announce_challenge, icon: '⚡', type: 'challenge',
        scores: `${human.nickname} ${human.score} : ${ai.score} ${ai.nickname}` }, 1400);
    }
  }, [phase]);

  // AI sends random emoji occasionally when it's their turn
  useEffect(() => {
    if (!isHumanTurn && phase === 'draw') {
      if (Math.random() < AI_EMOJI_CHANCE) {
        const emoji = AI_EMOJIS[Math.floor(Math.random() * AI_EMOJIS.length)];
        const t = setTimeout(() => { setAiEmoji(emoji); setTimeout(() => setAiEmoji(null), 100); }, 600);
        return () => clearTimeout(t);
      }
    }
  }, [isHumanTurn, phase]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const needsTimer = (phase === 'play' && isHumanTurn) || (phase === 'challenge' && lastPlay?.playerId === 'ai') || (phase === 'nl_counter' && lastPlay?.playerId === 'ai');
    if (needsTimer) {
      timerRef.current = setInterval(() => { tickTimer(); }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, isHumanTurn, lastPlay, tickTimer]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // 점수 변화 감지 → flash
  useEffect(() => {
    const prev = prevScoresRef.current;
    const hd = human.score - prev.human;
    const ad = ai.score - prev.ai;
    if (hd !== 0 || ad !== 0) {
      setScoreFlash({ human: hd !== 0 ? hd : null, ai: ad !== 0 ? ad : null });
      prevScoresRef.current = { human: human.score, ai: ai.score };
      const id = setTimeout(() => setScoreFlash({ human: null, ai: null }), 1600);
      return () => clearTimeout(id);
    }
  }, [human.score, ai.score]);

  // 턴이 넘어와 play phase가 되면 선언 블록 초기화
  useEffect(() => {
    if (phase === 'play' && isHumanTurn) setDeclareOpen(false);
  }, [phase, isHumanTurn]);

  const selectedCardObjects = human.hand.filter(c => selectedCards.includes(c.id));
  const hasRedJokerSelected = selectedCardObjects.some(c => c.rank === 'red_joker');

  const canDraw = phase === 'draw' && isHumanTurn && !challengeResult;
  const isSpecialPlay = selectedCards.length === 1 && selectedCardObjects[0]?.isSpecial;
  const validCount = selectedCards.length === 3 || isSpecialPlay;
  const canPlay = phase === 'play' && isHumanTurn && validCount && (isSpecialPlay || (declareOpen && declaredHandType !== 'single'));
  const canPass = phase === 'play' && isHumanTurn;
  const aiJustPlayed = lastPlay?.playerId === 'ai';
  const canChallenge = phase === 'challenge' && aiJustPlayed;
  const showNlCounter = phase === 'nl_counter' && aiJustPlayed;
  const timerWarning = timer <= 5 && timer > 0 && (phase === 'play' || (phase === 'challenge' && aiJustPlayed) || (phase === 'nl_counter' && aiJustPlayed));

  return (
    <div className="game-screen">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Turn Announcement Overlay */}
      {gsAnn && (
        <div className="gs-ann-overlay" key={gsAnn.title + gsAnn.type}>
          <div className={`gs-ann-box gs-ann-${gsAnn.type}`}>
            <div className="gs-ann-icon">{gsAnn.icon}</div>
            <div className="gs-ann-title">{gsAnn.title}</div>
            <div className="gs-ann-scores">{gsAnn.scores}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="game-header">
        <div className="game-round">{t.round} {round} / 3</div>
        <div className="score-bar">
          <div className="score-item">
            <span className="score-name">{human.nickname}</span>
            <div className="score-val-wrap">
              <span className="score-val">{human.score}</span>
              {scoreFlash.human !== null && (
                <span className={`score-delta${scoreFlash.human > 0 ? ' score-delta-pos' : ' score-delta-neg'}`}>
                  {scoreFlash.human > 0 ? `+${scoreFlash.human}` : scoreFlash.human}
                </span>
              )}
            </div>
          </div>
          <div className="score-divider">vs</div>
          <div className="score-item">
            <span className="score-name">{ai.nickname}</span>
            <div className="score-val-wrap">
              <span className="score-val">{ai.score}</span>
              {scoreFlash.ai !== null && (
                <span className={`score-delta${scoreFlash.ai > 0 ? ' score-delta-pos' : ' score-delta-neg'}`}>
                  {scoreFlash.ai > 0 ? `+${scoreFlash.ai}` : scoreFlash.ai}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="header-right">
          {((phase === 'play' && isHumanTurn) || (phase === 'challenge' && aiJustPlayed) || showNlCounter) && (
            <div className={`timer-display${timerWarning ? ' timer-warning' : ''}`}>
              {phase === 'nl_counter' ? 'NL' : phase === 'challenge' ? t.timer_challenge : t.timer_play}: {timer}s
            </div>
          )}
          <LangToggle />
          <button className="btn-rules" onClick={() => setShowRules(true)}>?</button>
        </div>
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
            challengeResult={challengeResult}
          />
        </div>
      </div>

      {/* Message area */}
      <div className={`message-bar${challengeResult ? (challengeResult.success ? ' message-success' : ' message-fail') : ''}`}>
        {message}
      </div>

      {/* Play Log */}
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
            {isSpecialPlay ? (
              <span className="hand-type-label">★ 스페셜 카드 — 바로 낼 수 있습니다</span>
            ) : !declareOpen ? (
              <button
                className="btn btn-declare-open"
                onClick={() => setDeclareOpen(true)}
                disabled={selectedCards.length === 0}
              >
                {t.declare} ▾
              </button>
            ) : (
              <>
                <span className="hand-type-label">{t.declare}</span>
                {HAND_TYPES.map(ht => (
                  <button
                    key={ht}
                    className={`btn btn-type${declaredHandType === ht ? ' btn-type-active' : ''}`}
                    onClick={() => setDeclaredHandType(ht)}
                  >
                    {t.hand_types[ht as keyof typeof t.hand_types] ?? ht}
                  </button>
                ))}
              </>
            )}
            {hasRedJokerSelected && (
              <span className="rj-hint">★ Red Joker: challenge-proof</span>
            )}
          </div>
        )}

        <div className="emoji-area">
          <EmojiBar aiEmoji={aiEmoji} />
        </div>

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

          {canChallenge && (
            <>
              <button className="btn btn-challenge" onClick={challenge}>
                {t.challenge}
              </button>
              <button className="btn btn-skip" onClick={skipChallenge}>
                {t.no_challenge}
              </button>
            </>
          )}

          {showNlCounter && (
            <>
              <button className="btn btn-nl-use" onClick={useNullify}>★ Nullify 사용</button>
              <button className="btn btn-skip" onClick={skipNullify}>패스</button>
            </>
          )}

          {phase === 'nl_counter' && !aiJustPlayed && (
            <div className="waiting-text">AI가 Nullify 여부를 결정 중...</div>
          )}

          {phase === 'challenge' && isHumanTurn && lastPlay?.playerId === 'human' && (
            <div className="waiting-text">{t.waiting_ai_challenge}</div>
          )}

          {!isHumanTurn && phase !== 'challenge' && phase !== 'nl_counter' && phase !== 'end' && (
            <div className="waiting-text">{t.ai_thinking}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
