export interface CatapultParams {
  armLength: number;
  counterweight: number;
  projectileWeight: number;
  releaseAngle: number;
}

export interface SimulationResult {
  trajectory: { x: number; y: number }[];
  maxHeight: number;
  distance: number;
  impactVelocity: number;
  flightTime: number;
  status: 'hit' | 'too_close' | 'too_far';
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
