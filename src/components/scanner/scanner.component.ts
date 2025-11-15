import { Component, ChangeDetectionStrategy, Output, EventEmitter, signal, computed, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectionEvent } from '../../types';
import { SpectralMapComponent } from '../spectral-map/spectral-map.component';
import { GeoTriangulatorComponent } from '../geo-triangulator/geo-triangulator.component';
import { DeviceStateService } from '../../services/device-state.service';
import { HapticService } from '../../services/haptic.service';
import { AnalyticsService } from '../../services/analytics.service';
import { InvestigationSessionService } from '../../services/investigation-session.service';
import { PerformanceService } from '../../services/performance.service';
import { NetworkService } from '../../services/network.service';
import { GeolocationService } from '../../services/geolocation.service';

@Component({
  selector: 'app-scanner',
  imports: [CommonModule, SpectralMapComponent, GeoTriangulatorComponent],
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScannerComponent implements OnInit, OnDestroy {
  @Output() detection = new EventEmitter<DetectionEvent>();

  status = signal('CALIBRATING...');
  scanActivity = signal('Initializing sensors...');
  private lastDetectionTime = 0;
  private lastHapticTime = 0;
  private scanStartTime = 0;

  deviceState = inject(DeviceStateService);
  private haptic = inject(HapticService);
  private analytics = inject(AnalyticsService);
  sessions = inject(InvestigationSessionService);
  private performance = inject(PerformanceService);
  network = inject(NetworkService);
  geolocation = inject(GeolocationService);

  constructor() {
    effect(() => {
      const reading = this.deviceState.emfReading();
      this.updateStatus(reading);
      this.updateScanActivity(reading);

      const detectionCooldown = 10000; // 10 seconds
      const now = Date.now();

      // Haptic feedback for high readings
      if (reading > 75 && (now - this.lastHapticTime > 2000)) {
        this.provideHapticFeedback(reading);
        this.lastHapticTime = now;
      }

      // Trigger a detection event if reading is critical and cooldown has passed
      if (reading > 90 && (now - this.lastDetectionTime > detectionCooldown)) {
        this.triggerDetection(reading);
        this.lastDetectionTime = now;
        // Reset EMF slightly to prevent immediate re-triggering
        this.deviceState.emfReading.set(20);
      }

      // Track scan metrics
      if (reading > 50) {
        this.analytics.trackEvent('high_emf_scan', 'scanner', { reading });
      }
    });
  }

  ngOnInit() {
    this.scanStartTime = Date.now();
    this.analytics.trackEvent('scanner_opened', 'navigation');
    this.performance.mark('scanner-start');

    // Auto-start session if not already active
    if (!this.sessions.currentSession()) {
      this.sessions.startSession('Auto Scan Session');
    }

    this.scanActivity.set('Scanning for paranormal activity...');
  }

  ngOnDestroy() {
    const scanDuration = Date.now() - this.scanStartTime;
    this.analytics.trackEvent('scanner_closed', 'navigation', { duration: scanDuration });
    this.performance.mark('scanner-end');
    this.performance.measure('scanner-session');
  }

  updateStatus(reading: number) {
    if (reading < 10) this.status.set('SYSTEM NOMINAL');
    else if (reading < 40) this.status.set('TRACE ENERGY DETECTED');
    else if (reading < 75) this.status.set('MODERATE FIELD DISTURBANCE');
    else if (reading < 90) this.status.set('HIGH EMF WARNING');
    else this.status.set('!!! CRITICAL EVENT IMMINENT !!!');
  }

  updateScanActivity(reading: number) {
    const location = this.geolocation.currentLocation();
    const locationStr = location ? `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°W` : 'Unknown';

    if (reading < 10) {
      this.scanActivity.set(`Ambient baseline monitoring | Location: ${locationStr}`);
    } else if (reading < 40) {
      this.scanActivity.set(`Faint spectral signatures detected | Tracking...`);
    } else if (reading < 75) {
      this.scanActivity.set(`Energy fluctuations increasing | Session active`);
    } else if (reading < 90) {
      this.scanActivity.set(`WARNING: Significant paranormal activity | Stand by...`);
    } else {
      this.scanActivity.set(`ALERT: Entity manifestation imminent | Preparing containment...`);
    }
  }

  async provideHapticFeedback(reading: number) {
    if (reading > 90) {
      await this.haptic.heavy();
    } else if (reading > 80) {
      await this.haptic.medium();
    } else {
      await this.haptic.light();
    }
  }

  triggerDetection(reading: number) {
    let strength: DetectionEvent['strength'] = 'weak';
    if (reading > 98) strength = 'critical';
    else if (reading > 95) strength = 'strong';
    else if (reading > 90) strength = 'moderate';

    this.analytics.trackEvent('detection_triggered', 'scanner', { emf: reading, strength });

    this.detection.emit({ emf: parseFloat(reading.toFixed(2)), strength });
  }

  barColorClass = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading > 90) return 'bg-red-500';
    if (reading > 75) return 'bg-yellow-500';
    if (reading > 40) return 'bg-teal-400';
    return 'bg-green-500';
  });

   statusColorClass = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading > 90) return 'text-red-400 animate-pulse';
    if (reading > 75) return 'text-yellow-400';
    if (reading > 40) return 'text-teal-300';
    return 'text-green-400';
  });

  scannerContainerStyles = computed(() => {
    const reading = this.deviceState.emfReading();
    let opacity = 0;
    let duration = 5;
    let blur = 0;

    if (reading > 5) {
      opacity = (reading / 100) * 0.4;
      duration = Math.max(0.5, 3 - (reading / 100) * 2.5); // Faster pulse with higher reading
      blur = (reading / 100) * 20;
    }

    return {
      '--glow-color': `rgba(52, 211, 153, ${opacity})`,
      '--glow-blur': `0 0 ${blur}px var(--glow-color)`,
      'animationDuration': `${duration}s`,
    };
  });

  backgroundDistortionOpacity = computed(() => {
    const reading = this.deviceState.emfReading();
    if (reading < 10) return 0;
    return Math.min((reading / 100) * 0.3, 0.3); // Max 30% opacity
  });

  sessionInfo = computed(() => {
    const session = this.sessions.currentSession();
    if (!session) return null;

    const duration = Date.now() - session.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return {
      name: session.name,
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      detectionCount: session.detections.length
    };
  });

  networkStatus = computed(() => {
    return this.network.isOnline() ? 'Online' : 'Offline';
  });

  networkStatusClass = computed(() => {
    return this.network.isOnline() ? 'text-green-400' : 'text-yellow-400';
  });

  locationDisplay = computed(() => {
    const location = this.geolocation.currentLocation();
    if (!location) return 'Acquiring GPS...';
    return `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`;
  });
}