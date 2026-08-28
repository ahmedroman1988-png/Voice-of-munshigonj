export interface RecordingItem {
  id: string;
  title: string;
  blob: Blob;
  url: string;
  duration: number; // in seconds
  createdAt: number;
  size: number; // in bytes
  format: 'wav' | 'webm' | 'mp3';
  sampleRate: number;
  tags: string[];
  notes?: string;
  markers?: number[]; // marker timestamps in seconds
}

export interface AudioSettings {
  format: 'wav' | 'webm' | 'mp3';
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24;
  channels: 1 | 2;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  gain: number; // 0 to 2
}

export interface ApkProjectConfig {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
  enableBackgroundService: boolean;
  enableNoiseReduction: boolean;
  enableNotificationControls: boolean;
}

export type ActiveTab = 'recorder' | 'recordings' | 'apk_builder' | 'apk_guides';
export type Language = 'bn' | 'en';
