import {accelerometer, SensorTypes, setUpdateIntervalForType, type SensorData} from 'react-native-sensors';
import type {AppSettings, LocationRecord} from '../types';

type SafetyCallbacks = {onCrashCandidate: () => void; onSpeeding: (mph: number) => void};

class SafetyMonitor {
  private sensorSubscription?: {unsubscribe: () => void};
  private speedingSince = 0;
  private lastSpeedAlertAt = 0;
  private previous?: {speedMps: number; time: number};
  private maxRecentG = 0;
  private lastHighGAt = 0;
  private lastCrashAt = 0;

  start(settings: AppSettings, callbacks: SafetyCallbacks) {
    this.stop();
    this.callbacks = callbacks;
    if (!settings.crashDetectionEnabled) {
      return;
    }
    setUpdateIntervalForType(SensorTypes.accelerometer, 100);
    this.sensorSubscription = accelerometer.subscribe({
      next: sample => this.onAcceleration(sample),
      error: error => console.warn('[safety] accelerometer unavailable', error),
    });
  }

  private callbacks?: SafetyCallbacks;

  onLocation(location: LocationRecord, settings: AppSettings) {
    const now = Date.now();
    const mph = location.speedMps * 2.23694;
    if (mph >= settings.speedingThresholdMph) {
      this.speedingSince ||= now;
      if (now - this.speedingSince >= 5_000 && now - this.lastSpeedAlertAt >= 10 * 60_000) {
        this.lastSpeedAlertAt = now;
        this.callbacks?.onSpeeding(Math.round(mph));
      }
    } else {
      this.speedingSince = 0;
    }

    if (this.previous) {
      const elapsed = now - this.previous.time;
      const hardStop = this.previous.speedMps >= 11.18 && location.speedMps <= 2.5 && elapsed <= 2_500;
      if (hardStop && this.maxRecentG >= 2.5 && now - this.lastHighGAt <= 2_500 && now - this.lastCrashAt >= 5 * 60_000) {
        this.lastCrashAt = now;
        this.callbacks?.onCrashCandidate();
      }
    }
    this.previous = {speedMps: location.speedMps, time: now};
    this.maxRecentG = 0;
  }

  private onAcceleration({x, y, z}: SensorData) {
    const gForce = Math.sqrt(x * x + y * y + z * z) / 9.80665;
    this.maxRecentG = Math.max(this.maxRecentG, gForce);
    if (gForce >= 2.5) this.lastHighGAt = Date.now();
  }

  stop() {
    this.sensorSubscription?.unsubscribe();
    this.sensorSubscription = undefined;
    this.previous = undefined;
    this.maxRecentG = 0;
    this.lastHighGAt = 0;
    this.speedingSince = 0;
    this.callbacks = undefined;
  }
}

export const safetyMonitor = new SafetyMonitor();
