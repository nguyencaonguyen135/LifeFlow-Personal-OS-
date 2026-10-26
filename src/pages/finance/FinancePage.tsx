import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Wallet, TrendingUp, ClipboardList, FolderOpen, PiggyBank,
  Target, CreditCard, FileBarChart, Plus, Search, Trash2,
  Download, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useFinanceStore } from '@/store/financeStore';
import {
  formatCurrency, formatDate, getTodayString, exportToCSV, confirmAction
} from '@/utils';
import type { TransactionType, PaymentMethod, DebtType, AccountType } from '@/types';

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#ec4899', '#3b82f6', '#eab308', '#a855f7'];

export default function FinancePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    accounts, categories, transactions, budgets, savingsGoals, debts,
    addTransaction, deleteTransaction,
    addAccount, addCategory, addBudget, deleteBudget,
    addSavingsGoal, addContribution,
    addDebt, addDebtPayment
  } = useFinanceStore();

  // Determine active tab from URL path
  const currentPath = location.pathname;
  const activeTab = useMemo(() => {
    if (currentPath.includes('/transactions')) return 'transactions';
    if (currentPath.includes('/categories')) return 'categories';
    if (currentPath.includes('/budgets')) return 'budgets';
    if (currentPath.includes('/savings')) return 'savings';
    if (currentPath.includes('/debts')) return 'debts';
    if (currentPath.includes('/reports')) return 'reports';
    return 'overview';
  }, [currentPath]);

  // Modal States
  const [modalType, setModalType] = useState<string | null>(null);

  // Transaction Filter State
  const [txnSearch, setTxnSearch] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | TransactionType>('all');
  const [txnAccountFilter, setTxnAccountFilter] = useState('all');

  // Form States for Transaction
  const [txnDesc, setTxnDesc] = useState('');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnType, setTxnType] = useState<TransactionType>('expense');
  const [txnAccountId, setTxnAccountId] = useState(accounts[0]?.id || '');
  const [txnToAccountId, setTxnToAccountId] = useState(accounts[1]?.id || '');
  const [txnCategoryId, setTxnCategoryId] = useState('');
  const [txnDate, setTxnDate] = useState(getTodayString());
  const [txnMethod, setTxnMethod] = useState<PaymentMethod>('cash');
  const [txnNote, setTxnNote] = useState('');

  // Form States for Account
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accInitial, setAccInitial] = useState('');

  // Form States for Budget
  const [budName, setBudName] = useState('');
  const [budCatId, setBudCatId] = useState('');
  const [budAmount, setBudAmount] = useState('');
  const [budAlert, setBudAlert] = useState('80');

  // Form States for Savings
  const [savName, setSavName] = useState('');
  const [savTarget, setSavTarget] = useState('');
  const [savDeadline, setSavDeadline] = useState('');
  const [contribGoalId, setContribGoalId] = useState('');
  const [contribAmount, setContribAmount] = useState('');

  // Form States for Debt
  const [debtPerson, setDebtPerson] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('owe');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDue, setDebtDue] = useState('');
  const [payDebtId, setPayDebtId] = useState('');
  const [payAmount, setPayAmount] = useState('');

  // Form States for Category
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catIcon, setCatIcon] = useState('🏷️');
  const [catColor, setCatColor] = useState('#6366f1');

  // Today & Month
  const today = getTodayString();
  const currentMonthStr = today.slice(0, 7);

  // Financial Computations
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }, [accounts]);

  const monthTxns = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonthStr));
  }, [transactions, currentMonthStr]);

  const monthIncome = useMemo(() => {
    return monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxns]);

  const monthExpense = useMemo(() => {
    return monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxns]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (txnTypeFilter !== 'all' && t.type !== txnTypeFilter) return false;
        if (txnAccountFilter !== 'all' && t.accountId !== txnAccountFilter) return false;
        if (txnSearch.trim()) {
          const q = txnSearch.toLowerCase();
          return t.description.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, txnTypeFilter, txnAccountFilter, txnSearch]);

  // Handlers
  const handleSaveTransaction = () => {
    const amt = Number(txnAmount);
    if (!txnDesc.trim() || isNaN(amt) || amt <= 0 || !txnAccountId) return;

    addTransaction({
      description: txnDesc,
      amount: amt,
      type: txnType,
      accountId: txnAccountId,
      toAccountId: txnType === 'transfer' ? txnToAccountId : undefined,
      categoryId: txnCategoryId || undefined,
      date: txnDate,
      paymentMethod: txnMethod,
      note: txnNote,
      tags: [],
      isDemo: false
    });

    setModalType(null);
    setTxnDesc('');
    setTxnAmount('');
    setTxnNote('');
  };

  const handleSaveAccount = () => {
    const init = Number(accInitial) || 0;
    if (!accName.trim()) return;
    addAccount({
      name: accName,
      type: accType,
      initialBalance: init,
      currentBalance: init,
      color: '#6366f1',
      icon: accType === 'cash' ? '💵' : accType === 'bank' ? '🏦' : accType === 'ewallet' ? '📱' : '💳',
      isActive: true,
      isDemo: false
    });
    setModalType(null);
    setAccName('');
    setAccInitial('');
  };

  const handleSaveBudget = () => {
    const amt = Number(budAmount);
    if (!budName.trim() || isNaN(amt) || amt <= 0) return;
    addBudget({
      name: budName,
      categoryId: budCatId || categories[0]?.id || '',
      amount: amt,
      period: 'monthly',
      startDate: `${currentMonthStr}-01`,
      endDate: `${currentMonthStr}-31`,
      alertThreshold: Number(budAlert) || 80,
      color: '#6366f1',
      isActive: true,
      isDemo: false
    });
    setModalType(null);
    setBudName('');
    setBudAmount('');
  };

  const handleSaveSavings = () => {
    const tgt = Number(savTarget);
    if (!savName.trim() || isNaN(tgt) || tgt <= 0) return;
    addSavingsGoal({
      name: savName,
      targetAmount: tgt,
      currentAmount: 0,
      startDate: today,
      deadline: savDeadline || undefined,
      priority: 'medium',
      isCompleted: false,
      isDemo: false,
      icon: '🎯'
    });
    setModalType(null);
    setSavName('');
    setSavTarget('');
  };

  const handleContributeSavings = () => {
    const amt = Number(contribAmount);
    if (!contribGoalId || isNaN(amt) || amt <= 0) return;
    addContribution(contribGoalId, {
      amount: amt,
      note: 'Nạp tiền tiết kiệm',
      date: today
    });
    setModalType(null);
    setContribAmount('');
  };

  const handleSaveDebt = () => {
    const amt = Number(debtAmount);
    if (!debtPerson.trim() || isNaN(amt) || amt <= 0) return;
    addDebt({
      personName: debtPerson,
      type: debtType,
      totalAmount: amt,
      dueDate: debtDue || undefined,
      status: 'pending',
      isDemo: false
    });
    setModalType(null);
    setDebtPerson('');
    setDebtAmount('');
  };

  const handleRecordDebtPayment = () => {
    const amt = Number(payAmount);
    if (!payDebtId || isNaN(amt) || amt <= 0) return;
    addDebtPayment(payDebtId, {
      amount: amt,
      note: 'Thanh toán nợ',
      date: today
    });
    setModalType(null);
    setPayAmount('');
  };

  const handleSaveCategory = () => {
    if (!catName.trim()) return;
    addCategory({
      name: catName,
      type: catType,
      icon: catIcon || '🏷️',
      color: catColor,
      isSystem: false,
      isActive: true,
      isDemo: false
    });
    setModalType(null);
    setCatName('');
  };

  const handleExportCSV = () => {
    const rows = transactions.map(t => ({
      Ngay: t.date,
      Loai: t.type === 'income' ? 'Thu' : t.type === 'expense' ? 'Chi' : 'Chuyen',
      SoTien: t.amount,
      MoTa: t.description,
      PhuongThuc: t.paymentMethod,
      GhiChu: t.note || ''
    }));
    exportToCSV(rows, `Giao_dich_${today}.csv`);
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Sub-Navigation */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">MODULE TÀI CHÍNH</span>
          <h1>Quản lý Tài chính Cá nhân</h1>
          <p className="muted">Theo dõi dòng tiền, số dư ví, ngân sách & mục tiêu tiết kiệm.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Xuất CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => setModalType('transaction')}>
            <Plus size={15} />
            <span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 8,
        overflowX: 'auto'
      }}>
        {[
          { key: 'overview', label: 'Tổng quan', path: '/finance/overview', icon: TrendingUp },
          { key: 'transactions', label: 'Giao dịch', path: '/finance/transactions', icon: ClipboardList },
          { key: 'budgets', label: 'Ngân sách', path: '/finance/budgets', icon: PiggyBank },
          { key: 'savings', label: 'Mục tiêu tiết kiệm', path: '/finance/savings', icon: Target },
          { key: 'debts', label: 'Sổ nợ', path: '/finance/debts', icon: CreditCard },
          { key: 'categories', label: 'Danh mục', path: '/finance/categories', icon: FolderOpen },
          { key: 'reports', label: 'Báo cáo', path: '/finance/reports', icon: FileBarChart },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'var(--color-primary)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 4 Financial Stat Cards */}
          <div className="metric-grid">
            <div className="card metric-card">
              <div className="metric-icon primary"><Wallet size={20} /></div>
              <div>
                <span>Tổng số dư tất cả ví</span>
                <strong>{formatCurrency(totalBalance)}</strong>
              </div>
            </div>
            <div className="card metric-card">
              <div className="metric-icon income"><ArrowUpRight size={20} /></div>
              <div>
                <span>Thu nhập tháng này</span>
                <strong style={{ color: 'var(--color-income)' }}>+{formatCurrency(monthIncome)}</strong>
              </div>
            </div>
            <div className="card metric-card">
              <div className="metric-icon expense"><ArrowDownRight size={20} /></div>
              <div>
                <span>Chi tiêu tháng này</span>
                <strong style={{ color: 'var(--color-expense)' }}>-{formatCurrency(monthExpense)}</strong>
              </div>
            </div>
            <div className="card metric-card">
              <div className="metric-icon primary"><PiggyBank size={20} /></div>
              <div>
                <span>Tỷ lệ tiết kiệm</span>
                <strong>{monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0}%</strong>
              </div>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Tài khoản & Ví thanh toán</h2>
                <small className="muted">{accounts.length} nguồn tiền</small>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType('account')}>
                <Plus size={14} /> Thêm tài khoản
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    background: 'var(--bg-surface-alt)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{acc.icon || '🏦'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{acc.name}</div>
                      <small className="muted">{acc.type.toUpperCase()}</small>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {formatCurrency(acc.currentBalance)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budgets Progress Overview */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Tiến độ Ngân sách tháng này</h2>
                <small className="muted">Cảnh báo khi chi tiêu vượt quá định mức</small>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/finance/budgets')}>
                Xem tất cả
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {budgets.map(b => {
                const cat = categories.find(c => c.id === b.categoryId);
                const spent = monthTxns
                  .filter(t => t.type === 'expense' && t.categoryId === b.categoryId)
                  .reduce((sum, t) => sum + t.amount, 0);
                const pct = Math.round((spent / (b.amount || 1)) * 100);
                const isOver = pct >= 100;
                const isWarn = pct >= b.alertThreshold;

                return (
                  <div key={b.id} style={{ padding: 14, borderRadius: 12, background: 'var(--bg-surface-alt)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <strong>{cat?.icon} {b.name}</strong>
                      <span style={{
                        color: isOver ? 'var(--color-danger)' : isWarn ? 'var(--color-warning)' : 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <span
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: isOver ? 'var(--color-danger)' : isWarn ? 'var(--color-warning)' : 'var(--color-income)'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>Đã chi: {formatCurrency(spent)}</span>
                      <span>Hạn mức: {formatCurrency(b.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: 34 }}
                placeholder="Tìm giao dịch theo mô tả..."
                value={txnSearch}
                onChange={e => setTxnSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="input select"
                style={{ width: 140 }}
                value={txnTypeFilter}
                onChange={e => setTxnTypeFilter(e.target.value as any)}
              >
                <option value="all">Mọi loại</option>
                <option value="income">Thu nhập</option>
                <option value="expense">Chi tiêu</option>
                <option value="transfer">Chuyển tiền</option>
              </select>
              <select
                className="input select"
                style={{ width: 160 }}
                value={txnAccountFilter}
                onChange={e => setTxnAccountFilter(e.target.value)}
              >
                <option value="all">Mọi tài khoản</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Mô tả</th>
                  <th>Danh mục</th>
                  <th>Tài khoản</th>
                  <th>Số tiền</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Không có giao dịch nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(t => {
                    const cat = categories.find(c => c.id === t.categoryId);
                    const acc = accounts.find(a => a.id === t.accountId);
                    const isInc = t.type === 'income';
                    const isTrf = t.type === 'transfer';
                    return (
                      <tr key={t.id}>
                        <td>{formatDate(t.date)}</td>
                        <td>
                          <strong>{t.description}</strong>
                          {t.note && <small className="muted" style={{ display: 'block' }}>{t.note}</small>}
                        </td>
                        <td>
                          <span className="badge badge-secondary">
                            {cat?.icon} {cat?.name || 'Khác'}
                          </span>
                        </td>
                        <td>{acc?.name || '—'}</td>
                        <td style={{
                          fontWeight: 600,
                          color: isInc ? 'var(--color-income)' : isTrf ? 'var(--color-transfer)' : 'var(--color-expense)'
                        }}>
                          {isInc ? '+' : isTrf ? '⇄ ' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => confirmAction('Bạn có chắc muốn xóa giao dịch này?', () => deleteTransaction(t.id))}
                            title="Xóa giao dịch"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: BUDGETS ── */}
      {activeTab === 'budgets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Quản lý Định mức Ngân sách</h2>
              <p className="muted">Thiết lập giới hạn chi tiêu hàng tháng theo từng danh mục.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModalType('budget')}>
              <Plus size={15} /> Tạo ngân sách
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {budgets.map(b => {
              const cat = categories.find(c => c.id === b.categoryId);
              const spent = monthTxns
                .filter(t => t.type === 'expense' && t.categoryId === b.categoryId)
                .reduce((sum, t) => sum + t.amount, 0);
              const pct = Math.round((spent / (b.amount || 1)) * 100);
              const remaining = b.amount - spent;
              const isOver = pct >= 100;

              return (
                <div key={b.id} className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{cat?.icon || '🛒'}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>{b.name}</h3>
                        <small className="muted">{cat?.name || 'Tất cả chi tiêu'}</small>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => confirmAction('Bạn có chắc muốn xóa ngân sách này?', () => deleteBudget(b.id))}
                      title="Xóa ngân sách"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="progress-bar" style={{ height: 10 }}>
                    <span
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: isOver ? 'var(--color-danger)' : pct >= b.alertThreshold ? 'var(--color-warning)' : 'var(--color-income)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <div>
                      <span className="muted" style={{ display: 'block', fontSize: 11 }}>Đã chi</span>
                      <strong>{formatCurrency(spent)}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="muted" style={{ display: 'block', fontSize: 11 }}>Định mức</span>
                      <strong>{formatCurrency(b.amount)}</strong>
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: isOver ? 'var(--color-danger-bg)' : 'var(--bg-surface-alt)',
                    fontSize: 12,
                    color: isOver ? 'var(--color-danger)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    {isOver ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                    <span>{isOver ? `Đã vượt quá ${formatCurrency(Math.abs(remaining))}` : `Còn lại ${formatCurrency(remaining)}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: SAVINGS GOALS ── */}
      {activeTab === 'savings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Mục tiêu Tiết kiệm</h2>
              <p className="muted">Tích lũy tài chính cho các dự định lớn trong cuộc sống.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModalType('savings')}>
              <Plus size={15} /> Mục tiêu mới
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {savingsGoals.map(g => {
              const pct = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
              return (
                <div key={g.id} className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{g.icon || '🎯'}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>{g.name}</h3>
                        {g.deadline && <small className="muted">Hạn chót: {formatDate(g.deadline)}</small>}
                      </div>
                    </div>
                    <span className="badge badge-primary">{pct}%</span>
                  </div>

                  <div className="progress-bar" style={{ height: 10 }}>
                    <span style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <div>
                      <span className="muted" style={{ display: 'block', fontSize: 11 }}>Hiện có</span>
                      <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(g.currentAmount)}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="muted" style={{ display: 'block', fontSize: 11 }}>Mục tiêu</span>
                      <strong>{formatCurrency(g.targetAmount)}</strong>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => {
                      setContribGoalId(g.id);
                      setModalType('contribute');
                    }}
                  >
                    + Nạp thêm tiền tiết kiệm
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: DEBTS ── */}
      {activeTab === 'debts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Sổ nợ & Cho vay</h2>
              <p className="muted">Ghi nhớ các khoản nợ cần trả hoặc tiền người khác đang mượn.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModalType('debt')}>
              <Plus size={15} /> Thêm khoản nợ
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {debts.map(d => {
              const remaining = d.totalAmount - (d.paidAmount || 0);
              const isOwe = d.type === 'owe';
              return (
                <div key={d.id} className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className={`badge ${isOwe ? 'badge-danger' : 'badge-income'}`}>
                        {isOwe ? 'Tôi nợ' : 'Người khác nợ tôi'}
                      </span>
                      <h3 style={{ margin: '6px 0 0', fontSize: 16 }}>{d.personName}</h3>
                      {d.dueDate && <small className="muted">Hạn trả: {formatDate(d.dueDate)}</small>}
                    </div>
                    <span className={`badge ${d.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {d.status === 'completed' ? 'Đã xong' : 'Chưa tất toán'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <span className="muted" style={{ display: 'block', fontSize: 11 }}>Đã thanh toán</span>
                      <strong>{formatCurrency(d.paidAmount || 0)}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="muted" style={{ display: 'block', fontSize: 11 }}>Còn lại</span>
                      <strong style={{ color: isOwe ? 'var(--color-danger)' : 'var(--color-income)' }}>
                        {formatCurrency(remaining)}
                      </strong>
                    </div>
                  </div>

                  {remaining > 0 && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setPayDebtId(d.id);
                        setModalType('debtPay');
                      }}
                    >
                      Ghi nhận thanh toán
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 6: CATEGORIES ── */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Danh mục Thu Chi</h2>
              <p className="muted">Phân loại chi tiêu và nguồn thu để kiểm soát tài chính dễ dàng hơn.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModalType('category')}>
              <Plus size={15} /> Thêm danh mục
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {categories.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px',
                  borderRadius: 12,
                  background: 'var(--bg-surface-alt)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontSize: 24 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <small className="muted">{c.type === 'income' ? 'Khoản thu' : 'Khoản chi'}</small>
                </div>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: c.color || '#6366f1'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 7: REPORTS ── */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card panel">
            <h2>Báo cáo Thu Chi & Tích lũy</h2>
            <div style={{ width: '100%', height: 320, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'T8', Thu: 11000000, Chi: 7500000 },
                  { name: 'T9', Thu: 13500000, Chi: 8900000 },
                  { name: 'T10', Thu: monthIncome, Chi: monthExpense },
                ]}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => `${v / 1000000}M`} />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} />
                  <Bar dataKey="Thu" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chi" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {/* 1. Transaction Modal */}
      {modalType === 'transaction' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Giao Dịch Mới</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(['expense', 'income', 'transfer'] as const).map(type => (
                <button
                  key={type}
                  className={`btn btn-sm ${txnType === type ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setTxnType(type)}
                >
                  {type === 'expense' ? 'Khoản chi' : type === 'income' ? 'Khoản thu' : 'Chuyển tiền'}
                </button>
              ))}
            </div>

            <label>
              Mô tả giao dịch
              <input className="input" autoFocus value={txnDesc} onChange={e => setTxnDesc(e.target.value)} placeholder="Ví dụ: Cơm trưa, Lương..." />
            </label>

            <label>
              Số tiền (VND)
              <input className="input" type="number" min="0" value={txnAmount} onChange={e => setTxnAmount(e.target.value)} placeholder="50000" />
            </label>

            <label>
              Tài khoản {txnType === 'transfer' ? 'nguồn' : ''}
              <select className="input select" value={txnAccountId} onChange={e => setTxnAccountId(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.currentBalance)})</option>)}
              </select>
            </label>

            {txnType === 'transfer' && (
              <label>
                Tài khoản đích
                <select className="input select" value={txnToAccountId} onChange={e => setTxnToAccountId(e.target.value)}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
            )}

            {txnType !== 'transfer' && (
              <label>
                Danh mục
                <select className="input select" value={txnCategoryId} onChange={e => setTxnCategoryId(e.target.value)}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.filter(c => c.type === txnType).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Ngày giao dịch
              <input className="input" type="date" value={txnDate} onChange={e => setTxnDate(e.target.value)} />
            </label>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveTransaction}>Lưu giao dịch</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Account Modal */}
      {modalType === 'account' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Tài Khoản / Ví</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Tên tài khoản
              <input className="input" value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ví dụ: Techcombank, MoMo..." />
            </label>
            <label>
              Loại tài khoản
              <select className="input select" value={accType} onChange={e => setAccType(e.target.value as any)}>
                <option value="bank">Ngân hàng</option>
                <option value="cash">Tiền mặt</option>
                <option value="ewallet">Ví điện tử</option>
                <option value="custom">Khác / Đầu tư</option>
              </select>
            </label>
            <label>
              Số dư ban đầu (VND)
              <input className="input" type="number" min="0" value={accInitial} onChange={e => setAccInitial(e.target.value)} placeholder="0" />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveAccount}>Tạo tài khoản</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Budget Modal */}
      {modalType === 'budget' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Tạo Ngân Sách Mới</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Tên ngân sách
              <input className="input" value={budName} onChange={e => setBudName(e.target.value)} placeholder="Ví dụ: Ăn uống tháng này" />
            </label>
            <label>
              Danh mục áp dụng
              <select className="input select" value={budCatId} onChange={e => setBudCatId(e.target.value)}>
                {categories.filter(c => c.type === 'expense').map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Định mức chi tối đa (VND)
              <input className="input" type="number" min="0" value={budAmount} onChange={e => setBudAmount(e.target.value)} placeholder="3000000" />
            </label>
            <label>
              Ngưỡng cảnh báo (%)
              <input className="input" type="number" min="50" max="100" value={budAlert} onChange={e => setBudAlert(e.target.value)} placeholder="80" />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveBudget}>Lưu ngân sách</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Savings Modal */}
      {modalType === 'savings' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Mục Tiêu Tiết Kiệm Mới</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Tên mục tiêu
              <input className="input" value={savName} onChange={e => setSavName(e.target.value)} placeholder="Ví dụ: Mua iPhone mới, Du lịch..." />
            </label>
            <label>
              Số tiền cần tích lũy (VND)
              <input className="input" type="number" min="0" value={savTarget} onChange={e => setSavTarget(e.target.value)} placeholder="20000000" />
            </label>
            <label>
              Hạn chót dự kiến (tùy chọn)
              <input className="input" type="date" value={savDeadline} onChange={e => setSavDeadline(e.target.value)} />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveSavings}>Tạo mục tiêu</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Contribute Savings Modal */}
      {modalType === 'contribute' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Nạp Tiền Tiết Kiệm</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Số tiền nạp (VND)
              <input className="input" autoFocus type="number" min="0" value={contribAmount} onChange={e => setContribAmount(e.target.value)} placeholder="500000" />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleContributeSavings}>Xác nhận nạp</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Debt Modal */}
      {modalType === 'debt' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Khoản Nợ / Cho Vay</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                className={`btn btn-sm ${debtType === 'owe' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setDebtType('owe')}
              >
                Tôi nợ
              </button>
              <button
                className={`btn btn-sm ${debtType === 'lend' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setDebtType('lend')}
              >
                Người khác nợ tôi
              </button>
            </div>
            <label>
              Tên đối tác / Bạn bè
              <input className="input" value={debtPerson} onChange={e => setDebtPerson(e.target.value)} placeholder="Ví dụ: Tuấn, Hoàng..." />
            </label>
            <label>
              Tổng số tiền (VND)
              <input className="input" type="number" min="0" value={debtAmount} onChange={e => setDebtAmount(e.target.value)} placeholder="1000000" />
            </label>
            <label>
              Hạn trả dự kiến (tùy chọn)
              <input className="input" type="date" value={debtDue} onChange={e => setDebtDue(e.target.value)} />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveDebt}>Lưu khoản nợ</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Pay Debt Modal */}
      {modalType === 'debtPay' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Ghi Nhận Thanh Toán Nợ</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Số tiền thanh toán đợt này (VND)
              <input className="input" autoFocus type="number" min="0" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="500000" />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleRecordDebtPayment}>Ghi nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Category Modal */}
      {modalType === 'category' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Danh Mục Mới</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                className={`btn btn-sm ${catType === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setCatType('expense')}
              >
                Khoản chi
              </button>
              <button
                className={`btn btn-sm ${catType === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setCatType('income')}
              >
                Khoản thu
              </button>
            </div>
            <label>
              Tên danh mục
              <input className="input" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ví dụ: Mua sắm, Du lịch..." />
            </label>
            <label>
              Icon Emoji
              <input className="input" value={catIcon} onChange={e => setCatIcon(e.target.value)} placeholder="🛍️" />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveCategory}>Tạo danh mục</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
