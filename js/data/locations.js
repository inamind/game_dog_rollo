import { tilePath } from '../config.js';

export const LOCATIONS = Object.freeze({
  yard: {
    id: 'yard',
    label: '마당',
    durationSeconds: 480,
    cameraBounds: { x: 0, y: 0, width: 3840, height: 2160 },
    spawn: { x: 100, y: 2050 },
    tilePaths: [tilePath(1, 1), tilePath(1, 2), tilePath(2, 1), tilePath(2, 2)],
    expThresholds: [0, 12, 24, 60, 84],
  },
  house: {
    id: 'house',
    label: '집',
    durationSeconds: 600,
    cameraBounds: { x: 1920, y: 0, width: 3840, height: 2160 },
    spawn: { x: 4300, y: 1780 },
    tilePaths: [tilePath(1, 2), tilePath(1, 3), tilePath(2, 2), tilePath(2, 3)],
    expThresholds: [0, 15, 45, 81, 105],
  },
});

export function getLocation(id) {
  const location = LOCATIONS[id];
  if (!location) throw new Error(`알 수 없는 장소: ${id}`);
  return location;
}
