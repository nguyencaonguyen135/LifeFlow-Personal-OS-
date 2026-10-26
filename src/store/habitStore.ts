// ============================================================
// Habit Store – Zustand
// Manages: habits, habit logs, streaks & completion rates
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Habit, HabitLog } from '@/types';
import { StorageKeys, storageGet, storageSet } from '@/services/storage';
import {
  generateId,
  toISOString,
  toISODateString,
  getTodayString,
} from '@/utils';

export interface HabitStore {
  habits: Habit[];
  habitLogs: HabitLog[];

  // Data Loading
  load: () => void;

  // Habit Actions
  addHabit: (data: Partial<Habit> & { name: string }) => Habit;
  updateHabit: (id: string, data: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;

  // Log Actions
  logHabit: (habitId: string, date: string, count: number, note?: string) => void;

  // Selectors & Calculations
  getStreakForHabit: (habitId: string) => number;
  getHabitLogsForDate: (date: string) => HabitLog[];
  getHabitLogsForHabit: (habitId: string, startDate: string, endDate: string) => HabitLog[];
  isCompletedToday: (habitId: string) => boolean;
  getCompletionRate: (habitId: string, days: number) => number;
}

const USER_ID = 'user_1';

function saveHabits(habits: Habit[]): void {
  storageSet(StorageKeys.HABITS, habits);
}

function saveHabitLogs(logs: HabitLog[]): void {
  storageSet(StorageKeys.HABIT_LOGS, logs);
}

export const useHabitStore = create<HabitStore>()(
  subscribeWithSelector((set, get) => ({
    habits: [],
    habitLogs: [],

    load: () => {
      const habits = storageGet<Habit[]>(StorageKeys.HABITS, []);
      const habitLogs = storageGet<HabitLog[]>(StorageKeys.HABIT_LOGS, []);
      set({ habits, habitLogs });
    },

    addHabit: (data) => {
      const now = toISOString();
      const habit: Habit = {
        icon: '🔥',
        color: '#6366f1',
        frequency: 'daily',
        targetPerDay: 1,
        startDate: getTodayString(),
        isActive: true,
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const habits = [...state.habits, habit];
        saveHabits(habits);
        return { habits };
      });

      return habit;
    },

    updateHabit: (id, data) => {
      const now = toISOString();
      set((state) => {
        const habits = state.habits.map((h) =>
          h.id === id ? { ...h, ...data, updatedAt: now } : h
        );
        saveHabits(habits);
        return { habits };
      });
    },

    deleteHabit: (id) => {
      set((state) => {
        const habits = state.habits.filter((h) => h.id !== id);
        const habitLogs = state.habitLogs.filter((l) => l.habitId !== id);
        saveHabits(habits);
        saveHabitLogs(habitLogs);
        return { habits, habitLogs };
      });
    },

    logHabit: (habitId, date, count, note) => {
      set((state) => {
        const existingIndex = state.habitLogs.findIndex(
          (log) => log.habitId === habitId && log.date === date
        );

        let habitLogs: HabitLog[];

        if (existingIndex >= 0) {
          habitLogs = state.habitLogs.map((log, index) =>
            index === existingIndex
              ? {
                  ...log,
                  completedCount: count,
                  ...(note !== undefined ? { note } : {}),
                }
              : log
          );
        } else {
          const newLog: HabitLog = {
            id: generateId(),
            habitId,
            userId: USER_ID,
            date,
            completedCount: count,
            note,
            createdAt: toISOString(),
          };
          habitLogs = [newLog, ...state.habitLogs];
        }

        saveHabitLogs(habitLogs);
        return { habitLogs };
      });
    },

    getStreakForHabit: (habitId) => {
      const habit = get().habits.find((h) => h.id === habitId);
      if (!habit) return 0;
      const target = habit.targetPerDay || 1;

      const logMap = new Map<string, number>();
      get().habitLogs.forEach((l) => {
        if (l.habitId === habitId) {
          logMap.set(l.date, l.completedCount);
        }
      });

      const today = getTodayString();
      const todayCount = logMap.get(today) ?? 0;

      let streak = 0;
      const d = new Date();

      if (todayCount >= target) {
        // Today is completed, count consecutive days ending today
        while (true) {
          const dateStr = toISODateString(d);
          if ((logMap.get(dateStr) ?? 0) >= target) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
      } else {
        // If today is not yet logged/completed, preserve streak ending yesterday
        d.setDate(d.getDate() - 1);
        while (true) {
          const dateStr = toISODateString(d);
          if ((logMap.get(dateStr) ?? 0) >= target) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
      }

      return streak;
    },

    getHabitLogsForDate: (date) => {
      return get().habitLogs.filter((log) => log.date === date);
    },

    getHabitLogsForHabit: (habitId, startDate, endDate) => {
      return get().habitLogs.filter(
        (log) =>
          log.habitId === habitId &&
          log.date >= startDate &&
          log.date <= endDate
      );
    },

    isCompletedToday: (habitId) => {
      const habit = get().habits.find((h) => h.id === habitId);
      if (!habit) return false;
      const today = getTodayString();
      const log = get().habitLogs.find(
        (l) => l.habitId === habitId && l.date === today
      );
      return (log?.completedCount ?? 0) >= (habit.targetPerDay || 1);
    },

    getCompletionRate: (habitId, days) => {
      if (days <= 0) return 0;
      const habit = get().habits.find((h) => h.id === habitId);
      if (!habit) return 0;
      const target = habit.targetPerDay || 1;

      const logMap = new Map<string, number>();
      get().habitLogs.forEach((l) => {
        if (l.habitId === habitId) {
          logMap.set(l.date, l.completedCount);
        }
      });

      let completedDays = 0;
      const d = new Date();
      for (let i = 0; i < days; i++) {
        const dateStr = toISODateString(d);
        if ((logMap.get(dateStr) ?? 0) >= target) {
          completedDays++;
        }
        d.setDate(d.getDate() - 1);
      }

      return Math.round((completedDays / days) * 100);
    },
  }))
);
