export const PERFORMANCE = Object.freeze({
  targetFps: 60,
  maxDpr: 2,
  decodeConcurrency: 3,
  maxParticles: 150,
  longFrameMs: 50,
});

export const WORLD = Object.freeze({
  width: 5760,
  height: 2160,
  tileWidth: 1920,
  tileHeight: 1080,
});

export const PLAYER_RENDER = Object.freeze({
  baseSize: 220,
  scaleByLevel: [0.6, 0.725, 0.85, 0.975, 1.1],
  groundOffsetY: 30,
});

export const LEVEL_COLORS = Object.freeze([
  '#FFFFFF',
  '#8EF0A7',
  '#65D6FF',
  '#FFD45C',
  '#FF7BD5',
]);

export const COMBAT = Object.freeze({
  smashDamageByLevel: [20, 22, 25, 29, 34],
  minimumAttackReach: 70,
  maximumMountHeightRatio: 0.6,
  biteCooldownSeconds: 30,
  specialExplosionFrameSeconds: 0.16,
  objectHpByLevel: [60, 100, 150, 220, 300],
});

export const SPRITE_PATHS = Object.freeze({
  running: [1, 2, 3].map((frame) => `./image_sources/dog_running_${frame}.png`),
  jumping: [1, 2, 3].map((frame) => `./image_sources/dog_jumping_${frame}.png`),
  smashing: [1, 2, 3].map((frame) => `./image_sources/dog_smashing_${frame}.png`),
  biting: [1, 2, 3].map((frame) => `./image_sources/dog_biting_${frame}.png`),
  levelup: [1, 2, 3].map((frame) => `./image_sources/dog_levelup_${frame}.png`),
  explosion: [1, 2].map((frame) => `./image_sources/explosion_${frame}.png`),
});

export const AUDIO_PATHS = Object.freeze({
  gameBgm: './배경음악.mp3',
});

export const OBJECT_SPRITE_PATHS = Object.freeze({
  sofa: [1, 2, 3, 4].map((state) => `./image_sources/object_sofa_state_${state}.png`),
  vase: [1, 2, 3, 4].map((state) => `./image_sources/object_vase_state_${state}.png`),
  table: [1, 2, 3, 4].map((state) => `./image_sources/object_table_state_${state}.png`),
  frame: [1, 2, 3, 4].map((state) => `./image_sources/object_frame_state_${state}.png`),
  tv: [1, 2, 3, 4].map((state) => `./image_sources/object_tv_state_${state}.png`),
  plate: [1, 2, 3, 4].map((state) => `./image_sources/object_plate_state_${state}.png`),
  chair: [1, 2, 3, 4].map((state) => `./image_sources/object_chair_state_${state}.png`),
  microwave: [1, 2, 3, 4].map((state) => `./image_sources/object_microwave_state_${state}.png`),
  fridge: [1, 2, 3, 4].map((state) => `./image_sources/object_fridge_state_${state}.png`),
  lamp: [1, 2, 3, 4].map((state) => `./image_sources/object_lamp_state_${state}.png`),
  mirror: [1, 2, 3, 4].map((state) => `./image_sources/object_mirror_state_${state}.png`),
  desk: [1, 2, 3, 4].map((state) => `./image_sources/object_desk_state_${state}.png`),
  bed: [1, 2, 3, 4].map((state) => `./image_sources/object_bed_state_${state}.png`),
  wardrobe: [1, 2, 3, 4].map((state) => `./image_sources/object_wardrobe_state_${state}.png`),
  tile: [1, 2, 3, 4].map((state) => `./image_sources/object_tile_state_${state}.png`),
  sink: [1, 2, 3, 4].map((state) => `./image_sources/object_sink_state_${state}.png`),
  toilet: [1, 2, 3, 4].map((state) => `./image_sources/object_toilet_state_${state}.png`),
  box: [1, 2, 3, 4].map((state) => `./image_sources/object_box_state_${state}.png`),
  'old-furniture': [1, 2, 3, 4].map((state) => `./image_sources/object_old-furniture_state_${state}.png`),
  piano: [1, 2, 3, 4].map((state) => `./image_sources/object_piano_state_${state}.png`),
  'pot-a': [1, 2, 3, 4].map((state) => `./image_sources/object_pot-a_state_${state}.png`),
  'pot-b': [1, 2, 3, 4].map((state) => `./image_sources/object_pot-b_state_${state}.png`),
  'pot-c': [1, 2, 3, 4].map((state) => `./image_sources/object_pot-c_state_${state}.png`),
  sandcastle: [1, 2, 3, 4].map((state) => `./image_sources/object_sandcastle_state_${state}.png`),
  fence: [1, 2, 3, 4].map((state) => `./image_sources/object_fence_state_${state}.png`),
  shelf: [1, 2, 3, 4].map((state) => `./image_sources/object_shelf_state_${state}.png`),
  bench: [1, 2, 3, 4].map((state) => `./image_sources/object_bench_state_${state}.png`),
  swing: [1, 2, 3, 4].map((state) => `./image_sources/object_swing_state_${state}.png`),
  bike: [1, 2, 3, 4].map((state) => `./image_sources/object_bike_state_${state}.png`),
  seesaw: [1, 2, 3, 4].map((state) => `./image_sources/object_seesaw_state_${state}.png`),
  toolbox: [1, 2, 3, 4].map((state) => `./image_sources/object_toolbox_state_${state}.png`),
  slide: [1, 2, 3, 4].map((state) => `./image_sources/object_slide_state_${state}.png`),
  fountain: [1, 2, 3, 4].map((state) => `./image_sources/object_fountain_state_${state}.png`),
  trampoline: [1, 2, 3, 4].map((state) => `./image_sources/object_trampoline_state_${state}.png`),
  tree: [1, 2, 3, 4].map((state) => `./image_sources/object_tree_state_${state}.png`),
});

