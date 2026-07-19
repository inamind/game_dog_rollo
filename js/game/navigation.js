const HOUSE_FLOORS = [
  { floor: 0, y: 1780, minX: 3170, maxX: 5620 },
  { floor: 1, y: 1235, minX: 3170, maxX: 5620 },
  { floor: 2, y: 720, minX: 3170, maxX: 5620 },
];

const HOUSE_STAIRS = {
  '0-1': [
    { x: 3740, y: 1780, floor: 0 },
    { x: 3840, y: 1712 }, { x: 3940, y: 1644 }, { x: 4040, y: 1576 },
    { x: 4140, y: 1508 }, { x: 4240, y: 1440 }, { x: 4340, y: 1372 },
    { x: 4440, y: 1304 }, { x: 4540, y: 1235, floor: 1 },
  ],
  '1-2': [
    { x: 4110, y: 1235, floor: 1 },
    { x: 4210, y: 1171 }, { x: 4310, y: 1107 }, { x: 4410, y: 1043 },
    { x: 4510, y: 979 }, { x: 4610, y: 915 }, { x: 4710, y: 851 },
    { x: 4810, y: 787 }, { x: 4910, y: 720, floor: 2 },
  ],
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export class Navigation {
  constructor(locationId) {
    this.locationId = locationId;
  }

  buildHorizontalRoute(player, direction) {
    if (this.locationId === 'yard') {
      return [{ x: direction < 0 ? 100 : 3700, y: 2050, floor: 0, action: 'running' }];
    }
    const floor = HOUSE_FLOORS[player.floor ?? 0];
    return [{
      x: direction < 0 ? floor.minX : floor.maxX,
      y: floor.y,
      floor: floor.floor,
      action: 'running',
    }];
  }

  isOnStairs(player) {
    if (this.locationId !== 'house') return false;
    const floor = HOUSE_FLOORS[player.floor ?? 0];
    return Math.abs(player.y - floor.y) > 20;
  }

  buildStairStep(player, direction) {
    if (this.locationId !== 'house') return [];
    let points;
    if (this.isOnStairs(player)) {
      points = Object.values(HOUSE_STAIRS).reduce((nearestStair, stair) => {
        const distance = Math.min(...stair.map((point) => Math.hypot(point.x - player.x, point.y - player.y)));
        const nearestDistance = Math.min(
          ...nearestStair.map((point) => Math.hypot(point.x - player.x, point.y - player.y)),
        );
        return distance < nearestDistance ? stair : nearestStair;
      });
    } else {
      const targetFloor = clamp((player.floor ?? 0) + direction, 0, HOUSE_FLOORS.length - 1);
      if (targetFloor === player.floor) return [];
      const lowerFloor = Math.min(player.floor, targetFloor);
      points = HOUSE_STAIRS[`${lowerFloor}-${lowerFloor + 1}`];
    }

    const currentIndex = points.reduce((nearestIndex, point, index) => {
      const nearest = points[nearestIndex];
      const distance = Math.hypot(point.x - player.x, point.y - player.y);
      const nearestDistance = Math.hypot(nearest.x - player.x, nearest.y - player.y);
      return distance < nearestDistance ? index : nearestIndex;
    }, 0);
    const currentPoint = points[currentIndex];
    const onStairs = this.isOnStairs(player);
    const allowedDistance = onStairs ? 45 : 150;
    if (Math.hypot(currentPoint.x - player.x, currentPoint.y - player.y) > allowedDistance) return [];

    const nextIndex = onStairs
      ? currentIndex + Math.sign(direction)
      : direction > 0 ? currentIndex + 1 : currentIndex - 1;
    const nextPoint = points[nextIndex];
    return nextPoint ? [{ ...nextPoint, action: 'jumping' }] : [];
  }
}
