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

// Schedule type for scheduler service
export interface Schedule {
  id: string;
  name?: string;
  enabled?: boolean;
  rrule?: string;
  intervalMs?: number;
  lastRun?: string;
  nextRun?: string;
}

// Note: AR, EVP, Temporal Echo, and Scene Analysis features have been removed
// as part of the rebuild to focus on autonomous anomaly detection.
// See anomaly-detection.service.ts for the new anomaly system.

export interface TemporalEcho {
  title: string;
  era: string;
  description: string;
}

export interface EVPAnalysis {
  transcription: string;
  confidence: number;
}

export interface CrossReferenceResult {
  match: boolean;
  details: string;
}

export interface EmotionalResonanceResult {
  emotions: string[];
  summary: string;
}

export interface ContainmentRitual {
  steps: string[];
  outcome: string;
}

export interface SceneAnalysisResult {
  objects: SceneObject[];
}

export interface SceneObject {
  name: string;
  polylines: Array<Array<{ x: number; y: number }>>;
}
