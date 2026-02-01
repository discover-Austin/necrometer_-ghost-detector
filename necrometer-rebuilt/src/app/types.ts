export interface DetectedEntity {
  id: number;
  timestamp: Date;
  emfReading: number;
  name: string;
  type: string;
  temperament: string;
  abilities: string[];
  historicalContext: string;
  containmentProtocol: string;
  contained: boolean;
  instability: number;
}

export interface AREntity extends DetectedEntity {
  x: number; // position on screen (percentage)
  y: number;
  vx: number; // velocity
  vy: number;
  ax: number; // acceleration
  ay: number;
  interactionTime?: number; 
  isInteracting?: boolean; 
  anchor?: {
    objectIndex: number;
    polylineIndex: number;
    pointIndex: number;
    baseX: number;
    baseY: number;
    offsetX: number;
    offsetY: number;
    depth: number;
  };
  occluded?: boolean;
  scale?: number;
  rotation?: number;
  bobPhase?: number;
  leftArmAngle?: number;
  rightArmAngle?: number;
  leftLegAngle?: number;
  rightLegAngle?: number;
  blink?: number;
  mouthOpen?: number;
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
  period: string;
  event: string;
  feeling: string;
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
  confidence: number;
}