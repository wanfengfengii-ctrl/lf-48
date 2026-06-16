import {
  WallParams,
  ImpactParams,
  SingleImpactResult,
  SiegeState,
  WallMaterialProperties,
  ArmorLayerProperties,
  CrackPoint,
  DamageHeatZone,
  DamageLevel,
  WALL_MATERIAL_PROPERTIES,
  ARMOR_LAYER_PROPERTIES,
  BestParamsSuggestion,
  CatapultParams,
  SimulationResult,
} from '@/types/catapult';
import { calculateInitialVelocity, runSimulation } from './physics';

export function calculateWallMaxDurability(wallParams: WallParams): number {
  const materialProps: WallMaterialProperties = WALL_MATERIAL_PROPERTIES[wallParams.material];
  const armorProps: ArmorLayerProperties = ARMOR_LAYER_PROPERTIES[wallParams.armorLayer];

  const baseDurability = materialProps.durability;
  const thicknessFactor = wallParams.thickness * 0.8;
  const heightFactor = 1 + (wallParams.height - 5) * 0.05;
  const inclineFactor = 1 + (wallParams.inclineAngle / 90) * 0.3;
  const armorFactor = armorProps.durabilityMultiplier;

  return Math.round(baseDurability * thicknessFactor * heightFactor * inclineFactor * armorFactor);
}

export function calculateImpactEnergy(impactParams: ImpactParams): number {
  const { projectileMass, impactVelocity } = impactParams;
  return 0.5 * projectileMass * impactVelocity * impactVelocity;
}

export function calculatePenetrationDepth(
  impactParams: ImpactParams,
  wallParams: WallParams,
  energyOnImpact: number
): { penetrationDepth: number; absorbedEnergy: number; craterRadius: number; craterDepth: number } {
  const materialProps: WallMaterialProperties = WALL_MATERIAL_PROPERTIES[wallParams.material];
  const armorProps: ArmorLayerProperties = ARMOR_LAYER_PROPERTIES[wallParams.armorLayer];

  const armorAbsorbed = (armorProps.energyAbsorption / 100) * energyOnImpact;
  const effectiveEnergy = Math.max(0, energyOnImpact - armorAbsorbed);

  const angleRad = (impactParams.impactAngle * Math.PI) / 180;
  const normalImpactFactor = Math.cos(angleRad);

  const hardnessFactor = 1 / Math.pow(materialProps.hardness, 0.5);
  const compressiveFactor = 1 / Math.pow(materialProps.compressiveStrength, 0.33);
  const thicknessFactor = Math.min(1, wallParams.thickness / 5);

  const penetrationBase = Math.pow(effectiveEnergy * normalImpactFactor, 0.5) * hardnessFactor * compressiveFactor * 0.02;
  const penetrationDepth = Math.min(penetrationBase * thicknessFactor, wallParams.thickness * 0.95);

  const craterRadius = Math.pow(effectiveEnergy, 0.33) * hardnessFactor * 0.05;
  const craterDepth = penetrationDepth * 0.6;

  const absorbedEnergy =
    armorAbsorbed +
    effectiveEnergy * (1 - Math.min(1, penetrationDepth / (wallParams.thickness * 0.95)));

  return {
    penetrationDepth: Math.round(penetrationDepth * 1000) / 1000,
    absorbedEnergy: Math.round(absorbedEnergy * 100) / 100,
    craterRadius: Math.round(craterRadius * 1000) / 1000,
    craterDepth: Math.round(craterDepth * 1000) / 1000,
  };
}

