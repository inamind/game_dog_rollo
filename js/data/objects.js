const object = (id, name, level, x, y, width = 150, height = 150, floorY = y) => ({
  id, name, requiredLevel: level, exp: level * 3, x, y, width, height, floorY,
});

export const OBJECTS = Object.freeze({
  yard: [
    object('pot-a', '화분 A', 1, 220, 2050, 100, 120),
    object('pot-b', '화분 B', 1, 430, 2050, 100, 120),
    object('pot-c', '화분 C', 1, 640, 2050, 100, 120),
    object('sandcastle', '모래성', 1, 880, 2050, 150, 110),
    object('fence', '울타리', 2, 1120, 2050, 180, 150),
    object('shelf', '선반', 2, 1370, 2050, 150, 180),
    object('bench', '벤치', 3, 1610, 2050, 190, 130),
    object('swing', '그네', 3, 1860, 2050, 190, 210),
    object('bike', '자전거', 3, 2110, 2050, 170, 130),
    object('seesaw', '시소', 3, 2350, 2050, 210, 110),
    object('toolbox', '공구함', 4, 2580, 2050, 150, 100),
    object('slide', '미끄럼틀', 4, 2800, 2050, 200, 190),
    object('fountain', '분수', 5, 3050, 2050, 180, 220),
    object('trampoline', '트램펄린', 5, 3290, 2050, 210, 90),
    object('tree', '나무', 5, 3540, 2050, 220, 300),
  ],
  house: [
    object('sofa', '소파', 1, 3300, 1780, 190, 130),
    object('vase', '꽃병', 1, 3550, 1780, 90, 120),
    object('table', '테이블', 2, 3820, 1780, 170, 120),
    object('frame', '액자', 2, 4090, 1650, 110, 130, 1780),
    object('tv', 'TV', 3, 4380, 1780, 170, 130),
    object('plate', '접시', 1, 4640, 1780, 100, 90),
    object('chair', '의자', 2, 4880, 1780, 130, 150),
    object('microwave', '전자레인지', 3, 5150, 1780, 150, 110),
    object('fridge', '냉장고', 5, 5470, 1780, 170, 260),
    object('lamp', '램프', 1, 3300, 1235, 100, 150),
    object('mirror', '거울', 2, 3560, 1100, 110, 150, 1235),
    object('desk', '책상', 3, 3830, 1235, 180, 140),
    object('bed', '침대', 4, 4140, 1235, 220, 110),
    object('wardrobe', '옷장', 5, 4470, 1235, 180, 250),
    object('tile', '타일', 2, 4770, 1120, 110, 110, 1235),
    object('sink', '세면대', 3, 5040, 1235, 160, 150),
    object('toilet', '변기', 4, 5360, 1235, 150, 150),
    object('box', '상자', 1, 3500, 720, 140, 120),
    object('old-furniture', '오래된 가구', 5, 4230, 720, 200, 180),
    object('piano', '피아노', 5, 5200, 720, 250, 180),
  ],
});

export const SAFE_PLACEMENT_SEGMENTS = Object.freeze({
  yard: [
    { minX: 240, maxX: 3120, floorY: 2050 },
  ],
  house: [
    // 1층: 중앙의 1→2층 계단과 출발 지점을 비워 둔다.
    { minX: 3210, maxX: 3650, floorY: 1780 },
    { minX: 4700, maxX: 5580, floorY: 1780 },
    // 2층: 두 계단의 연결부와 난간 앞을 비워 둔다.
    { minX: 3210, maxX: 3900, floorY: 1235 },
    { minX: 5070, maxX: 5580, floorY: 1235 },
    // 3층: 계단 도착 난간과 오른쪽 벽 기둥을 피한다.
    { minX: 3210, maxX: 4700, floorY: 720 },
    { minX: 5150, maxX: 5580, floorY: 720 },
  ],
});

function shuffled(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function distributeSpace(total, count, random) {
  if (count <= 0) return [];
  const weights = Array.from({ length: count }, () => 0.25 + random());
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => total * weight / weightTotal);
}

function placeInSafeSegments(definitions, segments, random) {
  const gap = 20;
  const states = segments.map((segment) => ({
    ...segment,
    capacity: segment.maxX - segment.minX,
    remaining: segment.maxX - segment.minX,
    definitions: [],
  }));
  const ranked = definitions.map((definition) => ({ definition, rank: random() }));
  ranked.sort((a, b) => b.definition.width - a.definition.width || a.rank - b.rank);

  for (const { definition } of ranked) {
    const candidates = states
      .map((state) => ({ state, needed: definition.width + (state.definitions.length ? gap : 0) }))
      .filter(({ state, needed }) => state.remaining >= needed)
      .sort((a, b) => (a.state.remaining - a.needed) - (b.state.remaining - b.needed));
    if (candidates.length === 0) throw new Error(`안전 배치 공간 부족: ${definition.id}`);
    const candidateCount = Math.min(3, candidates.length);
    const selected = candidates[Math.floor(random() * candidateCount)];
    selected.state.definitions.push(definition);
    selected.state.remaining -= selected.needed;
  }

  const placed = [];
  for (const state of states) {
    const ordered = shuffled(state.definitions, random);
    const usedWidth = ordered.reduce((sum, definition) => sum + definition.width, 0)
      + Math.max(0, ordered.length - 1) * gap;
    const spaces = distributeSpace(state.capacity - usedWidth, ordered.length + 1, random);
    let cursor = state.minX + (spaces[0] ?? 0);
    ordered.forEach((definition, index) => {
      const originalMountHeight = Math.max(0, definition.floorY - definition.y);
      const y = originalMountHeight > 0 ? state.floorY - originalMountHeight : state.floorY;
      cursor += definition.width / 2;
      placed.push({ ...definition, x: cursor, y, floorY: state.floorY });
      cursor += definition.width / 2 + gap + (spaces[index + 1] ?? 0);
    });
  }
  return placed;
}

export function getObjectDefinitions(locationId, random = Math.random) {
  const definitions = OBJECTS[locationId];
  const segments = SAFE_PLACEMENT_SEGMENTS[locationId];
  if (!definitions || !segments) return [];
  return placeInSafeSegments(definitions, segments, random);
}
