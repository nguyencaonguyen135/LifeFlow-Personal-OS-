// ============================================================
// Task Store – Zustand
// Manages: tasks, projects
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Task, Project, TaskStatus } from '@/types';
import { StorageKeys, storageGet, storageSet } from '@/services/storage';
import {
  generateId,
  toISOString,
  toISODateString,
  getTodayString,
  matchesSearch,
} from '@/utils';

export interface TaskStore {
  tasks: Task[];
  projects: Project[];

  // Data Loading
  load: () => void;

  // Task Actions
  addTask: (data: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  // Project Actions
  addProject: (data: Partial<Project> & { name: string }) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Selectors & Calculations
  getTasksForToday: () => Task[];
  getOverdueTasks: () => Task[];
  getUpcomingTasks: (days: number) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getProjectProgress: (projectId: string) => number;
  searchTasks: (query: string) => Task[];
}

const USER_ID = 'user_1';

function saveTasks(tasks: Task[]): void {
  storageSet(StorageKeys.TASKS, tasks);
}

function saveProjects(projects: Project[]): void {
  storageSet(StorageKeys.PROJECTS, projects);
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
  waiting: 'in_progress',
  cancelled: 'todo',
};

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector((set, get) => ({
    tasks: [],
    projects: [],

    load: () => {
      const tasks = storageGet<Task[]>(StorageKeys.TASKS, []);
      const projects = storageGet<Project[]>(StorageKeys.PROJECTS, []);
      set({ tasks, projects });
    },

    addTask: (data) => {
      const now = toISOString();
      const task: Task = {
        priority: 'medium',
        status: 'todo',
        labels: [],
        checklist: [],
        isRecurring: false,
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const tasks = [task, ...state.tasks];
        saveTasks(tasks);
        return { tasks };
      });

      return task;
    },

    updateTask: (id, data) => {
      const now = toISOString();
      set((state) => {
        const tasks = state.tasks.map((task) =>
          task.id === id ? { ...task, ...data, updatedAt: now } : task
        );
        saveTasks(tasks);
        return { tasks };
      });
    },

    deleteTask: (id) => {
      set((state) => {
        const tasks = state.tasks.filter((task) => task.id !== id);
        saveTasks(tasks);
        return { tasks };
      });
    },

    toggleTaskStatus: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      const nextStatus = NEXT_STATUS[task.status] ?? 'todo';
      const now = toISOString();

      set((state) => {
        const tasks = state.tasks.map((t) =>
          t.id === id ? { ...t, status: nextStatus, updatedAt: now } : t
        );
        saveTasks(tasks);
        return { tasks };
      });
    },

    addProject: (data) => {
      const now = toISOString();
      const project: Project = {
        color: '#6366f1',
        status: 'active',
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const projects = [...state.projects, project];
        saveProjects(projects);
        return { projects };
      });

      return project;
    },

    updateProject: (id, data) => {
      const now = toISOString();
      set((state) => {
        const projects = state.projects.map((proj) =>
          proj.id === id ? { ...proj, ...data, updatedAt: now } : proj
        );
        saveProjects(projects);
        return { projects };
      });
    },

    deleteProject: (id) => {
      set((state) => {
        const projects = state.projects.filter((proj) => proj.id !== id);
        saveProjects(projects);

        // Also detach tasks from this project to keep relational integrity
        const tasks = state.tasks.map((task) =>
          task.projectId === id ? { ...task, projectId: undefined, updatedAt: toISOString() } : task
        );
        saveTasks(tasks);

        return { projects, tasks };
      });
    },

    getTasksForToday: () => {
      const today = getTodayString();
      return get().tasks.filter(
        (task) => task.dueDate === today || task.startDate === today
      );
    },

    getOverdueTasks: () => {
      const today = getTodayString();
      return get().tasks.filter(
        (task) =>
          Boolean(task.dueDate) &&
          (task.dueDate as string) < today &&
          task.status !== 'done' &&
          task.status !== 'cancelled'
      );
    },

    getUpcomingTasks: (days: number) => {
      const today = getTodayString();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.max(0, days));
      const maxDate = toISODateString(targetDate);

      return get()
        .tasks.filter(
          (task) =>
            Boolean(task.dueDate) &&
            (task.dueDate as string) >= today &&
            (task.dueDate as string) <= maxDate &&
            task.status !== 'done' &&
            task.status !== 'cancelled'
        )
        .sort((a, b) => ((a.dueDate ?? '') > (b.dueDate ?? '') ? 1 : -1));
    },

    getTasksByProject: (projectId: string) => {
      return get().tasks.filter((task) => task.projectId === projectId);
    },

    getProjectProgress: (projectId: string) => {
      const projectTasks = get().tasks.filter((task) => task.projectId === projectId);
      if (projectTasks.length === 0) return 0;
      const doneTasks = projectTasks.filter((task) => task.status === 'done');
      return Math.round((doneTasks.length / projectTasks.length) * 100);
    },

    searchTasks: (query: string) => {
      if (!query.trim()) return get().tasks;
      return get().tasks.filter(
        (task) =>
          matchesSearch(task.title, query) ||
          (task.description ? matchesSearch(task.description, query) : false) ||
          (task.note ? matchesSearch(task.note, query) : false) ||
          task.labels.some((label) => matchesSearch(label, query))
      );
    },
  }))
);
