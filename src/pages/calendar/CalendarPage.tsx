import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Clock, MapPin, Video, Plus,
  ChevronLeft, ChevronRight, AlertTriangle, Trash2, CheckCircle2
} from 'lucide-react';
import { useCalendarStore } from '@/store/calendarStore';
import { useStudyStore } from '@/store/studyStore';
import { formatDate, getTodayString } from '@/utils';
import type { EventType, CalendarEvent } from '@/types';

export default function CalendarPage() {
  const { events, addEvent, deleteEvent, checkConflict } = useCalendarStore();
  const { scheduleEntries, subjects, assignments, exams } = useStudyStore();

  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);

  // Month navigation
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<CalendarEvent[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('personal');
  const [eventDate, setEventDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const { year, month } = currentYearMonth;
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    const padDays = (firstDay === 0 ? 7 : firstDay) - 1; // Start Monday
    for (let i = padDays - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [currentYearMonth]);

  // Selected date events & items
  const selectedDateEvents = useMemo(() => {
    const selEvents = events.filter(e => e.date === selectedDate);
    const selDeadlines = assignments.filter(a => a.deadline === selectedDate);
    const selExams = exams.filter(e => e.datetime.startsWith(selectedDate));

    // Study schedules for day of week
    const dayOfWeek = new Date(selectedDate).getDay(); // 0-6
    const mappedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // 1-7
    const daySchedules = scheduleEntries.filter(s => s.dayOfWeek === mappedDayOfWeek && s.isActive);

    return {
      events: selEvents,
      deadlines: selDeadlines,
      exams: selExams,
      schedules: daySchedules
    };
  }, [events, assignments, exams, scheduleEntries, selectedDate]);

  // Check conflicts in real-time when filling form
  const handleCheckConflict = (d: string, st: string, et: string) => {
    if (d && st && et) {
      const conflicts = checkConflict(d, st, et);
      setConflictWarning(conflicts);
    }
  };

  const handleSaveEvent = () => {
    if (!title.trim() || !eventDate || !startTime || !endTime) return;

    addEvent({
      title,
      type,
      date: eventDate,
      startTime,
      endTime,
      location: location || undefined,
      isOnline,
      onlineUrl: isOnline ? onlineUrl : undefined,
      description,
      color
    });

    setIsModalOpen(false);
    setTitle('');
    setLocation('');
    setDescription('');
    setConflictWarning([]);
  };

  const changeMonth = (direction: number) => {
    setCurrentYearMonth(prev => {
      let nextMonth = prev.month + direction;
      let nextYear = prev.year;
      if (nextMonth < 0) {
        nextMonth = 11;
        nextYear -= 1;
      } else if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      return { year: nextYear, month: nextMonth };
    });
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">MODULE LỊCH TRÌNH</span>
          <h1>Lịch Trình & Sự Kiện</h1>
          <p className="muted">Lên kế hoạch các cuộc hẹn, giờ học, kỳ thi và cảnh báo trùng giờ.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEventDate(selectedDate);
            setConflictWarning([]);
            setIsModalOpen(true);
          }}
        >
          <Plus size={15} /> Thêm sự kiện
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Calendar View */}
        <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Month Header Controller */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>
              Tháng {currentYearMonth.month + 1}, {currentYearMonth.year}
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(-1)}>
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const d = new Date();
                  setCurrentYearMonth({ year: d.getFullYear(), month: d.getMonth() });
                  setSelectedDate(today);
                }}
              >
                Hôm nay
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 600, fontSize: 12, color: 'var(--text-muted)' }}>
            <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {calendarDays.map((day, idx) => {
              const isSelected = day.dateStr === selectedDate;
              const isToday = day.dateStr === today;
              const hasEvents = events.some(e => e.date === day.dateStr);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day.dateStr)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 10,
                    padding: 6,
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid transparent',
                    background: isSelected
                      ? 'var(--color-primary-light)'
                      : isToday
                      ? 'var(--bg-surface-alt)'
                      : 'transparent',
                    opacity: day.isCurrentMonth ? 1 : 0.35,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--color-primary)' : 'var(--text-primary)'
                  }}>
                    {day.dayNum}
                  </span>
                  {hasEvents && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Panel */}
        <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel-heading">
            <div>
              <h2 style={{ fontSize: 16 }}>Lịch trình ngày: {formatDate(selectedDate)}</h2>
              <small className="muted">{selectedDate === today ? 'Hôm nay' : ''}</small>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEventDate(selectedDate);
                setConflictWarning([]);
                setIsModalOpen(true);
              }}
            >
              + Thêm lịch
            </button>
          </div>

          {/* List of items on selected date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 1. Schedule entries (lịch học cố định) */}
            {selectedDateEvents.schedules.map(sch => {
              const sub = subjects.find(s => s.id === sch.subjectId);
              return (
                <div
                  key={sch.id}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    background: 'var(--bg-surface-alt)',
                    borderLeft: `4px solid ${sub?.color || '#a855f7'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-primary">Lớp học cố định</span>
                    <small className="muted"><Clock size={12} /> {sch.startTime} - {sch.endTime}</small>
                  </div>
                  <h4 style={{ margin: '6px 0 2px', fontSize: 14 }}>{sub?.name || 'Môn học'}</h4>
                  {sch.room && <small className="muted"><MapPin size={11} /> Phòng {sch.room}</small>}
                  {sch.onlineUrl && (
                    <a href={sch.onlineUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 12, marginTop: 4 }}>
                      <Video size={12} /> Vào lớp Online
                    </a>
                  )}
                </div>
              );
            })}

            {/* 2. Exams */}
            {selectedDateEvents.exams.map(ex => (
              <div
                key={ex.id}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  background: 'var(--color-danger-bg)',
                  borderLeft: '4px solid var(--color-danger)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="badge badge-danger">Lịch thi cử</span>
                  <small style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{ex.duration} phút</small>
                </div>
                <h4 style={{ margin: '6px 0 2px', fontSize: 14, color: 'var(--color-danger)' }}>{ex.title}</h4>
                {ex.location && <small style={{ color: 'var(--color-danger)' }}>{ex.location}</small>}
              </div>
            ))}

            {/* 3. Deadlines */}
            {selectedDateEvents.deadlines.map(d => (
              <div
                key={d.id}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  background: 'var(--color-warning-bg)',
                  borderLeft: '4px solid var(--color-warning)'
                }}
              >
                <span className="badge badge-warning">Hạn nộp bài</span>
                <h4 style={{ margin: '6px 0 2px', fontSize: 14 }}>{d.title}</h4>
              </div>
            ))}

            {/* 4. Calendar Events */}
            {selectedDateEvents.events.map(ev => (
              <div
                key={ev.id}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  background: 'var(--bg-surface-alt)',
                  borderLeft: `4px solid ${ev.color || 'var(--color-primary)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-secondary">{ev.type.toUpperCase()}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <small className="muted"><Clock size={12} /> {ev.startTime} - {ev.endTime}</small>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 2, color: 'var(--color-danger)' }}
                      onClick={() => deleteEvent(ev.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <h4 style={{ margin: '6px 0 2px', fontSize: 14 }}>{ev.title}</h4>
                {ev.location && <small className="muted"><MapPin size={11} /> {ev.location}</small>}
                {ev.onlineUrl && (
                  <a href={ev.onlineUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 12, marginTop: 4 }}>
                    <Video size={12} /> Link cuộc họp
                  </a>
                )}
              </div>
            ))}

            {selectedDateEvents.events.length === 0 &&
              selectedDateEvents.schedules.length === 0 &&
              selectedDateEvents.exams.length === 0 &&
              selectedDateEvents.deadlines.length === 0 && (
                <div className="empty-state">
                  <CalendarIcon size={32} />
                  <span>Không có lịch trình nào trong ngày này.</span>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Event Modal with Conflict Warning */}
      {isModalOpen && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setIsModalOpen(false)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Lịch Trình Mới</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            {/* Conflict Alert Warning */}
            {conflictWarning.length > 0 && (
              <div style={{
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'var(--color-danger)'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Cảnh báo trùng giờ!</strong> Đã có sự kiện "<strong>{conflictWarning[0]?.title}</strong>" diễn ra từ {conflictWarning[0]?.startTime} đến {conflictWarning[0]?.endTime}.
                </span>
              </div>
            )}

            <label>
              Tiêu đề sự kiện
              <input className="input" autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Họp nhóm dự án, Lớp tiếng Anh..." />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Loại sự kiện
                <select className="input select" value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="personal">Cá nhân</option>
                  <option value="study">Học tập</option>
                  <option value="exam">Thi cử</option>
                  <option value="appointment">Cuộc hẹn</option>
                  <option value="task">Công việc</option>
                </select>
              </label>

              <label>
                Ngày diễn ra
                <input
                  className="input"
                  type="date"
                  value={eventDate}
                  onChange={e => {
                    setEventDate(e.target.value);
                    handleCheckConflict(e.target.value, startTime, endTime);
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Giờ bắt đầu
                <input
                  className="input"
                  type="time"
                  value={startTime}
                  onChange={e => {
                    setStartTime(e.target.value);
                    handleCheckConflict(eventDate, e.target.value, endTime);
                  }}
                />
              </label>

              <label>
                Giờ kết thúc
                <input
                  className="input"
                  type="time"
                  value={endTime}
                  onChange={e => {
                    setEndTime(e.target.value);
                    handleCheckConflict(eventDate, startTime, e.target.value);
                  }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isOnline} onChange={e => setIsOnline(e.target.checked)} />
              <span style={{ fontSize: 13 }}>Diễn ra trực tuyến (Online)</span>
            </label>

            {isOnline ? (
              <label>
                Link cuộc họp / Google Meet
                <input className="input" value={onlineUrl} onChange={e => setOnlineUrl(e.target.value)} placeholder="https://meet.google.com/..." />
              </label>
            ) : (
              <label>
                Địa điểm tổ chức
                <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ví dụ: Phòng B201, Cafe Highland..." />
              </label>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveEvent}>Lưu sự kiện</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
