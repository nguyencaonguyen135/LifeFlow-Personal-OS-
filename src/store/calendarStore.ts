// ============================================================
// Calendar Store – Zustand
// Manages: calendar events, scheduling, upcoming events & conflict checking
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CalendarEvent } from '@/types';
import { StorageKeys, storageGet, storageSet } from '@/services/storage';
import {
  generateId,
  toISOString,
  toISODateString,
  getTodayString,
} from '@/utils';

export interface CalendarStore {
  events: CalendarEvent[];

  // Data Loading
  load: () => void;

  // Event Actions
  addEvent: (data: Partial<CalendarEvent> & { title: string; date: string }) => CalendarEvent;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Selectors & Querying
  getEventsForDate: (date: string) => CalendarEvent[];
  getEventsForDateRange: (start: string, end: string) => CalendarEvent[];
  getUpcomingEvents: (days: number) => CalendarEvent[];
  checkConflict: (
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ) => CalendarEvent[];
}

const USER_ID = 'user_1';

function saveEvents(events: CalendarEvent[]): void {
  storageSet(StorageKeys.CALENDAR_EVENTS, events);
}

export const useCalendarStore = create<CalendarStore>()(
  subscribeWithSelector((set, get) => ({
    events: [],

    load: () => {
      const events = storageGet<CalendarEvent[]>(StorageKeys.CALENDAR_EVENTS, []);
      set({ events });
    },

    addEvent: (data) => {
      const now = toISOString();
      const event: CalendarEvent = {
        type: 'personal',
        isOnline: false,
        color: '#6366f1',
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const events = [event, ...state.events];
        saveEvents(events);
        return { events };
      });

      return event;
    },

    updateEvent: (id, data) => {
      const now = toISOString();
      set((state) => {
        const events = state.events.map((e) =>
          e.id === id ? { ...e, ...data, updatedAt: now } : e
        );
        saveEvents(events);
        return { events };
      });
    },

    deleteEvent: (id) => {
      set((state) => {
        const events = state.events.filter((e) => e.id !== id);
        saveEvents(events);
        return { events };
      });
    },

    getEventsForDate: (date) => {
      return get()
        .events.filter((e) => e.date === date)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    },

    getEventsForDateRange: (start, end) => {
      return get()
        .events.filter((e) => e.date >= start && e.date <= end)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            (a.startTime || '').localeCompare(b.startTime || '')
        );
    },

    getUpcomingEvents: (days) => {
      const today = getTodayString();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.max(0, days));
      const maxDate = toISODateString(targetDate);

      return get()
        .events.filter((e) => e.date >= today && e.date <= maxDate)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            (a.startTime || '').localeCompare(b.startTime || '')
        );
    },

    checkConflict: (date, startTime, endTime, excludeId) => {
      return get().events.filter((event) => {
        if (event.date !== date) return false;
        if (excludeId && event.id === excludeId) return false;
        if (!event.startTime) return false;

        const eventStart = event.startTime;
        const eventEnd = event.endTime || event.startTime;

        if (event.endTime) {
          return startTime < eventEnd && endTime > eventStart;
        } else {
          return eventStart >= startTime && eventStart < endTime;
        }
      });
    },
  }))
);
