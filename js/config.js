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

export function tilePath(row, column) {
  return `./image_sources/house_garden_tile_r${row}_c${column}.png`;
}
