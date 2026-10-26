import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, ListChecks, Calendar, BookOpen, Flame, Trophy } from 'lucide-react';

export default function MobileNav() {
  const items = [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/' },
    { label: 'Tài chính', icon: Wallet, path: '/finance/overview' },
    { label: 'Công việc', icon: ListChecks, path: '/tasks/list' },
    { label: 'Lịch', icon: Calendar, path: '/calendar' },
    { label: 'Thói quen', icon: Flame, path: '/habits' },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      zIndex: 40,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={{ flex: 1 }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 8px 8px', gap: 4,
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              }}>
                <Icon size={20} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
              </div>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
