import { useMemo, useState } from 'react';
import {
  Activity, Battery, Check, ChevronRight, Droplets, Moon, Plus,
  Smile, Sparkles, Target, Timer, Waves
} from 'lucide-react';
import { useHealthStore } from '@/store/healthStore';
import { useHabitStore } from '@/store/habitStore';
import { getTodayString } from '@/utils';
import type { HealthMood } from '@/types';

const MOODS: { value: HealthMood; label: string; emoji: string }[] = [
  { value: 'great', label: 'Rất tốt', emoji: '😄' },
  { value: 'good', label: 'Tốt', emoji: '🙂' },
  { value: 'okay', label: 'Ổn', emoji: '😐' },
  { value: 'low', label: 'Hơi mệt', emoji: '😔' },
  { value: 'bad', label: 'Không tốt', emoji: '😣' },
];

const formatSleep = (hours: number) => `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}p`;

export default function HealthPage() {
  const today = getTodayString();
  const { records, getRecord, upsertRecord, addWater, getRecentRecords } = useHealthStore();
  const { habits } = useHabitStore();
  const todayRecord = getRecord(today);
  const record = todayRecord ?? getRecentRecords(1)[0];
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [sleepDuration, setSleepDuration] = useState(String(record.sleepDuration || 7.5));
  const [sleepQuality, setSleepQuality] = useState(String(record.sleepQuality || 4));
  const [exerciseMinutes, setExerciseMinutes] = useState(String(record.exerciseMinutes || 30));
  const [exerciseType, setExerciseType] = useState(record.exerciseType || 'Đi bộ');

  const recentRecords = useMemo(() => getRecentRecords(7).reverse(), [records, getRecentRecords]);
  const averageSleep = recentRecords.reduce((sum, item) => sum + item.sleepDuration, 0) / 7;
  const waterGoal = 2000;
  const waterPercent = Math.min(100, Math.round((record.waterMl / waterGoal) * 100));
  const completedHealthHabits = habits.filter(habit => habit.isActive && ['Tập thể dục', 'Uống đủ nước'].includes(habit.name)).length;

  const saveSleep = () => {
    upsertRecord(today, {
      sleepDuration: Math.max(0, Number(sleepDuration) || 0),
      sleepQuality: Math.min(5, Math.max(1, Number(sleepQuality) || 1)),
    });
    setIsSleepOpen(false);
  };

  const saveExercise = () => {
    upsertRecord(today, {
      exerciseMinutes: Math.max(0, Number(exerciseMinutes) || 0),
      exerciseType: exerciseType.trim() || 'Vận động',
    });
  };

  return (
    <div className="page-content health-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">MODULE SỨC KHỎE</span>
          <h1>Sức khỏe & Năng lượng</h1>
          <p className="muted">Theo dõi giấc ngủ, nước uống, vận động và tâm trạng mỗi ngày.</p>
        </div>
        <div className="health-score">
          <Sparkles size={16} />
          <span>Sức khỏe hôm nay</span>
          <strong>{Math.round((waterPercent + Math.min(100, record.exerciseMinutes / 3) + (record.sleepDuration >= 7 ? 100 : record.sleepDuration / 7 * 100)) / 3)}%</strong>
        </div>
      </div>

      <div className="metric-grid health-metrics">
        <div className="card metric-card"><div className="metric-icon health-sleep"><Moon size={20} /></div><div><span>Giấc ngủ đêm qua</span><strong>{record.sleepDuration ? formatSleep(record.sleepDuration) : 'Chưa ghi nhận'}</strong></div></div>
        <div className="card metric-card"><div className="metric-icon health-water"><Droplets size={20} /></div><div><span>Nước hôm nay</span><strong>{(record.waterMl / 1000).toFixed(1)} / 2.0 L</strong></div></div>
        <div className="card metric-card"><div className="metric-icon health-move"><Activity size={20} /></div><div><span>Vận động hôm nay</span><strong>{record.exerciseMinutes} phút</strong></div></div>
        <div className="card metric-card"><div className="metric-icon health-mood"><Smile size={20} /></div><div><span>Tâm trạng</span><strong>{MOODS.find(mood => mood.value === record.mood)?.emoji || 'Chưa ghi nhận'}</strong></div></div>
      </div>

      <div className="health-grid">
        <section className="card panel">
          <div className="panel-heading"><h2><Moon size={18} /> Giấc ngủ</h2><button className="btn btn-secondary btn-sm" onClick={() => setIsSleepOpen(true)}>Cập nhật <ChevronRight size={14} /></button></div>
          <div className="sleep-summary"><div className="sleep-orb"><Moon size={25} /></div><div><strong>{record.sleepDuration ? formatSleep(record.sleepDuration) : 'Chưa có dữ liệu'}</strong><span>Thời lượng mục tiêu: 7–9 giờ</span></div></div>
          <div className="progress-bar"><span className="goal-progress" style={{ width: `${Math.min(100, record.sleepDuration / 8 * 100)}%` }} /></div>
          <div className="health-inline"><span>Chất lượng</span><strong>{record.sleepQuality ? `${record.sleepQuality}/5` : '—'}</strong><span>Trung bình 7 ngày</span><strong>{formatSleep(averageSleep)}</strong></div>
        </section>

        <section className="card panel">
          <div className="panel-heading"><h2><Droplets size={18} /> Uống nước</h2><span className="health-target">{waterPercent}% mục tiêu</span></div>
          <div className="water-progress"><div style={{ height: `${waterPercent}%` }}><Waves size={22} /></div></div>
          <div className="water-copy"><strong>{(record.waterMl / 1000).toFixed(1)} L</strong><span>mục tiêu 2.0 L</span></div>
          <div className="water-actions"><button className="btn btn-secondary btn-sm" onClick={() => addWater(today, 250)}><Plus size={14} /> 250 ml</button><button className="btn btn-primary btn-sm" onClick={() => addWater(today, 500)}><Plus size={14} /> 500 ml</button></div>
        </section>

        <section className="card panel">
          <div className="panel-heading"><h2><Activity size={18} /> Vận động</h2><span className="health-target">Mục tiêu 30 phút</span></div>
          <div className="exercise-form"><label>Hoạt động<input className="input" value={exerciseType} onChange={event => setExerciseType(event.target.value)} /></label><label>Thời lượng (phút)<input className="input" type="number" min="0" value={exerciseMinutes} onChange={event => setExerciseMinutes(event.target.value)} /></label></div>
          <button className="btn btn-primary" onClick={saveExercise}><Check size={15} /> Lưu vận động</button>
        </section>

        <section className="card panel">
          <div className="panel-heading"><h2><Smile size={18} /> Tâm trạng hôm nay</h2><Battery size={18} className="muted" /></div>
          <div className="mood-list">{MOODS.map(mood => <button key={mood.value} className={`mood-option ${record.mood === mood.value ? 'selected' : ''}`} onClick={() => upsertRecord(today, { mood: mood.value })}><span>{mood.emoji}</span><small>{mood.label}</small></button>)}</div>
          <p className="muted health-note">Ghi nhận cảm xúc giúp bạn nhận ra mối liên hệ giữa lịch sinh hoạt và năng lượng.</p>
        </section>
      </div>

      <section className="card panel health-history">
        <div className="panel-heading"><h2><Timer size={18} /> Nhật ký 7 ngày</h2><span className="muted">{completedHealthHabits} thói quen sức khỏe đang theo dõi</span></div>
        <div className="health-history-list">{recentRecords.map(item => <div className="health-day" key={item.date}><strong>{item.date === today ? 'Hôm nay' : new Date(`${item.date}T12:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' })}</strong><span><Moon size={13} /> {item.sleepDuration ? formatSleep(item.sleepDuration) : '—'}</span><span><Droplets size={13} /> {item.waterMl ? `${(item.waterMl / 1000).toFixed(1)}L` : '—'}</span><span><Activity size={13} /> {item.exerciseMinutes}p</span><span className="mood-dot">{MOODS.find(mood => mood.value === item.mood)?.emoji || '·'}</span></div>)}</div>
        <div className="health-tip"><Target size={17} /><span><strong>Mẹo nhỏ:</strong> Hãy bắt đầu bằng một thay đổi nhỏ hôm nay — uống thêm một cốc nước hoặc đi bộ 10 phút.</span></div>
      </section>

      {isSleepOpen && <div className="modal-backdrop" onMouseDown={event => event.currentTarget === event.target && setIsSleepOpen(false)}><div className="modal card"><div className="modal-heading"><h2>Cập nhật giấc ngủ</h2><button className="icon-btn" onClick={() => setIsSleepOpen(false)}>×</button></div><label>Thời lượng (giờ)<input className="input" type="number" min="0" max="24" step="0.5" value={sleepDuration} onChange={event => setSleepDuration(event.target.value)} /></label><label>Chất lượng (1–5)<input className="input" type="number" min="1" max="5" value={sleepQuality} onChange={event => setSleepQuality(event.target.value)} /></label><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setIsSleepOpen(false)}>Hủy</button><button className="btn btn-primary" onClick={saveSleep}>Lưu giấc ngủ</button></div></div></div>}
    </div>
  );
}
