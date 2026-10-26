// ============================================================
// Setting Store – Zustand
// Manages: user profile, system & UI settings, theme management
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { User, UserSetting } from '@/types';
import { StorageKeys, storageGet, storageSet } from '@/services/storage';
import { toISOString } from '@/utils';

export interface SettingStore {
  user: User;
  settings: UserSetting;

  // Data Loading
  load: () => void;

  // Actions
  updateUser: (data: Partial<User>) => void;
  updateSettings: (data: Partial<UserSetting>) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const now = toISOString();

export const DEFAULT_USER: User = {
  id: 'user_1',
  name: 'Người dùng',
  createdAt: now,
  updatedAt: now,
};

export const DEFAULT_SETTINGS: UserSetting = {
  userId: 'user_1',
  currency: 'VND',
  currencySymbol: '₫',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  weekStart: 1,
  timezone: 'Asia/Ho_Chi_Minh',
  theme: 'light',
  colorScheme: 'indigo',
  language: 'vi',
  notifications: {
    taskDeadline: true,
    budgetAlert: true,
    habitReminder: true,
    goalMilestone: true,
    debtDueDate: true,
    eventReminder: true,
    browserNotifications: false,
  },
  dailyGoals: {
    studyHours: 4,
    taskCount: 5,
    habitCount: 3,
  },
  updatedAt: now,
};

function saveUser(user: User): void {
  storageSet(StorageKeys.USER, user);
}

function saveSettings(settings: UserSetting): void {
  storageSet(StorageKeys.SETTINGS, settings);
}

export const useSettingStore = create<SettingStore>()(
  subscribeWithSelector((set, get) => ({
    user: DEFAULT_USER,
    settings: DEFAULT_SETTINGS,

    load: () => {
      const user = storageGet<User>(StorageKeys.USER, DEFAULT_USER);
      const settings = storageGet<UserSetting>(StorageKeys.SETTINGS, DEFAULT_SETTINGS);
      set({ user, settings });
      get().initTheme();
    },

    updateUser: (data) => {
      const updatedUser: User = {
        ...get().user,
        ...data,
        updatedAt: toISOString(),
      };
      saveUser(updatedUser);
      set({ user: updatedUser });
    },

    updateSettings: (data) => {
      const updatedSettings: UserSetting = {
        ...get().settings,
        ...data,
        updatedAt: toISOString(),
      };
      saveSettings(updatedSettings);
      set({ settings: updatedSettings });

      if (data.theme !== undefined) {
        get().initTheme();
      }
    },

    toggleTheme: () => {
      const currentTheme = get().settings.theme;
      const newTheme: 'light' | 'dark' = currentTheme === 'dark' ? 'light' : 'dark';

      if (typeof document !== 'undefined') {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      const updatedSettings: UserSetting = {
        ...get().settings,
        theme: newTheme,
        updatedAt: toISOString(),
      };

      saveSettings(updatedSettings);
      set({ settings: updatedSettings });
    },

    initTheme: () => {
      if (typeof document === 'undefined') return;

      const { theme } = get().settings;
      const isDark =
        theme === 'dark' ||
        (theme === 'system' &&
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
  }))
);
