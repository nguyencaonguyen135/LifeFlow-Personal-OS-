import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, LockKeyhole, Sparkles, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AuthPage() {
  const { login, register, getRememberedCredentials, setRememberedCredentials } = useAuthStore();
  const rememberedCredentials = getRememberedCredentials();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => rememberedCredentials.email);
  const [password, setPassword] = useState(() => rememberedCredentials.password);
  const [rememberAccount, setRememberAccount] = useState(() => Boolean(rememberedCredentials.email && rememberedCredentials.password));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = mode === 'login'
      ? await login(email, password)
      : await register(name, email, password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Không thể thực hiện thao tác.');
      return;
    }
    if (mode === 'login') setRememberedCredentials(email, password, rememberAccount);
  };

  return (
    <main className="auth-page">
      <section className="auth-card card">
        <div className="auth-brand"><span className="auth-logo">✦</span><div><strong>LifeFlow</strong><small>Personal OS</small></div></div>
        <div className="auth-icon"><Sparkles size={22} /></div>
        <span className="eyebrow">{mode === 'login' ? 'CHÀO MỪNG TRỞ LẠI' : 'BẮT ĐẦU HÀNH TRÌNH'}</span>
        <h1>{mode === 'login' ? 'Đăng nhập LifeFlow' : 'Tạo tài khoản mới'}</h1>
        <p className="muted">{mode === 'login' ? 'Tiếp tục quản lý cuộc sống theo cách của bạn.' : 'Lưu lại mục tiêu, thói quen và kế hoạch mỗi ngày.'}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && <label>Họ và tên<input className="input" value={name} onChange={event => setName(event.target.value)} placeholder="Nguyễn Văn A" autoComplete="name" /></label>}
          <label>Email<input className="input" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
          <label>Mật khẩu<input className="input" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {mode === 'login' && (
            <label className="auth-remember">
              <input type="checkbox" checked={rememberAccount} onChange={event => setRememberAccount(event.target.checked)} />
              <span>Ghi nhớ cả tài khoản và mật khẩu</span>
            </label>
          )}
          {mode === 'login' && rememberAccount && <small className="auth-security-note">Mật khẩu sẽ được lưu trên thiết bị này. Không bật tùy chọn này trên máy dùng chung.</small>}
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-primary auth-submit" disabled={isSubmitting}>{mode === 'login' ? <LockKeyhole size={16} /> : <UserPlus size={16} />}{isSubmitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}<ArrowRight size={16} /></button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </section>
    </main>
  );
}
