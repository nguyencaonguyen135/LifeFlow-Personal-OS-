// ============================================================
// Demo Data – Realistic Vietnamese sample data
// ============================================================

import { StorageKeys, storageSet, storageGet } from '@/services/storage';
import { generateId, toISOString, toISODateString, getTodayString } from '@/utils';
import type {
  User, UserSetting, Account, Category, Transaction, Budget,
  SavingsGoal, SavingsContribution, Debt, DebtPayment, Task, Project,
  CalendarEvent, Subject, ScheduleEntry, Assignment, Exam,
  StudySession, Habit, HabitLog, PersonalGoal, Notification
} from '@/types';

const USER_ID = 'user_1';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODateString(d);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODateString(d);
}

function thisMonthDate(day: number): string {
  const d = new Date();
  d.setDate(day);
  return toISODateString(d);
}

function lastMonthDate(day: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(day);
  return toISODateString(d);
}

export function isDemoDataLoaded(): boolean {
  return storageGet<boolean>('lifeflow_demo_loaded', false);
}

export function clearDemoData(): void {
  // Clear all demo flags and data
  const keys = Object.values(StorageKeys);
  keys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        const filtered = data.filter((item: { isDemo?: boolean }) => !item.isDemo);
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    } catch { /* ignore */ }
  });
  localStorage.removeItem('lifeflow_demo_loaded');
}

