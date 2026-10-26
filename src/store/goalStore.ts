// ============================================================
// Goal Store – Zustand
// Manages: personal goals, milestones & progress tracking
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PersonalGoal, Milestone } from '@/types';
import { StorageKeys, storageGet, storageSet } from '@/services/storage';
import {
  generateId,
  toISOString,
  getTodayString,
} from '@/utils';

export interface GoalStore {
  goals: PersonalGoal[];

  // Data Loading
  load: () => void;

  // Goal Actions
  addGoal: (data: Partial<PersonalGoal> & { name: string; targetValue: number }) => PersonalGoal;
  updateGoal: (id: string, data: Partial<PersonalGoal>) => void;
  deleteGoal: (id: string) => void;
  updateProgress: (id: string, newValue: number) => void;

  // Milestone Actions
  addMilestone: (
    goalId: string,
    milestone: Partial<Milestone> & { title: string; targetValue: number }
  ) => void;
  completeMilestone: (goalId: string, milestoneId: string) => void;
}

const USER_ID = 'user_1';

function saveGoals(goals: PersonalGoal[]): void {
  storageSet(StorageKeys.PERSONAL_GOALS, goals);
}

export const useGoalStore = create<GoalStore>()(
  subscribeWithSelector((set, get) => ({
    goals: [],

    load: () => {
      const goals = storageGet<PersonalGoal[]>(StorageKeys.PERSONAL_GOALS, []);
      set({ goals });
    },

    addGoal: (data) => {
      const now = toISOString();
      const goal: PersonalGoal = {
        category: 'personal',
        currentValue: 0,
        unit: '',
        startDate: getTodayString(),
        milestones: [],
        relatedTaskIds: [],
        relatedHabitIds: [],
        priority: 'medium',
        isCompleted: false,
        isDemo: false,
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const goals = [goal, ...state.goals];
        saveGoals(goals);
        return { goals };
      });

      return goal;
    },

    updateGoal: (id, data) => {
      const now = toISOString();
      set((state) => {
        const goals = state.goals.map((goal) =>
          goal.id === id ? { ...goal, ...data, updatedAt: now } : goal
        );
        saveGoals(goals);
        return { goals };
      });
    },

    deleteGoal: (id) => {
      set((state) => {
        const goals = state.goals.filter((goal) => goal.id !== id);
        saveGoals(goals);
        return { goals };
      });
    },

    updateProgress: (id, newValue) => {
      const now = toISOString();
      set((state) => {
        const goals = state.goals.map((goal) => {
          if (goal.id !== id) return goal;

          const isCompleted = newValue >= goal.targetValue;

          // Check and update milestones reached by this new value
          const updatedMilestones = goal.milestones.map((milestone) => {
            if (!milestone.isCompleted && newValue >= milestone.targetValue) {
              return {
                ...milestone,
                isCompleted: true,
                completedAt: now,
              };
            }
            return milestone;
          });

          return {
            ...goal,
            currentValue: newValue,
            isCompleted,
            milestones: updatedMilestones,
            updatedAt: now,
          };
        });

        saveGoals(goals);
        return { goals };
      });
    },

    addMilestone: (goalId, milestone) => {
      const now = toISOString();
      const newMilestone: Milestone = {
        id: generateId(),
        goalId,
        title: milestone.title,
        targetValue: milestone.targetValue,
        isCompleted: milestone.isCompleted ?? false,
        completedAt: milestone.isCompleted ? now : undefined,
        createdAt: now,
      };

      set((state) => {
        const goals = state.goals.map((goal) => {
          if (goal.id !== goalId) return goal;
          return {
            ...goal,
            milestones: [...goal.milestones, newMilestone],
            updatedAt: now,
          };
        });

        saveGoals(goals);
        return { goals };
      });
    },

    completeMilestone: (goalId, milestoneId) => {
      const now = toISOString();
      set((state) => {
        const goals = state.goals.map((goal) => {
          if (goal.id !== goalId) return goal;

          const milestones = goal.milestones.map((m) =>
            m.id === milestoneId ? { ...m, isCompleted: true, completedAt: now } : m
          );

          return {
            ...goal,
            milestones,
            updatedAt: now,
          };
        });

        saveGoals(goals);
        return { goals };
      });
    },
  }))
);
