import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from './logger.service';

export interface AudioSpectrumSnapshot {
  low: number;
  mid: number;
  high: number;
}

@Injectable({
  providedIn: 'root',
})
export class AudioAnalyzerService {
  private logger = inject(LoggerService);
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;

  spectrum = signal<AudioSpectrumSnapshot>({ low: 0, mid: 0, high: 0 });
  isActive = signal(false);

  async start(): Promise<void> {
    if (this.isActive()) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.logger.warn('Audio analyzer not supported');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      this.isActive.set(true);
      this.startMonitoring();
    } catch (error) {
      this.logger.error('Failed to start audio analyzer', error);
      this.isActive.set(false);
    }
  }

  stop(): void {
    if (!this.isActive()) return;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.stream = null;
    this.isActive.set(false);
  }

  private startMonitoring(): void {
    if (!this.analyser || !this.dataArray) return;
    this.monitorInterval = setInterval(() => {
      if (!this.analyser || !this.dataArray) return;
      this.analyser.getByteFrequencyData(this.dataArray);

      const low = this.averageRange(0, 10) / 255;
      const mid = this.averageRange(10, 25) / 255;
      const high = this.averageRange(25, 40) / 255;

      this.spectrum.set({ low, mid, high });
    }, 300);
  }

  private averageRange(start: number, end: number): number {
    if (!this.dataArray) return 0;
    let sum = 0;
    const length = Math.min(this.dataArray.length, end) - start;
    if (length <= 0) return 0;
    for (let i = start; i < Math.min(this.dataArray.length, end); i++) {
      sum += this.dataArray[i];
    }
    return sum / length;
  }
}
