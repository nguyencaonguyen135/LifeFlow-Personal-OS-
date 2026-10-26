// ============================================================
// LIFEFLOW – Personal Life OS
// TypeScript Interfaces & Types
// ============================================================

// ─── User & Settings ───────────────────────────────────────

export interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSetting {
  userId: string;
  currency: string; // default: 'VND'
  currencySymbol: string; // default: '₫'
  dateFormat: string; // default: 'DD/MM/YYYY'
  timeFormat: '12h' | '24h'; // default: '24h'
  weekStart: 0 | 1; // 0 = Sunday, 1 = Monday
  timezone: string; // default: 'Asia/Ho_Chi_Minh'
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'indigo' | 'violet' | 'blue' | 'teal';
  language: 'vi' | 'en';
  notifications: NotificationSettings;
  dailyGoals: DailyGoals;
  updatedAt: string;
}

export interface NotificationSettings {
  taskDeadline: boolean;
  budgetAlert: boolean;
  habitReminder: boolean;
  goalMilestone: boolean;
  debtDueDate: boolean;
  eventReminder: boolean;
  browserNotifications: boolean;
}

export interface DailyGoals {
  studyHours: number;
  taskCount: number;
  habitCount: number;
}

// ─── Finance: Accounts ────────────────────────────────────

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'custom';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon?: string;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Finance: Categories ──────────────────────────────────

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isSystem: boolean;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Finance: Transactions ────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'ewallet' | 'other';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  accountId: string;
  toAccountId?: string; // for transfer
  date: string; // ISO date string
  paymentMethod: PaymentMethod;
  description: string;
  note?: string;
  tags: string[];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Finance: Budgets ─────────────────────────────────────

export type BudgetPeriod = 'monthly' | 'weekly' | 'custom';

export interface Budget {
  id: string;
  userId: string;
  name: string;
  categoryId?: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  alertThreshold: number; // percentage, e.g. 80
  color: string;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Finance: Savings Goals ───────────────────────────────

export type GoalPriority = 'low' | 'medium' | 'high';

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
  transactionId?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  deadline?: string;
  priority: GoalPriority;
  note?: string;
  isCompleted: boolean;
  contributions: SavingsContribution[];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Finance: Debts ───────────────────────────────────────

export type DebtType = 'owe' | 'lend'; // owe = I owe, lend = they owe me
export type DebtStatus = 'pending' | 'partial' | 'completed' | 'overdue';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  note?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  type: DebtType;
  personName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
  status: DebtStatus;
  note?: string;
  payments: DebtPayment[];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Tasks & Projects ─────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done' | 'cancelled';

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0-6
  endDate?: string;
  count?: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  categoryId?: string;
  projectId?: string;
  startDate?: string;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  priority: TaskPriority;
  status: TaskStatus;
  labels: string[];
  checklist: ChecklistItem[];
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  note?: string;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  goalId?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  goalId?: string;
  note?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Calendar Events ──────────────────────────────────────

export type EventType = 'study' | 'exam' | 'assignment' | 'task' | 'appointment' | 'personal' | 'rest' | 'habit';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  type: EventType;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isOnline: boolean;
  onlineUrl?: string;
  description?: string;
  color: string;
  reminderMinutes?: number;
  recurrenceRule?: RecurrenceRule;
  subjectId?: string;
  taskId?: string;
  assignmentId?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Study ────────────────────────────────────────────────

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  teacher?: string;
  objectives?: string;
  color: string;
  totalSessions?: number;
  materials?: string;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEntry {
  id: string;
  userId: string;
  subjectId: string;
  dayOfWeek: number; // 0-6
  startTime: string;
  endTime: string;
  room?: string;
  onlineUrl?: string;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
}

export type AssignmentStatus = 'pending' | 'in_progress' | 'submitted' | 'graded';
export type ImportanceLevel = 'low' | 'medium' | 'high';

export interface Assignment {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  deadline: string;
  importance: ImportanceLevel;
  status: AssignmentStatus;
  score?: number;
  maxScore?: number;
  note?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  datetime: string;
  duration?: number; // minutes
  location?: string;
  isOnline: boolean;
  status: 'upcoming' | 'completed';
  score?: number;
  maxScore?: number;
  note?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  taskId?: string;
  type: 'study' | 'pomodoro';
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  date: string;
  note?: string;
  pomodoroCount?: number;
  isDemo: boolean;
  createdAt: string;
}

// ─── Habits ───────────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  customDays?: number[]; // for custom frequency
  targetPerDay: number;
  startDate: string;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedCount: number;
  note?: string;
  createdAt: string;
}

// ─── Health & Wellness ────────────────────────────────────

export type HealthMood = 'great' | 'good' | 'okay' | 'low' | 'bad';

export interface HealthRecord {
  id: string;
  userId: string;
  date: string;
  sleepDuration: number;
  sleepQuality: number;
  sleepStart?: string;
  sleepEnd?: string;
  waterMl: number;
  exerciseMinutes: number;
  exerciseType?: string;
  mood?: HealthMood;
  energyLevel?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Personal Goals ───────────────────────────────────────

export type GoalCategory = 'financial' | 'study' | 'career' | 'health' | 'personal';

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface PersonalGoal {
  id: string;
  userId: string;
  name: string;
  reason?: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  deadline?: string;
  milestones: Milestone[];
  relatedTaskIds: string[];
  relatedHabitIds: string[];
  savingsGoalId?: string;
  projectId?: string;
  priority: GoalPriority;
  isCompleted: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Notifications ────────────────────────────────────────

export type NotificationType =
  | 'task_deadline'
  | 'task_overdue'
  | 'budget_alert'
  | 'goal_milestone'
  | 'debt_due'
  | 'event_reminder'
  | 'habit_reminder'
  | 'savings_progress';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── App State ────────────────────────────────────────────

export interface AppData {
  user: User;
  settings: UserSetting;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  tasks: Task[];
  projects: Project[];
  calendarEvents: CalendarEvent[];
  subjects: Subject[];
  scheduleEntries: ScheduleEntry[];
  assignments: Assignment[];
  exams: Exam[];
  studySessions: StudySession[];
  habits: Habit[];
  habitLogs: HabitLog[];
  personalGoals: PersonalGoal[];
  notifications: Notification[];
  version: string;
  exportedAt: string;
}

// ─── UI Types ─────────────────────────────────────────────

export type DateRange = '7d' | '30d' | '3m' | '1y' | 'custom';

export interface FilterState {
  dateRange: DateRange;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  type?: TransactionType;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  search?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ─── Finance Calculations ─────────────────────────────────

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  budgetRemaining: number;
  savingsRate: number;
  transactionCount: number;
  previousMonthIncome?: number;
  previousMonthExpense?: number;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface DailyChartData {
  date: string;
  income: number;
  expense: number;
}