export function calculateDamageScore(
  penetrationDepth: number,
  wallParams: WallParams,
  impactParams: ImpactParams,
  currentDurability: number,
  maxDurability: number
): { damageScore: number; damageLevel: DamageLevel } {
  const materialProps: WallMaterialProperties = WALL_MATERIAL_PROPERTIES[wallParams.material];
  const thicknessRatio = penetrationDepth / wallParams.thickness;
  const durabilityRatio = currentDurability / maxDurability;

  const tensileFactor = 1 / Math.pow(materialProps.tensileStrength, 0.25);
  const cumulativeDamageFactor = 1 + (1 - durabilityRatio) * 0.8;
  const heightFactor = 1 + Math.pow(impactParams.impactHeight / wallParams.height, 2) * 0.5;

  let damageScore =
    Math.pow(thicknessRatio, 0.7) * 100 * tensileFactor * cumulativeDamageFactor * heightFactor;

  damageScore = Math.min(damageScore, maxDurability * 0.3);

  let damageLevel: DamageLevel;
  const scoreRatio = damageScore / maxDurability;

  if (scoreRatio < 0.01) damageLevel = 'none';
  else if (scoreRatio < 0.05) damageLevel = 'superficial';
  else if (scoreRatio < 0.12) damageLevel = 'minor';
  else if (scoreRatio < 0.25) damageLevel = 'moderate';
  else if (scoreRatio < 0.45) damageLevel = 'severe';
  else damageLevel = 'critical';

  return {
    damageScore: Math.round(damageScore * 100) / 100,
    damageLevel,
  };
}

export function generateCrackPropagation(
  wallParams: WallParams,
  impactParams: ImpactParams,
  damageLevel: DamageLevel,
  existingCracks: CrackPoint[]
): CrackPoint[] {
  const newCracks: CrackPoint[] = [];
  const severityMap: Record<DamageLevel, number> = {
    none: 0,
    superficial: 1,
    minor: 2,
    moderate: 4,
    severe: 7,
    critical: 12,
    destroyed: 20,
  };

  const numCracks = severityMap[damageLevel];
  if (numCracks === 0) return newCracks;

  const baseX = impactParams.impactHeight;
  const materialProps = WALL_MATERIAL_PROPERTIES[wallParams.material];
  const crackBias = existingCracks.length > 0 ? 1.5 : 1;

  for (let i = 0; i < numCracks; i++) {
    const isMainBranch = i < Math.ceil(numCracks / 3);
    const angle = isMainBranch
      ? (Math.random() - 0.5) * 60 + 90
      : Math.random() * 360;

    const lengthFactor = isMainBranch ? 1.5 : 0.6;
    const maxLength = (damageLevel === 'critical' ? 2.5 : damageLevel === 'severe' ? 1.5 : 0.8) * lengthFactor * crackBias;
    const length = Math.random() * maxLength + 0.1;

    const nearExisting = existingCracks.some(
      (c) => Math.abs(c.y - baseX) < 1.5 && Math.abs(c.x - 0) < 2
    );
    const startX = (Math.random() - 0.5) * 0.8 + (nearExisting ? (Math.random() - 0.5) * 1.5 : 0);
    const startY = baseX + (Math.random() - 0.5) * 0.5;

    const widthBase = 1 / materialProps.hardness;
    const width = (isMainBranch ? widthBase * 0.08 : widthBase * 0.02) * (1 + Math.random());

    newCracks.push({
      x: Math.round(startX * 1000) / 1000,
      y: Math.round(startY * 1000) / 1000,
      length: Math.round(length * 1000) / 1000,
      angle: Math.round(angle * 10) / 10,
      width: Math.round(width * 10000) / 10000,
    });
  }

  return newCracks;
}

export function calculateDamageHeatZone(
  impactParams: ImpactParams,
  damageScore: number,
  maxDurability: number
): DamageHeatZone {
  const intensityRatio = Math.min(1, damageScore / (maxDurability * 0.3));
  const radius = 1 + intensityRatio * 3 + Math.pow(impactParams.impactVelocity / 30, 0.5);
  const intensity = 0.3 + intensityRatio * 0.7;

  return {
    centerX: 0,
    centerY: impactParams.impactHeight,
    radius: Math.round(radius * 100) / 100,
    intensity: Math.round(intensity * 1000) / 1000,
  };
}

