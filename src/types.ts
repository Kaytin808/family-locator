export type AlertKind = 'checkin' | 'sos' | 'arrival' | 'departure' | 'speeding' | 'crash' | 'low_battery';
export type Coordinates = {latitude: number; longitude: number};

export type LocationRecord = Coordinates & {
  uid: string;
  speedMps: number;
  heading: number;
  accuracy: number;
  batteryLevel: number;
  isCharging: boolean;
  isDriving: boolean;
  updatedAt?: unknown;
};

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  activeCircleId?: string;
  fcmTokens?: string[];
};

export type Circle = {id: string; name: string; memberUids: string[]; createdBy: string};
export type Place = Coordinates & {id: string; name: string; radius: number; createdBy: string};

export type AppSettings = {
  foregroundIntervalSeconds: number;
  speedingThresholdMph: number;
  lowBatteryThreshold: number;
  crashDetectionEnabled: boolean;
  crashCountdownSeconds: number;
};

export const defaultSettings: AppSettings = {
  foregroundIntervalSeconds: 45,
  speedingThresholdMph: 75,
  lowBatteryThreshold: 20,
  crashDetectionEnabled: true,
  crashCountdownSeconds: 20,
};
