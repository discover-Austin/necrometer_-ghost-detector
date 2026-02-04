import { Injectable, signal, inject, effect } from '@angular/core';
import { DeviceStateService } from './device-state.service';
import { SensorService } from './sensor.service';
import { EnvironmentService } from './environment.service';

export interface EmfLogEntry {
  timestamp: number;
  emf: number;
  motionStability: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmfLogService {
  private deviceState = inject(DeviceStateService);
  private sensorService = inject(SensorService);
  private env = inject(EnvironmentService);
  private readonly storageKey = 'emf.log';

  entries = signal<EmfLogEntry[]>([]);

  private logInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadEntries();
    effect(() => {
      this.saveEntries();
    });
  }

  start(): void {
    if (this.logInterval) return;
    this.logInterval = setInterval(() => {
      this.addEntry();
    }, 2000);
  }

  stop(): void {
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }
  }

  addEntry(): void {
    const entry: EmfLogEntry = {
      timestamp: Date.now(),
      emf: this.deviceState.emfReading(),
      motionStability: this.sensorService.stabilityScore(),
    };
    this.entries.update(entries => [entry, ...entries].slice(0, 120));
  }

  getPeak(): number {
    return this.entries().reduce((max, entry) => Math.max(max, entry.emf), 0);
  }

  clear(): void {
    this.entries.set([]);
  }

  private loadEntries(): void {
    const stored = this.env.getStorageItem(this.storageKey);
    if (!stored) return;
    try {
      this.entries.set(JSON.parse(stored));
    } catch {
      this.entries.set([]);
    }
  }

  private saveEntries(): void {
    this.env.setStorageItem(this.storageKey, JSON.stringify(this.entries()));
  }
}
