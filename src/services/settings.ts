import AsyncStorage from '@react-native-async-storage/async-storage';
import {defaultSettings, type AppSettings} from '../types';

const SETTINGS_KEY = '@family-locator/settings/v1';

export async function loadSettings(): Promise<AppSettings> {
  const value = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!value) {
    return defaultSettings;
  }
  try {
    return {...defaultSettings, ...(JSON.parse(value) as Partial<AppSettings>)};
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
