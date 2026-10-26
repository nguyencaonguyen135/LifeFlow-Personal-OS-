import { useMemo } from 'react';
import {
  BarChart3, TrendingUp, CheckCircle2, Flame, BookOpen,
  PieChart as PieChartIcon, Award, ShieldCheck, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useFinanceStore } from '@/store/financeStore';
import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { useStudyStore } from '@/store/studyStore';
import { formatCurrency, getTodayString } from '@/utils';

const COLORS = ['#6366f1', '#22c55e', '#f97316', '#3b82f6', '#ec4899', '#a855f7'];

export default function ReportsPage() {
  const { transactions, accounts, categories } = useFinanceStore();
  const { tasks } = useTaskStore();
  const { habits, getStreakForHabit, getCompletionRate } = useHabitStore();
  const { studySessions } = useStudyStore();

  const today = getTodayString();
  const currentMonthStr = today.slice(0, 7);

  // Financial Stats
  const currentMonthTxns = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonthStr));
  }, [transactions, currentMonthStr]);

  const monthIncome = useMemo(() => {
    return currentMonthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTxns]);

  const monthExpense = useMemo(() => {
    return currentMonthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTxns]);

  const savingsRate = monthIncome > 0
    ? Math.max(0, Math.round(((monthIncome - monthExpense) / monthIncome) * 100))
    : 0;

  // Task Stats
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  // Habit Stats
  const bestStreak = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, getStreakForHabit(h.id)), 0);
  }, [habits, getStreakForHabit]);

  // Study Stats
  const totalStudyMinutes = useMemo(() => {
    return studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  }, [studySessions]);

  // Overall Life Balance Score (0 - 100)
  const lifeScore = Math.min(100, Math.round((savingsRate * 0.35) + (taskCompletionRate * 0.35) + (Math.min(bestStreak * 10, 100) * 0.30)));

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">BÁO CÁO & PHÂN TÍCH</span>
          <h1>Báo Cáo Tổng Hợp LifeFlow OS</h1>
          <p className="muted">Bức tranh toàn cảnh về tài chính, công việc, học tập và kỷ luật cá nhân.</p>
        </div>
      </div>

      {/* Life Balance Score Banner */}
      <div className="card panel" style={{
        background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--bg-surface) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--color-primary)',
            color: 'white',
            display: 'grid',
            placeItems: 'center'
          }}>
            <Zap size={32} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Chỉ Số Cân Bằng Cuộc Sống (Life Balance)</h2>
            <p className="muted" style={{ margin: 0 }}>
              Được tổng hợp từ kỷ luật tài chính, năng suất làm việc và chuỗi ngày rèn luyện.
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ fontSize: 44, color: 'var(--color-primary)', lineHeight: 1 }}>{lifeScore}</strong>
          <span className="muted" style={{ display: 'block', fontSize: 13 }}>/ 100 Điểm</span>
        </div>
      </div>

      {/* 4 Dimension Metrics */}
      <div className="metric-grid">
        <div className="card metric-card">
          <div className="metric-icon income"><TrendingUp size={20} /></div>
          <div>
            <span>Tỷ lệ tiết kiệm tháng</span>
            <strong style={{ color: 'var(--color-income)' }}>{savingsRate}%</strong>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon task"><CheckCircle2 size={20} /></div>
          <div>
            <span>Năng suất hoàn thành task</span>
            <strong style={{ color: 'var(--color-primary)' }}>{taskCompletionRate}%</strong>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon expense"><Flame size={20} /></div>
          <div>
            <span>Chuỗi Streak dài nhất</span>
            <strong style={{ color: '#f97316' }}>{bestStreak} ngày</strong>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon primary"><BookOpen size={20} /></div>
          <div>
            <span>Tổng giờ học tập</span>
            <strong style={{ color: 'var(--color-study-500)' }}>{Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}p</strong>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Income vs Expense Bar Chart */}
        <div className="card panel">
          <div className="panel-heading">
            <div>
              <h2>Dòng Tiền Thu Chi</h2>
              <small className="muted">Tháng này: Thu {formatCurrency(monthIncome)} • Chi {formatCurrency(monthExpense)}</small>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Thu nhập', amount: monthIncome, fill: '#22c55e' },
                { name: 'Chi tiêu', amount: monthExpense, fill: '#f97316' },
                { name: 'Tiết kiệm', amount: Math.max(0, monthIncome - monthExpense), fill: '#6366f1' },
              ]}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={v => `${v / 1000000}M`} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#f97316" />
                  <Cell fill="#6366f1" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Priorities Breakdown */}
        <div className="card panel">
          <div className="panel-heading">
            <div>
              <h2>Phân Bổ Nhiệm Vụ Theo Độ Ưu Tiên</h2>
              <small className="muted">Tổng {tasks.length} nhiệm vụ trong hệ thống</small>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {[
              { label: 'Rất gấp (Urgent)', count: tasks.filter(t => t.priority === 'urgent').length, color: 'var(--color-danger)' },
              { label: 'Cao (High)', count: tasks.filter(t => t.priority === 'high').length, color: 'var(--color-warning)' },
              { label: 'Trung bình (Medium)', count: tasks.filter(t => t.priority === 'medium').length, color: 'var(--color-primary)' },
              { label: 'Thấp (Low)', count: tasks.filter(t => t.priority === 'low').length, color: 'var(--text-muted)' },
            ].map(p => {
              const pct = tasks.length > 0 ? Math.round((p.count / tasks.length) * 100) : 0;
              return (
                <div key={p.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{p.label}</span>
                    <strong>{p.count} việc ({pct}%)</strong>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <span style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
