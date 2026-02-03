import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DeviceStateService } from './device-state.service';
import { EnvironmentService } from './environment.service';
import { LoggerService } from './logger.service';

export interface SpiritBoxWord {
  word: string;
  timestamp: number;
  intensity: number;
}

const DICTIONARY = [
  'whisper',
  'through',
  'signal',
  'behind',
  'silence',
  'listen',
  'cold',
  'north',
  'stay',
  'leave',
  'beneath',
  'close',
  'echo',
  'hold',
  'drift',
  'open',
  'follow',
  'wait',
  'near',
  'lost',
  'return',
  'veil',
  'hollow',
  'memory',
  'trace',
  'still',
  'signal',
];

@Injectable({
  providedIn: 'root',
})
export class SpiritBoxService {
  private deviceState = inject(DeviceStateService);
  private env = inject(EnvironmentService);
  private logger = inject(LoggerService);
  private readonly storageKey = 'spiritBox.words';

  wordLog = signal<SpiritBoxWord[]>([]);
  latestWord = computed(() => this.wordLog()[0] ?? null);
  isActive = signal(true);

  private lastWordAt = 0;
  private wordInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadWords();
    effect(() => {
      this.saveWords();
    });
  }

  start(): void {
    if (this.wordInterval) return;
    this.wordInterval = setInterval(() => {
      if (!this.isActive()) return;
      this.maybeEmitWord();
    }, 1200);
  }

  stop(): void {
    if (this.wordInterval) {
      clearInterval(this.wordInterval);
      this.wordInterval = null;
    }
  }

  private maybeEmitWord(): void {
    const emf = this.deviceState.emfReading();
    const intensity = Math.min(1, emf / 100);
    const now = Date.now();
    const cooldown = 6000 - intensity * 3000;

    if (now - this.lastWordAt < cooldown) {
      return;
    }

    const gate = 0.12 + intensity * 0.4;
    if (Math.random() > gate) {
      return;
    }

    const word = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
    this.wordLog.update(log => [{ word, timestamp: now, intensity }, ...log].slice(0, 40));
    this.lastWordAt = now;
    this.logger.info('Spirit box emitted word', { word, intensity });
  }

  private loadWords(): void {
    const stored = this.env.getStorageItem(this.storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as SpiritBoxWord[];
      this.wordLog.set(parsed);
    } catch (error) {
      this.logger.warn('Failed to load spirit box words', error);
    }
  }

  private saveWords(): void {
    this.env.setStorageItem(this.storageKey, JSON.stringify(this.wordLog()));
  }
}
