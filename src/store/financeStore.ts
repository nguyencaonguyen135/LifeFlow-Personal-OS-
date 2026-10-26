// ============================================================
// Finance Store – Zustand
// Manages: accounts, categories, transactions, budgets,
//          savings goals, debts
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Account, Category, Transaction, Budget,
  SavingsGoal, SavingsContribution, Debt, DebtPayment,
  TransactionType, FinanceSummary, CategoryExpense, MonthlyChartData
} from '@/types';
import { StorageKeys, storageGet, storageSet } from '@/services/storage';
import {
  generateId, toISOString, getTodayString,
  getCurrentMonthRange, getLastMonthRange,
  calculateSavingsRate, calculateDebtStatus
} from '@/utils';

// ─── Default System Categories ─────────────────────────────

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  // Income
  { name: 'Lương', type: 'income', icon: '💼', color: '#22c55e', isSystem: true, isActive: true, isDemo: false },
  { name: 'Làm thêm', type: 'income', icon: '⚡', color: '#10b981', isSystem: true, isActive: true, isDemo: false },
  { name: 'Thưởng', type: 'income', icon: '🎁', color: '#84cc16', isSystem: true, isActive: true, isDemo: false },
  { name: 'Kinh doanh', type: 'income', icon: '🏪', color: '#14b8a6', isSystem: true, isActive: true, isDemo: false },
  { name: 'Đầu tư', type: 'income', icon: '📈', color: '#06b6d4', isSystem: true, isActive: true, isDemo: false },
  { name: 'Thu nhập khác', type: 'income', icon: '💰', color: '#0ea5e9', isSystem: true, isActive: true, isDemo: false },
  // Expense
  { name: 'Ăn uống', type: 'expense', icon: '🍔', color: '#f97316', isSystem: true, isActive: true, isDemo: false },
  { name: 'Học tập', type: 'expense', icon: '📚', color: '#8b5cf6', isSystem: true, isActive: true, isDemo: false },
  { name: 'Đi lại', type: 'expense', icon: '🚗', color: '#6366f1', isSystem: true, isActive: true, isDemo: false },
  { name: 'Nhà ở', type: 'expense', icon: '🏠', color: '#3b82f6', isSystem: true, isActive: true, isDemo: false },
  { name: 'Mua sắm', type: 'expense', icon: '👗', color: '#ec4899', isSystem: true, isActive: true, isDemo: false },
  { name: 'Giải trí', type: 'expense', icon: '🎮', color: '#a855f7', isSystem: true, isActive: true, isDemo: false },
  { name: 'Sức khỏe', type: 'expense', icon: '💊', color: '#ef4444', isSystem: true, isActive: true, isDemo: false },
  { name: 'Hóa đơn', type: 'expense', icon: '⚡', color: '#f59e0b', isSystem: true, isActive: true, isDemo: false },
  { name: 'Trả nợ', type: 'expense', icon: '💳', color: '#dc2626', isSystem: true, isActive: true, isDemo: false },
  { name: 'Chi phí khác', type: 'expense', icon: '📌', color: '#6b7280', isSystem: true, isActive: true, isDemo: false },
];

// ─── Finance Store Interface ──────────────────────────────

