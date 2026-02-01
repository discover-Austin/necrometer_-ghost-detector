import { Injectable, inject, signal } from '@angular/core';
import { LoggerService } from './logger.service';
import { GeolocationService, LocationData } from './geolocation.service';
import { DetectedEntity } from '../types';
import { EnvironmentService } from './environment.service';

export interface InvestigationSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  location?: LocationData;
  detections: DetectedEntity[];
  notes: string;
  isActive: boolean;
}

/**
 * Investigation session manager
 * Manages paranormal investigation sessions with tracking and analytics
 */
@Injectable({
  providedIn: 'root'
})
export class InvestigationSessionService {
  private logger = inject(LoggerService);
  private geolocation = inject(GeolocationService);
  private env = inject(EnvironmentService);

  currentSession = signal<InvestigationSession | null>(null);
  sessions = signal<InvestigationSession[]>([]);
  private readonly STORAGE_KEY = 'necrometer.sessions';

  constructor() {
    this.loadSessions();
  }

  /**
   * Start a new investigation session
   */
  async startSession(name?: string): Promise<InvestigationSession> {
    // End current session if active
    if (this.currentSession()) {
      await this.endSession();
    }

    const location = await this.geolocation.getCurrentPosition();

    const session: InvestigationSession = {
      id: `session-${Date.now()}`,
      name: name || `Investigation ${new Date().toLocaleString()}`,
      startTime: Date.now(),
      location: location || undefined,
      detections: [],
      notes: '',
      isActive: true
    };

    this.currentSession.set(session);
    this.logger.info('Investigation session started', session);

    return session;
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    const session = this.currentSession();
    if (!session) return;

    session.endTime = Date.now();
    session.isActive = false;

    // Add to sessions list
    this.sessions.update(sessions => [...sessions, session]);
    this.saveSessions();

    this.logger.info('Investigation session ended', {
      sessionId: session.id,
      duration: session.endTime - session.startTime,
      detections: session.detections.length
    });

    this.currentSession.set(null);
  }

  /**
   * Add detection to current session
   */
  addDetection(entity: DetectedEntity): void {
    const session = this.currentSession();
    if (!session) {
      this.logger.warn('No active session to add detection to');
      return;
    }

    session.detections.push(entity);
    this.logger.debug(`Added detection to session: ${entity.name}`);
  }

  /**
   * Update session notes
   */
  updateNotes(notes: string): void {
    const session = this.currentSession();
    if (!session) return;

    session.notes = notes;
    this.logger.debug('Session notes updated');
  }

  /**
   * Get session statistics
   */
  getSessionStats(session: InvestigationSession): {
    duration: number;
    detectionCount: number;
    containedCount: number;
    avgEMF: number;
    entityTypes: Record<string, number>;
  } {
    const duration = session.endTime
      ? session.endTime - session.startTime
      : Date.now() - session.startTime;

    const containedCount = session.detections.filter(d => d.contained).length;

    const avgEMF = session.detections.length > 0
      ? session.detections.reduce((sum, d) => sum + d.emfReading, 0) / session.detections.length
      : 0;

    const entityTypes: Record<string, number> = {};
    for (const detection of session.detections) {
      entityTypes[detection.type] = (entityTypes[detection.type] || 0) + 1;
    }

    return {
      duration,
      detectionCount: session.detections.length,
      containedCount,
      avgEMF,
      entityTypes
    };
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    this.sessions.update(sessions =>
      sessions.filter(s => s.id !== sessionId)
    );
    this.saveSessions();
    this.logger.info(`Session deleted: ${sessionId}`);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): InvestigationSession[] {
    return this.sessions();
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.set([]);
    this.saveSessions();
    this.logger.info('All sessions cleared');
  }

  /**
   * Save sessions to storage
   */
  private saveSessions(): void {
    this.env.setStorageItem(this.STORAGE_KEY, JSON.stringify(this.sessions()));
  }

  /**
   * Load sessions from storage
   */
  private loadSessions(): void {
    const stored = this.env.getStorageItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const sessions: InvestigationSession[] = JSON.parse(stored);
        this.sessions.set(sessions);
        this.logger.info(`Loaded ${sessions.length} investigation sessions`);
      } catch (error) {
        this.logger.error('Failed to load sessions', error);
      }
    }
  }
}
