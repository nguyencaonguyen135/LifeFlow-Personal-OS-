import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, GraduationCap, CalendarDays, FileText, Clock,
  Plus, Play, Pause, RotateCcw, CheckCircle2, Trash2, MapPin, Video, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useStudyStore } from '@/store/studyStore';
import { formatDate, getTodayString, confirmAction } from '@/utils';
import type { ImportanceLevel, AssignmentStatus } from '@/types';

type ScheduleDraft = {
  subjectId: string;
  date: string;
  day: number;
  start: string;
  end: string;
  room: string;
};

const DAYS_OF_WEEK = [
  { day: 1, label: 'Thứ Hai' },
  { day: 2, label: 'Thứ Ba' },
  { day: 3, label: 'Thứ Tư' },
  { day: 4, label: 'Thứ Năm' },
  { day: 5, label: 'Thứ Sáu' },
  { day: 6, label: 'Thứ Bảy' },
  { day: 7, label: 'Chủ Nhật' },
];

const getMonday = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(12, 0, 0, 0);
  return result;
};

const toDateString = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function StudyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    subjects, scheduleEntries, assignments, exams, studySessions,
    addSubject, deleteSubject,
    addScheduleEntry, deleteScheduleEntry,
    addAssignment, updateAssignment, deleteAssignment,
    addExam, deleteExam,
    startStudySession, endStudySession,
    getTotalStudyTimeForDate
  } = useStudyStore();

  const today = getTodayString();
  const currentPath = location.pathname;

  const activeTab = useMemo(() => {
    if (currentPath.includes('/schedule')) return 'schedule';
    if (currentPath.includes('/assignments')) return 'assignments';
    if (currentPath.includes('/tracker')) return 'tracker';
    return 'subjects';
  }, [currentPath]);

  // Pomodoro Timer State
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [weekOffset, setWeekOffset] = useState(0);

  // Modals
  const [modalType, setModalType] = useState<string | null>(null);

  // Subject Form
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subTeacher, setSubTeacher] = useState('');
  const [subColor, setSubColor] = useState('#6366f1');

  // Schedule Entry Form
  const [scheduleDrafts, setScheduleDrafts] = useState<ScheduleDraft[]>([
    { subjectId: subjects[0]?.id || '', date: today, day: new Date(`${today}T12:00:00`).getDay() || 7, start: '08:00', end: '10:00', room: '' }
  ]);

  const weekDays = useMemo(() => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return DAYS_OF_WEEK.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return { ...day, date: toDateString(date) };
    });
  }, [weekOffset]);

  // Assignment Form
  const [asgnSubId, setAsgnSubId] = useState(subjects[0]?.id || '');
  const [asgnTitle, setAsgnTitle] = useState('');
  const [asgnDeadline, setAsgnDeadline] = useState(today);
  const [asgnImportance, setAsgnImportance] = useState<ImportanceLevel>('medium');

  // Exam Form
  const [examSubId, setExamSubId] = useState(subjects[0]?.id || '');
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(today);
  const [examTime, setExamTime] = useState('08:00');
  const [examDuration, setExamDuration] = useState('90');
  const [examLocation, setExamLocation] = useState('');

  // Pomodoro countdown effect
  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      // End session if active
      if (activeSessionId) {
        endStudySession(activeSessionId, new Date().toISOString());
        setActiveSessionId(null);
      }
      alert(pomodoroMode === 'study' ? '🎉 Hoàn thành phiên học 25 phút! Hãy nghỉ ngơi.' : '☕ Hết giờ nghỉ! Bắt đầu học nào.');
      setPomodoroMode(m => m === 'study' ? 'break' : 'study');
      setTimeLeft(pomodoroMode === 'study' ? 5 * 60 : 25 * 60);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, pomodoroMode, activeSessionId, endStudySession]);

  const togglePomodoro = () => {
    if (!isRunning) {
      // Start
      const session = startStudySession({
        type: 'pomodoro',
        subjectId: selectedSubjectId || undefined,
        startTime: new Date().toISOString(),
        date: today
      });
      setActiveSessionId(session.id);
      setIsRunning(true);
    } else {
      // Pause
      setIsRunning(false);
    }
  };

  const resetPomodoro = () => {
    setIsRunning(false);
    if (activeSessionId) {
      endStudySession(activeSessionId, new Date().toISOString());
      setActiveSessionId(null);
    }
    setTimeLeft(pomodoroMode === 'study' ? 25 * 60 : 5 * 60);
  };

  const handleSaveSubject = () => {
    if (!subName.trim()) return;
    addSubject({
      name: subName,
      code: subCode || undefined,
      teacher: subTeacher || undefined,
      color: subColor
    });
    setModalType(null);
    setSubName('');
    setSubCode('');
  };

  const handleSaveSchedule = () => {
    const validDrafts = scheduleDrafts.filter(draft =>
      draft.subjectId && draft.date && draft.start && draft.end && draft.start < draft.end
    );
    if (validDrafts.length === 0) return;

    validDrafts.forEach(draft => addScheduleEntry({
      subjectId: draft.subjectId,
      date: draft.date,
      dayOfWeek: draft.day,
      startTime: draft.start,
      endTime: draft.end,
      room: draft.room || undefined
    }));
    setScheduleDrafts([
      { subjectId: subjects[0]?.id || '', date: today, day: new Date(`${today}T12:00:00`).getDay() || 7, start: '08:00', end: '10:00', room: '' }
    ]);
    setModalType(null);
  };

  const updateScheduleDraft = (index: number, patch: Partial<ScheduleDraft>) => {
    setScheduleDrafts(current => current.map((draft, draftIndex) =>
      draftIndex === index ? { ...draft, ...patch } : draft
    ));
  };

  const addScheduleDraft = () => {
    setScheduleDrafts(current => [
      ...current,
      { subjectId: subjects[0]?.id || '', date: today, day: 1, start: '10:00', end: '12:00', room: '' }
    ]);
  };

  const handleSaveAssignment = () => {
    if (!asgnTitle.trim() || !asgnSubId || !asgnDeadline) return;
    addAssignment({
      subjectId: asgnSubId,
      title: asgnTitle,
      deadline: asgnDeadline,
      importance: asgnImportance
    });
    setModalType(null);
    setAsgnTitle('');
  };

  const handleSaveExam = () => {
    if (!examTitle.trim() || !examSubId) return;
    addExam({
      subjectId: examSubId,
      title: examTitle,
      datetime: `${examDate}T${examTime}:00`,
      duration: Number(examDuration) || 90,
      location: examLocation || undefined
    });
    setModalType(null);
    setExamTitle('');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const todayStudyMinutes = getTotalStudyTimeForDate(today);

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">MODULE HỌC TẬP</span>
          <h1>Quản lý Học tập & Kế hoạch</h1>
          <p className="muted">Thời khóa biểu, môn học, theo dõi bài tập & đồng hồ Pomodoro.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setModalType('assignment')}>
            <FileText size={15} /> Thêm bài tập
          </button>
          <button className="btn btn-primary" onClick={() => setModalType('subject')}>
            <Plus size={15} /> Thêm môn học
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 8,
        overflowX: 'auto'
      }}>
        {[
          { key: 'subjects', label: 'Môn học', path: '/study/subjects', icon: GraduationCap },
          { key: 'schedule', label: 'Thời khóa biểu', path: '/study/schedule', icon: CalendarDays },
          { key: 'assignments', label: 'Bài tập & Thi cử', path: '/study/assignments', icon: FileText },
          { key: 'tracker', label: 'Đồng hồ Pomodoro', path: '/study/tracker', icon: Clock },
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

      {/* ── TAB 1: SUBJECTS ── */}
      {activeTab === 'subjects' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {subjects.map(s => {
            const subAssignments = assignments.filter(a => a.subjectId === s.id);
            const subExams = exams.filter(e => e.subjectId === s.id);

            return (
              <div key={s.id} className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, background: s.color || '#6366f1' }} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{s.name}</h3>
                      {s.code && <small className="muted">Mã: {s.code}</small>}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => confirmAction('Bạn có chắc muốn xóa môn học này?', () => deleteSubject(s.id))}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {s.teacher && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Giảng viên: {s.teacher}</div>}
                {s.objectives && <p className="muted" style={{ fontSize: 12, margin: 0 }}>{s.objectives}</p>}

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border-color-subtle)' }}>
                  <span className="badge badge-secondary">{subAssignments.length} bài tập</span>
                  <span className="badge badge-primary">{subExams.length} kỳ thi</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: SCHEDULE ── */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ marginBottom: 3 }}>Thời Khóa Biểu Tuần</h2>
              <small className="muted">Lịch học theo ngày cụ thể, không lặp cố định hàng tuần.</small>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setWeekOffset(offset => offset - 1)}><ChevronLeft size={15} /></button>
              <button className="btn btn-secondary btn-sm" onClick={() => setWeekOffset(0)}>Tuần này</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setWeekOffset(offset => offset + 1)}><ChevronRight size={15} /></button>
            </div>
            <button className="btn btn-primary" onClick={() => setModalType('schedule')}>
              <Plus size={15} /> Thêm tiết học
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {weekDays.map(d => {
              const dayEntries = scheduleEntries.filter(s =>
                s.isActive && (s.date ? s.date === d.date : s.dayOfWeek === d.day)
              );
              return (
                <div key={d.date} className="card panel" style={{ minHeight: 180 }}>
                  <h3 style={{ fontSize: 15, margin: '0 0 12px', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                    {d.label}
                    <small className="muted" style={{ display: 'block', fontWeight: 400 }}>{formatDate(d.date)}</small>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dayEntries.length === 0 ? (
                      <span className="muted" style={{ fontSize: 12 }}>Không có lịch học</span>
                    ) : (
                      dayEntries.map(entry => {
                        const sub = subjects.find(s => s.id === entry.subjectId);
                        return (
                          <div
                            key={entry.id}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: 'var(--bg-surface-alt)',
                              borderLeft: `3px solid ${sub?.color || '#6366f1'}`
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: 13 }}>{sub?.name || 'Môn học'}</strong>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 2, color: 'var(--color-danger)' }}
                                onClick={() => confirmAction('Bạn có chắc muốn xóa lịch học này?', () => deleteScheduleEntry(entry.id))}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <small className="muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={11} /> {entry.startTime} - {entry.endTime}
                            </small>
                            {entry.room && <small className="muted" style={{ display: 'block' }}>Phòng {entry.room}</small>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: ASSIGNMENTS & EXAMS ── */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
          {/* Assignments */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Danh sách Bài tập & Deadline</h2>
                <small className="muted">{assignments.length} bài tập</small>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setModalType('assignment')}>
                + Thêm bài tập
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assignments.map(a => {
                const sub = subjects.find(s => s.id === a.subjectId);
                const isSubmitted = a.status === 'submitted' || a.status === 'graded';
                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: 10,
                      background: 'var(--bg-surface-alt)',
                      borderLeft: `4px solid ${a.importance === 'high' ? 'var(--color-danger)' : 'var(--color-warning)'}`
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 14 }}>{a.title}</strong>
                        {sub && <span className="badge badge-secondary">{sub.name}</span>}
                      </div>
                      <small className="muted">Hạn chót: {formatDate(a.deadline)}</small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className={`btn btn-sm ${isSubmitted ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => confirmAction('Bạn có muốn cập nhật trạng thái bài tập này?', () => updateAssignment(a.id, { status: isSubmitted ? 'pending' : 'submitted' }))}
                      >
                        {isSubmitted ? 'Đã nộp ✓' : 'Nộp bài'}
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => confirmAction('Bạn có chắc muốn xóa bài tập này?', () => deleteAssignment(a.id))}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exams */}
          <div className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Lịch Thi Cử</h2>
                <small className="muted">{exams.length} kỳ thi</small>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalType('exam')}>
                + Thêm kỳ thi
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exams.map(e => {
                const sub = subjects.find(s => s.id === e.subjectId);
                return (
                  <div
                    key={e.id}
                    style={{
                      padding: '12px',
                      borderRadius: 10,
                      background: 'var(--color-danger-bg)',
                      borderLeft: '4px solid var(--color-danger)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: 14, color: 'var(--color-danger)' }}>{e.title}</strong>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)', padding: 2 }} onClick={() => confirmAction('Bạn có chắc muốn xóa kỳ thi này?', () => deleteExam(e.id))}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <small style={{ color: 'var(--color-danger)', display: 'block' }}>{sub?.name}</small>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                      <span>{formatDate(e.datetime.slice(0, 10))} ({e.duration}p)</span>
                      <span>{e.location || 'Online'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: POMODORO TRACKER ── */}
      {activeTab === 'tracker' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
          {/* Pomodoro Clock */}
          <div className="card panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
            <span className="badge badge-primary" style={{ marginBottom: 16 }}>
              {pomodoroMode === 'study' ? '🎯 Phiên tập trung' : '☕ Giờ nghỉ ngơi'}
            </span>

            <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, margin: '16px 0', fontFamily: 'monospace' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            <div style={{ width: '100%', maxWidth: 280, marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Môn học đang tập trung</label>
              <select
                className="input select"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary btn-lg" onClick={togglePomodoro}>
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                <span>{isRunning ? 'Tạm dừng' : 'Bắt đầu'}</span>
              </button>
              <button className="btn btn-secondary btn-lg" onClick={resetPomodoro}>
                <RotateCcw size={18} /> Đặt lại
              </button>
            </div>
          </div>

          {/* Study Stats Today */}
          <div className="card panel">
            <h2>Thống kê Học tập Hôm nay</h2>
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <span className="muted" style={{ fontSize: 13, display: 'block' }}>Tổng thời gian học hôm nay</span>
              <strong style={{ fontSize: 36, color: 'var(--color-primary)' }}>
                {Math.floor(todayStudyMinutes / 60)}h {todayStudyMinutes % 60}p
              </strong>
            </div>

            <h3 style={{ fontSize: 14, margin: '16px 0 8px' }}>Các phiên học đã hoàn thành ({studySessions.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {studySessions.map(session => {
                const sub = subjects.find(s => s.id === session.subjectId);
                return (
                  <div
                    key={session.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'var(--bg-surface-alt)',
                      fontSize: 13
                    }}
                  >
                    <span>{sub?.name || 'Tự học'} ({session.type})</span>
                    <strong>{session.duration || 25} phút</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {/* 1. Subject Modal */}
      {modalType === 'subject' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Môn Học Mới</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Tên môn học
              <input className="input" autoFocus value={subName} onChange={e => setSubName(e.target.value)} placeholder="Ví dụ: Toán cao cấp, Lập trình Web..." />
            </label>
            <label>
              Mã môn học (tùy chọn)
              <input className="input" value={subCode} onChange={e => setSubCode(e.target.value)} placeholder="CS101" />
            </label>
            <label>
              Tên giảng viên
              <input className="input" value={subTeacher} onChange={e => setSubTeacher(e.target.value)} placeholder="Thầy/Cô..." />
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveSubject}>Lưu môn học</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Schedule Modal */}
      {modalType === 'schedule' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <div>
                <h2>Thêm Môn Học Vào TKB</h2>
                <small className="muted">Bạn có thể thêm nhiều môn trong một lần.</small>
              </div>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div className="schedule-drafts">
              {scheduleDrafts.map((draft, index) => (
                <div className="schedule-draft" key={index}>
                  <div className="schedule-draft-heading">
                    <strong>Tiết {index + 1}</strong>
                    {scheduleDrafts.length > 1 && (
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => setScheduleDrafts(current => current.filter((_, draftIndex) => draftIndex !== index))}
                      >
                        Xóa dòng
                      </button>
                    )}
                  </div>
                  <label>
                    Môn học
                    <select className="input select" value={draft.subjectId} onChange={e => updateScheduleDraft(index, { subjectId: e.target.value })}>
                      {subjects.length === 0 && <option value="">Chưa có môn học</option>}
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Ngày học
                    <input
                      className="input"
                      type="date"
                      value={draft.date}
                      onChange={e => updateScheduleDraft(index, {
                        date: e.target.value,
                        day: new Date(`${e.target.value}T12:00:00`).getDay() || 7
                      })}
                    />
                  </label>
                  <label>
                    Ngày đã chọn
                    <span className="input" style={{ display: 'block', color: 'var(--text-secondary)' }}>
                      {DAYS_OF_WEEK.find(day => day.day === draft.day)?.label || 'Chọn ngày ở trên'}
                    </span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <label>
                      Bắt đầu
                      <input className="input" type="time" value={draft.start} onChange={e => updateScheduleDraft(index, { start: e.target.value })} />
                    </label>
                    <label>
                      Kết thúc
                      <input className="input" type="time" value={draft.end} onChange={e => updateScheduleDraft(index, { end: e.target.value })} />
                    </label>
                  </div>
                  <label>
                    Phòng học
                    <input className="input" value={draft.room} onChange={e => updateScheduleDraft(index, { room: e.target.value })} placeholder="B201" />
                  </label>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary schedule-add-row" type="button" onClick={addScheduleDraft} disabled={subjects.length === 0}>
              <Plus size={14} /> Thêm môn/tiết khác
            </button>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveSchedule} disabled={subjects.length === 0}>Lưu {scheduleDrafts.length} tiết học</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Assignment Modal */}
      {modalType === 'assignment' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Bài Tập Mới</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Tiêu đề bài tập
              <input className="input" autoFocus value={asgnTitle} onChange={e => setAsgnTitle(e.target.value)} placeholder="Ví dụ: Bài tập chương 3, Tiểu luận..." />
            </label>
            <label>
              Môn học
              <select className="input select" value={asgnSubId} onChange={e => setAsgnSubId(e.target.value)}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Hạn nộp (Deadline)
                <input className="input" type="date" value={asgnDeadline} onChange={e => setAsgnDeadline(e.target.value)} />
              </label>
              <label>
                Độ quan trọng
                <select className="input select" value={asgnImportance} onChange={e => setAsgnImportance(e.target.value as any)}>
                  <option value="low">Thấp</option>
                  <option value="medium">Bình thường</option>
                  <option value="high">Quan trọng</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveAssignment}>Lưu bài tập</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Exam Modal */}
      {modalType === 'exam' && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setModalType(null)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Lịch Thi Cử</h2>
              <button className="icon-btn" onClick={() => setModalType(null)}>✕</button>
            </div>
            <label>
              Tên kỳ thi
              <input className="input" autoFocus value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="Ví dụ: Thi giữa kỳ, Thi cuối kỳ..." />
            </label>
            <label>
              Môn thi
              <select className="input select" value={examSubId} onChange={e => setExamSubId(e.target.value)}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Ngày thi
                <input className="input" type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
              </label>
              <label>
                Giờ thi
                <input className="input" type="time" value={examTime} onChange={e => setExamTime(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Thời lượng (phút)
                <input className="input" type="number" value={examDuration} onChange={e => setExamDuration(e.target.value)} />
              </label>
              <label>
                Phòng thi
                <input className="input" value={examLocation} onChange={e => setExamLocation(e.target.value)} placeholder="Phòng B201" />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveExam}>Lưu lịch thi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
