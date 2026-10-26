import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Wallet, ListChecks, Calendar, BookOpen,
  Target, BarChart3, Settings, TrendingUp, ClipboardList,
  Kanban, FolderOpen, Clock, GraduationCap, CalendarDays,
  FileText, Trophy, ChevronLeft, ChevronRight, Repeat,
  PiggyBank, CreditCard, FileBarChart, Flame, ChevronDown
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: LayoutDashboard, path: '/' },
  {
    label: 'Tài chính', icon: Wallet, path: '/finance',
    children: [
      { label: 'Tổng quan tài chính', icon: TrendingUp, path: '/finance/overview' },
      { label: 'Giao dịch', icon: ClipboardList, path: '/finance/transactions' },
      { label: 'Danh mục', icon: FolderOpen, path: '/finance/categories' },
      { label: 'Ngân sách', icon: PiggyBank, path: '/finance/budgets' },
      { label: 'Mục tiêu tiết kiệm', icon: Target, path: '/finance/savings' },
      { label: 'Công nợ', icon: CreditCard, path: '/finance/debts' },
      { label: 'Báo cáo', icon: FileBarChart, path: '/finance/reports' },
    ]
  },
  {
    label: 'Công việc', icon: ListChecks, path: '/tasks',
    children: [
      { label: 'Danh sách', icon: ListChecks, path: '/tasks/list' },
      { label: 'Kanban Board', icon: Kanban, path: '/tasks/kanban' },
      { label: 'Dự án', icon: FolderOpen, path: '/tasks/projects' },
      { label: 'Lặp lại', icon: Repeat, path: '/tasks/recurring' },
    ]
  },
  { label: 'Lịch trình', icon: Calendar, path: '/calendar' },
  {
    label: 'Học tập', icon: BookOpen, path: '/study',
    children: [
      { label: 'Môn học', icon: GraduationCap, path: '/study/subjects' },
      { label: 'Thời khóa biểu', icon: CalendarDays, path: '/study/schedule' },
      { label: 'Bài tập & Thi', icon: FileText, path: '/study/assignments' },
      { label: 'Theo dõi thời gian', icon: Clock, path: '/study/tracker' },
    ]
  },
  { label: 'Thói quen', icon: Flame, path: '/habits' },
  { label: 'Mục tiêu', icon: Trophy, path: '/goals' },
  { label: 'Báo cáo', icon: BarChart3, path: '/reports' },
  { label: 'Cài đặt', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['Tài chính', 'Công việc', 'Học tập']));

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isGroupActive = (item: NavItem): boolean => {
    if (item.path === '/' && location.pathname !== '/') return false;
    return location.pathname === item.path ||
      location.pathname.startsWith(item.path + '/') ||
      (item.children?.some(c => location.pathname === c.path || location.pathname.startsWith(c.path)) ?? false);
  };

  return (
    <aside
      className="sidebar flex flex-col h-full transition-all duration-300 ease-in-out select-none"
      style={{ width: collapsed ? '64px' : '240px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 16
        }}>
          ✦
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>LifeFlow</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Personal OS</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isActive = isGroupActive(item);
          const isOpen = openGroups.has(item.label);

          if (hasChildren) {
            return (
              <div key={item.path} className="mb-1">
                <button
                  className="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  style={{ fontWeight: isActive ? 600 : 400 }}
                  onClick={() => !collapsed && toggleGroup(item.label)}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} style={{ flexShrink: 0, color: isActive ? '#a5b4fc' : undefined }} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm">{item.label}</span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.2s ease',
                          color: 'rgba(255,255,255,0.3)'
                        }}
                      />
                    </>
                  )}
                </button>

                {!collapsed && isOpen && (
                  <div className="ml-2 mt-1 mb-1">
                    {item.children!.map(child => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname === child.path;
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className="sidebar-item flex items-center gap-2.5 px-3 py-2 text-sm"
                          style={isChildActive ? {
                            background: 'rgba(99,102,241,0.15)',
                            color: '#a5b4fc',
                            fontWeight: 500
                          } : {}}
                        >
                          <ChildIcon size={15} style={{ flexShrink: 0 }} />
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-item flex items-center gap-3 px-3 py-2.5 mb-1 text-sm ${isActive ? 'active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontWeight: 500 }}>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/5">
        <button
          className="sidebar-item w-full flex items-center justify-center p-2"
          onClick={onToggle}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <span className="flex items-center gap-2 text-sm w-full">
                <ChevronLeft size={16} />
                <span>Thu gọn</span>
              </span>
          }
        </button>
      </div>
    </aside>
  );
}
