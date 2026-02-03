import { Injectable, signal, effect, inject, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Schedule } from '../types';
import { PersistenceService } from './persistence.service';
import { LoggerService } from './logger.service';

// rrule is an optional dependency; load dynamically to avoid build-time failure when absent
type RRuleStr = (str: string) => { after: (date: Date, inc: boolean) => Date | null };
let rrulestr: RRuleStr | undefined = undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const rrulePkg = require('rrule');
  rrulestr = rrulePkg.rrulestr || rrulePkg.RRule && rrulePkg.rrulestr;
} catch (e) {
  // rrule not available; recurrence via rrule will be disabled
  rrulestr = undefined;
}

const SCHEDULES_STORAGE_KEY = 'necrometer_schedules_v1';

interface InternalSchedule extends Schedule {
  timerId?: ReturnType<typeof setTimeout>;
}

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private persistence = inject(PersistenceService);
  private logger = inject(LoggerService);

  private schedules = signal<InternalSchedule[]>(this.loadSchedules());
  private jobSubject = new BehaviorSubject<{ schedule: Schedule; firedAt: Date } | null>(null);

  public jobs$: Observable<{ schedule: Schedule; firedAt: Date } | null> = this.jobSubject.asObservable();

  constructor() {
    // Persist schedules whenever they change
    effect(() => {
      this.saveSchedules();
      // Refresh timers when schedules mutate
      this.refreshAllTimers();
    });
  }

  list(): Schedule[] {
    return this.schedules();
  }

  create(schedule: Schedule) {
    const s: InternalSchedule = { ...schedule };
    if (!s.id) s.id = this.generateId();
    if (s.enabled === undefined) s.enabled = true;
    this.schedules.update(arr => [s, ...arr]);
    return s;
  }

  update(id: string, patch: Partial<Schedule>) {
    this.schedules.update(arr => arr.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  remove(id: string) {
    this.schedules.update(arr => arr.filter(s => s.id !== id));
  }

  private saveSchedules() {
    try {
      const raw = JSON.stringify(this.schedules());
      localStorage.setItem(SCHEDULES_STORAGE_KEY, raw);
    } catch (e) {
      this.logger.error('Failed to save schedules', e);
    }
  }

  private loadSchedules(): InternalSchedule[] {
    try {
      const raw = localStorage.getItem(SCHEDULES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as InternalSchedule[];
      return parsed.map(s => ({ ...s }));
    } catch (e) {
      this.logger.error('Failed to load schedules', e);
      localStorage.removeItem(SCHEDULES_STORAGE_KEY);
      return [];
    }
  }

  private refreshAllTimers() {
    // Clear existing timers
    const items = this.schedules();
    items.forEach(s => {
      if (s.timerId) {
        clearTimeout(s.timerId);
        delete s.timerId;
      }
    });

    // Schedule next run for enabled schedules
    items.forEach(s => {
      if (!s.enabled) return;
      const next = this.computeNextRun(s);
      if (!next) return;
      const delay = Math.max(0, next.getTime() - Date.now());
      s.timerId = setTimeout(() => this.fireSchedule(s.id), delay);
      s.nextRun = next.toISOString();
    });
    // store back the updated items
    this.schedules.set(items);
  }

  private computeNextRun(s: InternalSchedule): Date | null {
    if (s.rrule) {
      try {
        if (!rrulestr) throw new Error('rrule not available');
        // Try parsing either as an RRULE string or full RFC string
        const rule = rrulestr(s.rrule);
        const after = new Date();
        const next = rule.after(after, false);
        return next ?? null;
      } catch (e) {
        this.logger.warn('Invalid rrule for schedule', s.id, e);
      }
    }

    if (s.intervalMs && s.intervalMs > 0) {
      const last = s.lastRun ? new Date(s.lastRun) : null;
      const base = last ?? new Date();
      return new Date(base.getTime() + s.intervalMs);
    }

    return null;
  }

  private fireSchedule(id: string) {
    const found = this.schedules().find(s => s.id === id);
    if (!found) return;
    const firedAt = new Date();
    // update lastRun and clear nextRun until recomputed
    found.lastRun = firedAt.toISOString();
    found.nextRun = undefined;
    this.jobSubject.next({ schedule: { ...found }, firedAt });

    // If rrule or interval exists, compute and schedule next occurrence
    const next = this.computeNextRun(found);
    if (next) {
      const delay = Math.max(0, next.getTime() - Date.now());
      found.timerId = setTimeout(() => this.fireSchedule(found.id), delay);
      found.nextRun = next.toISOString();
    }

    // persist changes
    this.schedules.set(this.schedules());
  }

  private generateId(): string {
    return Math.random().toString(36).slice(2, 10);
  }
}
