/**
 * @format
 */

import {defaultSettings} from '../src/types';

test('ships with conservative location and crash defaults', () => {
  expect(defaultSettings.foregroundIntervalSeconds).toBeGreaterThanOrEqual(30);
  expect(defaultSettings.crashCountdownSeconds).toBeGreaterThanOrEqual(15);
  expect(defaultSettings.speedingThresholdMph).toBe(75);
});
