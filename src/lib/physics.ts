import {
  CatapultParams,
  WindParams,
  TargetParams,
  SimulationResult,
  BatchShotResult,
  BatchExperimentStats,
  TrajectoryPoint3D,
  TARGET_MIN_DISTANCE,
  TARGET_MAX_DISTANCE,
  RANGE_LIMIT,
} from '@/types/catapult';

const GRAVITY = 9.81;
const GRAVITY_PX = 0.5;
const AIR_DENSITY = 1.225;
const PROJECTILE_RADIUS = 0.05;

export function calculateInitialVelocity(params: CatapultParams): number {
  const { armLength, counterweight, projectileWeight, releaseAngle } = params;

  const efficiency = 0.65;

  const angleRad = (releaseAngle * Math.PI) / 180;
  const heightDrop = armLength * (1 - Math.cos(angleRad));

  const potentialEnergy = counterweight * GRAVITY * heightDrop * efficiency;
  const velocity = Math.sqrt((2 * potentialEnergy) / projectileWeight);

  return Math.min(velocity, 60);
}

export function runSimulation(
  params: CatapultParams,
  windParams: WindParams = { windSpeed: 0, windDirection: 90, dragCoefficient: 0.47 },
  targetParams: TargetParams = { targetDistance: 115, targetRadius: 5 }
): SimulationResult {
  const { releaseAngle, projectileWeight } = params;
  const { windSpeed, windDirection, dragCoefficient } = windParams;
  const { targetDistance, targetRadius } = targetParams;

  const v0 = calculateInitialVelocity(params);
  const angleRad = (releaseAngle * Math.PI) / 180;
  const windDirRad = (windDirection * Math.PI) / 180;

  const v0x = v0 * Math.cos(angleRad);
  const v0y = v0 * Math.sin(angleRad);
  const v0z = 0;

  const windX = windSpeed * Math.cos(windDirRad);
  const windZ = windSpeed * Math.sin(windDirRad);

  const trajectory: { x: number; y: number }[] = [];
  const trajectory3D: TrajectoryPoint3D[] = [];
  const dt = 0.01;

  let x = 0;
  let y = params.armLength * Math.sin(angleRad);
  let z = 0;
  let t = 0;
  let vx = v0x;
  let vy = v0y;
  let vz = v0z;
  let maxHeight = y;
  let flightTime = 0;

  const crossSectionalArea = Math.PI * PROJECTILE_RADIUS * PROJECTILE_RADIUS;

  trajectory.push({ x, y });
  trajectory3D.push({ x, y, z, t });

  while (y >= 0 && x < RANGE_LIMIT) {
    const relVx = vx - windX;
    const relVy = vy;
    const relVz = vz - windZ;

    const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy + relVz * relVz);

    let dragForce = 0;
    if (relSpeed > 0.001) {
      dragForce = 0.5 * dragCoefficient * AIR_DENSITY * crossSectionalArea * relSpeed * relSpeed;
    }

    const ax = -dragForce * relVx / (projectileWeight * (relSpeed || 1));
    const ay = -GRAVITY - dragForce * relVy / (projectileWeight * (relSpeed || 1));
    const az = -dragForce * relVz / (projectileWeight * (relSpeed || 1));

    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;

    x += vx * dt;
    y += vy * dt;
    z += vz * dt;
    t += dt;
    flightTime = t;

    if (y > maxHeight) {
      maxHeight = y;
    }

    if (y >= 0) {
      trajectory.push({ x, y });
      trajectory3D.push({ x, y, z, t });
    }
  }

  if (y < 0) {
    const last = trajectory3D[trajectory3D.length - 1];
    const beforeLast = trajectory3D[trajectory3D.length - 2] || last;
    const tRatio = (0 - beforeLast.y) / (last.y - beforeLast.y || 1);
    x = beforeLast.x + tRatio * (last.x - beforeLast.x);
    z = beforeLast.z + tRatio * (last.z - beforeLast.z);
    y = 0;
    if (trajectory.length > 0) {
      trajectory[trajectory.length - 1] = { x, y };
    }
    if (trajectory3D.length > 0) {
      trajectory3D[trajectory3D.length - 1] = { x, y, z, t };
    }
  }

  const impactVy = vy;
  const impactVelocity = Math.sqrt(vx * vx + impactVy * impactVy + vz * vz);

  const lateralDeviation = z;

  const distanceError = x - targetDistance;
  const targetDeviation = Math.sqrt(distanceError * distanceError + lateralDeviation * lateralDeviation);
  const isTargetHit = targetDeviation <= targetRadius;
  const hitError = targetDeviation;

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
    trajectory3D,
    maxHeight: Math.round(maxHeight * 100) / 100,
    distance: Math.round(x * 100) / 100,
    lateralDeviation: Math.round(lateralDeviation * 100) / 100,
    impactVelocity: Math.round(impactVelocity * 100) / 100,
    flightTime: Math.round(flightTime * 100) / 100,
    status,
    targetDeviation: Math.round(targetDeviation * 100) / 100,
    hitError: Math.round(hitError * 100) / 100,
    isTargetHit,
  };
}

