import { Component, ChangeDetectionStrategy, signal, ViewChild, ElementRef, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { EVPAnalysis } from '../../types';
import { UpgradeService } from '../../services/upgrade.service';
import { AudioService } from '../../services/audio.service';


type RecordingState = 'idle' | 'recording' | 'analyzing' | 'result';

@Component({
  selector: 'app-evp',
  imports: [CommonModule],
  templateUrl: './evp.component.html',
  styleUrls: ['./evp.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvpComponent implements AfterViewInit, OnDestroy {
  @ViewChild('waveformCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  state = signal<RecordingState>('idle');
  analysisResult = signal<EVPAnalysis | null>(null);
  interpretation = signal<{
    summary: string;
    notable_phrases: string[];
    confidence: number;
    tone: 'neutral' | 'distressed' | 'angry' | 'calm' | 'unknown';
    flags: string[];
    requires_review: boolean;
  } | null>(null);
  error = signal<string | null>(null);
  
  private geminiService = inject(GeminiService);
  private upgradeService = inject(UpgradeService);
  private audioService = inject(AudioService);
  private animationFrameId: number | null = null;
  
  readonly analysisCost = 2;

  ngAfterViewInit() {
    this.drawSilence();
  }
  
  async toggleRecording() {
    if (this.state() === 'recording') {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      await this.audioService.startRecording();
      this.state.set('recording');
      this.error.set(null);
      this.drawSilence();
    } catch (err) {
      console.error("Microphone access denied:", err);
      this.error.set(err instanceof Error ? err.message : 'Failed to start recording.');
      this.state.set('idle');
    }
  }

  async stopRecording() {
    if (this.state() !== 'recording') return;
    
    try {
        const blob = await this.audioService.stopRecording();
        await this.analyze(blob);
    } catch (err) {
      console.error("Error stopping recording", err);
      this.error.set(err instanceof Error ? err.message : "An error occurred while stopping the recording.");
      this.state.set('idle');
    }
  }
  
  async analyze(recording: Blob) {
    if (!this.upgradeService.spendCredits(this.analysisCost)) {
      this.error.set(`Insufficient Credits. Analysis requires ${this.analysisCost} NC.`);
      this.state.set('idle');
      this.drawSilence();
      return;
    }

    this.state.set('analyzing');
    this.drawSilence();
    try {
      const { transcript } = await this.audioService.uploadToTranscribe(recording, '/transcribe');
      const result = await this.geminiService.interpretTranscript(transcript, {
        durationMs: recording.size,
        sizeBytes: recording.size,
        mimeType: recording.type || 'audio/wav',
        source: 'evp-recorder',
      });
      this.interpretation.set(result);
      this.analysisResult.set({
        transcription: transcript,
        confidence: result.confidence,
      });
      this.state.set('result');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to analyze EVP recording.');
      this.state.set('idle');
    }
  }
  
  reset() {
    this.state.set('idle');
    this.analysisResult.set(null);
    this.interpretation.set(null);
    this.error.set(null);
    this.drawSilence();
  }

  drawSilence() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(52, 211, 153)';
    ctx.beginPath();
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
