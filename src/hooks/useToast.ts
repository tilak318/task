import { useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
}

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

class ToastManager {
  private static instance: ToastManager;
  private listeners: Set<(state: ToastState) => void> = new Set();
  private state: ToastState = { toasts: [] };
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private removeToast(id: string): void {
    this.state.toasts = this.state.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
    
    // Clear timeout if exists
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }

  private addToast(toast: Toast): void {
    const id = this.generateId();
    const newToast = { ...toast, id };
    
    this.state.toasts = [newToast, ...this.state.toasts];
    this.notifyListeners();

    // Auto-dismiss after duration
    const duration = toast.duration || 5000;
    if (duration > 0) {
      const timeout = setTimeout(() => {
        this.removeToast(id);
      }, duration);
      this.timeouts.set(id, timeout);
    }
  }

  subscribe(listener: (state: ToastState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state); // Initial call
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  success(title: string, description?: string, options?: ToastOptions): void {
    this.addToast({
      type: 'success',
      title,
      description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  }

  error(title: string, description?: string, options?: ToastOptions): void {
    this.addToast({
      type: 'error',
      title,
      description,
      duration: options?.duration || 7000,
      action: options?.action,
    });
  }

  warning(title: string, description?: string, options?: ToastOptions): void {
    this.addToast({
      type: 'warning',
      title,
      description,
      duration: options?.duration || 6000,
      action: options?.action,
    });
  }

  info(title: string, description?: string, options?: ToastOptions): void {
    this.addToast({
      type: 'info',
      title,
      description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  dismiss(id: string): void {
    this.removeToast(id);
  }

  dismissAll(): void {
    this.state.toasts = [];
    this.notifyListeners();
    
    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}

export const useToast = () => {
  const [state, setState] = useState<ToastState>({ toasts: [] });
  const managerRef = useRef<ToastManager>();

  if (!managerRef.current) {
    managerRef.current = ToastManager.getInstance();
  }

  const manager = managerRef.current;

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  const toast = useCallback({
    success: (title: string, description?: string, options?: ToastOptions) => {
      manager.success(title, description, options);
    },
    error: (title: string, description?: string, options?: ToastOptions) => {
      manager.error(title, description, options);
    },
    warning: (title: string, description?: string, options?: ToastOptions) => {
      manager.warning(title, description, options);
    },
    info: (title: string, description?: string, options?: ToastOptions) => {
      manager.info(title, description, options);
    },
    dismiss: (id: string) => {
      manager.dismiss(id);
    },
    dismissAll: () => {
      manager.dismissAll();
    },
  }, [manager]);

  return {
    toasts: state.toasts,
    toast,
  };
};

// Convenience functions for direct usage
export const toast = {
  success: (title: string, description?: string, options?: ToastOptions) => {
    ToastManager.getInstance().success(title, description, options);
  },
  error: (title: string, description?: string, options?: ToastOptions) => {
    ToastManager.getInstance().error(title, description, options);
  },
  warning: (title: string, description?: string, options?: ToastOptions) => {
    ToastManager.getInstance().warning(title, description, options);
  },
  info: (title: string, description?: string, options?: ToastOptions) => {
    ToastManager.getInstance().info(title, description, options);
  },
  dismiss: (id: string) => {
    ToastManager.getInstance().dismiss(id);
  },
  dismissAll: () => {
    ToastManager.getInstance().dismissAll();
  },
}; 