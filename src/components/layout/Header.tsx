import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, Plus, User, ChevronDown, X, Check, TrendingUp, ListChecks, Calendar, BookOpen, Flame, Target } from 'lucide-react';
import { useSettingStore } from '@/store/settingStore';
import { useFinanceStore } from '@/store/financeStore';
import { useTaskStore } from '@/store/taskStore';
import { getGreeting, formatDate, formatCurrency, matchesSearch } from '@/utils';

interface HeaderProps {
  onQuickAdd?: (type: string) => void;
}

export default function Header({ onQuickAdd }: HeaderProps) {
  const { user, settings, toggleTheme } = useSettingStore();
  const { transactions, categories } = useFinanceStore();
  const { tasks } = useTaskStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dateStr = formatDate(now.toISOString());
  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayName = dayNames[now.getDay()];

  // Search results
  const searchResults = searchQuery.trim().length > 1 ? [
    ...transactions
      .filter(t => matchesSearch(t.description, searchQuery))
      .slice(0, 3)
      .map(t => ({
        type: 'transaction', id: t.id,
        label: t.description,
        sub: `${formatCurrency(t.amount)} • ${formatDate(t.date)}`,
        icon: '💰', path: '/finance/transactions'
      })),
    ...tasks
      .filter(t => matchesSearch(t.title, searchQuery))
      .slice(0, 3)
      .map(t => ({
        type: 'task', id: t.id,
        label: t.title,
        sub: t.dueDate ? `Hạn: ${formatDate(t.dueDate)}` : 'Chưa có hạn',
        icon: '✅', path: '/tasks/list'
      })),
  ] : [];

  // Notifications (simplified)
  const overdueTasks = tasks.filter(t => {
    const today = new Date().toISOString().slice(0, 10);
    return t.dueDate && t.dueDate < today && t.status !== 'done' && t.status !== 'cancelled';
  });

  const notifications = [
    ...overdueTasks.slice(0, 2).map(t => ({
      id: t.id,
      type: 'danger',
      title: 'Công việc quá hạn',
      message: t.title,
      time: 'Quá hạn',
    })),
  ];

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setQuickAddOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickAddOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const QUICK_ACTIONS = [
    { type: 'income', label: 'Thêm khoản thu', icon: TrendingUp, color: 'var(--color-income)' },
    { type: 'expense', label: 'Thêm khoản chi', icon: TrendingUp, color: 'var(--color-expense)' },
    { type: 'task', label: 'Tạo công việc', icon: ListChecks, color: 'var(--color-task-500)' },
    { type: 'event', label: 'Thêm lịch học', icon: Calendar, color: 'var(--color-study-500)' },
    { type: 'habit', label: 'Ghi nhận thói quen', icon: Flame, color: 'var(--color-habit-500)' },
    { type: 'goal', label: 'Tạo mục tiêu', icon: Target, color: 'var(--color-goal-500)' },
  ];

  const isDark = settings.theme === 'dark';

  return (
    <header
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Greeting & Date */}
      <div className="flex-1 min-w-0">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {getGreeting()}, {user.name.split(' ').pop()}! 👋
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'none' }} className="md:inline">
            {dayName}, {dateStr}
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {searchOpen ? (
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }} />
            <input
              ref={searchRef}
              className="input"
              style={{ paddingLeft: 34, paddingRight: 34, width: 280, fontSize: 13 }}
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              autoFocus
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
            >
              <X size={14} />
            </button>
            {searchResults.length > 0 && (
              <div className="dropdown" style={{ top: 'calc(100% + 6px)', left: 0, right: 0, minWidth: 280 }}>
                {searchResults.map(r => (
                  <div key={r.id} className="dropdown-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{r.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.sub}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            title="Tìm kiếm (Ctrl+K)"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {/* Quick Add */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={quickRef}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setQuickAddOpen(o => !o)}
          style={{ gap: 6 }}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Thêm mới</span>
          <ChevronDown size={13} />
        </button>
        {quickAddOpen && (
          <div className="dropdown" style={{ top: 'calc(100% + 6px)', right: 0, minWidth: 220 }}>
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.type}
                  className="dropdown-item w-full"
                  onClick={() => { setQuickAddOpen(false); onQuickAdd?.(action.type); }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: action.color + '20', flexShrink: 0
                  }}>
                    <Icon size={15} style={{ color: action.color }} />
                  </span>
                  <span style={{ fontSize: 13 }}>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={notifRef}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setNotifOpen(o => !o)}
          style={{ position: 'relative' }}
          title="Thông báo"
        >
          <Bell size={18} />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--color-danger)',
              border: '1.5px solid var(--bg-surface)'
            }} />
          )}
        </button>
        {notifOpen && (
          <div className="dropdown" style={{ top: 'calc(100% + 6px)', right: 0, width: 320 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: 13 }}>
              Thông báo {notifications.length > 0 && <span className="badge badge-danger ml-2">{notifications.length}</span>}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Không có thông báo mới
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="dropdown-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: n.type === 'danger' ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                    {n.title}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{n.message}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={toggleTheme}
        title={isDark ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* User Avatar */}
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          flexShrink: 0,
        }}
        title={user.name}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
    </header>
  );
}
