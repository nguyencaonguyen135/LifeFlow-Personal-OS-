import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ListChecks, Kanban, FolderOpen, Repeat, Plus, Search,
  Trash2, CheckCircle2, Clock3, AlertCircle, ChevronRight,
  ArrowRight, ArrowLeft, Calendar
} from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { formatDate, getTodayString, confirmAction } from '@/utils';
import type { TaskPriority, TaskStatus, Task } from '@/types';

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo', label: 'Chưa làm', color: '#64748b' },
  { key: 'in_progress', label: 'Đang làm', color: '#3b82f6' },
  { key: 'waiting', label: 'Tạm dừng / Đang chờ', color: '#f59e0b' },
  { key: 'done', label: 'Đã hoàn thành', color: '#22c55e' }
];

export default function TasksPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    tasks, projects,
    addTask, updateTask, deleteTask, toggleTaskStatus,
    addProject, deleteProject, getProjectProgress
  } = useTaskStore();

  const currentPath = location.pathname;
  const activeTab = useMemo(() => {
    if (currentPath.includes('/kanban')) return 'kanban';
    if (currentPath.includes('/projects')) return 'projects';
    if (currentPath.includes('/recurring')) return 'recurring';
    return 'list';
  }, [currentPath]);

  const today = getTodayString();

  // Filters for List View
  const [filterType, setFilterType] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskProjId, setTaskProjId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(today);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');

  // Project Form State
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projColor, setProjColor] = useState('#6366f1');

  // Filtered Tasks for List View
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Filter tab
      if (filterType === 'today') {
        if (t.dueDate !== today && t.startDate !== today) return false;
      } else if (filterType === 'overdue') {
        if (!t.dueDate || t.dueDate >= today || t.status === 'done' || t.status === 'cancelled') return false;
      } else if (filterType === 'upcoming') {
        if (!t.dueDate || t.dueDate <= today || t.status === 'done') return false;
      } else if (filterType === 'done') {
        if (t.status !== 'done') return false;
      }

      // Priority Filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      // Project Filter
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      }

      return true;
    });
  }, [tasks, filterType, priorityFilter, projectFilter, searchQuery, today]);

  // Handlers
  const handleSaveTask = () => {
    if (!taskTitle.trim()) return;
    addTask({
      title: taskTitle,
      description: taskDesc,
      projectId: taskProjId || undefined,
      dueDate: taskDueDate || undefined,
      priority: taskPriority,
      status: taskStatus
    });

    setIsTaskModalOpen(false);
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus('todo');
  };

  const handleSaveProject = () => {
    if (!projName.trim()) return;
    addProject({
      name: projName,
      description: projDesc,
      color: projColor
    });

    setIsProjectModalOpen(false);
    setProjName('');
    setProjDesc('');
  };

  const moveTaskStatus = (task: Task, direction: 'next' | 'prev') => {
    const sequence: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done'];
    const currentIndex = sequence.indexOf(task.status);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < sequence.length) {
      updateTask(task.id, { status: sequence[nextIndex] });
    }
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">MODULE CÔNG VIỆC</span>
          <h1>Quản lý Công việc & Dự án</h1>
          <p className="muted">Tổ chức nhiệm vụ hiệu quả theo danh sách, Kanban và dự án.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setIsProjectModalOpen(true)}>
            <FolderOpen size={15} /> Tạo dự án
          </button>
          <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(true)}>
            <Plus size={15} /> Thêm công việc
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
          { key: 'list', label: 'Danh sách việc', path: '/tasks/list', icon: ListChecks },
          { key: 'kanban', label: 'Bảng Kanban', path: '/tasks/kanban', icon: Kanban },
          { key: 'projects', label: 'Dự án', path: '/tasks/projects', icon: FolderOpen },
          { key: 'recurring', label: 'Việc lặp lại', path: '/tasks/recurring', icon: Repeat },
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

      {/* ── TAB 1: LIST VIEW ── */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filter Bar */}
          <div className="card panel" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Category buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: `Tất cả (${tasks.length})` },
                  { key: 'today', label: 'Hôm nay' },
                  { key: 'overdue', label: 'Quá hạn' },
                  { key: 'upcoming', label: 'Sắp tới' },
                  { key: 'done', label: 'Đã xong' },
                ].map(item => (
                  <button
                    key={item.key}
                    className={`btn btn-sm ${filterType === item.key ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterType(item.key as any)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Priority & Search */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  className="input select"
                  style={{ width: 140 }}
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value as any)}
                >
                  <option value="all">Độ ưu tiên</option>
                  <option value="urgent">Gấp</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>

                <select
                  className="input select"
                  style={{ width: 150 }}
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                >
                  <option value="all">Mọi dự án</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <div style={{ position: 'relative', minWidth: 200 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 32 }}
                    placeholder="Tìm việc..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="card panel">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <Clock3 size={32} />
                <span>Không tìm thấy công việc nào phù hợp.</span>
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map(task => {
                  const isDone = task.status === 'done';
                  const proj = projects.find(p => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      className={`task-row ${isDone ? 'completed' : ''}`}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--border-color-subtle)',
                        borderRadius: 10
                      }}
                    >
                      <button
                        className="task-check"
                        onClick={() => confirmAction('Bạn có muốn cập nhật trạng thái công việc này?', () => toggleTaskStatus(task.id))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {isDone ? (
                          <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                        ) : (
                          <span />
                        )}
                      </button>

                      <div className="task-copy" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong>{task.title}</strong>
                          {proj && (
                            <span style={{
                              fontSize: 11,
                              padding: '1px 6px',
                              borderRadius: 6,
                              background: `${proj.color}20`,
                              color: proj.color,
                              fontWeight: 500
                            }}>
                              {proj.name}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <small className="muted" style={{ display: 'block', marginTop: 2 }}>
                            {task.description}
                          </small>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {task.dueDate && (
                          <small style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: task.dueDate < today && !isDone ? 'var(--color-danger)' : 'var(--text-muted)',
                            fontSize: 12
                          }}>
                            <Calendar size={13} />
                            {formatDate(task.dueDate)}
                          </small>
                        )}

                        <span className={`badge badge-${
                          task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'secondary'
                        }`}>
                          {task.priority === 'urgent' ? 'Gấp' : task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Vừa' : 'Thấp'}
                        </span>

                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => confirmAction('Bạn có chắc muốn xóa công việc này?', () => deleteTask(task.id))}
                          title="Xóa công việc"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: KANBAN BOARD ── */}
      {activeTab === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {STATUS_COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="kanban-column">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <h3 style={{ margin: 0, fontSize: 15 }}>{col.label}</h3>
                  </div>
                  <span className="badge badge-secondary">{colTasks.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {colTasks.map(t => {
                    const proj = projects.find(p => p.id === t.projectId);
                    return (
                      <div key={t.id} className="kanban-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <span className={`badge badge-${
                            t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : 'secondary'
                          }`} style={{ fontSize: 10 }}>
                            {t.priority.toUpperCase()}
                          </span>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 2, color: 'var(--text-muted)' }}
                            onClick={() => confirmAction('Bạn có chắc muốn xóa công việc này?', () => deleteTask(t.id))}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>{t.title}</h4>
                        {t.description && <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>{t.description}</p>}

                        {proj && (
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: `${proj.color}20`, color: proj.color }}>
                              {proj.name}
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-color-subtle)' }}>
                          <small className="muted">{t.dueDate ? formatDate(t.dueDate) : '—'}</small>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {col.key !== 'todo' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 4 }}
                                onClick={() => moveTaskStatus(t, 'prev')}
                                title="Lùi trạng thái"
                              >
                                <ArrowLeft size={13} />
                              </button>
                            )}
                            {col.key !== 'done' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 4 }}
                                onClick={() => moveTaskStatus(t, 'next')}
                                title="Chuyển tiếp"
                              >
                                <ArrowRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', marginTop: 6 }}
                    onClick={() => {
                      setTaskStatus(col.key);
                      setIsTaskModalOpen(true);
                    }}
                  >
                    + Thêm vào đây
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 3: PROJECTS ── */}
      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {projects.map(p => {
              const projTasks = tasks.filter(t => t.projectId === p.id);
              const progress = getProjectProgress(p.id);
              const doneCount = projTasks.filter(t => t.status === 'done').length;

              return (
                <div key={p.id} className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 4, background: p.color || '#6366f1' }} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>{p.name}</h3>
                        {p.description && <small className="muted">{p.description}</small>}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => confirmAction('Bạn có chắc muốn xóa dự án này?', () => deleteProject(p.id))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="progress-bar" style={{ height: 8 }}>
                    <span style={{ width: `${progress}%`, background: p.color || 'var(--color-primary)' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>Hoàn thành: <strong>{doneCount}/{projTasks.length} việc</strong></span>
                    <strong style={{ color: p.color || 'var(--color-primary)' }}>{progress}%</strong>
                  </div>

                  {/* List of subtasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {projTasks.slice(0, 4).map(t => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: 'var(--bg-surface-alt)'
                        }}
                      >
                        <CheckCircle2
                          size={15}
                          style={{ color: t.status === 'done' ? 'var(--color-success)' : 'var(--text-muted)' }}
                        />
                        <span style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: RECURRING TASKS ── */}
      {activeTab === 'recurring' && (
        <div className="card panel">
          <h2>Nhiệm Vụ Lặp Lại Định Kỳ</h2>
          <p className="muted" style={{ marginBottom: 16 }}>Các công việc tự động lặp lại theo ngày/tuần/tháng.</p>
          <div className="task-list">
            {tasks.filter(t => t.isRecurring).length === 0 ? (
              <div className="empty-state">
                <Repeat size={32} />
                <span>Chưa có nhiệm vụ lặp lại nào. Bạn có thể bật tùy chọn lặp lại khi tạo công việc.</span>
              </div>
            ) : (
              tasks.filter(t => t.isRecurring).map(t => (
                <div key={t.id} className="task-row" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color-subtle)' }}>
                  <Repeat size={16} style={{ color: 'var(--color-primary)' }} />
                  <div className="task-copy">
                    <strong>{t.title}</strong>
                    <small className="muted">
                      {typeof t.recurrenceRule === 'string'
                        ? t.recurrenceRule
                        : t.recurrenceRule?.frequency === 'daily'
                        ? 'Hàng ngày'
                        : t.recurrenceRule?.frequency === 'weekly'
                        ? 'Hàng tuần'
                        : t.recurrenceRule?.frequency === 'monthly'
                        ? 'Hàng tháng'
                        : 'Hàng tuần'}
                    </small>
                  </div>
                  <span className="badge badge-primary">Lặp lại</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {/* 1. Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setIsTaskModalOpen(false)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Thêm Công Việc Mới</h2>
              <button className="icon-btn" onClick={() => setIsTaskModalOpen(false)}>✕</button>
            </div>

            <label>
              Tiêu đề công việc
              <input className="input" autoFocus value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Ví dụ: Ôn thi cuối kỳ, Viết báo cáo..." />
            </label>

            <label>
              Mô tả chi tiết
              <textarea
                className="input"
                rows={2}
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                placeholder="Ghi chú nội dung cần làm..."
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>
                Độ ưu tiên
                <select className="input select" value={taskPriority} onChange={e => setTaskPriority(e.target.value as any)}>
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Gấp</option>
                </select>
              </label>

              <label>
                Trạng thái
                <select className="input select" value={taskStatus} onChange={e => setTaskStatus(e.target.value as any)}>
                  <option value="todo">Chưa làm</option>
                  <option value="in_progress">Đang làm</option>
                  <option value="waiting">Tạm dừng</option>
                  <option value="done">Hoàn thành</option>
                </select>
              </label>
            </div>

            <label>
              Thuộc dự án
              <select className="input select" value={taskProjId} onChange={e => setTaskProjId(e.target.value)}>
                <option value="">-- Không thuộc dự án nào --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>

            <label>
              Hạn hoàn thành (Deadline)
              <input className="input" type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
            </label>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveTask}>Lưu công việc</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Project Modal */}
      {isProjectModalOpen && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setIsProjectModalOpen(false)}>
          <div className="modal card">
            <div className="modal-heading">
              <h2>Tạo Dự Án Mới</h2>
              <button className="icon-btn" onClick={() => setIsProjectModalOpen(false)}>✕</button>
            </div>

            <label>
              Tên dự án
              <input className="input" autoFocus value={projName} onChange={e => setProjName(e.target.value)} placeholder="Ví dụ: Học Python, Xây Portfolio..." />
            </label>

            <label>
              Mô tả mục tiêu
              <textarea
                className="input"
                rows={2}
                value={projDesc}
                onChange={e => setProjDesc(e.target.value)}
                placeholder="Mô tả ngắn gọn kết quả cần đạt..."
              />
            </label>

            <label>
              Màu đại diện
              <input
                className="input"
                type="color"
                value={projColor}
                onChange={e => setProjColor(e.target.value)}
                style={{ height: 42, padding: 4 }}
              />
            </label>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsProjectModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveProject}>Tạo dự án</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
