import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { buildDeck, dealHands } from './game/deck';
import { calcRoundScore, applyChallengeScores, determineActualHandType } from './game/scoring';
import { generateRoomId, getRoom, setRoom, deleteRoom, getPublicWaitingRoom, getAllRooms } from './rooms';
import { Card, GameRoom, HandType, PlayedHand } from './types';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PLAY_TIMER = 20;
const CHALLENGE_TIMER = 10;
const TOTAL_ROUNDS = 3;
const INITIAL_HAND_SIZE = 7;

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// Get public rooms list
app.get('/rooms', (_, res) => {
  const publicRooms = getAllRooms()
    .filter(r => r.isPublic && r.status === 'waiting')
    .map(r => ({ roomId: r.roomId, playerCount: r.players.length }));
  res.json(publicRooms);
});

function buildPlayedHand(playerId: string, cards: Card[], declaredType: HandType): PlayedHand {
  const hasRedJoker = cards.some(c => c.rank === 'red_joker');
  const actualType = determineActualHandType(cards);
  const isBluff = hasRedJoker ? false : declaredType !== actualType;
  return { playerId, cards, declaredType, actualType, isBluff };
}

function startTurnTimer(room: GameRoom, duration: number, onExpire: () => void) {
  if (room.timerInterval) clearInterval(room.timerInterval);
  room.turnTimer = duration;
  room.timerInterval = setInterval(() => {
    room.turnTimer--;
    io.to(room.roomId).emit('timer_tick', { seconds: room.turnTimer });
    if (room.turnTimer <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.timerInterval = null;
      onExpire();
    }
  }, 1000);
}

function stopTimer(room: GameRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
}

function broadcastRoom(room: GameRoom) {
  // Send each player their own hand; others get empty hand (handCount still reflects real count)
  room.players.forEach(player => {
    const sanitized = {
      roomId: room.roomId,
      isPublic: room.isPublic,
      status: room.status,
      round: room.round,
      currentTurn: room.currentTurn,
      phase: room.phase,
      drawPile: room.drawPile,
      discardPile: room.discardPile,
      lastPlay: room.lastPlay,
      turnTimer: room.turnTimer,
      players: room.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        handCount: p.handCount,
        score: p.score,
        passStreak: p.passStreak,
        isConnected: p.isConnected,
        hand: p.id === player.id ? p.hand : [],
      })),
    };
    io.to(player.id).emit('room_updated', sanitized);
  });
}

function nextTurn(room: GameRoom) {
  room.currentTurn = (room.currentTurn + 1) % room.players.length;
  room.phase = 'draw';
  room.turnTimer = PLAY_TIMER;
  setRoom(room);
  io.to(room.roomId).emit('turn_started', {
    playerId: room.players[room.currentTurn].id,
    phase: 'draw',
    timer: PLAY_TIMER,
  });
  broadcastRoom(room);
}

function endRound(room: GameRoom) {
  stopTimer(room);
  room.players = room.players.map(p => {
    const isHandout = p.hand.length === 0;
    const roundScore = calcRoundScore(p.hand, isHandout);
    return { ...p, score: p.score + roundScore };
  });

  const nextRound = room.round + 1;
  if (nextRound > TOTAL_ROUNDS) {
    const winner = room.players.reduce((a, b) => (a.score > b.score ? a : b));
    room.status = 'finished';
    room.phase = 'end';
    setRoom(room);
    const finalScores = room.players.map(p => ({ id: p.id, nickname: p.nickname, score: p.score }));
    io.to(room.roomId).emit('game_ended', { winner: winner.nickname, finalScores });
    return;
  }

  const deck = buildDeck();
  const { hands, remaining } = dealHands(deck, room.players.length, INITIAL_HAND_SIZE);
  room.players = room.players.map((p, i) => ({
    ...p,
    hand: hands[i],
    handCount: hands[i].length,
    passStreak: 0,
  }));
  room.drawPile = remaining;
  room.discardPile = [];
  room.lastPlay = null;
  room.round = nextRound;
  room.currentTurn = 0;
  room.phase = 'draw';
  setRoom(room);

  const scores = room.players.map(p => ({ id: p.id, nickname: p.nickname, score: p.score }));
  io.to(room.roomId).emit('round_ended', { scores });
  setTimeout(() => {
    broadcastRoom(room);
    io.to(room.roomId).emit('turn_started', {
      playerId: room.players[0].id,
      phase: 'draw',
      timer: PLAY_TIMER,
    });
  }, 1500);
}

