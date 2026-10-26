import { useState, useRef } from 'react';
import {
  Settings as SettingsIcon, User, Moon, Sun, Download, Upload,
  RefreshCw, Trash2, Shield, Bell, Check, Sparkles
} from 'lucide-react';
import { useSettingStore } from '@/store/settingStore';
import { useFinanceStore } from '@/store/financeStore';
import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { useGoalStore } from '@/store/goalStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useStudyStore } from '@/store/studyStore';
import { storageExport, storageImport, storageClear } from '@/services/storage';
import { loadDemoData } from '@/data/demoData';
import { confirmAction } from '@/utils';

export default function SettingsPage() {
  const {
    user, settings,
    updateUser, updateSettings, toggleTheme
  } = useSettingStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [isSaved, setIsSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const reloadAllStores = () => {
    useSettingStore.getState().load();
    useFinanceStore.getState().load();
    useTaskStore.getState().load();
    useHabitStore.getState().load();
    useGoalStore.getState().load();
    useCalendarStore.getState().load();
    useStudyStore.getState().load();
  };

  const handleSaveProfile = () => {
    if (!name.trim()) {
      setStatusMessage('Tên hiển thị không được để trống.');
      return;
    }
    confirmAction('Bạn có muốn cập nhật hồ sơ này?', () => {
      updateUser({ name, email, avatar });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    });
  };

  const confirmSettingsUpdate = (message: string, change: Parameters<typeof updateSettings>[0]) => {
    confirmAction(message, () => updateSettings(change));
  };

  const handleExportJSON = () => {
    const data = storageExport();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LifeFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Đã xuất file sao lưu JSON thành công!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const content = ev.target?.result as string;
        const ok = storageImport(content);
        if (ok) {
          reloadAllStores();
          setStatusMessage('Đã khôi phục dữ liệu từ file sao lưu thành công!');
        } else {
          alert('Tệp sao lưu không hợp lệ!');
        }
      } catch (err) {
        alert('Lỗi đọc tệp sao lưu!');
      }
      setTimeout(() => setStatusMessage(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    confirmAction('Bạn có chắc chắn muốn tải lại dữ liệu mẫu Demo không?', () => {
      loadDemoData();
      reloadAllStores();
      setStatusMessage('Đã khôi phục dữ liệu mẫu Demo thành công!');
      setTimeout(() => setStatusMessage(null), 3000);
    });
  };

  const handleClearAllData = () => {
    confirmAction('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ dữ liệu trong trình duyệt của bạn và không thể hoàn tác! Bạn có chắc chắn không?', () => {
      storageClear();
      reloadAllStores();
      setStatusMessage('Đã xóa sạch dữ liệu.');
      setTimeout(() => setStatusMessage(null), 3000);
    });
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      {/* Header */}
      <div className="welcome-row">
        <div>
          <span className="eyebrow">HỆ THỐNG</span>
          <h1>Cài Đặt & Cấu Hình</h1>
          <p className="muted">Quản lý tài khoản cá nhân, giao diện và dữ liệu sao lưu của bạn.</p>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 12,
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success)',
          fontSize: 13,
          fontWeight: 500
        }}>
          ✓ {statusMessage}
        </div>
      )}

      {/* Profile Section */}
      <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2>Thông Tin Cá Nhân</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
            alt="Avatar"
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
          />
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Link ảnh đại diện (URL)</label>
            <input className="input" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label>
            Họ và tên
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label>
            Địa chỉ Email
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSaveProfile}>
            {isSaved ? <Check size={16} /> : null}
            <span>{isSaved ? 'Đã lưu thay đổi' : 'Lưu thông tin'}</span>
          </button>
        </div>
      </div>

      {/* App Preferences */}
      <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2>Tùy Chọn Giao Diện & Hệ Thống</h2>

        {/* Theme Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color-subtle)' }}>
          <div>
            <strong style={{ fontSize: 14 }}>Chế độ hiển thị (Theme)</strong>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>Chuyển đổi giữa nền sáng và nền tối bảo vệ mắt.</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn btn-sm ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => confirmAction('Bạn có muốn cập nhật giao diện sáng?', () => updateSettings({ theme: 'light' }))}
            >
              <Sun size={14} /> Sáng
            </button>
            <button
              className={`btn btn-sm ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => confirmAction('Bạn có muốn cập nhật giao diện tối?', () => updateSettings({ theme: 'dark' }))}
            >
              <Moon size={14} /> Tối
            </button>
          </div>
        </div>

        {/* Currency & Date Format */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label>
            Đơn vị tiền tệ
            <select
              className="input select"
              value={settings.currency}
              onChange={e => confirmSettingsUpdate('Bạn có muốn cập nhật đơn vị tiền tệ?', { currency: e.target.value as any })}
            >
              <option value="VND">VND (₫ - Đồng Việt Nam)</option>
              <option value="USD">USD ($ - Dollar Mỹ)</option>
            </select>
          </label>

          <label>
            Định dạng ngày tháng
            <select
              className="input select"
              value={settings.dateFormat}
              onChange={e => confirmSettingsUpdate('Bạn có muốn cập nhật định dạng ngày?', { dateFormat: e.target.value as any })}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Việt Nam)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (Quốc tế)</option>
            </select>
          </label>
        </div>

        {/* Daily Goals Setting */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label>
            Mục tiêu giờ học mỗi ngày (giờ)
            <input
              className="input"
              type="number"
              min="1"
              value={settings.dailyGoals.studyHours}
              onChange={e => confirmSettingsUpdate('Bạn có muốn cập nhật mục tiêu học tập?', {
                dailyGoals: { ...settings.dailyGoals, studyHours: Number(e.target.value) || 2 }
              })}
            />
          </label>

          <label>
            Mục tiêu số task hoàn thành / ngày
            <input
              className="input"
              type="number"
              min="1"
              value={settings.dailyGoals.taskCount}
              onChange={e => confirmSettingsUpdate('Bạn có muốn cập nhật mục tiêu công việc?', {
                dailyGoals: { ...settings.dailyGoals, taskCount: Number(e.target.value) || 3 }
              })}
            />
          </label>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2>Quản Lý Dữ Liệu & Sao Lưu</h2>
        <p className="muted" style={{ margin: 0 }}>
          Dữ liệu của LifeFlow được lưu trữ an toàn trong trình duyệt (localStorage) của bạn. Hãy chủ động sao lưu định kỳ.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={handleExportJSON}>
            <Download size={15} /> Xuất file sao lưu (JSON)
          </button>

          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} /> Khôi phục từ file (JSON)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleImportJSON}
          />

          <button className="btn btn-secondary" onClick={handleResetDemoData}>
            <RefreshCw size={15} /> Tải lại dữ liệu mẫu Demo
          </button>

          <button className="btn btn-danger" onClick={handleClearAllData}>
            <Trash2 size={15} /> Xóa sạch dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
}
