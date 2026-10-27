import { useMemo, useState } from 'react';
import {
  Activity, Battery, Check, ChevronRight, Droplets, Moon, Plus,
  Smile, Sparkles, Target, Timer, Waves, Brain, ClipboardCheck,
  HeartPulse, CalendarDays, TrendingUp, AlertTriangle, CheckCircle2
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
  const [selectedDate, setSelectedDate] = useState(today);
  const record = getRecord(selectedDate) ?? {
    id: 'preview',
    userId: 'user_1',
    date: selectedDate,
    sleepDuration: 0,
    sleepQuality: 0,
    waterMl: 0,
    exerciseMinutes: 0,
    createdAt: '',
    updatedAt: ''
  };
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [sleepDuration, setSleepDuration] = useState(String(record.sleepDuration || 7.5));
  const [sleepQuality, setSleepQuality] = useState(String(record.sleepQuality || 4));
  const [exerciseMinutes, setExerciseMinutes] = useState(String(record.exerciseMinutes || 30));
  const [exerciseType, setExerciseType] = useState(record.exerciseType || 'Đi bộ');
  const [energyLevel, setEnergyLevel] = useState(String(record.energyLevel || 3));
  const [stressLevel, setStressLevel] = useState(String(record.stressLevel || 3));
  const [restingHeartRate, setRestingHeartRate] = useState(String(record.restingHeartRate || ''));
  const [symptoms, setSymptoms] = useState(record.symptoms || '');
  const [note, setNote] = useState(record.note || '');

  const recentRecords = useMemo(() => getRecentRecords(7).reverse(), [records, getRecentRecords]);
  const trackedDays = recentRecords.filter(item => item.sleepDuration || item.waterMl || item.exerciseMinutes || item.mood).length;
  const averageSleep = recentRecords.reduce((sum, item) => sum + item.sleepDuration, 0) / Math.max(1, recentRecords.filter(item => item.sleepDuration > 0).length);
  const averageWater = recentRecords.reduce((sum, item) => sum + item.waterMl, 0) / 7;
  const averageExercise = recentRecords.reduce((sum, item) => sum + item.exerciseMinutes, 0) / 7;
  const averageEnergy = recentRecords.filter(item => item.energyLevel).reduce((sum, item) => sum + (item.energyLevel || 0), 0) / Math.max(1, recentRecords.filter(item => item.energyLevel).length);
  const averageStress = recentRecords.filter(item => item.stressLevel).reduce((sum, item) => sum + (item.stressLevel || 0), 0) / Math.max(1, recentRecords.filter(item => item.stressLevel).length);
  const sleepGoalDays = recentRecords.filter(item => item.sleepDuration >= 7 && item.sleepDuration <= 9).length;
  const waterGoalDays = recentRecords.filter(item => item.waterMl >= 2000).length;
  const exerciseGoalDays = recentRecords.filter(item => item.exerciseMinutes >= 30).length;
  const weeklyScore = Math.round(((sleepGoalDays / 7) + (waterGoalDays / 7) + (exerciseGoalDays / 7) + (averageEnergy / 5 || 0) + ((5 - averageStress) / 5 || 0)) * 20);
  const moodScores: Record<HealthMood, number> = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };
  const moodRecords = recentRecords.filter(item => item.mood);
  const averageMood = moodRecords.length
    ? moodRecords.reduce((sum, item) => sum + (item.mood ? moodScores[item.mood] : 0), 0) / moodRecords.length
    : 0;
  const heartRateRecords = recentRecords.filter(item => item.restingHeartRate && item.restingHeartRate > 0);
  const averageHeartRate = heartRateRecords.length
    ? heartRateRecords.reduce((sum, item) => sum + (item.restingHeartRate || 0), 0) / heartRateRecords.length
    : 0;
  const symptomDays = recentRecords.filter(item => item.symptoms?.trim()).length;
  const completeDays = recentRecords.filter(item => item.sleepDuration > 0 && item.waterMl > 0 && item.exerciseMinutes > 0 && item.mood && item.energyLevel && item.stressLevel).length;
  const firstHalf = recentRecords.slice(0, 3);
  const secondHalf = recentRecords.slice(3);
  const average = (items: typeof recentRecords, selector: (item: typeof recentRecords[number]) => number) => {
    const values = items.map(selector).filter(value => value > 0);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };
  const sleepTrend = average(secondHalf, item => item.sleepDuration) - average(firstHalf, item => item.sleepDuration);
  const energyTrend = average(secondHalf, item => item.energyLevel || 0) - average(firstHalf, item => item.energyLevel || 0);
  const stressTrend = average(secondHalf, item => item.stressLevel || 0) - average(firstHalf, item => item.stressLevel || 0);
  const bestDay = [...recentRecords].sort((a, b) => {
    const score = (item: typeof a) => Number(item.sleepDuration >= 7 && item.sleepDuration <= 9) + Number(item.waterMl >= 2000) + Number(item.exerciseMinutes >= 30) + (item.energyLevel || 0) / 5;
    return score(b) - score(a);
  })[0];
  const attentionDay = [...recentRecords].sort((a, b) => (a.energyLevel || 0) - (b.energyLevel || 0) || (b.stressLevel || 0) - (a.stressLevel || 0))[0];
  const weeklyInsight = trackedDays < 4
    ? 'Cần ghi nhận thêm ít nhất 4 ngày để nhận định tuần có độ tin cậy tốt hơn.'
    : weeklyScore >= 75
      ? 'Nền tảng sức khỏe tuần này khá tốt. Hãy duy trì giấc ngủ và vận động đều.'
      : averageStress >= 3.5 || averageSleep < 7
        ? 'Tuần này có dấu hiệu quá tải hoặc ngủ chưa đủ. Hãy ưu tiên nghỉ ngơi và giảm lịch căng thẳng.'
        : 'Sức khỏe đang ở mức ổn. Hãy tập trung hoàn thành đều các mục tiêu nước, ngủ và vận động.';
  const waterGoal = 2000;
  const waterPercent = Math.min(100, Math.round((record.waterMl / waterGoal) * 100));
  const completedHealthHabits = habits.filter(habit => habit.isActive && ['Tập thể dục', 'Uống đủ nước'].includes(habit.name)).length;

  const saveExercise = () => {
    upsertRecord(selectedDate, {
      exerciseMinutes: Math.max(0, Number(exerciseMinutes) || 0),
      exerciseType: exerciseType.trim() || 'Vận động',
    });
  };

  const openDailyLog = () => {
    setSleepDuration(String(record.sleepDuration || 7.5));
    setSleepQuality(String(record.sleepQuality || 4));
    setExerciseMinutes(String(record.exerciseMinutes || 30));
    setExerciseType(record.exerciseType || 'Đi bộ');
    setEnergyLevel(String(record.energyLevel || 3));
    setStressLevel(String(record.stressLevel || 3));
    setRestingHeartRate(record.restingHeartRate ? String(record.restingHeartRate) : '');
    setSymptoms(record.symptoms || '');
    setNote(record.note || '');
    setIsSleepOpen(true);
  };

  const saveDailyLog = () => {
    upsertRecord(selectedDate, {
      sleepDuration: Math.max(0, Number(sleepDuration) || 0),
      sleepQuality: Math.min(5, Math.max(0, Number(sleepQuality) || 0)),
      exerciseMinutes: Math.max(0, Number(exerciseMinutes) || 0),
      exerciseType: exerciseType.trim() || undefined,
      energyLevel: Math.min(5, Math.max(0, Number(energyLevel) || 0)),
      stressLevel: Math.min(5, Math.max(0, Number(stressLevel) || 0)),
      restingHeartRate: restingHeartRate ? Math.max(0, Number(restingHeartRate) || 0) : undefined,
      symptoms: symptoms.trim() || undefined,
      note: note.trim() || undefined,
    });
    setIsSleepOpen(false);
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
      <div className="health-date-picker card-flat">
        <CalendarDays size={17} />
        <span>Ngày theo dõi</span>
        <input className="input" type="date" value={selectedDate} max={today} onChange={event => setSelectedDate(event.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={openDailyLog}><ClipboardCheck size={14} /> Ghi nhật ký chi tiết</button>
      </div>

      <div className="metric-grid health-metrics">
        <div className="card metric-card"><div className="metric-icon health-sleep"><Moon size={20} /></div><div><span>Giấc ngủ đêm qua</span><strong>{record.sleepDuration ? formatSleep(record.sleepDuration) : 'Chưa ghi nhận'}</strong></div></div>
        <div className="card metric-card"><div className="metric-icon health-water"><Droplets size={20} /></div><div><span>Nước hôm nay</span><strong>{(record.waterMl / 1000).toFixed(1)} / 2.0 L</strong></div></div>
        <div className="card metric-card"><div className="metric-icon health-move"><Activity size={20} /></div><div><span>Vận động hôm nay</span><strong>{record.exerciseMinutes} phút</strong></div></div>
        <div className="card metric-card"><div className="metric-icon health-mood"><Smile size={20} /></div><div><span>Tâm trạng</span><strong>{MOODS.find(mood => mood.value === record.mood)?.emoji || 'Chưa ghi nhận'}</strong></div></div>
      </div>

      <div className="health-grid">
        <section className="card panel">
          <div className="panel-heading"><h2><Moon size={18} /> Giấc ngủ</h2><button className="btn btn-secondary btn-sm" onClick={openDailyLog}>Cập nhật <ChevronRight size={14} /></button></div>
          <div className="sleep-summary"><div className="sleep-orb"><Moon size={25} /></div><div><strong>{record.sleepDuration ? formatSleep(record.sleepDuration) : 'Chưa có dữ liệu'}</strong><span>Thời lượng mục tiêu: 7–9 giờ</span></div></div>
          <div className="progress-bar"><span className="goal-progress" style={{ width: `${Math.min(100, record.sleepDuration / 8 * 100)}%` }} /></div>
          <div className="health-inline"><span>Chất lượng</span><strong>{record.sleepQuality ? `${record.sleepQuality}/5` : '—'}</strong><span>Trung bình 7 ngày</span><strong>{formatSleep(averageSleep)}</strong></div>
        </section>

        <section className="card panel">
          <div className="panel-heading"><h2><Droplets size={18} /> Uống nước</h2><span className="health-target">{waterPercent}% mục tiêu</span></div>
          <div className="water-progress"><div style={{ height: `${waterPercent}%` }}><Waves size={22} /></div></div>
          <div className="water-copy"><strong>{(record.waterMl / 1000).toFixed(1)} L</strong><span>mục tiêu 2.0 L</span></div>
          <div className="water-actions"><button className="btn btn-secondary btn-sm" onClick={() => addWater(selectedDate, 250)}><Plus size={14} /> 250 ml</button><button className="btn btn-primary btn-sm" onClick={() => addWater(selectedDate, 500)}><Plus size={14} /> 500 ml</button></div>
        </section>

        <section className="card panel">
          <div className="panel-heading"><h2><Activity size={18} /> Vận động</h2><span className="health-target">Mục tiêu 30 phút</span></div>
          <div className="exercise-form"><label>Hoạt động<input className="input" value={exerciseType} onChange={event => setExerciseType(event.target.value)} /></label><label>Thời lượng (phút)<input className="input" type="number" min="0" value={exerciseMinutes} onChange={event => setExerciseMinutes(event.target.value)} /></label></div>
          <button className="btn btn-primary" onClick={saveExercise}><Check size={15} /> Lưu vận động</button>
        </section>

        <section className="card panel">
          <div className="panel-heading"><h2><Smile size={18} /> Tâm trạng hôm nay</h2><Battery size={18} className="muted" /></div>
          <div className="mood-list">{MOODS.map(mood => <button key={mood.value} className={`mood-option ${record.mood === mood.value ? 'selected' : ''}`} onClick={() => upsertRecord(selectedDate, { mood: mood.value })}><span>{mood.emoji}</span><small>{mood.label}</small></button>)}</div>
          <p className="muted health-note">Ghi nhận cảm xúc giúp bạn nhận ra mối liên hệ giữa lịch sinh hoạt và năng lượng.</p>
        </section>
      </div>

      <section className="card panel weekly-health">
        <div className="panel-heading"><h2><Brain size={18} /> Nhận định sức khỏe 7 ngày</h2><span className="health-target">{trackedDays}/7 ngày có dữ liệu</span></div>
        <div className="weekly-health-grid">
          <div><span>Điểm tuần</span><strong>{weeklyScore}/100</strong></div>
          <div><span>Ngủ trung bình</span><strong>{averageSleep ? formatSleep(averageSleep) : '—'}</strong></div>
          <div><span>Nước trung bình</span><strong>{(averageWater / 1000).toFixed(1)} L</strong></div>
          <div><span>Vận động/ngày</span><strong>{Math.round(averageExercise)} phút</strong></div>
          <div><span>Năng lượng</span><strong>{averageEnergy ? `${averageEnergy.toFixed(1)}/5` : '—'}</strong></div>
          <div><span>Căng thẳng</span><strong>{averageStress ? `${averageStress.toFixed(1)}/5` : '—'}</strong></div>
        </div>
        <div className="health-report-details">
          <div><span>Độ đầy đủ nhật ký</span><strong>{Math.round(trackedDays / 7 * 100)}%</strong><small>{completeDays}/7 ngày đủ các trường chính</small></div>
          <div><span>Tâm trạng trung bình</span><strong>{averageMood ? `${averageMood.toFixed(1)}/5` : '—'}</strong><small>{moodRecords.length}/7 ngày đã ghi nhận</small></div>
          <div><span>Nhịp tim nghỉ</span><strong>{averageHeartRate ? `${Math.round(averageHeartRate)} bpm` : '—'}</strong><small>{heartRateRecords.length}/7 ngày có dữ liệu</small></div>
          <div><span>Ngày có triệu chứng</span><strong>{symptomDays}/7</strong><small>{symptomDays ? 'Nên theo dõi nguyên nhân' : 'Chưa ghi nhận triệu chứng'}</small></div>
        </div>
        <div className={`health-insight ${trackedDays < 4 ? 'incomplete' : ''}`}><HeartPulse size={17} /><span><strong>Nhận định:</strong> {weeklyInsight}</span></div>
        <div className="weekly-goals"><span>Đạt mục tiêu ngủ <b>{sleepGoalDays}/7</b></span><span>Đạt mục tiêu nước <b>{waterGoalDays}/7</b></span><span>Đạt mục tiêu vận động <b>{exerciseGoalDays}/7</b></span></div>
        <div className="health-trends">
          <div><TrendingUp size={15} /><span>Xu hướng ngủ</span><strong className={sleepTrend >= 0 ? 'trend-positive' : 'trend-negative'}>{sleepTrend >= 0 ? '+' : ''}{sleepTrend.toFixed(1)} giờ</strong></div>
          <div><Battery size={15} /><span>Xu hướng năng lượng</span><strong className={energyTrend >= 0 ? 'trend-positive' : 'trend-negative'}>{energyTrend >= 0 ? '+' : ''}{energyTrend.toFixed(1)} điểm</strong></div>
          <div><Brain size={15} /><span>Xu hướng căng thẳng</span><strong className={stressTrend <= 0 ? 'trend-positive' : 'trend-negative'}>{stressTrend >= 0 ? '+' : ''}{stressTrend.toFixed(1)} điểm</strong></div>
        </div>
        <div className="health-report-days">
          <div><CheckCircle2 size={16} /><span><strong>Ngày nổi bật:</strong> {trackedDays ? (bestDay?.date === today ? 'Hôm nay' : bestDay?.date) : 'Chưa đủ dữ liệu'}{trackedDays ? ' — có nhiều mục tiêu đạt nhất.' : ' — hãy ghi nhật ký để hệ thống so sánh.'}</span></div>
          <div><AlertTriangle size={16} /><span><strong>Ngày cần chú ý:</strong> {trackedDays ? (attentionDay?.date === today ? 'Hôm nay' : attentionDay?.date) : 'Chưa đủ dữ liệu'}{trackedDays ? ' — kiểm tra lại năng lượng, căng thẳng và triệu chứng.' : ' — chưa có dữ liệu để đánh giá.'}</span></div>
        </div>
        <p className="health-disclaimer">Báo cáo phản ánh xu hướng từ dữ liệu bạn nhập, không thay thế tư vấn hoặc chẩn đoán y khoa.</p>
      </section>

      <section className="card panel health-history">
        <div className="panel-heading"><h2><Timer size={18} /> Nhật ký 7 ngày</h2><span className="muted">{completedHealthHabits} thói quen sức khỏe đang theo dõi</span></div>
        <div className="health-history-list">{recentRecords.map(item => <div className="health-day" key={item.date}><strong>{item.date === today ? 'Hôm nay' : new Date(`${item.date}T12:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' })}</strong><span><Moon size={13} /> {item.sleepDuration ? formatSleep(item.sleepDuration) : '—'}</span><span><Droplets size={13} /> {item.waterMl ? `${(item.waterMl / 1000).toFixed(1)}L` : '—'}</span><span><Activity size={13} /> {item.exerciseMinutes}p</span><span className="mood-dot">{MOODS.find(mood => mood.value === item.mood)?.emoji || '·'}</span></div>)}</div>
        <div className="health-tip"><Target size={17} /><span><strong>Mẹo nhỏ:</strong> Hãy bắt đầu bằng một thay đổi nhỏ hôm nay — uống thêm một cốc nước hoặc đi bộ 10 phút.</span></div>
      </section>

      {isSleepOpen && <div className="modal-backdrop" onMouseDown={event => event.currentTarget === event.target && setIsSleepOpen(false)}><div className="modal card health-log-modal"><div className="modal-heading"><div><h2>Nhật ký sức khỏe ngày {selectedDate}</h2><small className="muted">Ghi càng đầy đủ, nhận định tuần càng chính xác.</small></div><button className="icon-btn" onClick={() => setIsSleepOpen(false)}>×</button></div><div className="health-log-fields"><label>Ngủ (giờ)<input className="input" type="number" min="0" max="24" step="0.5" value={sleepDuration} onChange={event => setSleepDuration(event.target.value)} /></label><label>Chất lượng ngủ (0–5)<input className="input" type="number" min="0" max="5" value={sleepQuality} onChange={event => setSleepQuality(event.target.value)} /></label><label>Năng lượng (0–5)<input className="input" type="number" min="0" max="5" value={energyLevel} onChange={event => setEnergyLevel(event.target.value)} /></label><label>Căng thẳng (0–5)<input className="input" type="number" min="0" max="5" value={stressLevel} onChange={event => setStressLevel(event.target.value)} /></label><label>Nhịp tim nghỉ (bpm)<input className="input" type="number" min="0" value={restingHeartRate} onChange={event => setRestingHeartRate(event.target.value)} placeholder="Không bắt buộc" /></label><label>Vận động (phút)<input className="input" type="number" min="0" value={exerciseMinutes} onChange={event => setExerciseMinutes(event.target.value)} /></label></div><label>Hoạt động<input className="input" value={exerciseType} onChange={event => setExerciseType(event.target.value)} placeholder="Đi bộ, gym, yoga..." /></label><label>Triệu chứng / khó chịu<textarea className="input health-textarea" value={symptoms} onChange={event => setSymptoms(event.target.value)} placeholder="Đau đầu, mệt mỏi, đau cơ..." /></label><label>Ghi chú trong ngày<textarea className="input health-textarea" value={note} onChange={event => setNote(event.target.value)} placeholder="Bữa ăn, thuốc, điều gì ảnh hưởng sức khỏe..." /></label><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setIsSleepOpen(false)}>Hủy</button><button className="btn btn-primary" onClick={saveDailyLog}>Lưu nhật ký</button></div></div></div>}
    </div>
  );
}
