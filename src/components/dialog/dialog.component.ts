import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../services/dialog.service';
import { HapticService } from '../../services/haptic.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dialog.getState()().isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="cancel()"></div>

        <!-- Dialog -->
        <div class="relative bg-gray-900 border-2 rounded-lg shadow-2xl max-w-md w-full transform animate-slide-up"
             [class.border-blue-500]="dialog.getState()().type === 'info'"
             [class.border-yellow-500]="dialog.getState()().type === 'warning'"
             [class.border-red-500]="dialog.getState()().type === 'danger'"
             [class.border-green-500]="dialog.getState()().type === 'success'">

          <!-- Header -->
          <div class="p-4 border-b"
               [class.border-blue-500/30]="dialog.getState()().type === 'info'"
               [class.border-yellow-500/30]="dialog.getState()().type === 'warning'"
               [class.border-red-500/30]="dialog.getState()().type === 'danger'"
               [class.border-green-500/30]="dialog.getState()().type === 'success'">
            <div class="flex items-center gap-3">
              <!-- Icon -->
              @switch (dialog.getState()().type) {
                @case ('warning') {
                  <svg class="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                }
                @case ('danger') {
                  <svg class="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                }
                @case ('success') {
                  <svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                }
                @default {
                  <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                }
              }
              <h3 class="text-lg font-bold text-white">{{ dialog.getState()().title }}</h3>
            </div>
          </div>

          <!-- Body -->
          <div class="p-4">
            <p class="text-gray-300">{{ dialog.getState()().message }}</p>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-gray-700 flex gap-3 justify-end">
            <button
              (click)="cancel()"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              {{ dialog.getState()().cancelText }}
            </button>
            <button
              (click)="confirm()"
              class="px-4 py-2 text-white rounded-lg transition-colors"
              [class.bg-blue-600]="dialog.getState()().type === 'info'"
              [class.hover:bg-blue-500]="dialog.getState()().type === 'info'"
              [class.bg-yellow-600]="dialog.getState()().type === 'warning'"
              [class.hover:bg-yellow-500]="dialog.getState()().type === 'warning'"
              [class.bg-red-600]="dialog.getState()().type === 'danger'"
              [class.hover:bg-red-500]="dialog.getState()().type === 'danger'"
              [class.bg-green-600]="dialog.getState()().type === 'success'"
              [class.hover:bg-green-500]="dialog.getState()().type === 'success'">
              {{ dialog.getState()().confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    @keyframes slide-up {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .animate-slide-up {
      animation: slide-up 0.2s ease-out;
    }
  `]
})
export class DialogComponent {
  dialog = inject(DialogService);
  private haptic = inject(HapticService);

  confirm() {
    this.haptic.light();
    this.dialog.handleConfirm();
  }

  cancel() {
    this.haptic.light();
    this.dialog.handleCancel();
  }
}
