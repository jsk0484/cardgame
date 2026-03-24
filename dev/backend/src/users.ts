import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  nickname: string;
  wins: number;
  coins: number;
  ownedItems: string[];
  selectedCardBack: string;
  selectedCardEmoji: string;
  createdAt: number;
}

const DATA_FILE = path.join(__dirname, '../../users.json');

function loadUsers(): { [id: string]: User } {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveUsers(users: { [id: string]: User }): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch {}
}

// Token → userId map (in-memory, resets on restart - OK for simplicity)
const tokenMap: { [token: string]: string } = {};

export async function registerUser(username: string, password: string, nickname: string): Promise<{ user: User; token: string } | { error: string }> {
  const users = loadUsers();
  // Check duplicate username
  const exists = Object.values(users).find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) return { error: 'USERNAME_TAKEN' };
  if (username.length < 3) return { error: 'USERNAME_TOO_SHORT' };
  if (password.length < 4) return { error: 'PASSWORD_TOO_SHORT' };

  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = {
    id: randomUUID(),
    username,
    passwordHash,
    nickname: nickname || username,
    wins: 0,
    coins: 0,
    ownedItems: [],
    selectedCardBack: '',
    selectedCardEmoji: '',
    createdAt: Date.now(),
  };
  users[user.id] = user;
  saveUsers(users);

  const token = randomUUID();
  tokenMap[token] = user.id;
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser as User, token };
}

export async function loginUser(username: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
  const users = loadUsers();
  const user = Object.values(users).find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return { error: 'INVALID_CREDENTIALS' };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: 'INVALID_CREDENTIALS' };

  const token = randomUUID();
  tokenMap[token] = user.id;
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser as User, token };
}

export function getUserByToken(token: string): User | null {
  const userId = tokenMap[token];
  if (!userId) return null;
  const users = loadUsers();
  const user = users[userId];
  if (!user) return null;
  const { passwordHash: _, ...safeUser } = user;
  return safeUser as User;
}

export function addWin(token: string, coins: number): User | null {
  const userId = tokenMap[token];
  if (!userId) return null;
  const users = loadUsers();
  if (!users[userId]) return null;
  users[userId].wins += 1;
  users[userId].coins += coins;
  saveUsers(users);
  const { passwordHash: _, ...safeUser } = users[userId];
  return safeUser as User;
}

export function buyItem(token: string, itemId: string, price: number): User | { error: string } | null {
  const userId = tokenMap[token];
  if (!userId) return null;
  const users = loadUsers();
  const u = users[userId];
  if (!u) return null;
  if (!u.ownedItems) u.ownedItems = [];
  if (u.ownedItems.includes(itemId)) return { error: 'ALREADY_OWNED' };
  if ((u.coins ?? 0) < price) return { error: 'NOT_ENOUGH_COINS' };
  u.coins -= price;
  u.ownedItems.push(itemId);
  saveUsers(users);
  const { passwordHash: _, ...safeUser } = u;
  return safeUser as User;
}

export function selectItem(token: string, itemId: string, type: 'card_back' | 'card_emoji'): User | null {
  const userId = tokenMap[token];
  if (!userId) return null;
  const users = loadUsers();
  const u = users[userId];
  if (!u) return null;
  // Allow empty string to deselect
  if (itemId !== '' && !u.ownedItems?.includes(itemId)) return null;
  if (type === 'card_back') u.selectedCardBack = itemId;
  else u.selectedCardEmoji = itemId;
  saveUsers(users);
  const { passwordHash: _, ...safeUser } = u;
  return safeUser as User;
}

export function addCoins(token: string, amount: number): User | null {
  const userId = tokenMap[token];
  if (!userId) return null;
  const users = loadUsers();
  if (!users[userId]) return null;
  users[userId].coins += amount;
  saveUsers(users);
  const { passwordHash: _, ...safeUser } = users[userId];
  return safeUser as User;
}
