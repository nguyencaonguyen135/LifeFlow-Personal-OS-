import { create } from 'zustand';
import type { HealthRecord } from '@/types';
import { StorageKeys, storageGet, storageSet } from '@/services/storage';
import { generateId, getTodayString, toISOString } from '@/utils';

const USER_ID = 'user_1';

type HealthRecordInput = Partial<Omit<HealthRecord, 'id' | 'userId' | 'date' | 'createdAt' | 'updatedAt'>>;

interface HealthStore {
  records: HealthRecord[];
  load: () => void;
  getRecord: (date: string) => HealthRecord | undefined;
  upsertRecord: (date: string, data: HealthRecordInput) => void;
  addWater: (date: string, amount: number) => void;
  getRecentRecords: (days: number) => HealthRecord[];
}

const createRecord = (date: string, data: HealthRecordInput = {}): HealthRecord => {
  const now = toISOString();
  return {
    id: generateId(),
    userId: USER_ID,
    date,
    sleepDuration: 0,
    sleepQuality: 0,
    waterMl: 0,
    exerciseMinutes: 0,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
};

const saveRecords = (records: HealthRecord[]) => storageSet(StorageKeys.HEALTH_RECORDS, records);

export const useHealthStore = create<HealthStore>((set, get) => ({
  records: [],

  load: () => {
    set({ records: storageGet<HealthRecord[]>(StorageKeys.HEALTH_RECORDS, []) });
  },

  getRecord: (date) => get().records.find(record => record.date === date),

  upsertRecord: (date, data) => {
    set(state => {
      const existing = state.records.find(record => record.date === date);
      const nextRecord = existing
        ? { ...existing, ...data, updatedAt: toISOString() }
        : createRecord(date, data);
      const records = existing
        ? state.records.map(record => record.date === date ? nextRecord : record)
        : [nextRecord, ...state.records];
      saveRecords(records);
      return { records };
    });
  },

  addWater: (date, amount) => {
    if (amount <= 0) return;
    const current = get().getRecord(date);
    get().upsertRecord(date, { waterMl: (current?.waterMl ?? 0) + amount });
  },

  getRecentRecords: (days) => {
    const records = [...get().records];
    const result: HealthRecord[] = [];
    for (let index = 0; index < days; index += 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const dateString = date.toISOString().slice(0, 10);
      result.push(records.find(record => record.date === dateString) ?? createRecord(dateString));
    }
    return result;
  },
}));

export const getDefaultHealthRecord = (date = getTodayString()): HealthRecord => createRecord(date);
