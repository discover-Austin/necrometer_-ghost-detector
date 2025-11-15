import { Injectable, signal } from '@angular/core';

export interface DialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

export interface DialogState extends DialogConfig {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogState = signal<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info'
  });

  getState() {
    return this.dialogState;
  }

  async confirm(config: DialogConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogState.set({
        isOpen: true,
        ...config,
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        type: config.type || 'info',
        resolve
      });
    });
  }

  handleConfirm() {
    const state = this.dialogState();
    if (state.resolve) {
      state.resolve(true);
    }
    this.close();
  }

  handleCancel() {
    const state = this.dialogState();
    if (state.resolve) {
      state.resolve(false);
    }
    this.close();
  }

  private close() {
    this.dialogState.update(state => ({ ...state, isOpen: false }));
  }
}