function startChallengePhase(room: GameRoom, playedHand: PlayedHand) {
  room.phase = 'challenge';
  room.lastPlay = playedHand;
  room.turnTimer = CHALLENGE_TIMER;
  setRoom(room);

  const opponentIdx = (room.currentTurn + 1) % room.players.length;
  const opponent = room.players[opponentIdx];

  // Emit played hand without bluff info (hide isBluff and actualType from clients)
  io.to(room.roomId).emit('cards_played', {
    playedHand: {
      playerId: playedHand.playerId,
      cardCount: playedHand.cards.length,
      declaredType: playedHand.declaredType,
    },
  });
  io.to(room.roomId).emit('turn_started', {
    playerId: opponent.id,
    phase: 'challenge',
    timer: CHALLENGE_TIMER,
  });

  startTurnTimer(room, CHALLENGE_TIMER, () => {
    // Auto skip challenge on timeout
    skipChallenge(room);
  });
}

function skipChallenge(room: GameRoom) {
  stopTimer(room);
  nextTurn(room);
  // Timer will start when the next player draws
}

function resolveChallenge(room: GameRoom, challengerId: string) {
  stopTimer(room);
  const lastPlay = room.lastPlay!;
  const challengeSuccess = lastPlay.isBluff;
  const blufferId = lastPlay.playerId;

  const scoreMap: { [id: string]: number } = {};
  room.players.forEach(p => {
    scoreMap[p.id] = p.score;
  });
  const newScores = applyChallengeScores(scoreMap, challengerId, blufferId, challengeSuccess);
  room.players = room.players.map(p => ({ ...p, score: newScores[p.id] ?? p.score }));

  const scoreDeltas: { [id: string]: number } = {};
  room.players.forEach(p => {
    scoreDeltas[p.id] = (newScores[p.id] ?? 0) - (scoreMap[p.id] ?? 0);
  });

  setRoom(room);
  io.to(room.roomId).emit('challenge_result', {
    success: challengeSuccess,
    actualType: lastPlay.actualType,
    cards: lastPlay.cards,
    scoreDeltas,
  });

  setTimeout(() => {
    nextTurn(room);
  }, 2000);
}

function startGame(room: GameRoom) {
  const deck = buildDeck();
  const { hands, remaining } = dealHands(deck, room.players.length, INITIAL_HAND_SIZE);
  room.players = room.players.map((p, i) => ({
    ...p,
    hand: hands[i],
    handCount: hands[i].length,
  }));
  room.drawPile = remaining;
  room.status = 'playing';
  room.round = 1;
  room.currentTurn = 0;
  room.phase = 'draw';
  setRoom(room);

  const order = room.players.map(p => p.id);
  room.players.forEach(p => {
    io.to(p.id).emit('game_started', { hand: p.hand, order });
  });
  broadcastRoom(room);
  io.to(room.roomId).emit('turn_started', {
    playerId: room.players[0].id,
    phase: 'draw',
    timer: PLAY_TIMER,
  });
}

function findPlayerRoom(socketId: string): GameRoom | undefined {
  return getAllRooms().find(r => r.players.some(p => p.id === socketId));
}

function handlePass(room: GameRoom, playerId: string) {
  stopTimer(room);
  if (room.phase !== 'play') return;
  const playerIdx = room.players.findIndex(p => p.id === playerId);
  if (playerIdx < 0) return;
  room.players[playerIdx].passStreak++;
  setRoom(room);
  io.to(room.roomId).emit('player_passed', { playerId });
  nextTurn(room);
}