export function calculateCollapseRisk(
  wallParams: WallParams,
  currentDurability: number,
  maxDurability: number,
  totalCracks: number,
  totalDamageScore: number
): number {
  const durabilityRatio = currentDurability / maxDurability;
  const damageRatio = totalDamageScore / maxDurability;
  const heightFactor = wallParams.height / 10;
  const inclineStability = 1 - (wallParams.inclineAngle / 90) * 0.2;

  let risk = 0;
  risk += (1 - durabilityRatio) * 0.5;
  risk += damageRatio * 0.3;
  risk += Math.min(0.2, totalCracks / 100) * 0.2;
  risk *= heightFactor / inclineStability;

  return Math.min(1, Math.max(0, risk));
}

export function calculateWallHitResult(
  impactParams: ImpactParams,
  wallParams: WallParams,
  currentSiegeState: SiegeState
): SingleImpactResult {
  const { wallCurrentDurability, wallMaxDurability, allCracks, totalDamageScore } = currentSiegeState;

  const energyOnImpact = calculateImpactEnergy(impactParams);
  const { penetrationDepth, absorbedEnergy, craterRadius, craterDepth } = calculatePenetrationDepth(
    impactParams,
    wallParams,
    energyOnImpact
  );

  const { damageScore, damageLevel } = calculateDamageScore(
    penetrationDepth,
    wallParams,
    impactParams,
    wallCurrentDurability,
    wallMaxDurability
  );

  const newCracks = generateCrackPropagation(wallParams, impactParams, damageLevel, allCracks);
  const heatZone = calculateDamageHeatZone(impactParams, damageScore, wallMaxDurability);

  const newDurability = Math.max(0, wallCurrentDurability - damageScore);
  const collapseRisk = calculateCollapseRisk(
    wallParams,
    newDurability,
    wallMaxDurability,
    allCracks.length + newCracks.length,
    totalDamageScore + damageScore
  );

  return {
    impactId: Date.now() + Math.random(),
    impactParams,
    energyOnImpact: Math.round(energyOnImpact * 100) / 100,
    absorbedEnergy: Math.round(absorbedEnergy * 100) / 100,
    penetrationDepth,
    damageLevel: newDurability <= 0 ? 'destroyed' : damageLevel,
    damageScore,
    craterRadius,
    craterDepth,
    crackPropagation: newCracks,
    heatZone,
    collapseRisk: Math.round(collapseRisk * 10000) / 100,
    wallDurabilityAfter: Math.round(newDurability * 100) / 100,
    timestamp: Date.now(),
  };
}

export function createInitialSiegeState(wallParams: WallParams): SiegeState {
  const maxDurability = calculateWallMaxDurability(wallParams);
  return {
    wallCurrentDurability: maxDurability,
    wallMaxDurability: maxDurability,
    totalDamageScore: 0,
    impactHistory: [],
    durabilityCurve: [{ shot: 0, durability: maxDurability }],
    allCracks: [],
    allHeatZones: [],
    collapseProbability: 0,
    isDestroyed: false,
  };
}

export function applyImpactToSiegeState(
  prevState: SiegeState,
  impactResult: SingleImpactResult
): SiegeState {
  const newDurability = Math.max(0, prevState.wallCurrentDurability - impactResult.damageScore);
  const isDestroyed = newDurability <= 0;

  return {
    wallCurrentDurability: newDurability,
    wallMaxDurability: prevState.wallMaxDurability,
    totalDamageScore: prevState.totalDamageScore + impactResult.damageScore,
    impactHistory: [...prevState.impactHistory, impactResult],
    durabilityCurve: [
      ...prevState.durabilityCurve,
      {
        shot: prevState.impactHistory.length + 1,
        durability: Math.round(newDurability * 100) / 100,
      },
    ],
    allCracks: [...prevState.allCracks, ...impactResult.crackPropagation],
    allHeatZones: [...prevState.allHeatZones, impactResult.heatZone],
    collapseProbability: impactResult.collapseRisk,
    isDestroyed,
  };
}

