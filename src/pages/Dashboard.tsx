import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  WalletCards, ArrowUpRight, ArrowDownRight, CheckCircle2,
  CircleDollarSign, Flame, Clock3, Plus, ChevronRight,
  TrendingUp, Calendar, BookOpen, AlertCircle, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useFinanceStore } from '@/store/financeStore';
import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { useGoalStore } from '@/store/goalStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useStudyStore } from '@/store/studyStore';
import { useSettingStore } from '@/store/settingStore';
import {
  formatCurrency, formatDate, getTodayString, getMotivationalQuote,
  getGreeting, confirmAction
} from '@/utils';

const PIE_COLORS = ['#6366f1', '#f97316', '#22c55e', '#ec4899', '#3b82f6', '#eab308', '#a855f7'];

export default function Dashboard({ onQuickAdd }: { onQuickAdd: (type: string) => void }) {
  const { user } = useSettingStore();
  const { accounts, transactions, categories } = useFinanceStore();
  const { tasks, toggleTaskStatus } = useTaskStore();
  const { habits, isCompletedToday, getStreakForHabit, logHabit } = useHabitStore();
  const { goals } = useGoalStore();
  const { getUpcomingEvents } = useCalendarStore();
  const { getUpcomingDeadlines } = useStudyStore();

  const today = getTodayString();
  const currentMonthStr = today.slice(0, 7);

  // Financial calculations
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  const currentMonthTxns = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonthStr));
  }, [transactions, currentMonthStr]);

  const monthIncome = useMemo(() => {
    return currentMonthTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTxns]);

  const monthExpense = useMemo(() => {
    return currentMonthTxns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTxns]);

  const savingsRate = monthIncome > 0
    ? Math.max(0, Math.round(((monthIncome - monthExpense) / monthIncome) * 100))
    : 0;

  // Monthly 6-month Bar Chart data
  const barChartData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const target = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
      const label = `T${target.getMonth() + 1}`;
      months[key] = { month: label, income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const key = t.date.slice(0, 7);
      if (months[key]) {
        if (t.type === 'income') months[key].income += t.amount;
        else if (t.type === 'expense') months[key].expense += t.amount;
      }
    });

    return Object.values(months);
  }, [transactions]);

  // Expense breakdown Pie Chart
  const expenseByCategoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    currentMonthTxns
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catId = t.categoryId || 'other';
        categoryTotals[catId] = (categoryTotals[catId] || 0) + t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          name: cat?.name || 'Khác',
          value: amount,
          color: cat?.color || '#94a3b8'
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [currentMonthTxns, categories]);

  // Tasks today & overdue
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate === today || t.startDate === today);
  }, [tasks, today]);

  const overdueTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done' && t.status !== 'cancelled');
  }, [tasks, today]);

  // Active Habits
  const activeHabits = useMemo(() => {
    return habits.filter(h => h.isActive);
  }, [habits]);

  // Upcoming deadlines & events (next 5 days)
  const upcomingEvents = useMemo(() => {
    return getUpcomingEvents(5).slice(0, 4);
  }, [getUpcomingEvents]);

  const upcomingDeadlines = useMemo(() => {
    return getUpcomingDeadlines(7).slice(0, 4);
  }, [getUpcomingDeadlines]);

  // Active Goals
  const activeGoals = useMemo(() => {
    return goals.filter(g => !g.isCompleted).slice(0, 3);
  }, [goals]);

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div className="welcome-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="eyebrow">PERSONAL LIFE OS</span>
            <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 600 }}>
              Live
            </span>
          </div>
          <h1 style={{ marginTop: 4 }}>
            {getGreeting()}, {user.name.split(' ').pop()}! 👋
          </h1>
          <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} style={{ color: 'var(--color-warning)' }} />
            <span>"{getMotivationalQuote()}"</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => onQuickAdd('expense')}>
            <ArrowDownRight size={15} style={{ color: 'var(--color-expense)' }} />
            <span>Chi tiền</span>
          </button>
          <button className="btn btn-primary" onClick={() => onQuickAdd('task')}>
            <Plus size={15} />
            <span>Thêm công việc</span>
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert if any */}
      {overdueTasks.length > 0 && (
        <div style={{
          background: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger)',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-danger)' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Bạn đang có <strong>{overdueTasks.length}</strong> công việc quá hạn cần hoàn thành ngay!
            </span>
          </div>
          <Link to="/tasks/list" className="btn btn-sm btn-danger" style={{ textDecoration: 'none' }}>
            Xem ngay
          </Link>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="metric-grid">
        <div className="card metric-card">
          <div className="metric-icon primary">
            <WalletCards size={20} />
          </div>
          <div>
            <span>Tổng số dư ví</span>
            <strong>{formatCurrency(totalBalance)}</strong>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon income">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <span>Thu nhập tháng {new Date().getMonth() + 1}</span>
            <strong style={{ color: 'var(--color-income)' }}>+{formatCurrency(monthIncome)}</strong>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon expense">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <span>Chi tiêu tháng {new Date().getMonth() + 1}</span>
            <strong style={{ color: 'var(--color-expense)' }}>-{formatCurrency(monthExpense)}</strong>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon task">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Việc hôm nay ({todayTasks.filter(t => t.status === 'done').length}/{todayTasks.length})</span>
            <strong>
              {todayTasks.length > 0
                ? `${Math.round((todayTasks.filter(t => t.status === 'done').length / todayTasks.length) * 100)}% xong`
                : 'Thảnh thơi'}
            </strong>
          </div>
        </div>
      </div>

      {/* Charts Section: Income/Expense Trend & Expense Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Trend Bar Chart */}
        <div className="card panel" style={{ minHeight: 300 }}>
          <div className="panel-heading">
            <div>
              <h2>Xu hướng thu chi</h2>
              <small className="muted">6 tháng gần đây (VND)</small>
            </div>
            <Link to="/finance/reports" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 13 }}>
              Báo cáo <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => `${val / 1000000}M`}
                />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val) || 0)}
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    fontSize: 12
                  }}
                />
                <Bar dataKey="income" name="Thu nhập" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Chi tiêu" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="card panel" style={{ minHeight: 300 }}>
          <div className="panel-heading">
            <div>
              <h2>Cơ cấu chi tiêu</h2>
              <small className="muted">Tháng {new Date().getMonth() + 1} theo danh mục</small>
            </div>
            <Link to="/finance/categories" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 13 }}>
              Danh mục <ChevronRight size={14} />
            </Link>
          </div>
          {expenseByCategoryData.length === 0 ? (
            <div className="empty-state" style={{ height: 200 }}>
              <CircleDollarSign size={28} />
              <span>Chưa có dữ liệu chi tiêu tháng này.</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val) || 0)}
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      fontSize: 12
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Tasks & Habits & Goals & Calendar */}
      <div className="dashboard-grid">
        {/* Left Column: Tasks Today & Recent Transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Today's Tasks */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Công việc hôm nay</h2>
                <small className="muted">{todayTasks.length} nhiệm vụ được lên lịch</small>
              </div>
              <Link to="/tasks/list">
                Tất cả <ChevronRight size={14} />
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div className="empty-state">
                <Clock3 size={28} />
                <span>Bạn không có nhiệm vụ nào cần làm hôm nay.</span>
                <button className="btn btn-secondary btn-sm" onClick={() => onQuickAdd('task')}>
                  + Thêm việc mới
                </button>
              </div>
            ) : (
              <div className="task-list">
                {todayTasks.map(task => (
                  <button
                    key={task.id}
                    className={`task-row ${task.status === 'done' ? 'completed' : ''}`}
                    onClick={() => confirmAction('Bạn có muốn cập nhật trạng thái công việc này?', () => toggleTaskStatus(task.id))}
                  >
                    <span className="task-check">
                      {task.status === 'done' ? (
                        <CheckCircle2 size={19} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <span />
                      )}
                    </span>
                    <span className="task-copy">
                      <strong>{task.title}</strong>
                      <small>{task.startTime ? `${task.startTime} - ${task.endTime || ''}` : 'Trong ngày'}</small>
                    </span>
                    <span
                      className={`badge badge-${
                        task.priority === 'urgent'
                          ? 'danger'
                          : task.priority === 'high'
                          ? 'warning'
                          : 'secondary'
                      }`}
                    >
                      {task.priority === 'urgent' ? 'Gấp' : task.priority === 'high' ? 'Cao' : 'Thường'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Giao dịch gần đây</h2>
                <small className="muted">Thu chi phát sinh mới nhất</small>
              </div>
              <Link to="/finance/transactions">
                Xem sổ giao dịch <ChevronRight size={14} />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="empty-state">
                <CircleDollarSign size={28} />
                <span>Chưa có giao dịch nào được ghi nhận.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentTransactions.map(t => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  const isInc = t.type === 'income';
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'var(--bg-surface-alt)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{cat?.icon || (isInc ? '💰' : '🛒')}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{t.description}</div>
                          <small className="muted">{formatDate(t.date)} • {cat?.name || 'Khác'}</small>
                        </div>
                      </div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: isInc ? 'var(--color-income)' : 'var(--color-expense)'
                      }}>
                        {isInc ? '+' : '-'}{formatCurrency(t.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Habits, Deadlines/Events, Goals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Habits Today */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Thói quen hôm nay</h2>
                <small className="muted">Duy trì chuỗi ngày liên tiếp</small>
              </div>
              <Link to="/habits">
                Quản lý <ChevronRight size={14} />
              </Link>
            </div>

            {activeHabits.length === 0 ? (
              <div className="empty-state">
                <Flame size={28} />
                <span>Chưa có thói quen nào. Hãy tạo thói quen đầu tiên!</span>
                <button className="btn btn-secondary btn-sm" onClick={() => onQuickAdd('habit')}>
                  + Tạo thói quen
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeHabits.slice(0, 4).map(habit => {
                  const done = isCompletedToday(habit.id);
                  const streak = getStreakForHabit(habit.id);
                  return (
                    <div className="habit-row" key={habit.id}>
                      <span className="habit-icon" style={{ background: `${habit.color}20` }}>
                        {habit.icon}
                      </span>
                      <div className="habit-copy">
                        <strong>{habit.name}</strong>
                        <small>
                          <Flame size={12} style={{ color: streak > 0 ? '#f97316' : 'var(--text-muted)' }} />
                          {streak} ngày liên tiếp
                        </small>
                      </div>
                      <button
                        className={`habit-action ${done ? 'done' : ''}`}
                        onClick={() => logHabit(habit.id, today, done ? 0 : habit.targetPerDay)}
                        title={done ? 'Hủy check-in' : 'Hoàn thành hôm nay'}
                      >
                        {done ? <CheckCircle2 size={18} /> : '✓'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Schedule / Deadlines */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Lịch trình & Deadline sắp tới</h2>
                <small className="muted">Sự kiện & hạn nộp bài trong tuần</small>
              </div>
              <Link to="/calendar">
                Xem lịch <ChevronRight size={14} />
              </Link>
            </div>

            {upcomingEvents.length === 0 && upcomingDeadlines.length === 0 ? (
              <div className="empty-state">
                <Calendar size={28} />
                <span>Không có lịch trình hoặc deadline nào sắp tới.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingDeadlines.map(d => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: 'var(--bg-surface-alt)',
                      borderLeft: '3px solid var(--color-warning)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{d.title}</div>
                      <small className="muted">Hạn nộp: {formatDate(d.deadline)}</small>
                    </div>
                    <span className="badge badge-warning">Bài tập</span>
                  </div>
                ))}

                {upcomingEvents.map(e => (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: 'var(--bg-surface-alt)',
                      borderLeft: `3px solid ${e.color || 'var(--color-primary)'}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
                      <small className="muted">{formatDate(e.date)} • {e.startTime} - {e.endTime}</small>
                    </div>
                    <span className="badge badge-primary">{e.type === 'study' ? 'Học' : 'Sự kiện'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals Progress */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Mục tiêu cá nhân</h2>
                <small className="muted">Theo dõi tiến độ cột mốc</small>
              </div>
              <Link to="/goals">
                Tất cả <ChevronRight size={14} />
              </Link>
            </div>

            {activeGoals.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={28} />
                <span>Chưa có mục tiêu nào. Hãy lập kế hoạch phát triển!</span>
                <button className="btn btn-secondary btn-sm" onClick={() => onQuickAdd('goal')}>
                  + Thêm mục tiêu
                </button>
              </div>
            ) : (
              activeGoals.map(goal => {
                const pct = Math.min(100, Math.round((goal.currentValue / (goal.targetValue || 1)) * 100));
                return (
                  <div className="goal-row" key={goal.id} style={{ marginBottom: 12 }}>
                    <div className="goal-head">
                      <strong>{goal.name}</strong>
                      <span style={{ color: 'var(--color-primary)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <span className="goal-progress" style={{ width: `${pct}%` }} />
                    </div>
                    <small className="muted">
                      {goal.currentValue.toLocaleString('vi-VN')} / {goal.targetValue.toLocaleString('vi-VN')} {goal.unit}
                    </small>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