export function runBatchSimulation(
  params: CatapultParams,
  windParams: WindParams,
  targetParams: TargetParams,
  shotCount: number,
  randomness: number = 0.02
): { shots: BatchShotResult[]; stats: BatchExperimentStats } {
  const shots: BatchShotResult[] = [];

  for (let i = 0; i < shotCount; i++) {
    const noisyParams: CatapultParams = {
      ...params,
      releaseAngle: params.releaseAngle * (1 + (Math.random() - 0.5) * randomness),
      counterweight: params.counterweight * (1 + (Math.random() - 0.5) * randomness * 0.5),
    };

    const noisyWind: WindParams = {
      ...windParams,
      windSpeed: Math.max(0, windParams.windSpeed * (1 + (Math.random() - 0.5) * randomness * 2)),
      windDirection: windParams.windDirection + (Math.random() - 0.5) * randomness * 30,
    };

    const result = runSimulation(noisyParams, noisyWind, targetParams);

    shots.push({
      id: i + 1,
      trajectory: result.trajectory,
      trajectory3D: result.trajectory3D,
      distance: result.distance,
      lateralDeviation: result.lateralDeviation,
      maxHeight: result.maxHeight,
      flightTime: result.flightTime,
      impactVelocity: result.impactVelocity,
      status: result.status,
      targetDeviation: result.targetDeviation,
      isTargetHit: result.isTargetHit,
      hitError: result.hitError,
    });
  }

  const stats = calculateBatchStats(shots);

  return { shots, stats };
}

export function calculateBatchStats(
  shots: BatchShotResult[]
): BatchExperimentStats {
  const totalShots = shots.length;
  const hitCount = shots.filter((s) => s.isTargetHit).length;
  const hitRate = totalShots > 0 ? hitCount / totalShots : 0;

  const distances = shots.map((s) => s.distance);
  const lateralDeviations = shots.map((s) => s.lateralDeviation);
  const maxHeights = shots.map((s) => s.maxHeight);
  const flightTimes = shots.map((s) => s.flightTime);
  const impactVelocities = shots.map((s) => s.impactVelocity);
  const targetDeviations = shots.map((s) => s.targetDeviation);

  const avgDistance = mean(distances);
  const stdDistance = stdDev(distances);
  const avgLateralDeviation = mean(lateralDeviations);
  const stdLateralDeviation = stdDev(lateralDeviations);
  const avgMaxHeight = mean(maxHeights);
  const avgFlightTime = mean(flightTimes);
  const avgImpactVelocity = mean(impactVelocities);
  const avgTargetDeviation = mean(targetDeviations);

  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const minLateralDeviation = Math.min(...lateralDeviations);
  const maxLateralDeviation = Math.max(...lateralDeviations);

  const sortedDeviations = [...targetDeviations].sort((a, b) => a - b);
  const cEP = totalShots > 0 ? sortedDeviations[Math.floor(totalShots * 0.5)] : 0;

  return {
    totalShots,
    hitCount,
    hitRate: Math.round(hitRate * 10000) / 100,
    avgDistance: Math.round(avgDistance * 100) / 100,
    stdDistance: Math.round(stdDistance * 100) / 100,
    avgLateralDeviation: Math.round(avgLateralDeviation * 100) / 100,
    stdLateralDeviation: Math.round(stdLateralDeviation * 100) / 100,
    avgMaxHeight: Math.round(avgMaxHeight * 100) / 100,
    avgFlightTime: Math.round(avgFlightTime * 100) / 100,
    avgImpactVelocity: Math.round(avgImpactVelocity * 100) / 100,
    avgTargetDeviation: Math.round(avgTargetDeviation * 100) / 100,
    minDistance: Math.round(minDistance * 100) / 100,
    maxDistance: Math.round(maxDistance * 100) / 100,
    minLateralDeviation: Math.round(minLateralDeviation * 100) / 100,
    maxLateralDeviation: Math.round(maxLateralDeviation * 100) / 100,
    cEP: Math.round(cEP * 100) / 100,
  };
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  const squareDiffs = arr.map((value) => Math.pow(value - m, 2));
  return Math.sqrt(mean(squareDiffs));
}

export { GRAVITY_PX };
