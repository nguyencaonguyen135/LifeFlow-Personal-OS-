import { create } from 'zustand';
import { storageGet, storageRemove, storageSet, StorageKeys } from '@/services/storage';
import { generateId, toISOString } from '@/utils';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface AuthStore {
  user: Omit<AuthUser, 'passwordHash'> | null;
  isLoaded: boolean;
  load: () => void;
  getRememberedCredentials: () => { email: string; password: string };
  setRememberedCredentials: (email: string, password: string, remember: boolean) => void;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const accountDataKey = (userId: string) => `lifeflow_account_data_${userId}`;
const dataKeys = Object.values(StorageKeys).filter(key =>
  key !== StorageKeys.AUTH_USERS &&
  key !== StorageKeys.AUTH_SESSION &&
  key !== StorageKeys.AUTH_REMEMBERED_EMAIL &&
  key !== StorageKeys.AUTH_REMEMBERED_PASSWORD &&
  key !== StorageKeys.VERSION
);

function captureAccountData(): void {
  const sessionId = storageGet<string | null>(StorageKeys.AUTH_SESSION, null);
  if (!sessionId) return;
  const snapshot: Record<string, string> = {};
  dataKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) snapshot[key] = value;
  });
  localStorage.setItem(accountDataKey(sessionId), JSON.stringify(snapshot));
}

function saveSnapshotForUser(userId: string): void {
  const snapshot: Record<string, string> = {};
  dataKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) snapshot[key] = value;
  });
  localStorage.setItem(accountDataKey(userId), JSON.stringify(snapshot));
}

function restoreAccountData(userId: string, user: AuthUser): void {
  dataKeys.forEach(key => localStorage.removeItem(key));
  const snapshot = storageGet<Record<string, string> | null>(accountDataKey(userId), null);
  if (snapshot) {
    Object.entries(snapshot).forEach(([key, value]) => localStorage.setItem(key, value));
  }

  const storedUser = storageGet<Record<string, unknown>>(StorageKeys.USER, {});
  storageSet(StorageKeys.USER, {
    ...storedUser,
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: new Date().toISOString(),
  });
}

const hashPassword = async (password: string): Promise<string> => {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
};

const publicUser = (user: AuthUser): Omit<AuthUser, 'passwordHash'> => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

const getUsers = () => storageGet<AuthUser[]>(StorageKeys.AUTH_USERS, []);

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoaded: false,

  load: () => {
    const sessionId = storageGet<string | null>(StorageKeys.AUTH_SESSION, null);
    const user = sessionId ? getUsers().find(item => item.id === sessionId) : undefined;
    set({ user: user ? publicUser(user) : null, isLoaded: true });
  },

  getRememberedCredentials: () => ({
    email: storageGet<string>(StorageKeys.AUTH_REMEMBERED_EMAIL, ''),
    password: storageGet<string>(StorageKeys.AUTH_REMEMBERED_PASSWORD, ''),
  }),

  setRememberedCredentials: (email, password, remember) => {
    if (remember && email.trim() && password) {
      storageSet(StorageKeys.AUTH_REMEMBERED_EMAIL, email.trim().toLowerCase());
      storageSet(StorageKeys.AUTH_REMEMBERED_PASSWORD, password);
    } else {
      storageRemove(StorageKeys.AUTH_REMEMBERED_EMAIL);
      storageRemove(StorageKeys.AUTH_REMEMBERED_PASSWORD);
    }
  },

  register: async (name, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || !normalizedEmail || password.length < 6) {
      return { success: false, error: 'Vui lòng nhập đủ thông tin; mật khẩu cần ít nhất 6 ký tự.' };
    }
    const users = getUsers();
    if (users.some(user => user.email === normalizedEmail)) {
      return { success: false, error: 'Email này đã được đăng ký.' };
    }
    captureAccountData();
    const user: AuthUser = {
      id: generateId(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      createdAt: toISOString(),
    };
    storageSet(StorageKeys.AUTH_USERS, [...users, user]);
    storageSet(StorageKeys.AUTH_SESSION, user.id);
    if (users.length === 0) saveSnapshotForUser(user.id);
    restoreAccountData(user.id, user);
    set({ user: publicUser(user), isLoaded: true });
    return { success: true };
  },

  login: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(password);
    const user = getUsers().find(item => item.email === normalizedEmail && item.passwordHash === passwordHash);
    if (!user) return { success: false, error: 'Email hoặc mật khẩu không chính xác.' };
    captureAccountData();
    storageSet(StorageKeys.AUTH_SESSION, user.id);
    restoreAccountData(user.id, user);
    set({ user: publicUser(user), isLoaded: true });
    return { success: true };
  },

  changePassword: async (currentPassword, newPassword) => {
    const currentUser = get().user;
    if (!currentUser) return { success: false, error: 'Phiên đăng nhập đã hết.' };
    if (newPassword.length < 6) return { success: false, error: 'Mật khẩu mới cần ít nhất 6 ký tự.' };
    const users = getUsers();
    const user = users.find(item => item.id === currentUser.id);
    if (!user || user.passwordHash !== await hashPassword(currentPassword)) {
      return { success: false, error: 'Mật khẩu hiện tại không đúng.' };
    }
    const updatedUser = { ...user, passwordHash: await hashPassword(newPassword) };
    storageSet(StorageKeys.AUTH_USERS, users.map(item => item.id === user.id ? updatedUser : item));
    return { success: true };
  },

  logout: () => {
    captureAccountData();
    storageRemove(StorageKeys.AUTH_SESSION);
    set({ user: null });
  },
}));