// Each sprite is 384 px tall. These are the transparent rows below its visible
// pixels, used to align the visible bottom precisely with the floor baseline.
export const OBJECT_SPRITE_BOTTOM_INSETS = Object.freeze({
  bed: [21, 36, 41, 53],
  bench: [21, 21, 31, 44],
  bike: [19, 24, 26, 38],
  box: [35, 20, 26, 56],
  chair: [24, 23, 18, 30],
  desk: [37, 28, 21, 37],
  fence: [53, 39, 35, 21],
  fountain: [28, 18, 37, 59],
  frame: [39, 39, 19, 32],
  fridge: [28, 28, 18, 49],
  lamp: [25, 25, 18, 25],
  microwave: [28, 27, 21, 24],
  mirror: [37, 37, 18, 32],
  'old-furniture': [21, 21, 41, 41],
  piano: [29, 23, 20, 44],
  plate: [44, 44, 19, 22],
  'pot-a': [49, 39, 12, 60],
  'pot-b': [36, 19, 19, 18],
  'pot-c': [31, 30, 39, 34],
  sandcastle: [18, 19, 19, 35],
  seesaw: [46, 45, 21, 30],
  shelf: [20, 22, 20, 35],
  sink: [17, 22, 28, 35],
  slide: [32, 19, 47, 55],
  sofa: [29, 28, 21, 40],
  swing: [20, 20, 56, 25],
  table: [23, 23, 20, 41],
  tile: [31, 27, 20, 20],
  toilet: [20, 19, 33, 58],
  toolbox: [41, 25, 21, 33],
  trampoline: [28, 28, 21, 38],
  tree: [30, 28, 26, 35],
  tv: [25, 24, 21, 51],
  vase: [19, 19, 19, 67],
  wardrobe: [24, 19, 25, 33],
});

export function tilePath(row, column) {
  return `./image_sources/house_garden_tile_r${row}_c${column}.png`;
}
