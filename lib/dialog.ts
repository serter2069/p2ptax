/**
 * Imperative dialog API — replaces React Native's Alert.alert.
 *
 * Why: Alert.alert on web renders as `window.alert` / `window.confirm`,
 * which can't be themed and blocks the JS thread. Our DialogHost (mounted
 * once in app/_layout.tsx) subscribes to this manager and renders a styled
 * Modal instead. Promise-based so callers can `await dialog.confirm(...)`.
 *
 * Usage:
 *   import { dialog } from "@/lib/dialog";
 *   await dialog.alert({ title: "Готово", message: "Сохранено" });
 *   const ok = await dialog.confirm({
 *     title: "Удалить?",
 *     message: "Это нельзя отменить",
 *     confirmLabel: "Удалить",
 *     destructive: true,
 *   });
 */

type DialogKind = "alert" | "confirm";

export interface DialogOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Optional accent — renders an icon at the top of the dialog.
   *  'success' → green CheckCircle, 'warning' → orange AlertTriangle. */
  tone?: "success" | "warning";
}

export interface DialogRequest extends DialogOptions {
  kind: DialogKind;
  resolve: (value: boolean) => void;
}

type Listener = (req: DialogRequest) => void;

class DialogManager {
  private listeners: Listener[] = [];

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(req: DialogRequest) {
    if (this.listeners.length === 0) {
      // No host mounted — fall back to logging the request and resolving
      // false so callers don't hang. In practice the host is always present.
      // eslint-disable-next-line no-console
      console.warn("[dialog] no host mounted; auto-dismissing", req);
      req.resolve(false);
      return;
    }
    // Fan out to every listener (usually exactly one — the singleton host).
    for (const l of this.listeners) l(req);
  }

  alert(opts: DialogOptions): Promise<void> {
    return new Promise((resolve) => {
      this.emit({ ...opts, kind: "alert", resolve: () => resolve() });
    });
  }

  confirm(opts: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.emit({ ...opts, kind: "confirm", resolve });
    });
  }
}

export const dialog = new DialogManager();
