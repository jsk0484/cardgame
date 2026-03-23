import { create } from 'zustand';
import type { GameState, Card, HandType, Player } from '../types';
import type { ChallengeResult } from '../types';
import { buildDeck, dealHands, shuffle } from '../game/deck';
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
import { applyChallengeScores } from '../game/scoring';
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
  tickTimer: () => void;
  playAgain: () => void;
  aiTakeTurn: () => void;
  // Internal helpers exposed on the store type
  _nextTurn: () => void;
  _afterChallenge: () => void;
  _resolveChallenge: (challengerId: string, blufferId: string) => void;
  _endRound: () => void;
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
      message: 'Draw a card to start your turn.',
      challengeResult: null,
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
        if (newDiscardPile.length === 0) return;
        newDrawPile = shuffle([...newDiscardPile]);
        newDiscardPile = [];
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
      message: 'Select 1-3 cards to play, or pass.',
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

    const playedHand = buildPlayedHand('human', playedCards, state.declaredHandType);
    human.hand = human.hand.filter(c => !state.selectedCards.includes(c.id));
    human.handCount = human.hand.length;
    human.passStreak = 0;
    players[HUMAN_IDX] = human;

    const newDiscardPile = [...state.discardPile, ...playedCards];
    const roundEnded = shouldEndRound(human.hand, state.drawPile);

    if (roundEnded) {
      set({
        players,
        discardPile: newDiscardPile,
        lastPlay: playedHand,
        selectedCards: [],
        phase: 'end',
        message: `${human.nickname} played their last card(s)! Round over.`,
      });
      setTimeout(() => get()._endRound(), 1000);
      return;
    }

    set({
      players,
      discardPile: newDiscardPile,
      lastPlay: playedHand,
      selectedCards: [],
      phase: 'challenge',
      timer: CHALLENGE_TIMER,
      message: `You played ${playedCards.length} card(s) as "${state.declaredHandType}". AI can challenge...`,
    });

    // AI challenge decision after brief delay
    setTimeout(() => {
      const s = get();
      if (s.phase !== 'challenge') return;
      const shouldChallenge = aiShouldChallenge(s.lastPlay);
      if (shouldChallenge) {
        get()._resolveChallenge('ai', 'human');
      } else {
        get()._afterChallenge();
      }
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
    if (state.phase !== 'challenge' || state.currentTurn !== HUMAN_IDX) return;
    if (state.lastPlay && state.lastPlay.playerId === 'ai') {
      get()._resolveChallenge('human', 'ai');
    }
  },

  skipChallenge: () => {
    const state = get();
    if (state.phase !== 'challenge') return;
    get()._afterChallenge();
  },

  tickTimer: () => {
    const state = get();
    if (state.timer <= 0) return;
    const newTimer = state.timer - 1;
    if (newTimer <= 0) {
      if (state.phase === 'play') {
        if (state.currentTurn === HUMAN_IDX) {
          set({ timer: 0, message: 'Time up! Auto-passing.' });
          get().pass();
        }
      } else if (state.phase === 'challenge') {
        set({ timer: 0 });
        get().skipChallenge();
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
        if (newDiscardPile.length === 0) {
          get()._endRound();
          return;
        }
        newDrawPile = shuffle([...newDiscardPile]);
        newDiscardPile = [];
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
      message: 'AI is thinking...',
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
        set({ players: updatedPlayers, message: 'AI passed.' });
        get()._nextTurn();
        return;
      }

      const playedHand = buildPlayedHand('ai', aiDecision.cards, aiDecision.declaredType);
      const updatedPlayers = [...s.players];
      const updatedAi = { ...updatedPlayers[AI_IDX] };
      updatedAi.hand = updatedAi.hand.filter(c => !aiDecision.cards.find(pc => pc.id === c.id));
      updatedAi.handCount = updatedAi.hand.length;
      updatedAi.passStreak = 0;
      updatedPlayers[AI_IDX] = updatedAi;

      const newDiscard = [...s.discardPile, ...aiDecision.cards];
      const roundEnded = shouldEndRound(updatedAi.hand, s.drawPile);

      if (roundEnded) {
        set({
          players: updatedPlayers,
          discardPile: newDiscard,
          lastPlay: playedHand,
          phase: 'end',
          message: 'AI played their last card(s)! Round over.',
        });
        setTimeout(() => get()._endRound(), 1000);
        return;
      }

      set({
        players: updatedPlayers,
        discardPile: newDiscard,
        lastPlay: playedHand,
        phase: 'challenge',
        timer: CHALLENGE_TIMER,
        message: `AI played ${aiDecision.cards.length} card(s) as "${aiDecision.declaredType}". Challenge?`,
      });
    }, 1200);
  },

  _nextTurn: () => {
    const state = get();
    const nextTurn = getNextTurn(state.currentTurn, state.players.length);
    set({
      currentTurn: nextTurn,
      phase: 'draw',
      timer: PLAY_TIMER,
      selectedCards: [],
      challengeResult: null,
    });

    if (nextTurn === AI_IDX) {
      setTimeout(() => get().aiTakeTurn(), 800);
    } else {
      set({ message: 'Your turn! Draw a card.' });
    }
  },

  _afterChallenge: () => {
    const state = get();
    const nextTurn = getNextTurn(state.currentTurn, state.players.length);
    set({
      currentTurn: nextTurn,
      phase: 'draw',
      timer: PLAY_TIMER,
      selectedCards: [],
      challengeResult: null,
      message: nextTurn === HUMAN_IDX ? 'Your turn! Draw a card.' : "AI's turn...",
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

    const newScores = applyChallengeScores(scoreMap, challengerId, blufferId, challengeSuccess);

    const players = state.players.map(p => ({
      ...p,
      score: newScores[p.id] ?? p.score,
    }));

    const challengerName = state.players.find(p => p.id === challengerId)?.nickname ?? challengerId;
    const blufferName = state.players.find(p => p.id === blufferId)?.nickname ?? blufferId;

    let msg: string;
    if (challengeSuccess) {
      msg = `Challenge success! ${blufferName} was bluffing! ${challengerName} +3, ${blufferName} -2.`;
    } else {
      msg = `Challenge failed! ${blufferName} was honest. ${challengerName} -2, ${blufferName} +3.`;
    }

    const result: ChallengeResult = { success: challengeSuccess, challengerId, blufferId, message: msg };

    set({ players, challengeResult: result, message: msg });

    setTimeout(() => get()._afterChallenge(), 2000);
  },

  _endRound: () => {
    const state = get();

    const players = state.players.map(p => {
      const handoutBonus = p.hand.length === 0 ? 10 : 0;
      const remainingPenalty = p.hand.reduce((sum, c) => {
        const val = typeof c.rank === 'number' ? c.rank : 5;
        return sum - Math.floor(val / 5);
      }, 0);
      return { ...p, score: p.score + handoutBonus + remainingPenalty };
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
      message: `Round ${nextRound} begins! ${roundWinnerName} won last round. Draw a card.`,
    });
  },
}));