export function loadDemoData(): void {
  if (isDemoDataLoaded()) return;
  const now = toISOString();

  // ── User ────────────────────────────────────────────────
  const user: User = {
    id: USER_ID,
    name: 'Nguyễn Văn Minh',
    email: 'minh@example.com',
    createdAt: now,
    updatedAt: now,
  };

  // ── Settings ────────────────────────────────────────────
  const settings: UserSetting = {
    userId: USER_ID,
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
    dailyGoals: { studyHours: 4, taskCount: 5, habitCount: 3 },
    updatedAt: now,
  };

  // ── Accounts ─────────────────────────────────────────────
  const accounts: Account[] = [
    {
      id: 'acc_cash',
      userId: USER_ID,
      name: 'Tiền mặt',
      type: 'cash',
      initialBalance: 500000,
      currentBalance: 500000,
      color: '#f59e0b',
      icon: '💵',
      isActive: true,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc_vcb',
      userId: USER_ID,
      name: 'Vietcombank',
      type: 'bank',
      initialBalance: 5000000,
      currentBalance: 5000000,
      color: '#22c55e',
      icon: '🏦',
      isActive: true,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc_momo',
      userId: USER_ID,
      name: 'Ví MoMo',
      type: 'ewallet',
      initialBalance: 200000,
      currentBalance: 200000,
      color: '#ec4899',
      icon: '📱',
      isActive: true,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // ── Categories ───────────────────────────────────────────
  const categories: Category[] = [
    // Income
    { id: 'cat_salary', userId: USER_ID, name: 'Lương', type: 'income', icon: '💼', color: '#22c55e', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_freelance', userId: USER_ID, name: 'Làm thêm', type: 'income', icon: '⚡', color: '#10b981', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_bonus', userId: USER_ID, name: 'Thưởng', type: 'income', icon: '🎁', color: '#84cc16', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_biz', userId: USER_ID, name: 'Kinh doanh', type: 'income', icon: '🏪', color: '#14b8a6', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_invest', userId: USER_ID, name: 'Đầu tư', type: 'income', icon: '📈', color: '#06b6d4', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_other_inc', userId: USER_ID, name: 'Thu nhập khác', type: 'income', icon: '💰', color: '#0ea5e9', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    // Expense
    { id: 'cat_food', userId: USER_ID, name: 'Ăn uống', type: 'expense', icon: '🍔', color: '#f97316', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_edu', userId: USER_ID, name: 'Học tập', type: 'expense', icon: '📚', color: '#8b5cf6', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_transport', userId: USER_ID, name: 'Đi lại', type: 'expense', icon: '🚗', color: '#6366f1', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_housing', userId: USER_ID, name: 'Nhà ở', type: 'expense', icon: '🏠', color: '#3b82f6', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_shopping', userId: USER_ID, name: 'Mua sắm', type: 'expense', icon: '👗', color: '#ec4899', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_entertain', userId: USER_ID, name: 'Giải trí', type: 'expense', icon: '🎮', color: '#a855f7', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_health', userId: USER_ID, name: 'Sức khỏe', type: 'expense', icon: '💊', color: '#ef4444', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_bills', userId: USER_ID, name: 'Hóa đơn', type: 'expense', icon: '⚡', color: '#f59e0b', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_debt', userId: USER_ID, name: 'Trả nợ', type: 'expense', icon: '💳', color: '#dc2626', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
    { id: 'cat_other_exp', userId: USER_ID, name: 'Chi phí khác', type: 'expense', icon: '📌', color: '#6b7280', isSystem: true, isActive: true, isDemo: false, createdAt: now, updatedAt: now },
  ];

  // ── Transactions ──────────────────────────────────────────
  const transactions: Transaction[] = [
    // Current month income
    { id: 'txn_1', userId: USER_ID, type: 'income', amount: 12000000, categoryId: 'cat_salary', accountId: 'acc_vcb', date: thisMonthDate(1), paymentMethod: 'bank_transfer', description: 'Lương tháng 10', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_2', userId: USER_ID, type: 'income', amount: 2500000, categoryId: 'cat_freelance', accountId: 'acc_momo', date: thisMonthDate(5), paymentMethod: 'ewallet', description: 'Thiết kế website freelance', note: '', tags: ['freelance'], isDemo: true, createdAt: now, updatedAt: now },
    // Current month expenses
    { id: 'txn_3', userId: USER_ID, type: 'expense', amount: 3500000, categoryId: 'cat_housing', accountId: 'acc_vcb', date: thisMonthDate(2), paymentMethod: 'bank_transfer', description: 'Tiền nhà tháng 10', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_4', userId: USER_ID, type: 'expense', amount: 450000, categoryId: 'cat_bills', accountId: 'acc_vcb', date: thisMonthDate(3), paymentMethod: 'bank_transfer', description: 'Điện nước tháng 10', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_5', userId: USER_ID, type: 'expense', amount: 2500000, categoryId: 'cat_edu', accountId: 'acc_vcb', date: thisMonthDate(4), paymentMethod: 'bank_transfer', description: 'Học phí lớp Python', note: '', tags: ['học tập'], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_6', userId: USER_ID, type: 'expense', amount: 85000, categoryId: 'cat_food', accountId: 'acc_cash', date: thisMonthDate(6), paymentMethod: 'cash', description: 'Ăn sáng + cafe', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_7', userId: USER_ID, type: 'expense', amount: 320000, categoryId: 'cat_transport', accountId: 'acc_cash', date: thisMonthDate(7), paymentMethod: 'cash', description: 'Xăng xe tuần 1', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_8', userId: USER_ID, type: 'expense', amount: 250000, categoryId: 'cat_food', accountId: 'acc_momo', date: thisMonthDate(8), paymentMethod: 'ewallet', description: 'Đặt đồ ăn Shopee Food', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_9', userId: USER_ID, type: 'expense', amount: 1200000, categoryId: 'cat_shopping', accountId: 'acc_vcb', date: thisMonthDate(9), paymentMethod: 'bank_transfer', description: 'Mua quần áo', note: '', tags: ['mua sắm'], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_10', userId: USER_ID, type: 'expense', amount: 65000, categoryId: 'cat_food', accountId: 'acc_cash', date: thisMonthDate(10), paymentMethod: 'cash', description: 'Cơm trưa', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_11', userId: USER_ID, type: 'expense', amount: 350000, categoryId: 'cat_entertain', accountId: 'acc_momo', date: thisMonthDate(11), paymentMethod: 'ewallet', description: 'Vé xem phim + snack', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_12', userId: USER_ID, type: 'expense', amount: 180000, categoryId: 'cat_food', accountId: 'acc_cash', date: thisMonthDate(12), paymentMethod: 'cash', description: 'Ăn tối cùng bạn bè', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_13', userId: USER_ID, type: 'expense', amount: 500000, categoryId: 'cat_debt', accountId: 'acc_vcb', date: thisMonthDate(13), paymentMethod: 'bank_transfer', description: 'Trả nợ bạn Tuấn (1/4)', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_14', userId: USER_ID, type: 'expense', amount: 150000, categoryId: 'cat_health', accountId: 'acc_cash', date: thisMonthDate(14), paymentMethod: 'cash', description: 'Khám sức khỏe định kỳ', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_15', userId: USER_ID, type: 'expense', amount: 290000, categoryId: 'cat_transport', accountId: 'acc_momo', date: thisMonthDate(15), paymentMethod: 'ewallet', description: 'Grab tuần 2', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    // Last month
    { id: 'txn_16', userId: USER_ID, type: 'income', amount: 12000000, categoryId: 'cat_salary', accountId: 'acc_vcb', date: lastMonthDate(1), paymentMethod: 'bank_transfer', description: 'Lương tháng 9', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_17', userId: USER_ID, type: 'expense', amount: 3500000, categoryId: 'cat_housing', accountId: 'acc_vcb', date: lastMonthDate(2), paymentMethod: 'bank_transfer', description: 'Tiền nhà tháng 9', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_18', userId: USER_ID, type: 'expense', amount: 2800000, categoryId: 'cat_food', accountId: 'acc_vcb', date: lastMonthDate(10), paymentMethod: 'bank_transfer', description: 'Chi tiêu ăn uống tháng 9', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_19', userId: USER_ID, type: 'expense', amount: 800000, categoryId: 'cat_entertain', accountId: 'acc_vcb', date: lastMonthDate(20), paymentMethod: 'bank_transfer', description: 'Giải trí tháng 9', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
    { id: 'txn_20', userId: USER_ID, type: 'income', amount: 1500000, categoryId: 'cat_freelance', accountId: 'acc_momo', date: lastMonthDate(15), paymentMethod: 'ewallet', description: 'Làm thêm tháng 9', note: '', tags: [], isDemo: true, createdAt: now, updatedAt: now },
  ];

  // Recalculate account balances
  const balances: Record<string, number> = {
    acc_cash: 500000,
    acc_vcb: 5000000,
    acc_momo: 200000,
  };
  transactions.forEach(t => {
    if (t.type === 'income') balances[t.accountId] = (balances[t.accountId] ?? 0) + t.amount;
    else if (t.type === 'expense') balances[t.accountId] = (balances[t.accountId] ?? 0) - t.amount;
    else if (t.type === 'transfer') {
      balances[t.accountId] = (balances[t.accountId] ?? 0) - t.amount;
      if (t.toAccountId) balances[t.toAccountId] = (balances[t.toAccountId] ?? 0) + t.amount;
    }
  });
  accounts.forEach(a => { a.currentBalance = balances[a.id] ?? a.initialBalance; });

  // ── Budgets ────────────────────────────────────────────────
  const thisMonthStart = toISODateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const thisMonthEnd = toISODateString(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

  const budgets: Budget[] = [
    { id: 'bud_food', userId: USER_ID, name: 'Ăn uống', categoryId: 'cat_food', amount: 3000000, period: 'monthly', startDate: thisMonthStart, endDate: thisMonthEnd, alertThreshold: 80, color: '#f97316', isActive: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'bud_transport', userId: USER_ID, name: 'Đi lại', categoryId: 'cat_transport', amount: 800000, period: 'monthly', startDate: thisMonthStart, endDate: thisMonthEnd, alertThreshold: 75, color: '#6366f1', isActive: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'bud_entertain', userId: USER_ID, name: 'Giải trí', categoryId: 'cat_entertain', amount: 500000, period: 'monthly', startDate: thisMonthStart, endDate: thisMonthEnd, alertThreshold: 70, color: '#a855f7', isActive: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'bud_shopping', userId: USER_ID, name: 'Mua sắm', categoryId: 'cat_shopping', amount: 1500000, period: 'monthly', startDate: thisMonthStart, endDate: thisMonthEnd, alertThreshold: 80, color: '#ec4899', isActive: true, isDemo: true, createdAt: now, updatedAt: now },
  ];

  // ── Savings Goals ──────────────────────────────────────────
  const laptopContrib: SavingsContribution = {
    id: 'contrib_1', goalId: 'goal_laptop', amount: 5000000,
    date: lastMonthDate(15), note: 'Tiết kiệm tháng 9', createdAt: now,
  };
  const laptopContrib2: SavingsContribution = {
    id: 'contrib_2', goalId: 'goal_laptop', amount: 3500000,
    date: thisMonthDate(10), note: 'Tiết kiệm tháng 10', createdAt: now,
  };

  const savingsGoals: SavingsGoal[] = [
    {
      id: 'goal_laptop', userId: USER_ID, name: 'Mua Laptop mới', icon: '💻',
      targetAmount: 20000000, currentAmount: 8500000,
      startDate: daysAgo(60), deadline: daysFromNow(90),
      priority: 'high', note: 'Macbook Air M3 hoặc Dell XPS', isCompleted: false,
      contributions: [laptopContrib, laptopContrib2],
      isDemo: true, createdAt: now, updatedAt: now,
    },
    {
      id: 'goal_emergency', userId: USER_ID, name: 'Quỹ dự phòng', icon: '🛡️',
      targetAmount: 30000000, currentAmount: 12000000,
      startDate: daysAgo(120), deadline: undefined,
      priority: 'high', note: 'Quỹ dự phòng 3 tháng lương', isCompleted: false,
      contributions: [],
      isDemo: true, createdAt: now, updatedAt: now,
    },
  ];

  // ── Debts ──────────────────────────────────────────────────
  const debtPayment: DebtPayment = {
    id: 'dpmt_1', debtId: 'debt_1', amount: 500000,
    date: thisMonthDate(13), note: 'Trả lần 1', createdAt: now,
  };

  const debts: Debt[] = [
    {
      id: 'debt_1', userId: USER_ID, type: 'owe', personName: 'Tuấn',
      totalAmount: 2000000, paidAmount: 500000, dueDate: daysFromNow(45),
      status: 'partial', note: 'Mượn để sửa xe tháng 9',
      payments: [debtPayment],
      isDemo: true, createdAt: now, updatedAt: now,
    },
  ];

  // ── Projects ───────────────────────────────────────────────
  const projects: Project[] = [
    { id: 'proj_python', userId: USER_ID, name: 'Học Python', description: 'Học Python từ beginner đến intermediate', color: '#6366f1', startDate: daysAgo(30), endDate: daysFromNow(60), status: 'active', note: '', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'proj_portfolio', userId: USER_ID, name: 'Xây dựng Portfolio', description: 'Làm website portfolio cá nhân', color: '#3b82f6', startDate: daysAgo(15), endDate: daysFromNow(45), status: 'active', note: '', isDemo: true, createdAt: now, updatedAt: now },
  ];

  // ── Tasks ──────────────────────────────────────────────────
  const tasks: Task[] = [
    { id: 'task_1', userId: USER_ID, title: 'Ôn tập Python Chapter 3', description: 'List comprehension, lambda, map/filter/reduce', projectId: 'proj_python', priority: 'high', status: 'todo', labels: ['python'], checklist: [], isRecurring: false, dueDate: getTodayString(), isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_2', userId: USER_ID, title: 'Nộp báo cáo thực tập', description: 'Hoàn thiện và nộp báo cáo thực tập tốt nghiệp', priority: 'urgent', status: 'in_progress', labels: ['thực tập'], checklist: [{ id: 'ck_1', text: 'Viết phần kết luận', isCompleted: true }, { id: 'ck_2', text: 'Chỉnh sửa theo góp ý', isCompleted: false }, { id: 'ck_3', text: 'Nộp qua email', isCompleted: false }], isRecurring: false, dueDate: daysFromNow(2), isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_3', userId: USER_ID, title: 'Đọc sách Atomic Habits', description: 'Đọc từ chương 5-8', priority: 'medium', status: 'in_progress', labels: ['đọc sách'], checklist: [], isRecurring: false, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_4', userId: USER_ID, title: 'Học TypeScript cơ bản', description: 'Hoàn thành course TypeScript trên Udemy', projectId: 'proj_python', priority: 'medium', status: 'todo', labels: ['typescript'], checklist: [], isRecurring: false, dueDate: daysFromNow(10), isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_5', userId: USER_ID, title: 'Chuẩn bị slide thuyết trình', description: 'Làm slide cho buổi thuyết trình dự án cuối kỳ', priority: 'high', status: 'todo', labels: ['học tập'], checklist: [], isRecurring: false, dueDate: daysFromNow(5), isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_6', userId: USER_ID, title: 'Mua vật liệu học tập', description: 'Mua sách giáo trình + bút + vở ghi chú', priority: 'low', status: 'todo', labels: [], checklist: [], isRecurring: false, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_7', userId: USER_ID, title: 'Ôn thi cuối kỳ Toán', description: 'Ôn tập các chương 1-6 cho thi cuối kỳ', priority: 'urgent', status: 'todo', labels: ['thi cử'], checklist: [], isRecurring: false, dueDate: daysFromNow(7), isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_8', userId: USER_ID, title: 'Đăng ký lớp học thêm', description: '', priority: 'medium', status: 'done', labels: [], checklist: [], isRecurring: false, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_9', userId: USER_ID, title: 'Gọi điện cho gia đình', description: '', priority: 'low', status: 'done', labels: [], checklist: [], isRecurring: false, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'task_10', userId: USER_ID, title: 'Viết CV cập nhật', description: 'Cập nhật kinh nghiệm và kỹ năng mới vào CV', projectId: 'proj_portfolio', priority: 'medium', status: 'in_progress', labels: ['sự nghiệp'], checklist: [{ id: 'ck_4', text: 'Cập nhật kỹ năng React', isCompleted: true }, { id: 'ck_5', text: 'Thêm dự án portfolio', isCompleted: false }], isRecurring: false, dueDate: daysFromNow(14), isDemo: true, createdAt: now, updatedAt: now },
    // Overdue task
    { id: 'task_11', userId: USER_ID, title: 'Nộp bài tập lập trình', description: 'Bài tập về thuật toán sắp xếp', priority: 'high', status: 'todo', labels: ['học tập'], checklist: [], isRecurring: false, dueDate: daysAgo(2), isDemo: true, createdAt: now, updatedAt: now },
  ];

  // ── Calendar Events ────────────────────────────────────────
  const calendarEvents: CalendarEvent[] = [
    { id: 'evt_1', userId: USER_ID, title: 'Lớp Python Online', type: 'study', date: getTodayString(), startTime: '19:00', endTime: '21:00', isOnline: true, onlineUrl: 'https://meet.google.com/abc', description: 'Học Python session 12 - OOP', color: '#6366f1', reminderMinutes: 15, subjectId: 'sub_python', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'evt_2', userId: USER_ID, title: 'Thi cuối kỳ Toán cao cấp', type: 'exam', date: daysFromNow(7), startTime: '08:00', endTime: '10:00', isOnline: false, location: 'Phòng B201 - Trường Đại học', description: 'Thi cuối kỳ Toán cao cấp 1', color: '#ef4444', reminderMinutes: 60, subjectId: 'sub_math', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'evt_3', userId: USER_ID, title: 'Họp nhóm dự án Portfolio', type: 'appointment', date: daysFromNow(1), startTime: '14:00', endTime: '16:00', isOnline: true, onlineUrl: 'https://zoom.us/j/123', description: 'Phân công công việc và review tiến độ', color: '#3b82f6', reminderMinutes: 30, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'evt_4', userId: USER_ID, title: 'Lớp Tiếng Anh', type: 'study', date: daysFromNow(3), startTime: '18:00', endTime: '19:30', isOnline: false, location: 'Trung tâm Anh ngữ ABC, Quận 1', description: '', color: '#22c55e', reminderMinutes: 15, subjectId: 'sub_english', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'evt_5', userId: USER_ID, title: 'Khám sức khỏe định kỳ', type: 'appointment', date: daysFromNow(14), startTime: '09:00', endTime: '11:00', isOnline: false, location: 'Bệnh viện Đa khoa Quận 7', description: '', color: '#f97316', reminderMinutes: 60, isDemo: true, createdAt: now, updatedAt: now },
  ];

  // ── Subjects ───────────────────────────────────────────────
  const subjects: Subject[] = [
    { id: 'sub_python', userId: USER_ID, name: 'Lập trình Python', code: 'CS101', teacher: 'Thầy Nguyễn Văn An', objectives: 'Nắm vững Python cơ bản và nâng cao', color: '#6366f1', totalSessions: 20, materials: 'Sách Python Crash Course', isActive: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'sub_math', userId: USER_ID, name: 'Toán cao cấp', code: 'MATH101', teacher: 'Cô Trần Thị Lan', objectives: 'Nắm vững giải tích và đại số tuyến tính', color: '#ef4444', totalSessions: 30, materials: '', isActive: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'sub_english', userId: USER_ID, name: 'Tiếng Anh giao tiếp', code: '', teacher: 'Ms. Sarah', objectives: 'Đạt trình độ B2 IELTS 6.0', color: '#22c55e', totalSessions: 40, materials: '', isActive: true, isDemo: true, createdAt: now, updatedAt: now },
  ];

  // ── Schedule Entries ──────────────────────────────────────
  const scheduleEntries: ScheduleEntry[] = [
    { id: 'sch_1', userId: USER_ID, subjectId: 'sub_python', dayOfWeek: 2, startTime: '19:00', endTime: '21:00', isActive: true, isDemo: true, createdAt: now },
    { id: 'sch_2', userId: USER_ID, subjectId: 'sub_python', dayOfWeek: 5, startTime: '19:00', endTime: '21:00', isActive: true, isDemo: true, createdAt: now },
    { id: 'sch_3', userId: USER_ID, subjectId: 'sub_math', dayOfWeek: 1, startTime: '08:00', endTime: '10:00', room: 'B201', isActive: true, isDemo: true, createdAt: now },
    { id: 'sch_4', userId: USER_ID, subjectId: 'sub_math', dayOfWeek: 4, startTime: '08:00', endTime: '10:00', room: 'B201', isActive: true, isDemo: true, createdAt: now },
    { id: 'sch_5', userId: USER_ID, subjectId: 'sub_english', dayOfWeek: 3, startTime: '18:00', endTime: '19:30', isActive: true, isDemo: true, createdAt: now },
    { id: 'sch_6', userId: USER_ID, subjectId: 'sub_english', dayOfWeek: 6, startTime: '09:00', endTime: '10:30', isActive: true, isDemo: true, createdAt: now },
  ];

  // ── Assignments ────────────────────────────────────────────
  const assignments: Assignment[] = [
    { id: 'asgn_1', userId: USER_ID, subjectId: 'sub_python', title: 'Bài tập OOP Python tuần 5', deadline: daysFromNow(3), importance: 'high', status: 'pending', note: 'Làm các bài tập về class và inheritance', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'asgn_2', userId: USER_ID, subjectId: 'sub_math', title: 'Bài tập Toán chương 4', deadline: daysFromNow(5), importance: 'medium', status: 'in_progress', note: 'Tích phân và ứng dụng', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'asgn_3', userId: USER_ID, subjectId: 'sub_english', title: 'Essay "My Future Career"', deadline: daysFromNow(10), importance: 'medium', status: 'pending', note: '500 từ, nộp qua email', isDemo: true, createdAt: now, updatedAt: now },
  ];

  // ── Exams ──────────────────────────────────────────────────
  const exams: Exam[] = [
    { id: 'exam_1', userId: USER_ID, subjectId: 'sub_math', title: 'Thi cuối kỳ Toán cao cấp', datetime: daysFromNow(7) + 'T08:00:00', duration: 120, location: 'Phòng B201', isOnline: false, status: 'upcoming', note: 'Mang CMND và bút bi', isDemo: true, createdAt: now, updatedAt: now },
  ];

  // ── Study Sessions ─────────────────────────────────────────
  const studySessions: StudySession[] = [
    { id: 'ss_1', userId: USER_ID, subjectId: 'sub_python', type: 'study', startTime: daysAgo(1) + 'T19:00:00', endTime: daysAgo(1) + 'T21:00:00', duration: 120, date: daysAgo(1), note: 'Ôn lại list comprehension', isDemo: true, createdAt: now },
    { id: 'ss_2', userId: USER_ID, subjectId: 'sub_math', type: 'study', startTime: daysAgo(2) + 'T08:00:00', endTime: daysAgo(2) + 'T10:00:00', duration: 120, date: daysAgo(2), note: '', isDemo: true, createdAt: now },
    { id: 'ss_3', userId: USER_ID, subjectId: 'sub_python', type: 'pomodoro', startTime: daysAgo(3) + 'T20:00:00', endTime: daysAgo(3) + 'T22:05:00', duration: 125, date: daysAgo(3), pomodoroCount: 4, note: '', isDemo: true, createdAt: now },
  ];

  // ── Habits ─────────────────────────────────────────────────
  const habits: Habit[] = [
    { id: 'habit_read', userId: USER_ID, name: 'Đọc sách', icon: '📚', color: '#6366f1', frequency: 'daily', targetPerDay: 1, startDate: daysAgo(30), isActive: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'habit_exercise', userId: USER_ID, name: 'Tập thể dục', icon: '🏋️', color: '#22c55e', frequency: 'daily', targetPerDay: 1, startDate: daysAgo(30), isActive: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'habit_english', userId: USER_ID, name: 'Học tiếng Anh', icon: '🗣️', color: '#f59e0b', frequency: 'daily', targetPerDay: 1, startDate: daysAgo(20), isActive: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'habit_water', userId: USER_ID, name: 'Uống đủ nước', icon: '💧', color: '#06b6d4', frequency: 'daily', targetPerDay: 8, startDate: daysAgo(15), isActive: true, isDemo: true, createdAt: now, updatedAt: now },
  ];

  // ── Habit Logs ─────────────────────────────────────────────
  const habitLogs: HabitLog[] = [];
  const habitPatterns: Record<string, number[]> = {
    'habit_read': [0, 1, 2, 3, 4, 5, 6], // completed all past 7 days
    'habit_exercise': [0, 1, 3, 4, 6], // some gaps
    'habit_english': [0, 1, 2, 4, 5],
    'habit_water': [0, 2, 3, 5, 6],
  };

  Object.entries(habitPatterns).forEach(([habitId, daysBack]) => {
    const habit = habits.find(h => h.id === habitId)!;
    daysBack.forEach(d => {
      habitLogs.push({
        id: generateId(),
        habitId,
        userId: USER_ID,
        date: daysAgo(d),
        completedCount: habit.targetPerDay,
        createdAt: now,
      });
    });
  });

  // ── Personal Goals ─────────────────────────────────────────
  const personalGoals: PersonalGoal[] = [
    {
      id: 'pgoal_1', userId: USER_ID, name: 'Tiết kiệm 50 triệu VND năm 2026',
      reason: 'Tạo quỹ dự phòng và đạt tự do tài chính cơ bản',
      category: 'financial', targetValue: 50000000, currentValue: 20500000,
      unit: '₫', startDate: '2026-01-01', deadline: '2026-12-31',
      milestones: [
        { id: 'ms_1', goalId: 'pgoal_1', title: 'Đạt 10 triệu', targetValue: 10000000, isCompleted: true, completedAt: daysAgo(45), createdAt: now },
        { id: 'ms_2', goalId: 'pgoal_1', title: 'Đạt 20 triệu', targetValue: 20000000, isCompleted: true, completedAt: daysAgo(5), createdAt: now },
        { id: 'ms_3', goalId: 'pgoal_1', title: 'Đạt 35 triệu', targetValue: 35000000, isCompleted: false, createdAt: now },
        { id: 'ms_4', goalId: 'pgoal_1', title: 'Đạt mục tiêu 50 triệu', targetValue: 50000000, isCompleted: false, createdAt: now },
      ],
      relatedTaskIds: [], relatedHabitIds: [], savingsGoalId: 'goal_emergency',
      priority: 'high', isCompleted: false, isDemo: true, createdAt: now, updatedAt: now,
    },
    {
      id: 'pgoal_2', userId: USER_ID, name: 'Học Python đến level Intermediate',
      reason: 'Phục vụ công việc và phát triển sự nghiệp lập trình',
      category: 'study', targetValue: 100, currentValue: 45,
      unit: '% tiến độ', startDate: daysAgo(30), deadline: daysFromNow(60),
      milestones: [
        { id: 'ms_5', goalId: 'pgoal_2', title: 'Hoàn thành Python cơ bản', targetValue: 40, isCompleted: true, completedAt: daysAgo(7), createdAt: now },
        { id: 'ms_6', goalId: 'pgoal_2', title: 'Hoàn thành OOP', targetValue: 60, isCompleted: false, createdAt: now },
        { id: 'ms_7', goalId: 'pgoal_2', title: 'Xây dựng dự án thực tế', targetValue: 100, isCompleted: false, createdAt: now },
      ],
      relatedTaskIds: ['task_1', 'task_4'], relatedHabitIds: [], projectId: 'proj_python',
      priority: 'high', isCompleted: false, isDemo: true, createdAt: now, updatedAt: now,
    },
  ];

  // ── Notifications ──────────────────────────────────────────
  const notifications: Notification[] = [
    { id: 'notif_1', userId: USER_ID, type: 'task_deadline', title: 'Công việc sắp đến hạn', message: '"Ôn tập Python Chapter 3" đến hạn hôm nay', relatedId: 'task_1', relatedType: 'task', isRead: false, createdAt: now },
    { id: 'notif_2', userId: USER_ID, type: 'budget_alert', title: 'Ngân sách gần đạt giới hạn', message: 'Ngân sách Ăn uống đã sử dụng 78%', relatedId: 'bud_food', relatedType: 'budget', isRead: false, createdAt: now },
    { id: 'notif_3', userId: USER_ID, type: 'goal_milestone', title: 'Đạt cột mốc mục tiêu!', message: 'Tiết kiệm đã đạt 20 triệu VND – hoàn thành cột mốc 2 🎉', relatedId: 'pgoal_1', relatedType: 'goal', isRead: false, createdAt: now },
    { id: 'notif_4', userId: USER_ID, type: 'task_overdue', title: 'Công việc quá hạn', message: '"Nộp bài tập lập trình" đã quá hạn 2 ngày', relatedId: 'task_11', relatedType: 'task', isRead: false, createdAt: now },
  ];

  // ── Persist everything ─────────────────────────────────────
  // Only set user/settings if not already set
  const existingUser = storageGet<User | null>(StorageKeys.USER, null);
  if (!existingUser) {
    storageSet(StorageKeys.USER, user);
    storageSet(StorageKeys.SETTINGS, settings);
  }

  // Merge with existing data
  const existingAccounts = storageGet<Account[]>(StorageKeys.ACCOUNTS, []);
  const existingCategories = storageGet<Category[]>(StorageKeys.CATEGORIES, []);
  const existingTransactions = storageGet<Transaction[]>(StorageKeys.TRANSACTIONS, []);
  const existingBudgets = storageGet<Budget[]>(StorageKeys.BUDGETS, []);
  const existingSavings = storageGet<SavingsGoal[]>(StorageKeys.SAVINGS_GOALS, []);
  const existingDebts = storageGet<Debt[]>(StorageKeys.DEBTS, []);
  const existingTasks = storageGet<Task[]>(StorageKeys.TASKS, []);
  const existingProjects = storageGet<Project[]>(StorageKeys.PROJECTS, []);
  const existingEvents = storageGet<CalendarEvent[]>(StorageKeys.CALENDAR_EVENTS, []);
  const existingSubjects = storageGet<Subject[]>(StorageKeys.SUBJECTS, []);
  const existingSchedule = storageGet<ScheduleEntry[]>(StorageKeys.SCHEDULE_ENTRIES, []);
  const existingAssignments = storageGet<Assignment[]>(StorageKeys.ASSIGNMENTS, []);
  const existingExams = storageGet<Exam[]>(StorageKeys.EXAMS, []);
  const existingSessions = storageGet<StudySession[]>(StorageKeys.STUDY_SESSIONS, []);
  const existingHabits = storageGet<Habit[]>(StorageKeys.HABITS, []);
  const existingHabitLogs = storageGet<HabitLog[]>(StorageKeys.HABIT_LOGS, []);
  const existingGoals = storageGet<PersonalGoal[]>(StorageKeys.PERSONAL_GOALS, []);
  const existingNotifications = storageGet<Notification[]>(StorageKeys.NOTIFICATIONS, []);

  storageSet(StorageKeys.ACCOUNTS, [...existingAccounts, ...accounts]);
  storageSet(StorageKeys.CATEGORIES, existingCategories.length ? existingCategories : categories);
  storageSet(StorageKeys.TRANSACTIONS, [...existingTransactions, ...transactions]);
  storageSet(StorageKeys.BUDGETS, [...existingBudgets, ...budgets]);
  storageSet(StorageKeys.SAVINGS_GOALS, [...existingSavings, ...savingsGoals]);
  storageSet(StorageKeys.DEBTS, [...existingDebts, ...debts]);
  storageSet(StorageKeys.TASKS, [...existingTasks, ...tasks]);
  storageSet(StorageKeys.PROJECTS, [...existingProjects, ...projects]);
  storageSet(StorageKeys.CALENDAR_EVENTS, [...existingEvents, ...calendarEvents]);
  storageSet(StorageKeys.SUBJECTS, [...existingSubjects, ...subjects]);
  storageSet(StorageKeys.SCHEDULE_ENTRIES, [...existingSchedule, ...scheduleEntries]);
  storageSet(StorageKeys.ASSIGNMENTS, [...existingAssignments, ...assignments]);
  storageSet(StorageKeys.EXAMS, [...existingExams, ...exams]);
  storageSet(StorageKeys.STUDY_SESSIONS, [...existingSessions, ...studySessions]);
  storageSet(StorageKeys.HABITS, [...existingHabits, ...habits]);
  storageSet(StorageKeys.HABIT_LOGS, [...existingHabitLogs, ...habitLogs]);
  storageSet(StorageKeys.PERSONAL_GOALS, [...existingGoals, ...personalGoals]);
  storageSet(StorageKeys.NOTIFICATIONS, [...existingNotifications, ...notifications]);

  storageSet('lifeflow_demo_loaded', true);
}
