// ============================================================
// Storage Service – localStorage abstraction
// All data is stored under a single key per entity type
// ============================================================

const PREFIX = 'lifeflow_';
const VERSION = '1.0.0';

export const StorageKeys = {
  USER: `${PREFIX}user`,
  SETTINGS: `${PREFIX}settings`,
  ACCOUNTS: `${PREFIX}accounts`,
  CATEGORIES: `${PREFIX}categories`,
  TRANSACTIONS: `${PREFIX}transactions`,
  BUDGETS: `${PREFIX}budgets`,
  SAVINGS_GOALS: `${PREFIX}savings_goals`,
  DEBTS: `${PREFIX}debts`,
  TASKS: `${PREFIX}tasks`,
  PROJECTS: `${PREFIX}projects`,
  CALENDAR_EVENTS: `${PREFIX}calendar_events`,
  SUBJECTS: `${PREFIX}subjects`,
  SCHEDULE_ENTRIES: `${PREFIX}schedule_entries`,
  ASSIGNMENTS: `${PREFIX}assignments`,
  EXAMS: `${PREFIX}exams`,
  STUDY_SESSIONS: `${PREFIX}study_sessions`,
  HABITS: `${PREFIX}habits`,
  HABIT_LOGS: `${PREFIX}habit_logs`,
  PERSONAL_GOALS: `${PREFIX}personal_goals`,
  NOTIFICATIONS: `${PREFIX}notifications`,
  VERSION: `${PREFIX}version`,
} as const;

export function storageGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[Storage] Failed to parse key: ${key}`);
    return defaultValue;
  }
}

export function storageSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[Storage] Failed to set key: ${key}`, e);
    return false;
  }
}

export function storageRemove(key: string): void {
  localStorage.removeItem(key);
}

export function storageClear(): void {
  Object.values(StorageKeys).forEach(key => localStorage.removeItem(key));
}

export function storageExport(): string {
  const data: Record<string, unknown> = { version: VERSION, exportedAt: new Date().toISOString() };
  Object.entries(StorageKeys).forEach(([name, key]) => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { data[name] = JSON.parse(raw); } catch { data[name] = raw; }
    }
  });
  return JSON.stringify(data, null, 2);
}

export function storageImport(jsonString: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString) as Record<string, unknown>;
    
    // Map name -> key
    const nameToKey = Object.entries(StorageKeys).reduce((acc, [name, key]) => {
      acc[name] = key;
      return acc;
    }, {} as Record<string, string>);

    Object.entries(data).forEach(([name, value]) => {
      if (name === 'version' || name === 'exportedAt') return;
      const key = nameToKey[name];
      if (key) {
        storageSet(key, value);
      }
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export function getStorageSize(): string {
  let total = 0;
  Object.values(StorageKeys).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) total += item.length * 2; // UTF-16 characters = 2 bytes
  });
  
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
}