export function extractImpactParamsFromSimulation(
  result: SimulationResult,
  wallParams: WallParams,
  projectileWeight: number
): { impactParams: ImpactParams | null; hitWall: boolean } {
  const trajectory3D = result.trajectory3D;
  if (trajectory3D.length < 2) return { impactParams: null, hitWall: false };

  const wallCenterX = 115;
  const wallHalfWidth = 5;
  const wallMinX = wallCenterX - wallHalfWidth;
  const wallMaxX = wallCenterX + wallHalfWidth;

  for (let i = trajectory3D.length - 1; i >= 1; i--) {
    const cur = trajectory3D[i];
    const prev = trajectory3D[i - 1];

    if (prev.x <= wallMaxX && cur.x >= wallMinX) {
      const tRatio = Math.max(0, Math.min(1, (wallCenterX - prev.x) / ((cur.x - prev.x) || 1)));
      const interpolatedY = prev.y + tRatio * (cur.y - prev.y);
      const interpolatedZ = prev.z + tRatio * (cur.z - prev.z);

      const lateralAbs = Math.abs(interpolatedZ);
      if (lateralAbs > wallHalfWidth) continue;
      if (interpolatedY < 0 || interpolatedY > wallParams.height + 2) continue;

      const vx = (cur.x - prev.x) / (cur.t - prev.t || 0.01);
      const vy = (cur.y - prev.y) / (cur.t - prev.t || 0.01);
      const vz = (cur.z - prev.z) / (cur.t - prev.t || 0.01);
      const impactVelocity = Math.sqrt(vx * vx + vy * vy + vz * vz);

      const impactAngle = Math.atan2(Math.abs(vy), Math.sqrt(vx * vx + vz * vz)) * (180 / Math.PI);
      const impactHeight = Math.min(Math.max(0, interpolatedY), wallParams.height);

      return {
        impactParams: {
          projectileMass: projectileWeight,
          impactVelocity: Math.round(impactVelocity * 100) / 100,
          impactAngle: Math.round(impactAngle * 10) / 10,
          impactHeight: Math.round(impactHeight * 100) / 100,
        },
        hitWall: true,
      };
    }
  }

  return { impactParams: null, hitWall: false };
}

