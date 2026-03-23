import { GameRoom } from './types';

const rooms = new Map<string, GameRoom>();

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(id) ? generateRoomId() : id;
}

export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId);
}

export function setRoom(room: GameRoom): void {
  rooms.set(room.roomId, room);
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

export function getAllRooms(): GameRoom[] {
  return Array.from(rooms.values());
}

export function getPublicWaitingRoom(): GameRoom | undefined {
  return Array.from(rooms.values()).find(
    r => r.isPublic && r.status === 'waiting' && r.players.length < 4
  );
}
