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

export function addWin(token: string): User | null {
  const userId = tokenMap[token];
  if (!userId) return null;
  const users = loadUsers();
  if (!users[userId]) return null;
  users[userId].wins += 1;
  users[userId].coins += 50;
  saveUsers(users);
  const { passwordHash: _, ...safeUser } = users[userId];
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
