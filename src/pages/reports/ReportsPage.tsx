import { useMemo } from 'react';
import {
  BarChart3, TrendingUp, CheckCircle2, Flame, BookOpen,
  PieChart as PieChartIcon, Award, ShieldCheck, Zap, CalendarRange,
  PiggyBank, ArrowDownRight, HeartPulse, Target, ListChecks
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { useFinanceStore } from '@/store/financeStore';
import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { useStudyStore } from '@/store/studyStore';
import { useHealthStore } from '@/store/healthStore';
import { useGoalStore } from '@/store/goalStore';
import { formatCurrency, getTodayString } from '@/utils';

const COLORS = ['#6366f1', '#22c55e', '#f97316', '#3b82f6', '#ec4899', '#a855f7'];

export default function ReportsPage() {
  const { transactions, savingsGoals } = useFinanceStore();
  const { tasks } = useTaskStore();
  const { habits, getStreakForHabit, getCompletionRate } = useHabitStore();
  const { studySessions } = useStudyStore();
  const { records: healthRecords } = useHealthStore();
  const { goals } = useGoalStore();

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

  const monthlyFinance = useMemo(() => {
    const months: {
      key: string;
      label: string;
      income: number;
      expense: number;
      net: number;
      contributions: number;
      cumulative: number;
    }[] = [];
    const [year, month] = currentMonthStr.split('-').map(Number);
    for (let index = 11; index >= 0; index -= 1) {
      const date = new Date(year, month - 1 - index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
        income: 0,
        expense: 0,
        net: 0,
        contributions: 0,
        cumulative: 0,
      });
    }

    transactions.forEach(transaction => {
      const monthData = months.find(item => transaction.date.startsWith(item.key));
      if (!monthData) return;
      if (transaction.type === 'income') monthData.income += transaction.amount;
      if (transaction.type === 'expense') monthData.expense += transaction.amount;
    });
    savingsGoals.forEach(goal => goal.contributions.forEach(contribution => {
      const monthData = months.find(item => contribution.date.startsWith(item.key));
      if (monthData) monthData.contributions += contribution.amount;
    }));

    let cumulative = 0;
    return months.map(monthData => {
      monthData.net = monthData.income - monthData.expense;
      cumulative += monthData.net;
      return { ...monthData, cumulative };
    });
  }, [transactions, savingsGoals, currentMonthStr]);

  const yearIncome = monthlyFinance.reduce((sum, item) => sum + item.income, 0);
  const yearExpense = monthlyFinance.reduce((sum, item) => sum + item.expense, 0);
  const yearNet = yearIncome - yearExpense;
  const yearContributions = monthlyFinance.reduce((sum, item) => sum + item.contributions, 0);
  const averageMonthlyExpense = yearExpense / 12;
  const bestFinancialMonth = [...monthlyFinance].sort((a, b) => b.net - a.net)[0];
  const highestExpenseMonth = [...monthlyFinance].sort((a, b) => b.expense - a.expense)[0];
  const savingsTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const savingsCurrent = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const savingsProgress = savingsTarget > 0 ? Math.min(100, Math.round((savingsCurrent / savingsTarget) * 100)) : 0;

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

  const healthScore = useMemo(() => {
    const recent = healthRecords.filter(record => {
      const age = (Date.now() - new Date(`${record.date}T12:00:00`).getTime()) / 86400000;
      return age >= 0 && age < 7;
    });
    if (recent.length === 0) return 0;
    const sleep = recent.filter(record => record.sleepDuration >= 7 && record.sleepDuration <= 9).length / recent.length * 100;
    const water = recent.filter(record => record.waterMl >= 2000).length / recent.length * 100;
    const exercise = recent.filter(record => record.exerciseMinutes >= 30).length / recent.length * 100;
    const energy = recent.reduce((sum, record) => sum + (record.energyLevel || 0), 0) / recent.length / 5 * 100;
    const stress = (1 - recent.reduce((sum, record) => sum + (record.stressLevel || 0), 0) / recent.length / 5) * 100;
    return Math.round((sleep + water + exercise + energy + stress) / 5);
  }, [healthRecords]);

  const habitScore = useMemo(() => {
    const activeHabits = habits.filter(habit => habit.isActive);
    if (activeHabits.length === 0) return 0;
    return Math.round(activeHabits.reduce((sum, habit) => sum + getCompletionRate(habit.id, 7), 0) / activeHabits.length);
  }, [habits, getCompletionRate]);

  const studyScore = Math.min(100, Math.round(totalStudyMinutes / 300 * 100));
  const goalScore = goals.length > 0
    ? Math.round(goals.reduce((sum, goal) => sum + Math.min(100, goal.targetValue > 0 ? goal.currentValue / goal.targetValue * 100 : 0), 0) / goals.length)
    : 0;
  const financeScore = Math.max(0, Math.min(100, savingsRate));
  const workScore = taskCompletionRate;
  const balanceCategories = [
    { key: 'finance', label: 'Tài chính', score: financeScore, icon: <PiggyBank size={17} />, color: '#16a34a' },
    { key: 'work', label: 'Công việc', score: workScore, icon: <ListChecks size={17} />, color: '#6366f1' },
    { key: 'habits', label: 'Thói quen', score: habitScore, icon: <Flame size={17} />, color: '#f97316' },
    { key: 'study', label: 'Học tập', score: studyScore, icon: <BookOpen size={17} />, color: '#8b5cf6' },
    { key: 'health', label: 'Sức khỏe', score: healthScore, icon: <HeartPulse size={17} />, color: '#ec4899' },
    { key: 'goals', label: 'Mục tiêu', score: goalScore, icon: <Target size={17} />, color: '#0891b2' },
  ];
  const activeBalanceCategories = balanceCategories.filter(category => category.score > 0);
  const lifeScore = activeBalanceCategories.length
    ? Math.round(activeBalanceCategories.reduce((sum, category) => sum + category.score, 0) / activeBalanceCategories.length)
    : 0;
  const strongestCategory = [...balanceCategories].sort((a, b) => b.score - a.score)[0];
  const weakestCategory = [...balanceCategories].sort((a, b) => a.score - b.score)[0];
  const balanceInsight = activeBalanceCategories.length < 4
    ? 'Bạn cần cập nhật thêm dữ liệu ở các danh mục còn thiếu để chỉ số cân bằng phản ánh chính xác hơn.'
    : lifeScore >= 80
      ? 'Các mặt trong cuộc sống đang được duy trì khá cân bằng. Hãy giữ nhịp ổn định và tránh tập trung quá mức vào một lĩnh vực.'
      : lifeScore >= 60
        ? `Nền tảng đang ở mức khá. ${weakestCategory.label} là lĩnh vực nên được ưu tiên cải thiện trong tuần tới.`
        : 'Chỉ số cân bằng đang thấp. Hãy chọn một lĩnh vực quan trọng nhất để cải thiện từng bước thay vì thay đổi mọi thứ cùng lúc.';

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
              Tổng hợp {activeBalanceCategories.length}/6 danh mục: {balanceInsight}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ fontSize: 44, color: 'var(--color-primary)', lineHeight: 1 }}>{lifeScore}</strong>
          <span className="muted" style={{ display: 'block', fontSize: 13 }}>/ 100 Điểm</span>
        </div>
      </div>

      <section className="card panel balance-overview">
        <div className="panel-heading">
          <div>
            <h2><ShieldCheck size={18} /> Tổng quan các danh mục</h2>
            <small className="muted">Mỗi điểm được tính từ dữ liệu thực tế của từng lĩnh vực; danh mục chưa có dữ liệu chưa làm giảm điểm trung bình.</small>
          </div>
          <span className="health-target">Mạnh nhất: {strongestCategory.label}</span>
        </div>
        <div className="balance-category-grid">
          {balanceCategories.map(category => (
            <div className="balance-category" key={category.key}>
              <div className="balance-category-heading"><span style={{ color: category.color }}>{category.icon}</span><strong>{category.label}</strong><b>{category.score ? `${category.score}/100` : 'Chưa có dữ liệu'}</b></div>
              <div className="progress-bar"><span style={{ width: `${category.score}%`, background: category.color }} /></div>
              <small>{category.score >= 80 ? 'Đang duy trì tốt' : category.score >= 60 ? 'Có thể cải thiện' : category.score > 0 ? 'Nên ưu tiên cải thiện' : 'Hãy bắt đầu ghi nhận dữ liệu'}</small>
            </div>
          ))}
        </div>
        <div className="balance-insight"><Zap size={17} /><span><strong>Nhận định cân bằng:</strong> {balanceInsight}</span></div>
        <div className="balance-detail-grid">
          <div><strong>{activeBalanceCategories.length}/6</strong><span>Danh mục có dữ liệu</span></div>
          <div><strong>{strongestCategory.score}/100</strong><span>Điểm cao nhất · {strongestCategory.label}</span></div>
          <div><strong>{weakestCategory.score}/100</strong><span>Ưu tiên cải thiện · {weakestCategory.label}</span></div>
        </div>
      </section>

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

        <section className="card panel finance-year-report">
          <div className="panel-heading">
            <div>
              <h2><CalendarRange size={18} /> Báo cáo thu chi & tích lũy 12 tháng</h2>
              <small className="muted">Từ {monthlyFinance[0]?.label} đến {monthlyFinance[11]?.label} • Dữ liệu giao dịch và khoản nạp mục tiêu tiết kiệm</small>
            </div>
          </div>
          <div className="finance-report-metrics">
            <div><span>Tổng thu</span><strong className="finance-income">{formatCurrency(yearIncome)}</strong><small>12 tháng gần nhất</small></div>
            <div><span>Tổng chi</span><strong className="finance-expense">{formatCurrency(yearExpense)}</strong><small>Trung bình {formatCurrency(averageMonthlyExpense)}/tháng</small></div>
            <div><span>Tích lũy ròng</span><strong className={yearNet >= 0 ? 'finance-income' : 'finance-expense'}>{formatCurrency(yearNet)}</strong><small>Tỷ lệ {yearIncome > 0 ? Math.round(yearNet / yearIncome * 100) : 0}% trên tổng thu</small></div>
            <div><span>Đã nạp tiết kiệm</span><strong className="finance-saving">{formatCurrency(yearContributions)}</strong><small>{savingsGoals.length} mục tiêu đang theo dõi</small></div>
          </div>
          <div className="finance-report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinance} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-subtle)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={value => `${value / 1000000}M`} />
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value) || 0), name === 'income' ? 'Thu nhập' : name === 'expense' ? 'Chi tiêu' : 'Tích lũy ròng']} />
                <Bar dataKey="income" name="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="expense" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="net" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="finance-report-trend">
            <div className="finance-trend-heading"><h3><TrendingUp size={16} /> Tăng trưởng tích lũy ròng</h3><span className="muted">Tổng thu trừ tổng chi theo từng tháng</span></div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyFinance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-subtle)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={value => `${value / 1000000}M`} />
                <Tooltip formatter={value => formatCurrency(Number(value) || 0)} />
                <Line type="monotone" dataKey="cumulative" name="Tích lũy" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="finance-report-highlights">
            <div><PiggyBank size={17} /><span><strong>Tháng tích lũy tốt nhất:</strong> {bestFinancialMonth?.label} ({formatCurrency(bestFinancialMonth?.net || 0)})</span></div>
            <div><ArrowDownRight size={17} /><span><strong>Tháng chi cao nhất:</strong> {highestExpenseMonth?.label} ({formatCurrency(highestExpenseMonth?.expense || 0)})</span></div>
          </div>
          <div className="finance-month-table">
            <div className="finance-month-row finance-month-header"><strong>Tháng</strong><strong>Thu</strong><strong>Chi</strong><strong>Ròng</strong><strong>Đã nạp tiết kiệm</strong><strong>Tỷ lệ tiết kiệm</strong></div>
            {monthlyFinance.map(item => (
              <div className="finance-month-row" key={item.key}>
                <strong>{item.label}</strong>
                <span className="finance-income">{formatCurrency(item.income)}</span>
                <span className="finance-expense">{formatCurrency(item.expense)}</span>
                <span className={item.net >= 0 ? 'finance-income' : 'finance-expense'}>{formatCurrency(item.net)}</span>
                <span className="finance-saving">{formatCurrency(item.contributions)}</span>
                <span>{item.income > 0 ? `${Math.round(item.net / item.income * 100)}%` : '—'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card panel savings-report">
          <div className="panel-heading">
            <div>
              <h2><PiggyBank size={18} /> Chi tiết tiến độ tích lũy</h2>
              <small className="muted">Tổng hợp tất cả mục tiêu tiết kiệm hiện có</small>
            </div>
            <strong className="finance-saving">{formatCurrency(savingsCurrent)} / {formatCurrency(savingsTarget)}</strong>
          </div>
          <div className="progress-bar savings-report-progress"><span style={{ width: `${savingsProgress}%` }} /></div>
          <div className="savings-report-summary"><span>Đã hoàn thành <b>{savingsProgress}%</b></span><span>Còn thiếu <b>{formatCurrency(Math.max(0, savingsTarget - savingsCurrent))}</b></span></div>
          <div className="savings-goal-list">
            {savingsGoals.length === 0 ? <p className="muted">Chưa có mục tiêu tiết kiệm nào.</p> : savingsGoals.map(goal => {
              const progress = goal.targetAmount > 0 ? Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)) : 0;
              const contributed = goal.contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
              return <div className="savings-goal-row" key={goal.id}><div><strong>{goal.icon || '🎯'} {goal.name}</strong><small>{goal.contributions.length} lần nạp • Đã nạp {formatCurrency(contributed)}</small></div><div className="savings-goal-value"><span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span><div className="progress-bar"><span style={{ width: `${progress}%` }} /></div></div><strong>{progress}%</strong></div>;
            })}
          </div>
        </section>

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