interface FinanceStore {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];

  // Load from storage
  load: () => void;

  // Account actions
  addAccount: (data: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Account;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => boolean;
  recalculateAccountBalance: (accountId: string) => void;

  // Category actions
  addCategory: (data: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => { success: boolean; reason?: string };

  // Transaction actions
  addTransaction: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Budget actions
  addBudget: (data: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Budget;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetSpent: (budgetId: string) => number;

  // Savings goal actions
  addSavingsGoal: (data: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'contributions'>) => SavingsGoal;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addContribution: (goalId: string, contribution: Omit<SavingsContribution, 'id' | 'goalId' | 'createdAt'>) => void;

  // Debt actions
  addDebt: (data: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'payments'>) => Debt;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (debtId: string, payment: Omit<DebtPayment, 'id' | 'debtId' | 'createdAt'>) => void;

  // Computed
  getFinanceSummary: (month?: string) => FinanceSummary;
  getCategoryExpenses: (startDate: string, endDate: string) => CategoryExpense[];
  getMonthlyChartData: (months?: number) => MonthlyChartData[];
  getTotalBalance: () => number;
  getTransactionsInRange: (startDate: string, endDate: string, type?: TransactionType) => Transaction[];
}

const USER_ID = 'user_1';

function saveAccounts(accounts: Account[]) { storageSet(StorageKeys.ACCOUNTS, accounts); }
function saveCategories(cats: Category[]) { storageSet(StorageKeys.CATEGORIES, cats); }
function saveTransactions(txns: Transaction[]) { storageSet(StorageKeys.TRANSACTIONS, txns); }
function saveBudgets(b: Budget[]) { storageSet(StorageKeys.BUDGETS, b); }
function saveSavingsGoals(g: SavingsGoal[]) { storageSet(StorageKeys.SAVINGS_GOALS, g); }
function saveDebts(d: Debt[]) { storageSet(StorageKeys.DEBTS, d); }

export const useFinanceStore = create<FinanceStore>()(
  subscribeWithSelector((set, get) => ({
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    savingsGoals: [],
    debts: [],

    load: () => {
      const accounts = storageGet<Account[]>(StorageKeys.ACCOUNTS, []);
      let categories = storageGet<Category[]>(StorageKeys.CATEGORIES, []);
      
      // Seed system categories if none exist
      if (categories.length === 0) {
        const now = toISOString();
        categories = DEFAULT_CATEGORIES.map((cat, i) => ({
          ...cat,
          id: `cat_${i + 1}`,
          userId: USER_ID,
          createdAt: now,
          updatedAt: now,
        }));
        saveCategories(categories);
      }

      set({
        accounts,
        categories,
        transactions: storageGet<Transaction[]>(StorageKeys.TRANSACTIONS, []),
        budgets: storageGet<Budget[]>(StorageKeys.BUDGETS, []),
        savingsGoals: storageGet<SavingsGoal[]>(StorageKeys.SAVINGS_GOALS, []),
        debts: storageGet<Debt[]>(StorageKeys.DEBTS, []),
      });
    },

    // ── Account Actions ──────────────────────────────────

    addAccount: (data) => {
      const account: Account = {
        ...data,
        id: generateId(),
        userId: USER_ID,
        currentBalance: data.initialBalance,
        createdAt: toISOString(),
        updatedAt: toISOString(),
      };
      set(s => {
        const accounts = [...s.accounts, account];
        saveAccounts(accounts);
        return { accounts };
      });
      return account;
    },

    updateAccount: (id, data) => {
      set(s => {
        const accounts = s.accounts.map(a =>
          a.id === id ? { ...a, ...data, updatedAt: toISOString() } : a
        );
        saveAccounts(accounts);
        return { accounts };
      });
    },

    deleteAccount: (id) => {
      const { transactions } = get();
      const hasTransactions = transactions.some(t => t.accountId === id || t.toAccountId === id);
      if (hasTransactions) return false;
      set(s => {
        const accounts = s.accounts.filter(a => a.id !== id);
        saveAccounts(accounts);
        return { accounts };
      });
      return true;
    },

    recalculateAccountBalance: (accountId) => {
      const { accounts, transactions } = get();
      const account = accounts.find(a => a.id === accountId);
      if (!account) return;

      let balance = account.initialBalance;
      transactions.forEach(t => {
        if (t.accountId === accountId) {
          if (t.type === 'income') balance += t.amount;
          else if (t.type === 'expense') balance -= t.amount;
          else if (t.type === 'transfer') balance -= t.amount;
        }
        if (t.toAccountId === accountId && t.type === 'transfer') {
          balance += t.amount;
        }
      });

      set(s => {
        const updatedAccounts = s.accounts.map(a =>
          a.id === accountId ? { ...a, currentBalance: balance, updatedAt: toISOString() } : a
        );
        saveAccounts(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    },

    // ── Category Actions ─────────────────────────────────

    addCategory: (data) => {
      const category: Category = {
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: toISOString(),
        updatedAt: toISOString(),
      };
      set(s => {
        const categories = [...s.categories, category];
        saveCategories(categories);
        return { categories };
      });
      return category;
    },

    updateCategory: (id, data) => {
      set(s => {
        const categories = s.categories.map(c =>
          c.id === id ? { ...c, ...data, updatedAt: toISOString() } : c
        );
        saveCategories(categories);
        return { categories };
      });
    },

    deleteCategory: (id) => {
      const { categories, transactions } = get();
      const cat = categories.find(c => c.id === id);
      if (!cat) return { success: false, reason: 'Không tìm thấy danh mục' };
      if (cat.isSystem) return { success: false, reason: 'Không thể xóa danh mục hệ thống' };
      const used = transactions.some(t => t.categoryId === id);
      if (used) return { success: false, reason: 'Danh mục đang được sử dụng trong giao dịch' };
      set(s => {
        const updatedCategories = s.categories.filter(c => c.id !== id);
        saveCategories(updatedCategories);
        return { categories: updatedCategories };
      });
      return { success: true };
    },

    // ── Transaction Actions ──────────────────────────────

    addTransaction: (data) => {
      const txn: Transaction = {
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: toISOString(),
        updatedAt: toISOString(),
      };
      set(s => {
        const transactions = [txn, ...s.transactions];
        saveTransactions(transactions);
        return { transactions };
      });
      // Recalculate balances
      get().recalculateAccountBalance(data.accountId);
      if (data.toAccountId) get().recalculateAccountBalance(data.toAccountId);
      return txn;
    },

    updateTransaction: (id, data) => {
      const { transactions } = get();
      const old = transactions.find(t => t.id === id);
      set(s => {
        const updated = s.transactions.map(t =>
          t.id === id ? { ...t, ...data, updatedAt: toISOString() } : t
        );
        saveTransactions(updated);
        return { transactions: updated };
      });
      // Recalculate affected accounts
      if (old) {
        get().recalculateAccountBalance(old.accountId);
        if (old.toAccountId) get().recalculateAccountBalance(old.toAccountId);
      }
      if (data.accountId && data.accountId !== old?.accountId) {
        get().recalculateAccountBalance(data.accountId);
      }
    },

    deleteTransaction: (id) => {
      const { transactions } = get();
      const txn = transactions.find(t => t.id === id);
      set(s => {
        const updated = s.transactions.filter(t => t.id !== id);
        saveTransactions(updated);
        return { transactions: updated };
      });
      if (txn) {
        get().recalculateAccountBalance(txn.accountId);
        if (txn.toAccountId) get().recalculateAccountBalance(txn.toAccountId);
      }
    },

    // ── Budget Actions ───────────────────────────────────

    addBudget: (data) => {
      const budget: Budget = {
        ...data,
        id: generateId(),
        userId: USER_ID,
        createdAt: toISOString(),
        updatedAt: toISOString(),
      };
      set(s => {
        const budgets = [...s.budgets, budget];
        saveBudgets(budgets);
        return { budgets };
      });
      return budget;
    },

    updateBudget: (id, data) => {
      set(s => {
        const budgets = s.budgets.map(b =>
          b.id === id ? { ...b, ...data, updatedAt: toISOString() } : b
        );
        saveBudgets(budgets);
        return { budgets };
      });
    },

    deleteBudget: (id) => {
      set(s => {
        const budgets = s.budgets.filter(b => b.id !== id);
        saveBudgets(budgets);
        return { budgets };
      });
    },

    getBudgetSpent: (budgetId) => {
      const { budgets, transactions } = get();
      const budget = budgets.find(b => b.id === budgetId);
      if (!budget) return 0;
      
      return transactions
        .filter(t =>
          t.type === 'expense' &&
          t.date >= budget.startDate &&
          t.date <= budget.endDate &&
          (budget.categoryId ? t.categoryId === budget.categoryId : true)
        )
        .reduce((sum, t) => sum + t.amount, 0);
    },

    // ── Savings Goal Actions ─────────────────────────────

    addSavingsGoal: (data) => {
      const goal: SavingsGoal = {
        ...data,
        id: generateId(),
        userId: USER_ID,
        contributions: [],
        createdAt: toISOString(),
        updatedAt: toISOString(),
      };
      set(s => {
        const savingsGoals = [...s.savingsGoals, goal];
        saveSavingsGoals(savingsGoals);
        return { savingsGoals };
      });
      return goal;
    },

    updateSavingsGoal: (id, data) => {
      set(s => {
        const savingsGoals = s.savingsGoals.map(g =>
          g.id === id ? { ...g, ...data, updatedAt: toISOString() } : g
        );
        saveSavingsGoals(savingsGoals);
        return { savingsGoals };
      });
    },

    deleteSavingsGoal: (id) => {
      set(s => {
        const savingsGoals = s.savingsGoals.filter(g => g.id !== id);
        saveSavingsGoals(savingsGoals);
        return { savingsGoals };
      });
    },

    addContribution: (goalId, contribution) => {
      const contrib: SavingsContribution = {
        ...contribution,
        id: generateId(),
        goalId,
        createdAt: toISOString(),
      };
      set(s => {
        const savingsGoals = s.savingsGoals.map(g => {
          if (g.id !== goalId) return g;
          const newAmount = g.currentAmount + contribution.amount;
          return {
            ...g,
            currentAmount: newAmount,
            isCompleted: newAmount >= g.targetAmount,
            contributions: [...g.contributions, contrib],
            updatedAt: toISOString(),
          };
        });
        saveSavingsGoals(savingsGoals);
        return { savingsGoals };
      });
    },

    // ── Debt Actions ─────────────────────────────────────

    addDebt: (data) => {
      const debt: Debt = {
        ...data,
        id: generateId(),
        userId: USER_ID,
        paidAmount: 0,
        payments: [],
        status: 'pending',
        createdAt: toISOString(),
        updatedAt: toISOString(),
      };
      set(s => {
        const debts = [...s.debts, debt];
        saveDebts(debts);
        return { debts };
      });
      return debt;
    },

    updateDebt: (id, data) => {
      set(s => {
        const debts = s.debts.map(d =>
          d.id === id ? { ...d, ...data, updatedAt: toISOString() } : d
        );
        saveDebts(debts);
        return { debts };
      });
    },

    deleteDebt: (id) => {
      set(s => {
        const debts = s.debts.filter(d => d.id !== id);
        saveDebts(debts);
        return { debts };
      });
    },

    addDebtPayment: (debtId, payment) => {
      const pmt: DebtPayment = {
        ...payment,
        id: generateId(),
        debtId,
        createdAt: toISOString(),
      };
      set(s => {
        const debts = s.debts.map(d => {
          if (d.id !== debtId) return d;
          const newPaid = d.paidAmount + payment.amount;
          return {
            ...d,
            paidAmount: newPaid,
            status: calculateDebtStatus({ ...d, paidAmount: newPaid }),
            payments: [...d.payments, pmt],
            updatedAt: toISOString(),
          };
        });
        saveDebts(debts);
        return { debts };
      });
    },

    // ── Computed Values ──────────────────────────────────

    getTotalBalance: () => {
      return get().accounts
        .filter(a => a.isActive)
        .reduce((sum, a) => sum + a.currentBalance, 0);
    },

    getTransactionsInRange: (startDate, endDate, type) => {
      return get().transactions.filter(t =>
        t.date >= startDate &&
        t.date <= endDate &&
        (type ? t.type === type : t.type !== 'transfer')
      );
    },

    getFinanceSummary: (month) => {
      const { transactions, budgets } = get();
      const { start, end } = month
        ? { start: `${month}-01`, end: `${month}-31` }
        : getCurrentMonthRange();

      const lastMonth = getLastMonthRange();

      const monthTxns = transactions.filter(t =>
        t.date >= start && t.date <= end && t.type !== 'transfer'
      );
      const lastMonthTxns = transactions.filter(t =>
        t.date >= lastMonth.start && t.date <= lastMonth.end && t.type !== 'transfer'
      );

      const monthlyIncome = monthTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpense = monthTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const previousMonthIncome = lastMonthTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const previousMonthExpense = lastMonthTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Budget remaining = sum of all active budget limits - actual spending in those categories
      const activeBudgets = budgets.filter(b => b.isActive && b.startDate <= end && b.endDate >= start);
      const totalBudget = activeBudgets.reduce((sum, b) => sum + b.amount, 0);
      const budgetSpent = activeBudgets.reduce((sum, b) => {
        const spent = transactions
          .filter(t =>
            t.type === 'expense' &&
            t.date >= b.startDate && t.date <= b.endDate &&
            (b.categoryId ? t.categoryId === b.categoryId : true)
          )
          .reduce((s, t) => s + t.amount, 0);
        return sum + spent;
      }, 0);

      return {
        totalBalance: get().getTotalBalance(),
        monthlyIncome,
        monthlyExpense,
        budgetRemaining: Math.max(0, totalBudget - budgetSpent),
        savingsRate: calculateSavingsRate(monthlyIncome, monthlyExpense),
        transactionCount: monthTxns.length,
        previousMonthIncome,
        previousMonthExpense,
      };
    },

    getCategoryExpenses: (startDate, endDate) => {
      const { transactions, categories } = get();
      const expenses = transactions.filter(t =>
        t.type === 'expense' && t.date >= startDate && t.date <= endDate
      );
      const total = expenses.reduce((sum, t) => sum + t.amount, 0);

      const grouped: Record<string, { amount: number; count: number }> = {};
      expenses.forEach(t => {
        const catId = t.categoryId ?? 'uncategorized';
        if (!grouped[catId]) grouped[catId] = { amount: 0, count: 0 };
        grouped[catId]!.amount += t.amount;
        grouped[catId]!.count++;
      });

      return Object.entries(grouped)
        .map(([catId, { amount, count }]) => {
          const cat = categories.find(c => c.id === catId);
          return {
            categoryId: catId,
            categoryName: cat?.name ?? 'Khác',
            categoryColor: cat?.color ?? '#6b7280',
            amount,
            percentage: total > 0 ? (amount / total) * 100 : 0,
            count,
          };
        })
        .sort((a, b) => b.amount - a.amount);
    },

    getMonthlyChartData: (months = 6) => {
      const { transactions } = get();
      const data: MonthlyChartData[] = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

        const monthTxns = transactions.filter(t =>
          t.date >= start && t.date <= endStr && t.type !== 'transfer'
        );
        const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        data.push({
          month: `T${d.getMonth() + 1}/${d.getFullYear()}`,
          income,
          expense,
          balance: income - expense,
        });
      }
      return data;
    },
  }))
);
