// Toast notification system — event-based, no external deps
// Usage: import { toast } from '@/lib/toast'; toast.error('msg');

type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type ToastListener = (msg: ToastMessage) => void;
type DismissListener = (id: string) => void;

const showListeners: ToastListener[] = [];
const dismissListeners: DismissListener[] = [];

let counter = 0;

function show(type: ToastType, message: string): string {
  const id = `toast-${++counter}-${Date.now()}`;
  const msg: ToastMessage = { id, type, message };
  showListeners.forEach((l) => l(msg));
  return id;
}

function dismiss(id: string) {
  dismissListeners.forEach((l) => l(id));
}

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
  dismiss,
  /** @internal */
  onShow(listener: ToastListener): () => void {
    showListeners.push(listener);
    return () => {
      const idx = showListeners.indexOf(listener);
      if (idx !== -1) showListeners.splice(idx, 1);
    };
  },
  /** @internal */
  onDismiss(listener: DismissListener): () => void {
    dismissListeners.push(listener);
    return () => {
      const idx = dismissListeners.indexOf(listener);
      if (idx !== -1) dismissListeners.splice(idx, 1);
    };
  },
};