io.on('connection', socket => {
  console.log('connected:', socket.id);

  socket.on('create_room', ({ nickname, isPublic }: { nickname: string; isPublic: boolean }) => {
    const roomId = generateRoomId();
    const deck = buildDeck();
    const room: GameRoom = {
      roomId,
      isPublic,
      players: [
        {
          id: socket.id,
          nickname: nickname || 'Player',
          hand: [],
          handCount: 0,
          score: 0,
          passStreak: 0,
          isConnected: true,
        },
      ],
      status: 'waiting',
      round: 1,
      currentTurn: 0,
      phase: 'draw',
      drawPile: deck,
      discardPile: [],
      lastPlay: null,
      turnTimer: PLAY_TIMER,
      timerInterval: null,
    };
    setRoom(room);
    socket.join(roomId);
    socket.emit('room_created', { roomId });
    broadcastRoom(room);
  });

  socket.on('join_room', ({ roomId, nickname }: { roomId: string; nickname: string }) => {
    let room: GameRoom | undefined;

    if (roomId === 'quick') {
      room = getPublicWaitingRoom();
      if (!room) {
        // Create a new public room
        const newId = generateRoomId();
        const deck = buildDeck();
        room = {
          roomId: newId,
          isPublic: true,
          players: [],
          status: 'waiting',
          round: 1,
          currentTurn: 0,
          phase: 'draw',
          drawPile: deck,
          discardPile: [],
          lastPlay: null,
          turnTimer: PLAY_TIMER,
          timerInterval: null,
        };
        setRoom(room);
      }
    } else {
      room = getRoom(roomId);
    }

    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }
    if (room.status !== 'waiting') {
      socket.emit('error', { code: 'GAME_IN_PROGRESS', message: 'Game already started' });
      return;
    }
    if (room.players.length >= 4) {
      socket.emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
      return;
    }
    if (room.players.find(p => p.id === socket.id)) {
      socket.emit('error', { code: 'ALREADY_JOINED', message: 'Already in room' });
      return;
    }

    room.players.push({
      id: socket.id,
      nickname: nickname || 'Player',
      hand: [],
      handCount: 0,
      score: 0,
      passStreak: 0,
      isConnected: true,
    });
    setRoom(room);
    socket.join(room.roomId);
    socket.emit('room_joined', { roomId: room.roomId });
    broadcastRoom(room);

    // Auto-start for quick match when 2+ players after 10s, or immediately if 4
    if (room.isPublic && room.players.length >= 2) {
      const targetRoomId = room.roomId;
      const delay = room.players.length >= 4 ? 0 : 10000;
      setTimeout(() => {
        const r = getRoom(targetRoomId);
        if (r && r.status === 'waiting' && r.players.length >= 2) {
          startGame(r);
        }
      }, delay);
    }
  });

  socket.on('ready', () => {
    const room = findPlayerRoom(socket.id);
    if (!room || room.status !== 'waiting') return;
    // Host can start game manually with 2+ players
    if (room.players[0].id === socket.id && room.players.length >= 2) {
      startGame(room);
    }
  });

  socket.on('draw_card', ({ from }: { from: 'draw' | 'discard' }) => {
    const room = findPlayerRoom(socket.id);
    if (!room || room.status !== 'playing') return;
    if (room.players[room.currentTurn].id !== socket.id) {
      socket.emit('error', { code: 'NOT_YOUR_TURN', message: 'Not your turn' });
      return;
    }
    if (room.phase !== 'draw') {
      socket.emit('error', { code: 'INVALID_PHASE', message: 'Not draw phase' });
      return;
    }

    let card: Card | undefined;
    if (from === 'discard') {
      if (room.discardPile.length === 0) {
        socket.emit('error', { code: 'EMPTY_PILE', message: 'Discard pile empty' });
        return;
      }
      card = room.discardPile[room.discardPile.length - 1];
      room.discardPile = room.discardPile.slice(0, -1);
    } else {
      if (room.drawPile.length === 0) {
        endRound(room);
        return;
      }
      card = room.drawPile[room.drawPile.length - 1];
      room.drawPile = room.drawPile.slice(0, -1);
    }

    const playerIdx = room.players.findIndex(p => p.id === socket.id);
    room.players[playerIdx].hand.push(card);
    room.players[playerIdx].handCount = room.players[playerIdx].hand.length;
    room.phase = 'play';
    setRoom(room);

    socket.emit('card_drawn', { playerId: socket.id, from, card });
    io.to(room.roomId).emit('turn_started', { playerId: socket.id, phase: 'play', timer: PLAY_TIMER });
    broadcastRoom(room);

    startTurnTimer(room, PLAY_TIMER, () => {
      // Auto pass on timeout
      handlePass(room, socket.id);
    });
  });

  socket.on('play_cards', ({ cards, declaredType }: { cards: Card[]; declaredType: HandType }) => {
    const room = findPlayerRoom(socket.id);
    if (!room || room.status !== 'playing') return;
    if (room.players[room.currentTurn].id !== socket.id) {
      socket.emit('error', { code: 'NOT_YOUR_TURN', message: 'Not your turn' });
      return;
    }
    if (room.phase !== 'play') {
      socket.emit('error', { code: 'INVALID_PHASE', message: 'Not play phase' });
      return;
    }

    stopTimer(room);
    const playerIdx = room.players.findIndex(p => p.id === socket.id);
    const player = room.players[playerIdx];

    // Validate cards are in hand
    const validCards = cards.filter(c => player.hand.find(h => h.id === c.id));
    if (validCards.length === 0) {
      socket.emit('error', { code: 'INVALID_CARDS', message: 'Cards not in hand' });
      return;
    }

    const playedHand = buildPlayedHand(socket.id, validCards, declaredType);

    // Remove cards from hand
    player.hand = player.hand.filter(c => !validCards.find(vc => vc.id === c.id));
    player.handCount = player.hand.length;
    player.passStreak = 0;

    // Handle special effects
    const hasHandoof = validCards.some(c => c.rank === 'handoof');
    const hasNullify = validCards.some(c => c.rank === 'nullify');
    const hasBlackJoker = validCards.some(c => c.rank === 'black_joker');

    if (hasHandoof && room.players.length >= 2) {
      const opponentIdx = (playerIdx + 1) % room.players.length;
      const tempHand = [...room.players[opponentIdx].hand];
      room.players[opponentIdx].hand = player.hand;
      room.players[opponentIdx].handCount = player.hand.length;
      player.hand = tempHand;
      player.handCount = tempHand.length;
    }

    if (hasBlackJoker) {
      const opponentIdx = (playerIdx + 1) % room.players.length;
      if (room.players[opponentIdx].hand.length > 0) {
        const stealIdx = Math.floor(Math.random() * room.players[opponentIdx].hand.length);
        room.players[opponentIdx].hand.splice(stealIdx, 1);
        room.players[opponentIdx].handCount--;
      }
    }

    room.discardPile.push(...validCards);

    if (hasNullify && room.lastPlay) {
      room.drawPile.push(...room.lastPlay.cards);
      room.lastPlay = null;
      setRoom(room);
      io.to(room.roomId).emit('cards_played', { playedHand: {
        playerId: playedHand.playerId,
        cardCount: playedHand.cards.length,
        declaredType: playedHand.declaredType,
      }});
      nextTurn(room);
      return;
    }

    if (player.hand.length === 0 || room.drawPile.length === 0) {
      setRoom(room);
      io.to(room.roomId).emit('cards_played', { playedHand: {
        playerId: playedHand.playerId,
        cardCount: playedHand.cards.length,
        declaredType: playedHand.declaredType,
      }});
      setTimeout(() => endRound(room), 1000);
      return;
    }

    startChallengePhase(room, playedHand);
  });

  socket.on('pass', () => {
    const room = findPlayerRoom(socket.id);
    if (!room) return;
    handlePass(room, socket.id);
  });

  socket.on('challenge', () => {
    const room = findPlayerRoom(socket.id);
    if (!room || room.phase !== 'challenge') return;
    if (!room.lastPlay) return;
    const lastPlayerIdx = room.players.findIndex(p => p.id === room.lastPlay!.playerId);
    const expectedChallengerIdx = (lastPlayerIdx + 1) % room.players.length;
    if (room.players[expectedChallengerIdx].id !== socket.id) {
      socket.emit('error', { code: 'NOT_YOUR_TURN', message: 'Not your challenge turn' });
      return;
    }
    resolveChallenge(room, socket.id);
  });

  socket.on('skip_challenge', () => {
    const room = findPlayerRoom(socket.id);
    if (!room || room.phase !== 'challenge') return;
    skipChallenge(room);
  });

  socket.on('send_emoji', ({ emoji }: { emoji: string }) => {
    const room = findPlayerRoom(socket.id);
    if (!room) return;
    io.to(room.roomId).emit('emoji_sent', { playerId: socket.id, emoji });
  });

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    const room = findPlayerRoom(socket.id);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.isConnected = false;
      setRoom(room);
      io.to(room.roomId).emit('player_disconnected', {
        playerId: socket.id,
        reconnectDeadline: Date.now() + 60000,
      });
    }
    // Clean up empty waiting rooms
    if (room.status === 'waiting' && room.players.every(p => !p.isConnected)) {
      deleteRoom(room.roomId);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`HANDOOF server running on port ${PORT}`));
