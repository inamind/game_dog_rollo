import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getObjectDefinitions,
  OBJECTS,
  SAFE_PLACEMENT_SEGMENTS,
} from '../js/data/objects.js';
import { LOCATIONS } from '../js/data/locations.js';
import {
  AUDIO_PATHS,
  LEVEL_COLORS,
  OBJECT_SPRITE_BOTTOM_INSETS,
  OBJECT_SPRITE_PATHS,
  PLAYER_RENDER,
  SPRITE_PATHS,
} from '../js/config.js';
import { SfxPlayer } from '../js/audio/sfx-player.js';
import { Navigation } from '../js/game/navigation.js';
import { ObjectManager } from '../js/game/object-manager.js';
import { PlayerController } from '../js/game/player-controller.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const file of [
  'index.html',
  'styles/main.css',
  'js/main.js',
  'dist/rollo.bundle.js',
  'image_sources/ui_direction_up.png',
  'image_sources/ui_direction_left.png',
  'image_sources/ui_direction_down.png',
  'image_sources/ui_direction_right.png',
]) {
  try { await access(join(root, file)); } catch { failures.push(`필수 파일 누락: ${file}`); }
}

const assetPaths = [
  ...Object.values(SPRITE_PATHS).flat(),
  ...Object.values(OBJECT_SPRITE_PATHS).flat(),
  ...Object.values(LOCATIONS).flatMap((location) => location.tilePaths),
];
const audioPaths = Object.values(AUDIO_PATHS);
for (const path of new Set(assetPaths)) {
  try { await access(join(root, path.replace('./', ''))); } catch { failures.push(`에셋 누락: ${path}`); }
}
for (const path of audioPaths) {
  try { await access(join(root, path.replace('./', ''))); } catch { failures.push(`오디오 누락: ${path}`); }
}

assert(OBJECTS.house.length === 20, `집 물건 수 오류: ${OBJECTS.house.length}`);
assert(OBJECTS.yard.length === 15, `마당 물건 수 오류: ${OBJECTS.yard.length}`);
assert(OBJECTS.house.reduce((sum, item) => sum + item.exp, 0) === 165, '집 EXP 합계 오류');
assert(OBJECTS.yard.reduce((sum, item) => sum + item.exp, 0) === 129, '마당 EXP 합계 오류');
const ids = Object.values(OBJECTS).flat().map((item) => item.id);
assert(ids.every((id) => OBJECT_SPRITE_BOTTOM_INSETS[id]?.length === 4),
  '물건 스프라이트 바닥 보정값 누락');
assert(Object.values(OBJECT_SPRITE_BOTTOM_INSETS).flat()
  .every((value) => value >= 0 && value < 384),
  '물건 스프라이트 바닥 보정값 범위 오류');
assert(new Set(ids).size === ids.length, '물건 ID 중복');
assert(PLAYER_RENDER.groundOffsetY === 30, '강아지 발밑 렌더링 보정값 오류');
assert(PLAYER_RENDER.scaleByLevel.join(',') === '0.6,0.725,0.85,0.975,1.1',
  '강아지 레벨별 표시 배율 오류');
assert(LEVEL_COLORS.length === 5 && new Set(LEVEL_COLORS).size === 5,
  '레벨별 표시 색상 구성 오류');
assert(SPRITE_PATHS.explosion.length === 2, '필살기 폭발 프레임 수 오류');
assert(SPRITE_PATHS.explosion[0].endsWith('explosion_1.png')
  && SPRITE_PATHS.explosion[1].endsWith('explosion_2.png'),
  '필살기 폭발 프레임 순서 오류');

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

for (const locationId of ['yard', 'house']) {
  const layoutA = getObjectDefinitions(locationId, seededRandom(17));
  const layoutB = getObjectDefinitions(locationId, seededRandom(29));
  assert(layoutA.length === OBJECTS[locationId].length,
    `${locationId} 랜덤 배치 물건 수 오류`);
  assert(layoutA.some((item) => {
    const other = layoutB.find((candidate) => candidate.id === item.id);
    return other && (Math.abs(item.x - other.x) > 1 || item.floorY !== other.floorY);
  }), `${locationId} 게임별 랜덤 배치 변화 오류`);

  for (const item of layoutA) {
    const insideSafeSegment = SAFE_PLACEMENT_SEGMENTS[locationId].some((segment) => (
      segment.floorY === item.floorY
      && item.x - item.width / 2 >= segment.minX - 0.001
      && item.x + item.width / 2 <= segment.maxX + 0.001
    ));
    assert(insideSafeSegment, `${locationId} 안전 구역 밖 배치: ${item.id}`);
  }

  const byFloor = Map.groupBy(layoutA, (item) => item.floorY);
  for (const floorItems of byFloor.values()) {
    const ordered = [...floorItems].sort((a, b) => a.x - b.x);
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      const horizontalGap = current.x - current.width / 2
        - (previous.x + previous.width / 2);
      assert(horizontalGap >= 19.999,
        `${locationId} 물건 겹침: ${previous.id}/${current.id}`);
    }
  }
}

