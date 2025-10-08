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

export interface AREntity extends DetectedEntity {
  x: number; // position on screen (percentage)
  y: number;
  vx: number; // velocity
  vy: number;
  ax: number; // acceleration
  ay: number;
  interactionTime?: number; // Timestamp of the last scene interaction
  isInteracting?: boolean; // Flag for a momentary visual effect
  // Optional AR anchoring information tying this entity to a scene object
  anchor?: {
    objectIndex: number;      // index into SceneAnalysisResult.objects
    polylineIndex: number;    // which polyline in that object
    pointIndex: number;       // which point in that polyline
    baseX: number;            // base percent X on screen (0-100)
    baseY: number;            // base percent Y on screen (0-100)
    offsetX: number;          // initial spawn offset from base (percent)
    offsetY: number;          // initial spawn offset from base (percent)
    depth: number;            // simulated relative depth (0.5 near .. 2.0 far)
  };
  // Whether the entity should be visually occluded by a detected scene object this frame
  occluded?: boolean;
  // Rendering helpers computed each frame
  scale?: number;    // visual scale multiplier (1 = default)
  rotation?: number; // small rotation in degrees for natural variance
  bobPhase?: number; // internal phase for breathing/bobbing animation
  // Limb angles (degrees) for simple walking animation
  leftArmAngle?: number;
  rightArmAngle?: number;
  leftLegAngle?: number;
  rightLegAngle?: number;
  // Facial expression parameters
  blink?: number; // 0..1 (0 open, 1 closed)
  mouthOpen?: number; // 0..1 (0 closed, 1 wide open)
  // Soft occlusion level computed per-frame (0 = visible, 1 = fully occluded)
  occlusionLevel?: number;
}

export interface DetectionEvent {
  emf: number;
  strength: 'weak' | 'moderate' | 'strong' | 'critical';
}

export interface EVPAnalysis {
  transcription: string;
  confidence: number;
}

export interface TemporalEcho {
  title: string;
  era: string;
  description: string;
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

export interface SceneObject {
  name: string;
  polylines: { x: number; y: number }[][];
}

export interface SceneAnalysisResult {
  objects: SceneObject[];
}

export interface Schedule {
  id: string;
  name?: string;
  enabled: boolean;
  // RFC5545 RRULE string (e.g. "FREQ=DAILY;INTERVAL=1")
  rrule?: string;
  // Simple fixed interval in milliseconds
  intervalMs?: number;
  // ISO timestamps for next and last run
  nextRun?: string;
  lastRun?: string;
  // Arbitrary payload the scheduler will emit when the job triggers
  payload?: any;
  // Higher numbers run first when multiple jobs are due
  priority?: number;
  timezone?: string; // optional timezone hint (not enforced in this initial impl)
}