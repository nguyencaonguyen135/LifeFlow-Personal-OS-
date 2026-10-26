import { AlertTriangle, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface ConfirmRequest {
  message: string;
  onConfirm: () => void;
}

export const CONFIRM_EVENT = 'lifeflow:confirm';

export function confirmAction(message: string, onConfirm?: () => void): boolean {
  if (typeof window === 'undefined') return false;
  if (!onConfirm) return window.confirm(message);
  window.dispatchEvent(new CustomEvent<ConfirmRequest>(CONFIRM_EVENT, {
    detail: { message, onConfirm }
  }));
  return true;
}

export default function ConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    const handleRequest = (event: Event) => {
      setRequest((event as CustomEvent<ConfirmRequest>).detail);
    };
    window.addEventListener(CONFIRM_EVENT, handleRequest);
    return () => window.removeEventListener(CONFIRM_EVENT, handleRequest);
  }, []);

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRequest(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request]);

  if (!request) return null;

  const isDelete = /xóa|xoá|xóa sạch/i.test(request.message);
  const close = () => setRequest(null);
  const confirm = () => {
    request.onConfirm();
    close();
  };

  return (
    <div className="confirm-backdrop" onMouseDown={event => event.currentTarget === event.target && close()}>
      <div className={`confirm-dialog card ${isDelete ? 'confirm-danger' : 'confirm-update'}`} role="alertdialog" aria-modal="true">
        <button className="confirm-close" onClick={close} aria-label="Đóng"><X size={17} /></button>
        <div className="confirm-icon">{isDelete ? <AlertTriangle size={25} /> : <Check size={25} />}</div>
        <span className="confirm-kicker">{isDelete ? 'XÁC NHẬN XÓA' : 'XÁC NHẬN CẬP NHẬT'}</span>
        <h2>{isDelete ? 'Bạn chắc chắn chứ?' : 'Xác nhận thay đổi'}</h2>
        <p>{request.message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={close}>Để sau</button>
          <button className={`btn ${isDelete ? 'btn-danger' : 'btn-primary'}`} onClick={confirm}>{isDelete ? 'Xóa ngay' : 'Xác nhận'}</button>
        </div>
      </div>
    </div>
  );
}
