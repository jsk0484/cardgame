import { create } from 'zustand';
import { useLangStore } from './langStore';
import type { GameState, Card, HandType, Player, PlayLogEntry } from '../types';

const t = () => useLangStore.getState().t;
import type { ChallengeResult } from '../types';
import { buildDeck, dealHands } from '../game/deck';
import {
  buildPlayedHand,
  shouldEndRound,
  getNextTurn,
  PLAY_TIMER,
  CHALLENGE_TIMER,
  TOTAL_ROUNDS,
  INITIAL_HAND_SIZE,
  MAX_PASS_STREAK,
  getWinner,
} from '../game/gameLogic';
import { applyChallengeScores, getComboBonus } from '../game/scoring';
import { aiChooseDrawSource, aiChoosePlay, aiShouldChallenge } from '../game/ai';

function makePlayer(id: string, nickname: string): Player {
  return {
    id,
    nickname,
    hand: [],
    handCount: 0,
    score: 0,
    passStreak: 0,
    isConnected: true,
  };
}

interface GameStore extends GameState {
  setNickname: (name: string) => void;
  startGame: () => void;
  drawCard: (fromDiscard: boolean) => void;
  selectCard: (cardId: string) => void;
  setDeclaredHandType: (type: HandType) => void;
  playCards: () => void;
  pass: () => void;
  challenge: () => void;
  skipChallenge: () => void;
  useNullify: () => void;
  skipNullify: () => void;
  tickTimer: () => void;
  playAgain: () => void;
  aiTakeTurn: () => void;
  // Internal helpers exposed on the store type
  _nextTurn: () => void;
  _afterChallenge: () => void;
  _resolveChallenge: (challengerId: string, blufferId: string) => void;
  _endRound: () => void;
  _applySpecialAndNext: () => void;
  playLog: PlayLogEntry[];
  comboAccum: { [playerId: string]: number };
}

