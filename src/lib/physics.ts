import {
  CatapultParams,
  SimulationResult,
  TARGET_MIN_DISTANCE,
  TARGET_MAX_DISTANCE,
  RANGE_LIMIT,
} from '@/types/catapult';

const GRAVITY = 9.81;
const GRAVITY_PX = 0.5;

export function calculateInitialVelocity(params: CatapultParams): number {
  const { armLength, counterweight, projectileWeight, releaseAngle } = params;

  const ratio = counterweight / projectileWeight;
  const efficiency = 0.65;

  const angleRad = (releaseAngle * Math.PI) / 180;
  const heightDrop = armLength * (1 - Math.cos(angleRad));

  const potentialEnergy = counterweight * GRAVITY * heightDrop * efficiency;
  const velocity = Math.sqrt((2 * potentialEnergy) / projectileWeight);

  return Math.min(velocity, 60);
}

export function runSimulation(params: CatapultParams): SimulationResult {
  const { releaseAngle } = params;

  const v0 = calculateInitialVelocity(params);
  const angleRad = (releaseAngle * Math.PI) / 180;

  const v0x = v0 * Math.cos(angleRad);
  const v0y = v0 * Math.sin(angleRad);

  const trajectory: { x: number; y: number }[] = [];
  const dt = 0.02;

  let x = 0;
  let y = params.armLength * Math.sin(angleRad);
  let vy = v0y;
  let maxHeight = y;
  let flightTime = 0;

  trajectory.push({ x, y });

  while (y >= 0 && x < RANGE_LIMIT) {
    vy -= GRAVITY * dt;
    x += v0x * dt;
    y += vy * dt;
    flightTime += dt;

    if (y > maxHeight) {
      maxHeight = y;
    }

    if (y >= 0) {
      trajectory.push({ x, y });
    }
  }

  if (y < 0) {
    const last = trajectory[trajectory.length - 1];
    const beforeLast = trajectory[trajectory.length - 2] || last;
    const t = (0 - beforeLast.y) / (last.y - beforeLast.y || 1);
    x = beforeLast.x + t * (last.x - beforeLast.x);
    y = 0;
    trajectory.push({ x, y: 0 });
  }

  const impactVy = vy;
  const impactVelocity = Math.sqrt(v0x * v0x + impactVy * impactVy);

  let status: 'hit' | 'too_close' | 'too_far';
  if (x >= TARGET_MIN_DISTANCE && x <= TARGET_MAX_DISTANCE) {
    status = 'hit';
  } else if (x < TARGET_MIN_DISTANCE) {
    status = 'too_close';
  } else {
    status = 'too_far';
  }

  return {
    trajectory,
    maxHeight: Math.round(maxHeight * 100) / 100,
    distance: Math.round(x * 100) / 100,
    impactVelocity: Math.round(impactVelocity * 100) / 100,
    flightTime: Math.round(flightTime * 100) / 100,
    status,
  };
}

export { GRAVITY_PX };
