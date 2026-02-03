// Legacy types - kept for backwards compatibility with upgrade/store system
export interface EntityProfile {
  name: string;
  type: string;
  backstory: string;
  instability: number; // 0-100 scale
  contained: boolean;
  glyphB64: string;
}

export interface DetectedEntity extends EntityProfile {
  id: number;
  timestamp: Date;
  emfReading: number;
}

// Temporal Echo - historical event that left spiritual residue
export interface TemporalEcho {
  title: string;
  era: string;
  description: string;
}

// EVP (Electronic Voice Phenomenon) analysis result
export interface EVPAnalysis {
  transcription: string;
  confidence: number;
}

// Cross-reference result from spectral database
export interface CrossReferenceResult {
  match: boolean;
  details: string;
}

// Emotional resonance analysis of an entity
export interface EmotionalResonanceResult {
  emotions: string[];
  summary: string;
}

// Containment ritual steps and outcome
export interface ContainmentRitual {
  steps: string[];
  outcome: string;
}

// Scene analysis result with detected objects
export interface SceneAnalysisResult {
  objects: SceneObject[];
}

// Object detected in scene with polyline outlines
export interface SceneObject {
  name: string;
  polylines: Array<Array<{ x: number; y: number }>>;
}

// Schedule for task scheduling service
export interface Schedule {
  id: string;
  name?: string;
  enabled?: boolean;
  rrule?: string;
  intervalMs?: number;
  lastRun?: string;
  nextRun?: string;
}

// Note: AR overlay features have been removed as part of the rebuild to focus on
// autonomous anomaly detection. See anomaly-detection.service.ts for the new system.
// Scene analysis types (SceneAnalysisResult, SceneObject) are retained for GeminiService
// API functionality, though not currently exposed in the UI.