export function findBestBreakParams(
  wallParams: WallParams,
  targetDistance: number
): BestParamsSuggestion {
  const bestResults: BestParamsSuggestion[] = [];

  const armLengths = [2, 3, 4, 5, 6, 7, 8];
  const counterweights = [50, 100, 150, 200, 250, 300, 400];
  const projectileWeights = [3, 5, 8, 10, 15, 20, 30];
  const releaseAngles = [30, 35, 40, 45, 50, 55, 60];

  const sampleSize = 40;
  for (let i = 0; i < sampleSize; i++) {
    const armLength = armLengths[Math.floor(Math.random() * armLengths.length)];
    const counterweight = counterweights[Math.floor(Math.random() * counterweights.length)];
    const projectileWeight = projectileWeights[Math.floor(Math.random() * projectileWeights.length)];
    const releaseAngle = releaseAngles[Math.floor(Math.random() * releaseAngles.length)];

    const params: CatapultParams = { armLength, counterweight, projectileWeight, releaseAngle };
    const v0 = calculateInitialVelocity(params);

    const angleRad = (releaseAngle * Math.PI) / 180;
    const vx = v0 * Math.cos(angleRad);
    const vy = v0 * Math.sin(angleRad);
    const t = targetDistance / vx;
    const yAtTarget = vy * t - 0.5 * 9.81 * t * t;

    if (yAtTarget < 0 || yAtTarget > 20) continue;

    const impactVy = vy - 9.81 * t;
    const impactVelocity = Math.sqrt(vx * vx + impactVy * impactVy);
    const impactAngle = Math.atan2(Math.abs(impactVy), vx) * (180 / Math.PI);

    const impactParams: ImpactParams = {
      projectileMass: projectileWeight,
      impactVelocity,
      impactAngle,
      impactHeight: Math.min(wallParams.height, Math.max(0, yAtTarget)),
    };

    const initialState = createInitialSiegeState(wallParams);
    const result = calculateWallHitResult(impactParams, wallParams, initialState);

    const resourceUsed = counterweight * 0.1 + projectileWeight;
    const resourceEfficiency = result.damageScore / Math.pow(resourceUsed, 0.5);
    const shotsToDestroy = Math.ceil(initialState.wallMaxDurability / result.damageScore);

    bestResults.push({
      armLength,
      counterweight,
      projectileWeight,
      releaseAngle,
      expectedDamagePerShot: result.damageScore,
      expectedShotsToDestroy: shotsToDestroy,
      resourceEfficiency: Math.round(resourceEfficiency * 100) / 100,
    });
  }

  bestResults.sort((a, b) => b.resourceEfficiency - a.resourceEfficiency);
  return bestResults[0] || {
    armLength: 5,
    counterweight: 200,
    projectileWeight: 10,
    releaseAngle: 45,
    expectedDamagePerShot: 0,
    expectedShotsToDestroy: 999,
    resourceEfficiency: 0,
  };
}

export function runSiegeBatchSimulation(
  catapultParams: CatapultParams,
  windParams: { windSpeed: number; windDirection: number; dragCoefficient: number },
  wallParams: WallParams,
  maxShots: number,
  randomness: number = 0.02
): {
  siegeState: SiegeState;
  totalShots: number;
  hitsOnWall: number;
  shotsToDestroy: number | null;
  maxPenetration: number;
  totalDamage: number;
} {
  let siegeState = createInitialSiegeState(wallParams);
  let hitsOnWall = 0;
  let shotsToDestroy: number | null = null;
  let maxPenetration = 0;
  let totalDamage = 0;

  for (let i = 0; i < maxShots; i++) {
    if (siegeState.isDestroyed) break;

    const noisyParams: CatapultParams = {
      ...catapultParams,
      releaseAngle: catapultParams.releaseAngle * (1 + (Math.random() - 0.5) * randomness),
      counterweight: catapultParams.counterweight * (1 + (Math.random() - 0.5) * randomness * 0.5),
    };

    const noisyWind = {
      ...windParams,
      windSpeed: Math.max(0, windParams.windSpeed * (1 + (Math.random() - 0.5) * randomness * 2)),
      windDirection: windParams.windDirection + (Math.random() - 0.5) * randomness * 30,
    };

    const simResult = runSimulation(noisyParams, noisyWind, { targetDistance: 115, targetRadius: 5 });
    const { impactParams, hitWall } = extractImpactParamsFromSimulation(
      simResult,
      wallParams,
      catapultParams.projectileWeight
    );

    if (hitWall && impactParams) {
      hitsOnWall++;
      const impactResult = calculateWallHitResult(impactParams, wallParams, siegeState);
      siegeState = applyImpactToSiegeState(siegeState, impactResult);

      if (impactResult.penetrationDepth > maxPenetration) {
        maxPenetration = impactResult.penetrationDepth;
      }
      totalDamage += impactResult.damageScore;

      if (siegeState.isDestroyed && shotsToDestroy === null) {
        shotsToDestroy = i + 1;
      }
    }
  }

  return {
    siegeState,
    totalShots: maxShots,
    hitsOnWall,
    shotsToDestroy,
    maxPenetration: Math.round(maxPenetration * 1000) / 1000,
    totalDamage: Math.round(totalDamage * 100) / 100,
  };
}