const navigation = new Navigation('house');
assert(navigation.buildStairStep({ floor: 0, x: 3300, y: 1780 }, 1).length === 0,
  '계단에서 멀리 떨어진 위층 입력 차단 오류');
const stairPlayer = { floor: 0, x: 3740, y: 1780 };
let stairPresses = 0;
while (stairPlayer.floor === 0 && stairPresses < 10) {
  const step = navigation.buildStairStep(stairPlayer, 1);
  assert(step.length === 1, `계단 ${stairPresses + 1}번째 단일 이동 오류`);
  if (step.length === 0) break;
  Object.assign(stairPlayer, step[0]);
  stairPresses += 1;
}
assert(stairPresses === 8, `1층→2층 계단 입력 횟수 오류: ${stairPresses}`);
assert(stairPlayer.floor === 1 && stairPlayer.y === 1235, '계단 단계 입력 후 2층 도착 오류');
const reversePlayer = { floor: 0, x: 3840, y: 1712 };
const reverseStep = navigation.buildStairStep(reversePlayer, -1);
assert(reverseStep.length === 1 && reverseStep[0].floor === 0,
  '계단 중간에서 아래 방향으로 한 단 되돌아가기 오류');

const combatObjects = new ObjectManager([{
  id: 'test', name: '테스트', requiredLevel: 1, exp: 3,
  x: 100, y: 200, width: 100, height: 100,
}]);
const testPlayer = { x: 0, y: 200, width: 100, height: 100, facing: 1, level: 1 };
assert(combatObjects.canTouchSmash(testPlayer, 100, 150), '전방 근접 물건 터치 스매쉬 판정 오류');
assert(!combatObjects.canTouchSmash({ ...testPlayer, facing: -1 }, 100, 150),
  '뒤쪽 물건 터치 스매쉬 차단 오류');
combatObjects.attack(testPlayer, 'smashing');
assert(combatObjects.objects[0].state === 2, '1회 타격 후 파손 2단계 전환 오류');
combatObjects.attack(testPlayer, 'smashing');
assert(combatObjects.objects[0].state === 3, '2회 타격 후 파손 3단계 전환 오류');
combatObjects.attack(testPlayer, 'smashing');
assert(combatObjects.objects[0].state === 4, '완파 후 파손 4단계 전환 오류');
assert(combatObjects.allDestroyed, '전방 Smashing 3회 파괴 판정 오류');

const directionalObjects = new ObjectManager([
  {
    id: 'behind', name: '뒤쪽 대상', requiredLevel: 1, exp: 3,
    x: -100, y: 200, width: 100, height: 100,
  },
  {
    id: 'body', name: '몸과 겹친 대상', requiredLevel: 1, exp: 3,
    x: 0, y: 200, width: 100, height: 100,
  },
  {
    id: 'front', name: '바로 앞 대상', requiredLevel: 1, exp: 3,
    x: 100, y: 200, width: 100, height: 100,
  },
  {
    id: 'too-far', name: '먼 앞쪽 대상', requiredLevel: 1, exp: 3,
    x: 200, y: 200, width: 100, height: 100,
  },
]);
const rightSmash = directionalObjects.attack(testPlayer, 'smashing');
assert(rightSmash.damaged.length === 1 && rightSmash.damaged[0].id === 'front',
  '오른쪽 스매쉬 바로 앞 한정 판정 오류');
const leftSmash = directionalObjects.attack({ ...testPlayer, facing: -1 }, 'smashing');
assert(leftSmash.damaged.length === 1 && leftSmash.damaged[0].id === 'behind',
  '왼쪽 스매쉬 바로 앞 한정 판정 오류');
assert(directionalObjects.objects[1].hp === directionalObjects.objects[1].maxHp,
  '강아지 몸 중심 뒤쪽 대상이 스매쉬 데미지를 받음');
assert(directionalObjects.objects[3].hp === directionalObjects.objects[3].maxHp,
  '먼 앞쪽 대상이 스매쉬 데미지를 받음');

