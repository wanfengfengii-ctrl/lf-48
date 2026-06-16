export interface CatapultParams {
  armLength: number;
  counterweight: number;
  projectileWeight: number;
  releaseAngle: number;
}

export interface WindParams {
  windSpeed: number;
  windDirection: number;
  dragCoefficient: number;
}

export interface TargetParams {
  targetDistance: number;
  targetRadius: number;
}

export interface TrajectoryPoint3D {
  x: number;
  y: number;
  z: number;
  t: number;
}

export interface SimulationResult {
  trajectory: { x: number; y: number }[];
  trajectory3D: TrajectoryPoint3D[];
  maxHeight: number;
  distance: number;
  lateralDeviation: number;
  impactVelocity: number;
  flightTime: number;
  status: 'hit' | 'too_close' | 'too_far';
  targetDeviation: number;
  hitError: number;
  isTargetHit: boolean;
}

export interface BatchShotResult {
  id: number;
  trajectory: { x: number; y: number }[];
  trajectory3D: TrajectoryPoint3D[];
  distance: number;
  lateralDeviation: number;
  maxHeight: number;
  flightTime: number;
  impactVelocity: number;
  status: 'hit' | 'too_close' | 'too_far';
  targetDeviation: number;
  isTargetHit: boolean;
  hitError: number;
}

export interface BatchExperimentStats {
  totalShots: number;
  hitCount: number;
  hitRate: number;
  avgDistance: number;
  stdDistance: number;
  avgLateralDeviation: number;
  stdLateralDeviation: number;
  avgMaxHeight: number;
  avgFlightTime: number;
  avgImpactVelocity: number;
  avgTargetDeviation: number;
  minDistance: number;
  maxDistance: number;
  minLateralDeviation: number;
  maxLateralDeviation: number;
  cEP: number;
}

export interface BatchExperimentResult {
  id: string;
  name: string;
  params: CatapultParams;
  windParams: WindParams;
  targetParams: TargetParams;
  shots: BatchShotResult[];
  stats: BatchExperimentStats;
  timestamp: number;
}

export interface SavedScheme {
  id: string;
  name: string;
  params: CatapultParams;
  result: SimulationResult;
  timestamp: number;
}

export const TARGET_MIN_DISTANCE = 80;
export const TARGET_MAX_DISTANCE = 150;
export const RANGE_LIMIT = 250;

export const DEFAULT_PARAMS: CatapultParams = {
  armLength: 3,
  counterweight: 100,
  projectileWeight: 5,
  releaseAngle: 45,
};

export const DEFAULT_WIND_PARAMS: WindParams = {
  windSpeed: 0,
  windDirection: 90,
  dragCoefficient: 0.47,
};

export const DEFAULT_TARGET_PARAMS: TargetParams = {
  targetDistance: 115,
  targetRadius: 5,
};