const HUMAN_IDX = 0;
const AI_IDX = 1;

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'main',
  players: [
    makePlayer('human', 'Player'),
    makePlayer('ai', 'AI Opponent'),
  ],
  drawPile: [],
  discardPile: [],
  lastPlay: null,
  round: 1,
  currentTurn: HUMAN_IDX,
  phase: 'draw',
  timer: PLAY_TIMER,
  selectedCards: [],
  declaredHandType: 'single',
  roundWinner: null,
  gameWinner: null,
  message: '',
  challengeResult: null,
  playLog: [],
  comboAccum: {},

  setNickname: (name: string) => {
    set(state => {
      const players = [...state.players];
      players[HUMAN_IDX] = { ...players[HUMAN_IDX], nickname: name || 'Player' };
      return { players };
    });
  },

  startGame: () => {
    const deck = buildDeck();
    const { hands, remaining } = dealHands(deck, 2, INITIAL_HAND_SIZE);
    set(state => ({
      screen: 'game' as const,
      drawPile: remaining,
      discardPile: [],
      lastPlay: null,
      round: 1,
      currentTurn: HUMAN_IDX,
      phase: 'draw' as const,
      timer: PLAY_TIMER,
      selectedCards: [],
      declaredHandType: 'single' as HandType,
      roundWinner: null,
      gameWinner: null,
      message: t().msg_draw_start,
      challengeResult: null,
      playLog: [],
      players: state.players.map((p, i) => ({
        ...p,
        hand: hands[i],
        handCount: hands[i].length,
        score: 0,
        passStreak: 0,
      })),
    }));
  },

  drawCard: (fromDiscard: boolean) => {
    const state = get();
    if (state.phase !== 'draw' || state.currentTurn !== HUMAN_IDX) return;

    let card: Card | undefined;
    let newDrawPile = [...state.drawPile];
    let newDiscardPile = [...state.discardPile];

    if (fromDiscard) {
      if (newDiscardPile.length === 0) return;
      card = newDiscardPile[newDiscardPile.length - 1];
      newDiscardPile = newDiscardPile.slice(0, -1);
    } else {
      if (newDrawPile.length === 0) {
        set({ message: t().msg_draw_empty });
        get()._endRound();
        return;
      }
      card = newDrawPile[newDrawPile.length - 1];
      newDrawPile = newDrawPile.slice(0, -1);
    }

    if (!card) return;

    const players = [...state.players];
    const human = { ...players[HUMAN_IDX] };
    human.hand = [...human.hand, card];
    human.handCount = human.hand.length;
    players[HUMAN_IDX] = human;

    set({
      drawPile: newDrawPile,
      discardPile: newDiscardPile,
      players,
      phase: 'play',
      timer: PLAY_TIMER,
      message: t().msg_select_play,
    });
  },

  selectCard: (cardId: string) => {
    const state = get();
    if (state.phase !== 'play' || state.currentTurn !== HUMAN_IDX) return;
    const selected = state.selectedCards;
    if (selected.includes(cardId)) {
      set({ selectedCards: selected.filter(id => id !== cardId) });
    } else if (selected.length < 3) {
      set({ selectedCards: [...selected, cardId] });
    }
  },

  setDeclaredHandType: (type: HandType) => {
    set({ declaredHandType: type });
  },

  playCards: () => {
    const state = get();
    if (state.phase !== 'play' || state.currentTurn !== HUMAN_IDX) return;
    if (state.selectedCards.length === 0) return;

    const players = [...state.players];
    const human = { ...players[HUMAN_IDX] };
    const playedCards = human.hand.filter(c => state.selectedCards.includes(c.id));
    if (playedCards.length === 0) return;
    // 1장은 특수카드만, 일반 카드는 반드시 3장
    if (playedCards.length === 1 && !playedCards[0].isSpecial) return;
    if (playedCards.length === 2) return;

    const declaredType = playedCards.length === 1 && playedCards[0].isSpecial ? 'special' as HandType : state.declaredHandType;
    const playedHand = buildPlayedHand('human', playedCards, declaredType);
    const logEntry: PlayLogEntry = {
      id: Date.now(),
      round: state.round,
      playerName: state.players[HUMAN_IDX].nickname,
      declaredType: declaredType,
      cardCount: playedCards.length,
      cards: playedCards,
      challenged: null,
      challengeSuccess: null,
      delta: null,
    };
    human.hand = human.hand.filter(c => !state.selectedCards.includes(c.id));
    human.handCount = human.hand.length;
    human.passStreak = 0;
    players[HUMAN_IDX] = human;

    const hasNullify = playedCards.some(c => c.rank === 'nullify');
    // Only HF/BJ have actual effects that NL can counter; RJ is just a wildcard in combos
    const hasEffectSpecial = playedCards.some(c => c.rank === 'handoof' || c.rank === 'black_joker');
    const normalPlayedCards = playedCards.filter(c => !c.isSpecial);
    const newDiscardPile = [...state.discardPile, ...normalPlayedCards];
    const roundEnded = shouldEndRound(human.hand, state.drawPile);

    if (roundEnded) {
      set({
        players,
        discardPile: newDiscardPile,
        lastPlay: playedHand,
        selectedCards: [],
        phase: 'end',
        message: t().msg_human_round_over(human.nickname),
        playLog: [...state.playLog, logEntry],
      });
      setTimeout(() => get()._endRound(), 1000);
      return;
    }

    // NL: can only cancel a special card last play
    if (hasNullify) {
      const lastHasSpecial = state.lastPlay?.cards.some(c => c.isSpecial) ?? false;
      if (!lastHasSpecial) {
        set({ message: 'NL은 특수카드 플레이만 무효화할 수 있습니다.' });
        return;
      }
      const nullifiedCards = state.lastPlay ? state.lastPlay.cards : [];
      set({
        players,
        discardPile: newDiscardPile,
        lastPlay: null,
        drawPile: [...state.drawPile, ...nullifiedCards],
        selectedCards: [],
        phase: 'draw',
        timer: PLAY_TIMER,
        message: t().msg_nullify_cancel,
        playLog: [...state.playLog, logEntry],
      });
      get()._nextTurn();
      return;
    }

    // HF/BJ special effect cards: NL counter opportunity (RJ is just a wildcard, no effect to counter)
    if (hasEffectSpecial) {
      const aiHasNL = players[AI_IDX].hand.some(c => c.rank === 'nullify');
      if (aiHasNL) {
        set({
          players, discardPile: newDiscardPile, lastPlay: playedHand, selectedCards: [],
          phase: 'nl_counter', timer: CHALLENGE_TIMER,
          message: t().msg_ai_nullify_deciding,
          playLog: [...state.playLog, logEntry],
        });
        setTimeout(() => {
          const s = get();
          if (s.phase !== 'nl_counter') return;
          if (Math.random() < 0.35) {
            // AI uses NL: return special card to human, no effects
            const nlCard = s.players[AI_IDX].hand.find(c => c.rank === 'nullify')!;
            const updPl = s.players.map((p, i) => {
              if (i === AI_IDX) { const h = p.hand.filter(c => c.id !== nlCard.id); return { ...p, hand: h, handCount: h.length }; }
              if (i === HUMAN_IDX) { const h = [...p.hand, ...s.lastPlay!.cards]; return { ...p, hand: h, handCount: p.hand.length + s.lastPlay!.cards.length }; }
              return p;
            });
            set({ players: updPl, lastPlay: null, phase: 'draw', timer: 0, message: t().msg_ai_nullify_used });
            get()._nextTurn();
          } else {
            // AI skips: apply HF/BJ effects now, then nextTurn
            get()._applySpecialAndNext();
          }
        }, 1500);
      } else {
        // No AI NL: apply effects immediately
        set({
          players, discardPile: newDiscardPile, lastPlay: playedHand, selectedCards: [],
          phase: 'draw', timer: PLAY_TIMER,
          message: t().msg_special_played,
          playLog: [...state.playLog, logEntry],
        });
        get()._applySpecialAndNext();
      }
      return;
    }

    // Regular 3-card play: go directly to challenge (no NL counter)
    set({
      players,
      discardPile: newDiscardPile,
      lastPlay: playedHand,
      selectedCards: [],
      phase: 'challenge',
      timer: CHALLENGE_TIMER,
      message: (() => { const tr = t(); return tr.msg_you_played(playedCards.length, tr.hand_types[declaredType as keyof typeof tr.hand_types] ?? declaredType); })(),
      playLog: [...state.playLog, logEntry],
    });

    setTimeout(() => {
      const s = get();
      if (s.phase !== 'challenge') return;
      if (aiShouldChallenge(s.lastPlay)) get()._resolveChallenge('ai', 'human');
      else get().skipChallenge();
    }, 1500);
  },

  pass: () => {
    const state = get();
    if (state.phase !== 'play' || state.currentTurn !== HUMAN_IDX) return;

    const players = [...state.players];
    const human = { ...players[HUMAN_IDX] };
    human.passStreak = (human.passStreak || 0) + 1;
    players[HUMAN_IDX] = human;

    let msg = `You passed (${human.passStreak}/${MAX_PASS_STREAK} max).`;
    if (human.passStreak >= MAX_PASS_STREAK) {
      human.passStreak = 0;
      players[HUMAN_IDX] = human;
      msg = 'Max passes reached! Turn passes automatically.';
    }

    set({ players, selectedCards: [], message: msg });
    get()._nextTurn();
  },

  challenge: () => {
    const state = get();
    if (state.phase !== 'challenge') return;
    set({ phase: 'draw', timer: 0 }); // lock immediately to prevent double-click
    if (state.lastPlay && state.lastPlay.playerId === 'ai') {
      get()._resolveChallenge('human', 'ai');
    }
  },

  skipChallenge: () => {
    const state = get();
    if (state.phase !== 'challenge') return;
    // Briefly reveal the played cards before moving on
    if (state.lastPlay) {
      const blufferName = state.players.find(p => p.id === state.lastPlay!.playerId)?.nickname ?? '';
      const wasBluff = state.lastPlay.isBluff;
      const result: ChallengeResult = {
        success: false,
        challengerId: '',
        blufferId: state.lastPlay.playerId,
        message: wasBluff
          ? `No challenge — ${blufferName} was bluffing!`
          : `No challenge — ${blufferName} was honest.`,
      };
      // 패스 시 선언 조합 점수 적용
      const bonus = getComboBonus(state.lastPlay.declaredType);
      let players = state.players;
      if (bonus > 0) {
        players = players.map(p =>
          p.id === state.lastPlay!.playerId ? { ...p, score: p.score + bonus } : p
        );
      }
      // 로그에 점수 변화 기록
      const passLog = [...state.playLog];
      if (passLog.length > 0 && bonus > 0) {
        passLog[passLog.length - 1] = {
          ...passLog[passLog.length - 1],
          deltas: [{ name: blufferName, delta: bonus }],
        };
      }
      // phase와 challengeResult를 한 번에 set → 중간 렌더 없이 canDraw 방지
      set({ phase: 'draw', timer: 0, players, challengeResult: result, message: result.message, playLog: passLog });
      setTimeout(() => get()._afterChallenge(), 1200);
    } else {
      get()._afterChallenge();
    }
  },

  useNullify: () => {
    // Human uses NL to cancel AI's special card play
    const state = get();
    if (state.phase !== 'nl_counter') return;
    if (!state.lastPlay || state.lastPlay.playerId !== 'ai') return;
    const nlCard = state.players[HUMAN_IDX].hand.find(c => c.rank === 'nullify');
    if (!nlCard) return;
    // Remove NL from human hand; return AI's special cards to AI hand
    const returnedCards = state.lastPlay.cards;
    const players = state.players.map((p, i) => {
      if (i === HUMAN_IDX) { const h = p.hand.filter(c => c.id !== nlCard.id); return { ...p, hand: h, handCount: h.length }; }
      if (i === AI_IDX) { const h = [...p.hand, ...returnedCards]; return { ...p, hand: h, handCount: h.length }; }
      return p;
    });
    set({ players, lastPlay: null, phase: 'draw', timer: 0, selectedCards: [], message: "Nullify! AI's special card is cancelled." });
    get()._nextTurn();
  },

  skipNullify: () => {
    // Human skips NL: apply AI's special effects then nextTurn
    const state = get();
    if (state.phase !== 'nl_counter') return;
    get()._applySpecialAndNext();
  },

  tickTimer: () => {
    const state = get();
    if (state.timer <= 0) return;
    const newTimer = state.timer - 1;
    if (newTimer <= 0) {
      if (state.phase === 'play') {
        if (state.currentTurn === HUMAN_IDX) {
          // Timeout penalty: -2 points
          const players = state.players.map((p, i) =>
            i === HUMAN_IDX ? { ...p, score: p.score - 2 } : p
          );
          set({ timer: 0, players, message: t().msg_timeout });
          get().pass();
        }
      } else if (state.phase === 'challenge') {
        set({ timer: 0 });
        get().skipChallenge();
      } else if (state.phase === 'nl_counter') {
        set({ timer: 0 });
        get().skipNullify();
      }
    } else {
      set({ timer: newTimer });
    }
  },

  playAgain: () => {
    get().startGame();
  },

  aiTakeTurn: () => {
    const state = get();
    if (state.currentTurn !== AI_IDX) return;

    const drawSource = aiChooseDrawSource(state.discardPile);
    let card: Card | undefined;
    let newDrawPile = [...state.drawPile];
    let newDiscardPile = [...state.discardPile];

    if (drawSource === 'discard' && newDiscardPile.length > 0) {
      card = newDiscardPile[newDiscardPile.length - 1];
      newDiscardPile = newDiscardPile.slice(0, -1);
    } else {
      if (newDrawPile.length === 0) {
        get()._endRound();
        return;
      }
      card = newDrawPile[newDrawPile.length - 1];
      newDrawPile = newDrawPile.slice(0, -1);
    }

    if (!card) {
      get()._endRound();
      return;
    }

    const players = [...state.players];
    const ai = { ...players[AI_IDX] };
    ai.hand = [...ai.hand, card];
    ai.handCount = ai.hand.length;
    players[AI_IDX] = ai;

    set({
      drawPile: newDrawPile,
      discardPile: newDiscardPile,
      players,
      message: t().ai_thinking,
    });

    setTimeout(() => {
      const s = get();
      if (s.currentTurn !== AI_IDX) return;

      const aiPlayer = s.players[AI_IDX];
      const aiDecision = aiChoosePlay(aiPlayer.hand, s.lastPlay);

      if (!aiDecision) {
        const updatedPlayers = [...s.players];
        const updatedAi = { ...updatedPlayers[AI_IDX] };
        updatedAi.passStreak = (updatedAi.passStreak || 0) + 1;
        if (updatedAi.passStreak >= MAX_PASS_STREAK) {
          updatedAi.passStreak = 0;
        }
        updatedPlayers[AI_IDX] = updatedAi;
        set({ players: updatedPlayers, message: t().msg_ai_passed });
        get()._nextTurn();
        return;
      }

      const playedHand = buildPlayedHand('ai', aiDecision.cards, aiDecision.declaredType);
      const aiLogEntry: PlayLogEntry = {
        id: Date.now() + 1,
        round: s.round,
        playerName: s.players[AI_IDX].nickname,
        declaredType: aiDecision.declaredType,
        cardCount: aiDecision.cards.length,
        cards: aiDecision.cards,
        challenged: null,
        challengeSuccess: null,
        delta: null,
      };
      const updatedPlayers = [...s.players];
      const updatedAi = { ...updatedPlayers[AI_IDX] };
      updatedAi.hand = updatedAi.hand.filter(c => !aiDecision.cards.find(pc => pc.id === c.id));
      updatedAi.handCount = updatedAi.hand.length;
      updatedAi.passStreak = 0;
      updatedPlayers[AI_IDX] = updatedAi;

      const aiHasNullify = aiDecision.cards.some(c => c.rank === 'nullify');

      const normalAiCards = aiDecision.cards.filter(c => !c.isSpecial);
      const newDiscard = [...s.discardPile, ...normalAiCards];
      const roundEnded = shouldEndRound(updatedPlayers[AI_IDX].hand, s.drawPile);

      if (roundEnded) {
        set({
          players: updatedPlayers,
          discardPile: newDiscard,
          lastPlay: playedHand,
          phase: 'end',
          message: t().msg_ai_round_over,
          playLog: [...s.playLog, aiLogEntry],
        });
        setTimeout(() => get()._endRound(), 1000);
        return;
      }

      // AI NL: only cancel if last play contained a special card
      const lastHasSpecial = s.lastPlay?.cards.some(c => c.isSpecial) ?? false;
      if (aiHasNullify && lastHasSpecial) {
        const nullifiedCards = s.lastPlay ? s.lastPlay.cards : [];
        set({
          players: updatedPlayers,
          discardPile: newDiscard,
          lastPlay: null,
          drawPile: [...s.drawPile, ...nullifiedCards],
          phase: 'draw',
          timer: PLAY_TIMER,
          message: t().msg_ai_nullify_played,
          playLog: [...s.playLog, aiLogEntry],
        });
        get()._nextTurn();
        return;
      }

      // HF/BJ special effect cards: NL counter opportunity for human (RJ is wildcard, no effect to counter)
      const aiPlayedEffectSpecial = aiDecision.cards.some(c => c.rank === 'handoof' || c.rank === 'black_joker');
      if (aiPlayedEffectSpecial) {
        const humanHasNL = updatedPlayers[HUMAN_IDX].hand.some(c => c.rank === 'nullify');
        if (humanHasNL) {
          set({
            players: updatedPlayers, discardPile: newDiscard, lastPlay: playedHand,
            phase: 'nl_counter', timer: CHALLENGE_TIMER,
            message: t().msg_ai_special,
            playLog: [...s.playLog, aiLogEntry],
          });
        } else {
          set({
            players: updatedPlayers, discardPile: newDiscard, lastPlay: playedHand,
            phase: 'draw', timer: PLAY_TIMER,
            message: t().msg_ai_special_no_nl,
            playLog: [...s.playLog, aiLogEntry],
          });
          get()._applySpecialAndNext();
        }
        return;
      }

      // Regular 3-card play: go directly to challenge
      set({
        players: updatedPlayers,
        discardPile: newDiscard,
        lastPlay: playedHand,
        phase: 'challenge',
        timer: CHALLENGE_TIMER,
        message: (() => { const tr = t(); return tr.msg_ai_played(aiDecision.cards.length, tr.hand_types[aiDecision.declaredType as keyof typeof tr.hand_types] ?? aiDecision.declaredType); })(),
        playLog: [...s.playLog, aiLogEntry],
      });
    }, 1200);
  },

  _applySpecialAndNext: () => {
    // Apply deferred HF/BJ effects from lastPlay, then go to nextTurn
    const state = get();
    if (!state.lastPlay) { get()._nextTurn(); return; }
    const cards = state.lastPlay.cards;
    const playerId = state.lastPlay.playerId;
    const playerIdx = playerId === 'human' ? HUMAN_IDX : AI_IDX;
    const opponentIdx = playerIdx === HUMAN_IDX ? AI_IDX : HUMAN_IDX;
    let players = [...state.players];

    const hasHandoof = cards.some(c => c.rank === 'handoof');
    const hasBlackJoker = cards.some(c => c.rank === 'black_joker');

    if (hasHandoof) {
      const tempHand = [...players[opponentIdx].hand];
      players[opponentIdx] = { ...players[opponentIdx], hand: players[playerIdx].hand, handCount: players[playerIdx].hand.length };
      players[playerIdx] = { ...players[playerIdx], hand: tempHand, handCount: tempHand.length };
    }

    if (hasBlackJoker && players[opponentIdx].hand.length > 0) {
      const handCopy = [...players[opponentIdx].hand];
      const stealIdx = Math.floor(Math.random() * handCopy.length);
      const stolen = handCopy.splice(stealIdx, 1)[0];
      players[opponentIdx] = { ...players[opponentIdx], hand: handCopy, handCount: handCopy.length };
      players[playerIdx] = { ...players[playerIdx], hand: [...players[playerIdx].hand, stolen], handCount: players[playerIdx].hand.length + 1 };
    }

    set({ players });
    get()._nextTurn();
  },

  _nextTurn: () => {
    const state = get();
    const nextTurn = getNextTurn(state.currentTurn, state.players.length);
    const playLog = [...state.playLog];
    if (playLog.length > 0 && playLog[playLog.length - 1].challenged === null) {
      playLog[playLog.length - 1] = { ...playLog[playLog.length - 1], challenged: false };
    }
    set({
      currentTurn: nextTurn,
      phase: 'draw',
      timer: PLAY_TIMER,
      selectedCards: [],
      challengeResult: null,
      playLog,
    });

    if (nextTurn === AI_IDX) {
      setTimeout(() => get().aiTakeTurn(), 800);
    } else {
      set({ message: t().msg_your_turn });
    }
  },

  _afterChallenge: () => {
    const state = get();
    const nextTurn = getNextTurn(state.currentTurn, state.players.length);
    const playLog = [...state.playLog];
    if (playLog.length > 0 && playLog[playLog.length - 1].challenged === null) {
      playLog[playLog.length - 1] = { ...playLog[playLog.length - 1], challenged: false };
    }

    set({
      players: state.players,
      currentTurn: nextTurn,
      phase: 'draw',
      timer: PLAY_TIMER,
      selectedCards: [],
      challengeResult: null,
      message: nextTurn === HUMAN_IDX ? t().msg_your_turn : t().ai_thinking,
      playLog,
    });

    if (nextTurn === AI_IDX) {
      setTimeout(() => get().aiTakeTurn(), 800);
    }
  },

  _resolveChallenge: (challengerId: string, blufferId: string) => {
    const state = get();
    const lastPlay = state.lastPlay;
    if (!lastPlay) return;

    const challengeSuccess = lastPlay.isBluff;

    const scoreMap: { [id: string]: number } = {};
    state.players.forEach(p => { scoreMap[p.id] = p.score; });

    const newScores = applyChallengeScores(scoreMap, challengerId, blufferId, challengeSuccess, lastPlay.declaredType);

    let players = state.players.map(p => ({
      ...p,
      score: newScores[p.id] ?? p.score,
    }));

    // If challenge succeeds (bluff caught), return bluffer's played cards (non-special) to their hand
    // AND remove them from the discard pile (they were added there when played)
    let discardPile = state.discardPile;
    if (challengeSuccess && lastPlay.cards.length > 0) {
      const nonSpecialCards = lastPlay.cards.filter(c => !c.isSpecial);
      const returnedIds = new Set(nonSpecialCards.map(c => c.id));
      discardPile = discardPile.filter(c => !returnedIds.has(c.id));
      players = players.map(p =>
        p.id === blufferId
          ? { ...p, hand: [...p.hand, ...nonSpecialCards], handCount: p.hand.length + nonSpecialCards.length }
          : p
      );
    }

    const myDelta = (newScores['human'] ?? 0) - (scoreMap['human'] ?? 0);
    // Build deltas array for all affected players
    const deltasList: Array<{ name: string; delta: number }> = [];
    state.players.forEach(p => {
      const d = (newScores[p.id] ?? 0) - (scoreMap[p.id] ?? 0);
      if (d !== 0) deltasList.push({ name: p.nickname, delta: d });
    });
    const resolvedLog = [...state.playLog];
    if (resolvedLog.length > 0) {
      resolvedLog[resolvedLog.length - 1] = {
        ...resolvedLog[resolvedLog.length - 1],
        challenged: true,
        challengeSuccess: challengeSuccess,
        delta: myDelta,
        deltas: deltasList,
      };
    }

    const challengerName = state.players.find(p => p.id === challengerId)?.nickname ?? challengerId;
    const blufferName = state.players.find(p => p.id === blufferId)?.nickname ?? blufferId;

    let msg: string;
    const penalty = getComboBonus(lastPlay.declaredType);
    const tr = t();
    const typeName = tr.hand_types[lastPlay.declaredType as keyof typeof tr.hand_types] ?? lastPlay.declaredType;
    if (challengeSuccess) {
      msg = tr.msg_bluff_caught(typeName, `${challengerName}+3 / ${blufferName}-${penalty}`);
    } else {
      msg = tr.msg_bluff_held(typeName, `${challengerName}-2 / ${blufferName}+3`);
    }

    const result: ChallengeResult = { success: challengeSuccess, challengerId, blufferId, message: msg };

    // Set timer: 0 to prevent tickTimer from re-triggering during the reveal delay
    set({ players, discardPile, challengeResult: result, message: msg, playLog: resolvedLog, timer: 0 });

    setTimeout(() => get()._afterChallenge(), 2000);
  },

  _endRound: () => {
    const state = get();
    const playLog = [...state.playLog];
    if (playLog.length > 0 && playLog[playLog.length - 1].challenged === null) {
      playLog[playLog.length - 1] = { ...playLog[playLog.length - 1], challenged: false };
    }

    const players = state.players.map(p => {
      const handoutBonus = p.hand.length === 0 ? 5 : 0;
      return { ...p, score: p.score + handoutBonus };
    });

    const winner = players.reduce((a, b) => a.score > b.score ? a : b);
    const roundWinnerName = winner.nickname;

    const nextRound = state.round + 1;

    if (nextRound > TOTAL_ROUNDS) {
      const gameWinnerPlayer = getWinner(players);
      set({
        players,
        phase: 'end',
        roundWinner: roundWinnerName,
        gameWinner: gameWinnerPlayer.nickname,
        screen: 'result',
        message: `Game over! ${gameWinnerPlayer.nickname} wins!`,
        playLog,
      });
      return;
    }

    const deck = buildDeck();
    const { hands, remaining } = dealHands(deck, 2, INITIAL_HAND_SIZE);

    set({
      players: players.map((p, i) => ({
        ...p,
        hand: hands[i],
        handCount: hands[i].length,
        passStreak: 0,
      })),
      drawPile: remaining,
      discardPile: [],
      lastPlay: null,
      round: nextRound,
      currentTurn: HUMAN_IDX,
      phase: 'draw',
      timer: PLAY_TIMER,
      selectedCards: [],
      roundWinner: roundWinnerName,
      challengeResult: null,
      comboAccum: {},
      message: `Round ${nextRound} begins! ${roundWinnerName} won last round. Draw a card.`,
      playLog,
    });
  },
}));