const mountedObjects = new ObjectManager([{
  id: 'mounted-mirror', name: '벽걸이 거울', requiredLevel: 2, exp: 6,
  x: 100, y: 1100, floorY: 1235, width: 110, height: 150,
}]);
const levelTwoHeight = PLAYER_RENDER.baseSize * PLAYER_RENDER.scaleByLevel[1];
const maximumMountHeight = levelTwoHeight * 0.6;
assert(Math.abs(mountedObjects.objects[0].y - (1235 - maximumMountHeight)) < 0.001,
  '요구 레벨 강아지 크기 기반 벽걸이 높이 제한 오류');
const mountedHit = mountedObjects.attack({
  x: 0, y: 1235, width: 220, height: 220,
  renderWidth: levelTwoHeight, renderHeight: levelTwoHeight,
  facing: 1, level: 2,
}, 'smashing');
assert(mountedHit.hit === 1, '높이 보정된 Lv.2 벽걸이 물건 타격 오류');

const specialObjects = new ObjectManager([
  {
    id: 'eligible-near', name: '근처 대상', requiredLevel: 1, exp: 3,
    x: 100, y: 200, width: 100, height: 100,
  },
  {
    id: 'eligible-far', name: '범위 밖 대상', requiredLevel: 2, exp: 6,
    x: 5000, y: 200, width: 100, height: 100,
  },
  {
    id: 'blocked-near', name: '고레벨 근처 대상', requiredLevel: 3, exp: 9,
    x: 105, y: 200, width: 100, height: 100,
  },
]);
const specialResult = specialObjects.attack({ ...testPlayer, level: 2 }, 'biting');
assert(specialResult.destroyed.length === 1 && specialResult.destroyed[0].id === 'eligible-near',
  '필살기 스매쉬 범위 내 대상 파괴 오류');
assert(specialResult.destroyed.every((item) => item.requiredLevel <= 2),
  '필살기 사용 레벨 이하 제한 오류');
assert(specialResult.blocked.length === 1 && specialResult.blocked[0].requiredLevel === 3,
  '필살기 고레벨 물건 차단 오류');
assert(specialObjects.objects[1].hp === specialObjects.objects[1].maxHp,
  '필살기가 스매쉬 타격범위 밖 물건 체력을 감소시킴');
assert(specialObjects.objects[2].hp === specialObjects.objects[2].maxHp,
  '필살기가 고레벨 물건 체력을 감소시킴');

const levelupPlayer = new PlayerController({
  name: 'TEST',
  spawn: { x: 0, y: 0 },
  navigation: { isOnStairs: () => false, buildHorizontalRoute: () => [], buildStairStep: () => [] },
});
assert(levelupPlayer.renderWidth === 132 && levelupPlayer.renderHeight === 132,
  'Lv.1 강아지 60% 표시 크기 오류');
levelupPlayer.setLevel(2);
assert(levelupPlayer.renderWidth === 159.5 && levelupPlayer.renderHeight === 159.5,
  'Lv.2 강아지 72.5% 표시 크기 오류');
assert(levelupPlayer.action === 'levelup', '레벨업 액션 시작 오류');
assert(levelupPlayer.spritePath === SPRITE_PATHS.levelup[0], '레벨업 1프레임 적용 오류');
levelupPlayer.update(0.5);
assert(levelupPlayer.action === 'levelup' && levelupPlayer.spritePath === SPRITE_PATHS.levelup[1],
  '레벨업 2프레임 유지 오류');
levelupPlayer.update(0.5);
assert(levelupPlayer.action === 'levelup' && levelupPlayer.spritePath === SPRITE_PATHS.levelup[2],
  '레벨업 3프레임 유지 오류');
levelupPlayer.update(0.5);
assert(levelupPlayer.action === 'idle', '레벨업 애니메이션 종료 오류');

const soundCues = [];
const sfx = new SfxPlayer({ onCue: (cue) => soundCues.push(cue) });
sfx.playAttack('smashing');
sfx.playAttack('biting');
sfx.playHit(false);
sfx.playHit(true);
sfx.playBlocked();
sfx.playDestroy();
sfx.playLevelUp();
assert(soundCues.join(',') === 'smash,bite,hit,heavy-hit,blocked,destroy,level-up',
  `효과음 큐 연결 오류: ${soundCues.join(',')}`);

const jsFiles = (await readdir(join(root, 'js'), { recursive: true }))
  .filter((file) => file.endsWith('.js'));
for (const file of jsFiles) {
  const source = await readFile(join(root, 'js', file), 'utf8');
  assert(!source.includes('house_garden_background.png'), `런타임 전체 배경 참조 금지: ${file}`);
  assert(!source.includes('desynchronized: true'), `태블릿 Canvas 부분 프레임 표시 금지: ${file}`);
}

if (failures.length) {
  for (const failure of failures) process.stderr.write(`FAIL ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS files=${jsFiles.length} assets=${new Set(assetPaths).size} house=20/165 yard=15/129\n`);
}
