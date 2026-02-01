import { Injectable, signal } from '@angular/core';

interface SoundBank {
  uiClick: AudioBuffer | null;
  detection: AudioBuffer | null;
  success: AudioBuffer | null;
  contain: AudioBuffer | null;
  staticLoop: AudioBuffer | null;
  interactionHum: AudioBuffer | null;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private sounds: SoundBank = {
    uiClick: null,
    detection: null,
    success: null,
    contain: null,
    staticLoop: null,
    interactionHum: null,
  };
  private staticSource: AudioBufferSourceNode | null = null;
  private isStaticPlaying = false;

  isInitialized = signal(false);

  constructor() {}

  async init() {
    if (this.audioContext) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load all sounds in parallel
      await Promise.all([
        this.loadSound('uiClick', 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'),
        this.loadSound('detection', 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAAAAAAAAAAAAAAAAAAAAAD//w=='),
        this.loadSound('success', 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAAAAAAAAAAAAAAAAAAAAAD//w=='),
        this.loadSound('contain', 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAAAAAAAAAAAAAAAAAAAAAD//w=='),
        this.loadSound('staticLoop', 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAAAAAAAAAAAAAAAAAAAAAD//w=='),
        this.loadSound('interactionHum', 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAAAAAAAAAAAAAAAAAAAAAD//w=='),
      ]);

      this.isInitialized.set(true);
    } catch (e) {
      console.error('Failed to initialize audio context:', e);
    }
  }

  private async loadSound(name: keyof SoundBank, url: string): Promise<void> {
    if (!this.audioContext) return;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds[name] = audioBuffer;
        } catch (e) {
          console.error(`Failed to load sound: ${name}`, e);
        }
      }
    
      updateStaticLevel(level: number) {
        if (!this.audioContext || !this.staticSource) return;
        // Adjust gain based on EMF level
        const gain = this.staticSource.context.createGain();
        gain.gain.value = (level / 100) * 0.5; // Max 50% volume
      }
    
      playUISound() {
        this.playSound('uiClick', 0.5);
      }
    
      playDetectionSound() {
        this.playSound('detection', 0.8);
      }
    
      private playSound(name: keyof SoundBank, gain: number) {
        if (!this.audioContext || !this.sounds[name]) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = gain;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
      }
    }
    