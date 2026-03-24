import { create } from 'zustand';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL ?? 'https://cardgame-production-0f69.up.railway.app';
const TOKEN_KEY = 'handoof_token';

export interface AuthUser {
  id: string;
  username: string;
  nickname: string;
  wins: number;
  coins: number;
  ownedItems: string[];
  selectedCardBack: string;
  selectedCardEmoji: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  register: (username: string, password: string, nickname: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  restore: () => Promise<void>;
  recordWin: () => Promise<void>;
  buyItem: (itemId: string, price: number) => Promise<boolean>;
  selectItem: (itemId: string, type: 'card_back' | 'card_emoji') => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  register: async (username, password, nickname) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nickname }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error === 'USERNAME_TAKEN' ? '이미 사용 중인 아이디입니다.' :
                    data.error === 'USERNAME_TOO_SHORT' ? '아이디는 3자 이상이어야 합니다.' :
                    data.error === 'PASSWORD_TOO_SHORT' ? '비밀번호는 4자 이상이어야 합니다.' :
                    '회원가입 실패.';
        set({ error: msg, loading: false });
        return false;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch {
      set({ error: '서버 연결 실패.', loading: false });
      return false;
    }
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: '아이디 또는 비밀번호가 틀렸습니다.', loading: false });
        return false;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch {
      set({ error: '서버 연결 실패.', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null });
  },

  restore: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, token });
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {}
  },

  recordWin: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/win`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user });
      }
    } catch {}
  },

  buyItem: async (itemId: string, price: number) => {
    const { token } = get();
    if (!token) return false;
    try {
      const res = await fetch(`${BACKEND_URL}/api/shop/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId, price }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  selectItem: async (itemId: string, type: 'card_back' | 'card_emoji') => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/shop/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId, type }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user });
      }
    } catch {}
  },

  clearError: () => set({ error: null }),
}));
