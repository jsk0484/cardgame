import { create } from 'zustand';
import { connectSocket, getSocket } from '../socket';
import { useLangStore } from './langStore';
import type { Card, HandType, PlayLogEntry } from '../types';

const t = () => useLangStore.getState().t;

export type MultiScreen = 'lobby' | 'waiting' | 'game' | 'result';

export interface MultiPlayer {
  id: string;
  nickname: string;
  handCount: number;
  score: number;
  passStreak: number;
  isConnected: boolean;
}

export interface MultiLastPlay {
  playerId: string;
  cardCount: number;
  declaredType: string;
  cards: Card[];
}

interface MultiState {
  screen: MultiScreen;
  roomId: string | null;
  myId: string | null;
  nickname: string;
  players: MultiPlayer[];
  myHand: Card[];
  drawPileCount: number;
  discardPile: Card[];
  lastPlay: MultiLastPlay | null;
  currentPlayerId: string | null;
  phase: string;
  timer: number;
  round: number;
  message: string;
  error: string | null;
  playLog: PlayLogEntry[];
  gameWinner: string | null;
  finalScores: { id: string; nickname: string; score: number }[];
  challengeReveal: boolean;

  setNickname: (n: string) => void;
  createRoom: (isPublic: boolean) => void;
  joinRoom: (roomId: string) => void;
  quickMatch: () => void;
  startGame: () => void;
  drawCard: (from: 'draw' | 'discard') => void;
  playCards: (cards: Card[], declaredType: HandType) => void;
  pass: () => void;
  challenge: () => void;
  skipChallenge: () => void;
  useNullify: () => void;
  skipNullify: () => void;
  sendEmoji: (emoji: string) => void;
  disconnect: () => void;
}

let listenersSetup = false;

