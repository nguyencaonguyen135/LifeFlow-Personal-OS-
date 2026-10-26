// ============================================================
// Study Store – Zustand
// Manages: subjects, schedule entries, assignments, exams,
//          study sessions, deadlines & total study time
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Subject,
  ScheduleEntry,
  Assignment,
  Exam,
  StudySession,
} from '@/types';
import { StorageKeys, storageGet, storageSet } from '@/services/storage';
import {
  generateId,
  toISOString,
  toISODateString,
  getTodayString,
} from '@/utils';

export interface StudyStore {
  subjects: Subject[];
  scheduleEntries: ScheduleEntry[];
  assignments: Assignment[];
  exams: Exam[];
  studySessions: StudySession[];

  // Data Loading
  load: () => void;

  // Subject Actions
  addSubject: (data: Partial<Subject> & { name: string }) => Subject;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Schedule Entry Actions
  addScheduleEntry: (
    data: Partial<ScheduleEntry> & {
      subjectId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }
  ) => ScheduleEntry;
  updateScheduleEntry: (id: string, data: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;

  // Assignment Actions
  addAssignment: (
    data: Partial<Assignment> & {
      subjectId: string;
      title: string;
      deadline: string;
    }
  ) => Assignment;
  updateAssignment: (id: string, data: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;

  // Exam Actions
  addExam: (
    data: Partial<Exam> & {
      subjectId: string;
      title: string;
      datetime: string;
    }
  ) => Exam;
  updateExam: (id: string, data: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  // Study Session Actions
  startStudySession: (
    data: Partial<StudySession> & {
      type?: 'study' | 'pomodoro';
      subjectId?: string;
      startTime?: string;
      date?: string;
    }
  ) => StudySession;
  endStudySession: (id: string, endTime: string) => void;

  // Selectors & Calculations
  getTotalStudyTimeForDate: (date: string) => number;
  getTotalStudyTimeForSubject: (subjectId: string) => number;
  getUpcomingDeadlines: (days: number) => Assignment[];
  getScheduleForDay: (dayOfWeek: number) => ScheduleEntry[];
}

const USER_ID = 'user_1';

function saveSubjects(subjects: Subject[]): void {
  storageSet(StorageKeys.SUBJECTS, subjects);
}

function saveScheduleEntries(entries: ScheduleEntry[]): void {
  storageSet(StorageKeys.SCHEDULE_ENTRIES, entries);
}

function saveAssignments(assignments: Assignment[]): void {
  storageSet(StorageKeys.ASSIGNMENTS, assignments);
}

function saveExams(exams: Exam[]): void {
  storageSet(StorageKeys.EXAMS, exams);
}

function saveStudySessions(sessions: StudySession[]): void {
  storageSet(StorageKeys.STUDY_SESSIONS, sessions);
}

function computeDurationInMinutes(startTime: string, endTime: string): number {
  if (startTime.includes('T') || startTime.includes('-')) {
    const startMs = Date.parse(startTime);
    const endMs = Date.parse(endTime);
    if (!isNaN(startMs) && !isNaN(endMs)) {
      return Math.max(0, Math.round((endMs - startMs) / 60000));
    }
  }

  const [sh = 0, sm = 0] = startTime.split(':').map(Number);
  const [eh = 0, em = 0] = endTime.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) {
    diff += 24 * 60; // Crossed midnight
  }
  return Math.max(0, diff);
}

export const useStudyStore = create<StudyStore>()(
  subscribeWithSelector((set, get) => ({
    subjects: [],
    scheduleEntries: [],
    assignments: [],
    exams: [],
    studySessions: [],

    load: () => {
      const subjects = storageGet<Subject[]>(StorageKeys.SUBJECTS, []);
      const scheduleEntries = storageGet<ScheduleEntry[]>(StorageKeys.SCHEDULE_ENTRIES, []);
      const assignments = storageGet<Assignment[]>(StorageKeys.ASSIGNMENTS, []);
      const exams = storageGet<Exam[]>(StorageKeys.EXAMS, []);
      const studySessions = storageGet<StudySession[]>(StorageKeys.STUDY_SESSIONS, []);

      set({
        subjects,
        scheduleEntries,
        assignments,
        exams,
        studySessions,
      });
    },

    // ── Subject Actions ──────────────────────────────────

    addSubject: (data) => {
      const now = toISOString();
      const subject: Subject = {
        color: '#6366f1',
        isActive: true,
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const subjects = [...state.subjects, subject];
        saveSubjects(subjects);
        return { subjects };
      });

      return subject;
    },

    updateSubject: (id, data) => {
      const now = toISOString();
      set((state) => {
        const subjects = state.subjects.map((s) =>
          s.id === id ? { ...s, ...data, updatedAt: now } : s
        );
        saveSubjects(subjects);
        return { subjects };
      });
    },

    deleteSubject: (id) => {
      set((state) => {
        const subjects = state.subjects.filter((s) => s.id !== id);
        saveSubjects(subjects);
        return { subjects };
      });
    },

    // ── Schedule Entry Actions ───────────────────────────

    addScheduleEntry: (data) => {
      const entry: ScheduleEntry = {
        isActive: true,
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: toISOString(),
      };

      set((state) => {
        const scheduleEntries = [...state.scheduleEntries, entry];
        saveScheduleEntries(scheduleEntries);
        return { scheduleEntries };
      });

      return entry;
    },

    updateScheduleEntry: (id, data) => {
      set((state) => {
        const scheduleEntries = state.scheduleEntries.map((e) =>
          e.id === id ? { ...e, ...data } : e
        );
        saveScheduleEntries(scheduleEntries);
        return { scheduleEntries };
      });
    },

    deleteScheduleEntry: (id) => {
      set((state) => {
        const scheduleEntries = state.scheduleEntries.filter((e) => e.id !== id);
        saveScheduleEntries(scheduleEntries);
        return { scheduleEntries };
      });
    },

    // ── Assignment Actions ───────────────────────────────

    addAssignment: (data) => {
      const now = toISOString();
      const assignment: Assignment = {
        importance: 'medium',
        status: 'pending',
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const assignments = [assignment, ...state.assignments];
        saveAssignments(assignments);
        return { assignments };
      });

      return assignment;
    },

    updateAssignment: (id, data) => {
      const now = toISOString();
      set((state) => {
        const assignments = state.assignments.map((a) =>
          a.id === id ? { ...a, ...data, updatedAt: now } : a
        );
        saveAssignments(assignments);
        return { assignments };
      });
    },

    deleteAssignment: (id) => {
      set((state) => {
        const assignments = state.assignments.filter((a) => a.id !== id);
        saveAssignments(assignments);
        return { assignments };
      });
    },

    // ── Exam Actions ─────────────────────────────────────

    addExam: (data) => {
      const now = toISOString();
      const exam: Exam = {
        isOnline: false,
        status: 'upcoming',
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const exams = [exam, ...state.exams];
        saveExams(exams);
        return { exams };
      });

      return exam;
    },

    updateExam: (id, data) => {
      const now = toISOString();
      set((state) => {
        const exams = state.exams.map((e) =>
          e.id === id ? { ...e, ...data, updatedAt: now } : e
        );
        saveExams(exams);
        return { exams };
      });
    },

    deleteExam: (id) => {
      set((state) => {
        const exams = state.exams.filter((e) => e.id !== id);
        saveExams(exams);
        return { exams };
      });
    },

    // ── Study Session Actions ────────────────────────────

    startStudySession: (data) => {
      const now = toISOString();
      const currentTime = new Date().toTimeString().slice(0, 5);
      const session: StudySession = {
        type: 'study',
        startTime: currentTime,
        date: getTodayString(),
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
      };

      set((state) => {
        const studySessions = [session, ...state.studySessions];
        saveStudySessions(studySessions);
        return { studySessions };
      });

      return session;
    },

    endStudySession: (id, endTime) => {
      set((state) => {
        const studySessions = state.studySessions.map((session) => {
          if (session.id !== id) return session;

          const duration = computeDurationInMinutes(session.startTime, endTime);
          return {
            ...session,
            endTime,
            duration,
          };
        });

        saveStudySessions(studySessions);
        return { studySessions };
      });
    },

    // ── Selectors & Calculations ─────────────────────────

    getTotalStudyTimeForDate: (date) => {
      return get()
        .studySessions.filter((s) => s.date === date)
        .reduce((sum, s) => sum + (s.duration || 0), 0);
    },

    getTotalStudyTimeForSubject: (subjectId) => {
      return get()
        .studySessions.filter((s) => s.subjectId === subjectId)
        .reduce((sum, s) => sum + (s.duration || 0), 0);
    },

    getUpcomingDeadlines: (days) => {
      const today = getTodayString();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.max(0, days));
      const maxDate = toISODateString(targetDate);

      return get()
        .assignments.filter(
          (a) =>
            a.deadline >= today &&
            a.deadline <= maxDate &&
            a.status !== 'submitted' &&
            a.status !== 'graded'
        )
        .sort((a, b) => a.deadline.localeCompare(b.deadline));
    },

    getScheduleForDay: (dayOfWeek) => {
      return get()
        .scheduleEntries.filter(
          (entry) => entry.dayOfWeek === dayOfWeek && entry.isActive
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    },
  }))
);
