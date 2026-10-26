import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { ListChecks, X } from 'lucide-react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';

// Pages
import Dashboard from './pages/Dashboard';
import FinancePage from './pages/finance/FinancePage';
import TasksPage from './pages/tasks/TasksPage';
import CalendarPage from './pages/calendar/CalendarPage';
import StudyPage from './pages/study/StudyPage';
import HabitsPage from './pages/habits/HabitsPage';
import GoalsPage from './pages/goals/GoalsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

// Stores & Data
import { loadDemoData } from './data/demoData';
import { useSettingStore } from './store/settingStore';
import { useFinanceStore } from './store/financeStore';
import { useTaskStore } from './store/taskStore';
import { useHabitStore } from './store/habitStore';
import { useGoalStore } from './store/goalStore';
import { useCalendarStore } from './store/calendarStore';
import { useStudyStore } from './store/studyStore';
import { getTodayString } from './utils';

import './App.css';

type QuickAction = 'income' | 'expense' | 'task' | 'event' | 'habit' | 'goal' | null;

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [quickAction, setQuickAction] = useState<QuickAction>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // 1. Seed demo data if first time
    loadDemoData();

    // 2. Initialize theme from settings
    useSettingStore.getState().initTheme();

    // 3. Load all stores from storage
    useSettingStore.getState().load();
    useFinanceStore.getState().load();
    useTaskStore.getState().load();
    useHabitStore.getState().load();
    useGoalStore.getState().load();
    useCalendarStore.getState().load();
    useStudyStore.getState().load();
  }, []);

  const openQuickAdd = (type: string) => {
    setQuickAction(type as QuickAction);
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-wrap ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </div>

      {mobileSidebarOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Đóng menu"
        />
      )}

      <main className="app-main" style={{ marginLeft: collapsed ? 72 : 240, transition: 'margin-left 0.25s ease' }}>
        <Header onQuickAdd={openQuickAdd} />

        <button
          className="mobile-menu"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Mở menu"
        >
          <ListChecks size={20} />
        </button>

        <Routes>
          <Route path="/" element={<Dashboard onQuickAdd={openQuickAdd} />} />
          <Route path="/finance/*" element={<FinancePage />} />
          <Route path="/tasks/*" element={<TasksPage />} />
          <Route path="/calendar/*" element={<CalendarPage />} />
          <Route path="/study/*" element={<StudyPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <MobileNav />

      {quickAction && (
        <QuickAddModal
          action={quickAction}
          onClose={() => setQuickAction(null)}
          onSaved={() => setQuickAction(null)}
        />
      )}
    </div>
  );
}

function QuickAddModal({
  action,
  onClose,
  onSaved
}: {
  action: Exclude<QuickAction, null>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());

  const { addTask } = useTaskStore();
  const { addTransaction, accounts, categories } = useFinanceStore();
  const { addHabit } = useHabitStore();
  const { addGoal } = useGoalStore();
  const { addEvent } = useCalendarStore();

  const isMoney = action === 'income' || action === 'expense';
  const labels: Record<Exclude<QuickAction, null>, string> = {
    income: 'Thêm Khoản Thu',
    expense: 'Thêm Khoản Chi',
    task: 'Thêm Công Việc Mới',
    event: 'Thêm Sự Kiện Lịch',
    habit: 'Tạo Thói Quen Mới',
    goal: 'Tạo Mục Tiêu Mới'
  };

  const handleSave = () => {
    if (!title.trim() || (isMoney && !amount)) return;

    if (action === 'task') {
      addTask({ title, dueDate: date });
    } else if (action === 'habit') {
      addHabit({ name: title });
    } else if (action === 'goal') {
      addGoal({ name: title, targetValue: Number(amount) || 100 });
    } else if (action === 'event') {
      addEvent({ title, date, startTime: '09:00', endTime: '10:00', type: 'personal' });
    } else if (isMoney && accounts[0]) {
      addTransaction({
        type: action,
        amount: Number(amount),
        accountId: accounts[0].id,
        date,
        paymentMethod: 'cash',
        description: title,
        tags: [],
        isDemo: false,
        categoryId: categories.find(c => c.type === action)?.id
      });
    }

    onSaved();
  };

  return (
    <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && onClose()}>
      <div className="modal card">
        <div className="modal-heading">
          <h2>{labels[action]}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <label>
          Tiêu đề / Nội dung
          <input
            className="input"
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={action === 'task' ? 'Ví dụ: Nộp bài tập, Họp nhóm...' : 'Nhập nội dung...'}
          />
        </label>

        {(isMoney || action === 'goal') && (
          <label>
            {action === 'goal' ? 'Mục tiêu cần đạt' : 'Số tiền (VND)'}
            <input
              className="input"
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
            />
          </label>
        )}

        {action !== 'habit' && (
          <label>
            Ngày áp dụng
            <input
              className="input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </label>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave}>Lưu lại</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
