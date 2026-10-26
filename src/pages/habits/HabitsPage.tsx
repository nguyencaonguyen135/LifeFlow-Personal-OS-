import { useState, useMemo } from 'react';
import { Flame, Plus, Trash2, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { useHabitStore } from '@/store/habitStore';
import { getTodayString, toISODateString } from '@/utils';

export default function HabitsPage() {
  const {
    habits, habitLogs,
    addHabit, deleteHabit, logHabit,
    getStreakForHabit, getCompletionRate
  } = useHabitStore();

  const today = getTodayString();

  // Past 7 days array (from 6 days ago to today)
  const past7Days = useMemo(() => {
    const list: { dateStr: string; label: string }[] = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toISODateString(d);
      list.push({
        dateStr,
        label: i === 0 ? 'Hôm nay' : dayNames[d.getDay()]
      });
    }
    return list;
  }, []);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🔥');
  const [color, setColor] = useState('#6366f1');
  const [targetPerDay, setTargetPerDay] = useState('1');

  const handleSaveHabit = () => {
    if (!name.trim()) return;
    addHabit({
      name,
      icon: icon || '✨',
      color,
      targetPerDay: Number(targetPerDay) || 1,
      frequency: 'daily'
    });

    setIsModalOpen(false);
    setName('');
  };

  const isDateDone = (habitId: string, dateStr: string, target: number) => {
    const log = habitLogs.find(l => l.habitId === habitId && l.date === dateStr);
    return log ? log.completedCount >= target : false;
  };

  const toggleDayLog = (habitId: string, dateStr: string, target: number) => {
    const done = isDateDone(habitId, dateStr, target);
    logHabit(habitId, dateStr, done ? 0 : target);
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">MODULE THÓI QUEN</span>
          <h1>Quản lý & Rèn luyện Thói quen</h1>
          <p className="muted">Duy trì chuỗi ngày liên tiếp để xây dựng kỷ luật bản thân.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} /> Thêm thói quen
        </button>
      </div>

      {/* Habits Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {habits.map(habit => {
          const streak = getStreakForHabit(habit.id);
          const completion30 = getCompletionRate(habit.id, 30);
          const doneToday = isDateDone(habit.id, today, habit.targetPerDay);

          return (
            <div key={habit.id} className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${habit.color}20`,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 22
                  }}>
                    {habit.icon}
                  </span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17 }}>{habit.name}</h3>
                    <small className="muted">Mục tiêu: {habit.targetPerDay} lần / ngày</small>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Streak Flame */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: streak > 0 ? '#fff7ed' : 'var(--bg-surface-alt)',
                    color: streak > 0 ? '#ea580c' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: 13
                  }}>
                    <Flame size={17} style={{ color: streak > 0 ? '#f97316' : 'var(--text-muted)' }} />
                    <span>{streak} ngày liên tiếp</span>
                  </div>

                  {/* 30-day rate */}
                  <div style={{ fontSize: 13 }}>
                    <span className="muted" style={{ display: 'block', fontSize: 11 }}>30 ngày qua</span>
                    <strong>{completion30}% hoàn thành</strong>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => deleteHabit(habit.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* 7 Days Matrix Check-in Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--bg-surface-alt)',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Ghi nhận 7 ngày gần nhất:
                </span>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {past7Days.map(d => {
                    const done = isDateDone(habit.id, d.dateStr, habit.targetPerDay);
                    return (
                      <button
                        key={d.dateStr}
                        onClick={() => toggleDayLog(habit.id, d.dateStr, habit.targetPerDay)}
                        style={{
                          width: 40,
                          height: 48,
                          borderRadius: 8,
                          border: done ? 'none' : '1px solid var(--border-color)',
                          background: done ? 'var(--color-income)' : 'var(--bg-surface)',
                          color: done ? 'white' : 'var(--text-primary)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        title={`${d.label} - ${d.dateStr}`}
                      >
                        <span style={{ fontSize: 10, opacity: done ? 0.9 : 0.6 }}>{d.label}</span>
                        {done ? <CheckCircle2 size={16} /> : <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border-color)' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Habit */}
      {isModalOpen && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setIsModalOpen(false)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Tạo Thói Quen Mới</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <label>
              Tên thói quen
              <input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Đọc sách 20 phút, Uống 2 lít nước..." />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Biểu tượng Emoji
                <input className="input" value={icon} onChange={e => setIcon(e.target.value)} placeholder="📚" />
              </label>

              <label>
                Mục tiêu mỗi ngày
                <input className="input" type="number" min="1" value={targetPerDay} onChange={e => setTargetPerDay(e.target.value)} placeholder="1" />
              </label>
            </div>

            <label>
              Màu chủ đạo
              <input
                className="input"
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ height: 42, padding: 4 }}
              />
            </label>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveHabit}>Tạo thói quen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
