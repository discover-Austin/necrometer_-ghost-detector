import { Component, ChangeDetectionStrategy, Output, EventEmitter, signal, computed, inject, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectionEvent } from '../../types';
import { SpectralMapComponent } from '../spectral-map/spectral-map.component';
import { GeoTriangulatorComponent } from '../geo-triangulator/geo-triangulator.component';
import { DeviceStateService } from '../../services/device-state.service';

@Component({
  selector: 'app-scanner',
  imports: [CommonModule, SpectralMapComponent, GeoTriangulatorComponent],
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScannerComponent implements AfterViewInit, OnDestroy {
  @Output() detection = new EventEmitter<DetectionEvent>();
  @ViewChild('waveformCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  status = signal('CALIBRATING...');
  private lastDetectionTime = 0;
  private animationFrameId: number | null = null;
  private history: number[] = [];
  private maxHistory = 200;

  deviceState = inject(DeviceStateService);

  constructor() {
    effect(() => {
      const reading = this.deviceState.emfReading();
      this.updateStatus(reading);
      this.updateHistory(reading);

      const detectionCooldown = 10000; // 10 seconds
      const now = Date.now();

      // Trigger a detection event if reading is critical and cooldown has passed
      if (reading > 90 && (now - this.lastDetectionTime > detectionCooldown)) {
        this.triggerDetection(reading);
        this.lastDetectionTime = now;
        // Reset EMF slightly to prevent immediate re-triggering
        this.deviceState.emfReading.set(20);
      }
    });
  }

  ngAfterViewInit() {
    this.startVisualizer();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  updateHistory(reading: number) {
    this.history.push(reading);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  startVisualizer() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      if (!ctx) return;
      const width = rect.width;
      const height = rect.height;

      // Clear with trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Fade out effect
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
      this.drawGrid(ctx, width, height);

      // Waveform
      this.drawWaveform(ctx, width, height);

      this.animationFrameId = requestAnimationFrame(draw);
    };

    draw();
  }

  drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)'; // Spectral-500 very low opacity
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical lines
    for (let x = 0; x <= width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    // Horizontal lines
    for (let y = 0; y <= height; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  drawWaveform(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.history.length < 2) return;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const stepX = width / this.maxHistory;

    // Start from the end of logic
    // We map 0-100 reading to height. 
    // 0 reading -> height (bottom), 100 reading -> 0 (top)

    for (let i = 0; i < this.history.length; i++) {
      const x = i * stepX;
      const reading = this.history[i];

      // Add some jitter for "noise" if reading is low
      const noise = reading < 20 ? (Math.random() - 0.5) * 5 : 0;
      const y = height - ((reading + noise) / 100) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Dynamic Color based on current reading
    const currentReading = this.history[this.history.length - 1];
    let strokeColor = '#22d3ee'; // spectral-400
    if (currentReading > 75) strokeColor = '#facc15'; // warning
    if (currentReading > 90) strokeColor = '#ef4444'; // critical

    ctx.strokeStyle = strokeColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = strokeColor;
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset
  }

  updateStatus(reading: number) {
    if (reading < 10) this.status.set('SYSTEM NOMINAL');
    else if (reading < 40) this.status.set('TRACE ENERGY DETECTED');
    else if (reading < 75) this.status.set('MODERATE FIELD DISTURBANCE');
    else if (reading < 90) this.status.set('HIGH EMF WARNING');
    else this.status.set('!!! CRITICAL EVENT IMMINENT !!!');
  }

  triggerDetection(reading: number) {
    let strength: DetectionEvent['strength'] = 'weak';
    if (reading > 98) strength = 'critical';
    else if (reading > 95) strength = 'strong';
    else if (reading > 90) strength = 'moderate';

    this.detection.emit({ emf: parseFloat(reading.toFixed(2)), strength });
  }

  statusColorClass = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading > 90) return 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    if (reading > 75) return 'text-warning-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]';
    if (reading > 40) return 'text-spectral-300';
    return 'text-spectral-600';
  });
}