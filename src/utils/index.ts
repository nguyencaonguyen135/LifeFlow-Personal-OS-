// ============================================================
// Utility Functions
// ============================================================

// ─── ID Generation ───────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── Date & Time ─────────────────────────────────────────

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatTime(time: string): string {
  if (!time) return '';
  return time.slice(0, 5);
}

export function toISODateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function toISOString(): string {
  return new Date().toISOString();
}

export function getTodayString(): string {
  return toISODateString(new Date());
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toISODateString(start), end: toISODateString(end) };
}

export function getLastMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start: toISODateString(start), end: toISODateString(end) };
}

export function getDateRangeFromFilter(range: string): { start: string; end: string } {
  const now = new Date();
  const today = toISODateString(now);
  
  switch (range) {
    case '7d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { start: toISODateString(start), end: today };
    }
    case '30d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { start: toISODateString(start), end: today };
    }
    case '3m': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return { start: toISODateString(start), end: today };
    }
    case '1y': {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { start: toISODateString(start), end: today };
    }
    case 'this_month':
    default:
      return getCurrentMonthRange();
  }
}

export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

export function isPast(dateString: string): boolean {
  return dateString < getTodayString();
}

export function isFuture(dateString: string): boolean {
  return dateString > getTodayString();
}

export function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDayName(dayOfWeek: number, short = false): string {
  const days = short
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return days[dayOfWeek] ?? '';
}

export function getMonthName(month: number, short = false): string {
  const months = short
    ? ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
    : ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
       'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  return months[month] ?? '';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Đêm khuya rồi';
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function getMotivationalQuote(): string {
  const quotes = [
    'Mỗi ngày là một cơ hội mới để làm tốt hơn hôm qua.',
    'Hành trình vạn dặm bắt đầu từ một bước chân.',
    'Đầu tư tốt nhất là đầu tư vào bản thân.',
    'Kỷ luật là cầu nối giữa mục tiêu và thành tựu.',
    'Tiết kiệm hôm nay, tự do ngày mai.',
    'Học mỗi ngày một điều, năm có 365 điều mới.',
    'Thói quen tốt xây dựng cuộc sống tốt.',
    'Không bao giờ là quá muộn để bắt đầu.',
    'Tập trung vào những gì bạn có thể kiểm soát.',
    'Tiến bộ nhỏ mỗi ngày tạo ra kết quả lớn.',
  ];
  return quotes[new Date().getDate() % quotes.length] ?? quotes[0];
}

// ─── Currency & Numbers ──────────────────────────────────

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + '₫';
}

export function formatCurrencyShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1) + ' tỷ₫';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1) + ' triệu₫';
  }
  if (Math.abs(amount) >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'k₫';
  }
  return amount.toLocaleString('vi-VN') + '₫';
}

export function parseCurrency(str: string): number {
  const cleaned = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} giờ`;
}

// ─── String Utilities ────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

export function searchNormalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return searchNormalize(text).includes(searchNormalize(query));
}

// ─── Array Utilities ─────────────────────────────────────

export function sortBy<T>(arr: T[], key: keyof T, dir: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ─── Finance Calculations ─────────────────────────────────

export function calculateSavingsRate(income: number, expense: number): number {
  if (income <= 0) return 0;
  const rate = ((income - expense) / income) * 100;
  return Math.max(0, Math.round(rate * 10) / 10);
}

export function calculateMonthsToGoal(remaining: number, monthlySaving: number): number {
  if (monthlySaving <= 0) return Infinity;
  return Math.ceil(remaining / monthlySaving);
}

export function calculateDebtStatus(debt: { totalAmount: number; paidAmount: number; dueDate?: string }): 'pending' | 'partial' | 'completed' | 'overdue' {
  if (debt.paidAmount >= debt.totalAmount) return 'completed';
  if (debt.dueDate && debt.dueDate < getTodayString()) return 'overdue';
  if (debt.paidAmount > 0) return 'partial';
  return 'pending';
}

// ─── Priority Helpers ────────────────────────────────────

export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4, high: 3, medium: 2, low: 1
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Thấp', medium: 'Trung bình', high: 'Cao', urgent: 'Khẩn cấp'
};

export const STATUS_LABELS: Record<string, string> = {
  todo: 'Chưa làm',
  in_progress: 'Đang làm',
  waiting: 'Đang chờ',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: 'Thu nhập',
  expense: 'Chi tiêu',
  transfer: 'Chuyển tiền',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  credit_card: 'Thẻ tín dụng',
  ewallet: 'Ví điện tử',
  other: 'Khác',
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  ewallet: 'Ví điện tử',
  custom: 'Tùy chỉnh',
};

export const GOAL_CATEGORY_LABELS: Record<string, string> = {
  financial: 'Tài chính',
  study: 'Học tập',
  career: 'Sự nghiệp',
  health: 'Sức khỏe',
  personal: 'Phát triển bản thân',
};

export const DEBT_TYPE_LABELS: Record<string, string> = {
  owe: 'Tôi nợ',
  lend: 'Người khác nợ tôi',
};

export const DEBT_STATUS_LABELS: Record<string, string> = {
  pending: 'Chưa thanh toán',
  partial: 'Đang trả',
  completed: 'Đã hoàn thành',
  overdue: 'Quá hạn',
};

export const HABIT_FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  weekdays: 'Ngày trong tuần',
  weekends: 'Cuối tuần',
  custom: 'Tùy chỉnh',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  study: 'Lịch học',
  exam: 'Kỳ thi',
  assignment: 'Bài tập',
  task: 'Công việc',
  appointment: 'Cuộc hẹn',
  personal: 'Cá nhân',
  rest: 'Nghỉ ngơi',
  habit: 'Thói quen',
};

// ─── Color Utilities ──────────────────────────────────────

export const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6b7280', '#374151',
];

export const PRESET_ICONS = [
  '💰', '🏠', '🍔', '🚗', '📚', '🎮', '💊', '⚡',
  '👗', '✈️', '💄', '🎵', '🏋️', '📱', '💼', '🎓',
  '🍕', '☕', '🛒', '🎁', '💳', '🏦', '💵', '📊',
  '🎯', '⭐', '🔥', '💡', '🌱', '🏆', '🤝', '❤️',
];

// ─── CSV Export ───────────────────────────────────────────

export function exportToCSV(data: Record<string, string | number>[], filename: string): void {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]!);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${getTodayString()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${getTodayString()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Streak Calculation ───────────────────────────────────

export function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  
  const sorted = [...new Set(dates)].sort().reverse();
  const today = getTodayString();
  
  let streak = 0;
  let current = today;
  
  for (const date of sorted) {
    if (date === current) {
      streak++;
      const d = new Date(current);
      d.setDate(d.getDate() - 1);
      current = toISODateString(d);
    } else if (date < current) {
      break;
    }
  }
  
  return streak;
}

// ─── Budget Calculation ───────────────────────────────────

export function getBudgetStatus(spent: number, total: number, threshold: number): 'safe' | 'warning' | 'danger' | 'over' {
  const pct = total > 0 ? (spent / total) * 100 : 0;
  if (pct >= 100) return 'over';
  if (pct >= threshold) return 'danger';
  if (pct >= threshold * 0.8) return 'warning';
  return 'safe';
}
