import { Injectable } from '@angular/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private staticGainNode: GainNode | null = null;
  private staticSource: AudioBufferSourceNode | null = null;
  private isInitialized = false;
  private isStaticPlaying = false;
  private lastRecordedBlob: Blob | null = null;

  private sounds: { [key: string]: AudioBuffer | null } = {
    uiClick: null,
    detection: null,
    success: null,
    contain: null,
    staticLoop: null,
    interactionHum: null,
  };

  private async loadSound(url: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`Failed to load sound: ${url}`, error);
      return null;
    }
  }

  async startRecording(): Promise<void> {
    const permission = await VoiceRecorder.requestAudioRecordingPermission();
    if (!permission.value) {
      throw new Error('Microphone permission denied');
    }
    const canRecord = await VoiceRecorder.canDeviceVoiceRecord();
    if (!canRecord.value) {
      throw new Error('Voice recording is not supported on this device');
    }
    await VoiceRecorder.startRecording();
  }

  async stopRecording(): Promise<Blob> {
    const result = await VoiceRecorder.stopRecording();
    const data = result.value?.recordDataBase64;
    const mimeType = result.value?.mimeType || 'audio/wav';
    if (!data) {
      throw new Error('Recording failed to produce audio data');
    }
    const blob = this.base64ToBlob(data, mimeType);
    this.lastRecordedBlob = blob;
    return blob;
  }

  async uploadToTranscribe(blob: Blob, endpoint: string): Promise<{ transcript: string }> {
    const audioBase64 = await this.blobToBase64(blob);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        mimeType: blob.type || 'audio/wav',
      }),
    });
    if (response.status === 501) {
      const data = await response.json().catch(() => ({}));
      if (data?.error === 'TRANSCRIPTION_NOT_CONFIGURED') {
        throw new Error('Transcription not configured');
      }
    }
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status} ${await response.text()}`);
    }
    return response.json();
  }

  getLastRecordedBlob(): Blob | null {
    return this.lastRecordedBlob;
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  async init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    // Audio context must be created after a user gesture
    this.audioContext = new AudioContext();
    this.isInitialized = true;

    // Load all sounds using base64 data URIs to avoid CORS issues
    this.sounds.uiClick = await this.loadSound('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAADQBEADgASwBHAEUARgA+ADwAOwA6ADcANgA1ADcANwA4ADgAOQA6ADsAPAA+AEAAQgBDAEUA');
    this.sounds.detection = await this.loadSound('data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVwAAAAAQz9APz09Ozc3NjQzMjAxMC8uLSwrKikoJyYlJCMhICAfHh0cGhsaFhUTERAQDw4NDAsKCQgHBgUEAwIBAAAA/v/5+fn49/f39fX18/Pz7+/v6+vr5+fn4+Pj3t7e2dnZ1dXV0tLSz8/Py8vLycnJxsbGxcXFw8PDu7u7srKyq6urpqampaWlpKSkoaGhoKCgn5+fnZ2dnJycm5ubmZmZl5eXlpaWk5OTkpKSkZGRj4+Pjo6OjY2NjIyMi4uLiYmJh4eHhoaGg4ODgoKCgYGBgICAf39/fX19fHx8e3t7enp6eXl5eHh4d3d3dXV1dHR0c3NzcXFxcHBwb29vbm5ubW1tbGxsampqaWlpaGhoZ2dnZmZmW1tbWlpaWVlZWFhYV1dXVVVVUlJS');
    this.sounds.success = await this.loadSound('data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUgAAACAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgIDAwMDAgID');
    this.sounds.contain = await this.loadSound('data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVwAAAAAMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM=');
    this.sounds.staticLoop = await this.loadSound('data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUgAAACgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCg==');
    this.sounds.interactionHum = await this.loadSound('data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVIAAAAAPz9AQEBAPz8/Pz8/Pj49PTw8PDs7Ozo6Ojk5OTg4ODc3NjY2NTU1NDQzMzIyMjExMTAwLy8uLSwrKyoqKSkoKCcnJyMTExMjIyMzM0NDU1NjY3Nzg4OTk6Ojs8PD09Pj4/P0BA');
  }

  private playSound(buffer: AudioBuffer | null, gain = 1.0) {
    if (!this.audioContext || !buffer) return;
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    source.buffer = buffer;
    gainNode.gain.value = gain;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }
  
  private startStatic() {
     if (!this.audioContext || this.isStaticPlaying || !this.sounds.staticLoop) return;
      this.staticSource = this.audioContext.createBufferSource();
      this.staticSource.buffer = this.sounds.staticLoop;
      this.staticSource.loop = true;
      this.staticGainNode = this.audioContext.createGain();
      this.staticSource.connect(this.staticGainNode);
      this.staticGainNode.connect(this.audioContext.destination);
      this.staticSource.start(0);
      this.isStaticPlaying = true;
  }
  
  playUISound() {
    this.playSound(this.sounds.uiClick, 0.5);
  }

  playDetectionSound() {
    this.playSound(this.sounds.detection, 0.8);
  }

  playSuccessSound() {
    this.playSound(this.sounds.success);
  }

  playContainSound() {
    this.playSound(this.sounds.contain);
  }

  playInteractionHum() {
    this.playSound(this.sounds.interactionHum, 0.3);
  }

  updateStaticLevel(emfReading: number) {
    if (!this.isInitialized) {
        this.init().then(() => this.updateStaticLevel(emfReading));
        return;
    }
    
    if (!this.isStaticPlaying) {
        this.startStatic();
    }

    if (this.staticGainNode && this.audioContext) {
      // Map EMF reading (0-100) to a pleasant volume level (0 to ~0.4)
      const maxVolume = 0.4;
      const targetVolume = (emfReading / 100) * maxVolume;
      // Use setTargetAtTime for smooth volume transitions
      this.staticGainNode.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.1);
    }
  }
}
