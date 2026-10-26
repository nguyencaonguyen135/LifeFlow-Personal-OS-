import { useState, useMemo } from 'react';
import {
  Trophy, Plus, CheckCircle2, Target, Trash2, Calendar,
  TrendingUp, Award, CheckSquare
} from 'lucide-react';
import { useGoalStore } from '@/store/goalStore';
import { formatDate, getTodayString } from '@/utils';
import type { GoalCategory, PersonalGoal } from '@/types';

const CATEGORIES: { key: 'all' | GoalCategory; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'financial', label: 'Tài chính' },
  { key: 'study', label: 'Học tập' },
  { key: 'career', label: 'Sự nghiệp' },
  { key: 'health', label: 'Sức khỏe' },
  { key: 'personal', label: 'Phát triển' },
];

export default function GoalsPage() {
  const {
    goals,
    addGoal, deleteGoal, updateProgress,
    addMilestone, completeMilestone
  } = useGoalStore();

  const [activeCategory, setActiveCategory] = useState<'all' | GoalCategory>('all');
  const [modalType, setModalType] = useState<string | null>(null);

  // Goal Form State
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');

  // Update Progress Modal State
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [newProgressValue, setNewProgressValue] = useState('');

  // Add Milestone Modal State
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneTarget, setMilestoneTarget] = useState('');

  const filteredGoals = useMemo(() => {
    return goals.filter(g => activeCategory === 'all' || g.category === activeCategory);
  }, [goals, activeCategory]);

  const handleSaveGoal = () => {
    const tgt = Number(targetValue);
    if (!name.trim() || isNaN(tgt) || tgt <= 0) return;

    addGoal({
      name,
      reason,
      category,
      targetValue: tgt,
      currentValue: Number(currentValue) || 0,
      unit: unit || 'điểm',
      deadline: deadline || undefined,
      milestones: []
    });

    setModalType(null);
    setName('');
    setReason('');
    setTargetValue('');
  };

  const handleUpdateProgress = () => {
    if (!selectedGoalId) return;
    const val = Number(newProgressValue);
    if (isNaN(val)) return;

    updateProgress(selectedGoalId, val);
    setModalType(null);
    setNewProgressValue('');
  };

  const handleSaveMilestone = () => {
    if (!selectedGoalId || !milestoneTitle.trim()) return;
    const tgt = Number(milestoneTarget) || 0;

    addMilestone(selectedGoalId, {
      title: milestoneTitle,
      targetValue: tgt
    });

    setModalType(null);
    setMilestoneTitle('');
    setMilestoneTarget('');
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">MODULE MỤC TIÊU</span>
          <h1>Mục Tiêu & Cột Mốc Phát Triển</h1>
          <p className="muted">Theo dõi và hiện thực hóa các dự định lớn qua từng mốc hành trình.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalType('goal')}>
          <Plus size={15} /> Tạo mục tiêu mới
        </button>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`btn btn-sm ${activeCategory === cat.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {filteredGoals.map(goal => {
          const pct = Math.min(100, Math.round((goal.currentValue / (goal.targetValue || 1)) * 100));
          return (
            <div key={goal.id} className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-primary">{goal.category.toUpperCase()}</span>
                  <h3 style={{ margin: '6px 0 2px', fontSize: 17 }}>{goal.name}</h3>
                  {goal.reason && <p className="muted" style={{ fontSize: 12, margin: 0 }}>"{goal.reason}"</p>}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => deleteGoal(goal.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>Tiến độ thực hiện</span>
                  <strong style={{ color: 'var(--color-primary)' }}>{pct}%</strong>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <span style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6, color: 'var(--text-muted)' }}>
                  <span>{goal.currentValue.toLocaleString('vi-VN')} {goal.unit}</span>
                  <span>Mục tiêu: {goal.targetValue.toLocaleString('vi-VN')} {goal.unit}</span>
                </div>
              </div>

              {/* Milestones Checklist */}
              <div style={{ borderTop: '1px solid var(--border-color-subtle)', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: 13 }}>Cột mốc ({goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length})</strong>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12, color: 'var(--color-primary)' }}
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setModalType('milestone');
                    }}
                  >
                    + Thêm mốc
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {goal.milestones.map(m => (
                    <button
                      key={m.id}
                      onClick={() => !m.isCompleted && completeMilestone(goal.id, m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: 'var(--bg-surface-alt)',
                        border: 'none',
                        cursor: m.isCompleted ? 'default' : 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <CheckCircle2
                          size={15}
                          style={{ color: m.isCompleted ? 'var(--color-success)' : 'var(--text-muted)' }}
                        />
                        <span style={{ textDecoration: m.isCompleted ? 'line-through' : 'none', color: m.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {m.title}
                        </span>
                      </div>
                      <small className="muted">{m.targetValue} {goal.unit}</small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                {goal.deadline && (
                  <small className="muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> Hạn chót: {formatDate(goal.deadline)}
                  </small>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedGoalId(goal.id);
                    setNewProgressValue(String(goal.currentValue));
                    setModalType('progress');
                  }}
                >
                  Cập nhật tiến độ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODALS ── */}
      {/* 1. Goal Modal */}
      {modalType === 'goal' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Tạo Mục Tiêu Mới</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Tên mục tiêu
              <input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Đạt IELTS 7.0, Tiết kiệm 50 triệu..." />
            </label>
            <label>
              Lý do thực hiện (Động lực)
              <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Để xin học bổng, tự do tài chính..." />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Lĩnh vực
                <select className="input select" value={category} onChange={e => setCategory(e.target.value as any)}>
                  <option value="financial">Tài chính</option>
                  <option value="study">Học tập</option>
                  <option value="career">Sự nghiệp</option>
                  <option value="health">Sức khỏe</option>
                  <option value="personal">Phát triển</option>
                </select>
              </label>
              <label>
                Đơn vị tính
                <input className="input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="VND, %, cuốn sách..." />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Mục tiêu cần đạt
                <input className="input" type="number" min="1" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="100" />
              </label>
              <label>
                Hiện tại đã có
                <input className="input" type="number" min="0" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="0" />
              </label>
            </div>
            <label>
              Hạn chót (Deadline)
              <input className="input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveGoal}>Tạo mục tiêu</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Progress Modal */}
      {modalType === 'progress' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Cập Nhật Tiến Độ</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Giá trị hiện tại mới
              <input className="input" autoFocus type="number" value={newProgressValue} onChange={e => setNewProgressValue(e.target.value)} />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleUpdateProgress}>Lưu tiến độ</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Milestone Modal */}
      {modalType === 'milestone' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Cột Mốc Mới</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Tiêu đề cột mốc
              <input className="input" autoFocus value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} placeholder="Ví dụ: Đạt được 50% chặng đường" />
            </label>
            <label>
              Giá trị kích hoạt
              <input className="input" type="number" value={milestoneTarget} onChange={e => setMilestoneTarget(e.target.value)} placeholder="50" />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveMilestone}>Thêm cột mốc</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
