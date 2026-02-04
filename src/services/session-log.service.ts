import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { EnvironmentService } from './environment.service';
import { DeviceStateService } from './device-state.service';
import { SpiritBoxService, SpiritBoxWord } from './spirit-box.service';
import { EmfLogService } from './emf-log.service';
import { SensorService } from './sensor.service';

export interface SessionEvent {
  type: 'emf_spike' | 'motion' | 'word';
  timestamp: number;
  detail: string;
  intensity: number;
}

export interface SessionSummary {
  id: string;
  startedAt: number;
  endedAt?: number;
  peakEmf: number;
  events: SessionEvent[];
  words: SpiritBoxWord[];
}

@Injectable({
  providedIn: 'root',
})
export class SessionLogService {
  private env = inject(EnvironmentService);
  private deviceState = inject(DeviceStateService);
  private spiritBox = inject(SpiritBoxService);
  private emfLog = inject(EmfLogService);
  private sensorService = inject(SensorService);
  private readonly storageKey = 'sessions';

  currentSession = signal<SessionSummary | null>(null);
  sessions = signal<SessionSummary[]>([]);

  sessionActive = computed(() => this.currentSession() !== null);

  private sessionInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadSessions();
    effect(() => {
      this.saveSessions();
    });
  }

  startSession(): void {
    if (this.currentSession()) return;
    const session: SessionSummary = {
      id: `session-${Date.now()}`,
      startedAt: Date.now(),
      peakEmf: 0,
      events: [],
      words: [],
    };
    this.currentSession.set(session);
    this.spiritBox.start();
    this.emfLog.start();
    this.startSessionWatcher();
  }

  endSession(): void {
    const session = this.currentSession();
    if (!session) return;
    const endedSession: SessionSummary = {
      ...session,
      endedAt: Date.now(),
    };
    this.sessions.update(list => [endedSession, ...list].slice(0, 20));
    this.currentSession.set(null);
    this.spiritBox.stop();
    this.emfLog.stop();
    this.stopSessionWatcher();
  }

  addEvent(event: SessionEvent): void {
    const session = this.currentSession();
    if (!session) return;
    session.events.unshift(event);
  }

  private startSessionWatcher(): void {
    if (this.sessionInterval) return;
    this.sessionInterval = setInterval(() => {
      const session = this.currentSession();
      if (!session) return;

      const emf = this.deviceState.emfReading();
      const stability = this.sensorService.stabilityScore();
      session.peakEmf = Math.max(session.peakEmf, emf);

      if (emf > 65) {
        session.events.unshift({
          type: 'emf_spike',
          timestamp: Date.now(),
          detail: 'Magnetic field anomaly registered',
          intensity: Math.min(1, emf / 100),
        });
      }

      if (stability < 0.6) {
        session.events.unshift({
          type: 'motion',
          timestamp: Date.now(),
          detail: 'Motion interference detected',
          intensity: 1 - stability,
        });
      }

      const latestWord = this.spiritBox.latestWord();
      if (latestWord && !session.words.find(word => word.timestamp === latestWord.timestamp)) {
        session.words.unshift(latestWord);
        session.events.unshift({
          type: 'word',
          timestamp: latestWord.timestamp,
          detail: `Spirit box emitted “${latestWord.word}”`,
          intensity: latestWord.intensity,
        });
      }

      session.events = session.events.slice(0, 80);
      session.words = session.words.slice(0, 30);
      this.currentSession.set({
        ...session,
        events: [...session.events],
        words: [...session.words],
      });
    }, 2500);
  }

  private stopSessionWatcher(): void {
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval);
      this.sessionInterval = null;
    }
  }

  getCurrentSummary(): SessionSummary | null {
    const session = this.currentSession();
    if (!session) return null;
    return {
      ...session,
      peakEmf: Math.max(session.peakEmf, this.deviceState.highestEmf()),
    };
  }

  private loadSessions(): void {
    const stored = this.env.getStorageItem(this.storageKey);
    if (!stored) return;
    try {
      this.sessions.set(JSON.parse(stored));
    } catch {
      this.sessions.set([]);
    }
  }

  private saveSessions(): void {
    this.env.setStorageItem(this.storageKey, JSON.stringify(this.sessions()));
  }
}