export const useMultiStore = create<MultiState>((set, get) => {
  function setupListeners() {
    if (listenersSetup) return;
    listenersSetup = true;

    const socket = getSocket();

    socket.on('room_created', ({ roomId }: { roomId: string }) => {
      set({ roomId, screen: 'waiting' });
    });

    socket.on('room_joined', ({ roomId }: { roomId: string }) => {
      set({ roomId, screen: 'waiting' });
    });

    socket.on('room_updated', (room: any) => {
      const myId = socket.id;
      const me = room.players.find((p: any) => p.id === myId);
      set(s => ({
        players: room.players.map((p: any) => ({
          id: p.id,
          nickname: p.nickname,
          handCount: p.handCount,
          score: p.score,
          passStreak: p.passStreak ?? 0,
          isConnected: p.isConnected,
        })),
        myHand: me?.hand?.length > 0 ? me.hand : s.myHand,
        drawPileCount: room.drawPile.length,
        discardPile: room.discardPile,
        lastPlay: room.lastPlay,
        round: room.round,
        phase: room.phase,
        myId: myId ?? s.myId,
      }));
    });

    socket.on('game_started', ({ hand }: { hand: Card[]; order: string[] }) => {
      set({ myHand: hand, screen: 'game', message: t().msg_game_started, playLog: [] });
    });

    socket.on('turn_started', ({ playerId, phase, timer }: { playerId: string; phase: string; timer: number }) => {
      const myId = socket.id;
      let msg = '';
      if (playerId === myId) {
        if (phase === 'draw') msg = t().msg_your_turn_draw;
        else if (phase === 'challenge') msg = t().msg_challenge_or_pass;
        else if (phase === 'nl_counter') msg = t().msg_use_nullify;
        else msg = t().msg_select_cards;
      } else {
        const player = get().players.find(p => p.id === playerId);
        msg = t().msg_opp_deciding(player?.nickname ?? 'Opponent');
      }
      if (phase === 'draw') {
        const log = get().playLog;
        const playLog = [...log];
        if (playLog.length > 0 && playLog[playLog.length - 1].challenged === null) {
          playLog[playLog.length - 1] = { ...playLog[playLog.length - 1], challenged: false };
        }
        set({ currentPlayerId: playerId, phase, timer, message: msg, playLog, challengeReveal: false });
      } else {
        set({ currentPlayerId: playerId, phase, timer, message: msg });
      }
    });

    socket.on('card_drawn', ({ card }: { playerId: string; from: string; card?: Card }) => {
      if (card) {
        set(s => ({ myHand: [...s.myHand, card] }));
      }
    });

    socket.on('cards_played', ({ playedHand }: any) => {
      const state = get();
      const playerName = state.players.find(p => p.id === playedHand.playerId)?.nickname ?? playedHand.playerId;
      const newEntry: PlayLogEntry = {
        id: Date.now(),
        round: state.round,
        playerName,
        declaredType: playedHand.declaredType,
        cardCount: playedHand.cardCount ?? playedHand.cards?.length ?? 0,
        cards: playedHand.cards ?? [],
        challenged: null,
        challengeSuccess: null,
        delta: null,
      };
      set(s => ({
        lastPlay: {
          playerId: playedHand.playerId,
          cardCount: playedHand.cardCount ?? playedHand.cards?.length ?? 0,
          declaredType: playedHand.declaredType,
          cards: playedHand.cards ?? [],
        },
        playLog: [...s.playLog, newEntry],
      }));
    });

    socket.on('challenge_result', ({ success, actualType, scoreDeltas, cards }: any) => {
      const myId = socket.id;
      const delta = scoreDeltas[myId ?? ''] ?? 0;
      const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
      const tr = t();
      const handTypeName = tr.hand_types[actualType as keyof typeof tr.hand_types] ?? actualType;
      set(s => {
        const playLog = [...s.playLog];
        if (playLog.length > 0) {
          playLog[playLog.length - 1] = {
            ...playLog[playLog.length - 1],
            challenged: true,
            challengeSuccess: success,
            delta,
          };
        }
        return {
          lastPlay: s.lastPlay ? { ...s.lastPlay, cards: cards ?? s.lastPlay.cards } : null,
          challengeReveal: true,
          message: success
            ? t().msg_bluff_caught(handTypeName, deltaStr)
            : t().msg_bluff_held(handTypeName, deltaStr),
          playLog,
        };
      });
    });

    socket.on('round_ended', () => {
      set({ message: t().msg_round_over });
    });

    socket.on('game_ended', ({ winner, finalScores }: { winner: string; finalScores: { id: string; nickname: string; score: number }[] }) => {
      set({ gameWinner: winner, finalScores, screen: 'result' });
    });

    socket.on('timer_tick', ({ seconds }: { seconds: number }) => {
      set({ timer: seconds });
    });

    socket.on('player_disconnected', ({ playerId }: { playerId: string }) => {
      set(s => ({
        players: s.players.map(p =>
          p.id === playerId ? { ...p, isConnected: false } : p
        ),
        message: t().msg_player_dc,
      }));
    });

    socket.on('nl_opportunity', ({ playerId }: { playerId: string }) => {
      const myId = socket.id;
      if (playerId === myId) {
        set({ phase: 'nl_counter', message: t().msg_use_nullify });
      } else {
        set({ phase: 'nl_counter', message: t().waiting_nullify_opp });
      }
    });

    socket.on('nl_used', () => {
      set({ lastPlay: null, message: t().msg_nullify_used });
    });

    socket.on('player_passed', ({ playerId }: { playerId: string }) => {
      const player = get().players.find(p => p.id === playerId);
      set({ message: t().msg_passed(player?.nickname ?? 'Opponent') });
    });

    socket.on('emoji_sent', ({ playerId, emoji }: { playerId: string; emoji: string }) => {
      const player = get().players.find(p => p.id === playerId);
      set({ message: `${player?.nickname ?? 'Player'}: ${emoji}` });
    });

    socket.on('error', ({ code, message }: { code: string; message: string }) => {
      set({ error: `${code}: ${message}` });
      setTimeout(() => set({ error: null }), 3000);
    });
  }

  return {
    screen: 'lobby',
    roomId: null,
    myId: null,
    nickname: 'Player',
    players: [],
    myHand: [],
    drawPileCount: 0,
    discardPile: [],
    lastPlay: null,
    currentPlayerId: null,
    phase: 'draw',
    timer: 20,
    round: 1,
    message: '',
    error: null,
    playLog: [],
    gameWinner: null,
    finalScores: [],
    challengeReveal: false,

    setNickname: (n) => set({ nickname: n }),

    createRoom: (isPublic) => {
      const socket = connectSocket();
      setupListeners();
      socket.once('connect', () => {
        set({ myId: socket.id ?? null });
      });
      if (socket.connected) set({ myId: socket.id ?? null });
      socket.emit('create_room', { nickname: get().nickname, isPublic });
    },

    joinRoom: (roomId) => {
      const socket = connectSocket();
      setupListeners();
      if (socket.connected) set({ myId: socket.id ?? null });
      socket.once('connect', () => {
        set({ myId: socket.id ?? null });
      });
      socket.emit('join_room', { roomId, nickname: get().nickname });
    },

    quickMatch: () => {
      const socket = connectSocket();
      setupListeners();
      if (socket.connected) set({ myId: socket.id ?? null });
      socket.once('connect', () => {
        set({ myId: socket.id ?? null });
        socket.emit('join_room', { roomId: 'quick', nickname: get().nickname });
      });
      if (socket.connected) {
        socket.emit('join_room', { roomId: 'quick', nickname: get().nickname });
      }
    },

    startGame: () => {
      getSocket().emit('ready');
    },

    drawCard: (from) => getSocket().emit('draw_card', { from }),
    playCards: (cards, declaredType) => getSocket().emit('play_cards', { cards, declaredType }),
    pass: () => getSocket().emit('pass'),
    challenge: () => getSocket().emit('challenge'),
    skipChallenge: () => getSocket().emit('skip_challenge'),
    useNullify: () => getSocket().emit('use_nl'),
    skipNullify: () => getSocket().emit('skip_nl'),
    sendEmoji: (emoji) => getSocket().emit('send_emoji', { emoji }),

    disconnect: () => {
      listenersSetup = false;
      getSocket().disconnect();
      set({
        screen: 'lobby',
        roomId: null,
        myId: null,
        players: [],
        myHand: [],
        lastPlay: null,
        gameWinner: null,
        finalScores: [],
        message: '',
        error: null,
      });
    },
  };
});
