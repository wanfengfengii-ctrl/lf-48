import {
  LogisticsState,
  ShotLogisticsCost,
  RepairResult,
  CatapultParams,
  EnvironmentParams,
} from '@/types/catapult';
import { calculateFailureRate, calculateVisibility } from './environment';

const STAMINA_PER_SHOT_BASE = 3;
const COUNTERWEAR_PER_SHOT = 0.02;
const REPAIR_MATERIALS_PER_UNIT_DURABILITY = 0.5;
const REPAIR_STAMINA_PER_MATERIAL = 0.2;
const REPAIR_TIME_PER_MATERIAL = 0.1;

export function calculateShotCost(
  params: CatapultParams,
  env: EnvironmentParams,
  soldierStamina: number,
  shotsFired: number
): { cost: ShotLogisticsCost; canFire: boolean; failureChance: number } {
  const visibility = calculateVisibility(env);
  const visibilityFactor = 1 + (100 - visibility) / 200;

  const projectileUsed = 1;
  const counterweightUsed = params.counterweight * COUNTERWEAR_PER_SHOT * visibilityFactor;
  const staminaUsed = STAMINA_PER_SHOT_BASE * (params.projectileWeight / 10) * visibilityFactor;
  const wearAndTear = params.counterweight * COUNTERWEAR_PER_SHOT * (shotsFired / 100 + 1);

  const failureChance = calculateFailureRate(env, soldierStamina, shotsFired);

  const canFire = soldierStamina >= staminaUsed * 0.3;

  return {
    cost: {
      projectileUsed: Math.round(projectileUsed * 100) / 100,
      counterweightUsed: Math.round(counterweightUsed * 100) / 100,
      staminaUsed: Math.round(staminaUsed * 100) / 100,
      wearAndTear: Math.round(wearAndTear * 100) / 100,
    },
    canFire,
    failureChance,
  };
}

export function applyShotCost(
  logistics: LogisticsState,
  cost: ShotLogisticsCost
): LogisticsState {
  return {
    ...logistics,
    projectileStock: Math.max(0, logistics.projectileStock - cost.projectileUsed),
    counterweightStock: Math.max(0, logistics.counterweightStock - cost.counterweightUsed),
    soldierStamina: Math.max(0, logistics.soldierStamina - cost.staminaUsed),
    shotsFiredInSession: logistics.shotsFiredInSession + 1,
    totalFatigueAccumulated: logistics.totalFatigueAccumulated + cost.staminaUsed,
  };
}

export function calculateRepair(
  wallDurability: number,
  wallMaxDurability: number,
  repairMaterials: number,
  soldierStamina: number
): RepairResult {
  const damageAmount = wallMaxDurability - wallDurability;

  const maxRepairByMaterials = repairMaterials / REPAIR_MATERIALS_PER_UNIT_DURABILITY;
  const maxRepairByStamina = soldierStamina / REPAIR_STAMINA_PER_MATERIAL * REPAIR_MATERIALS_PER_UNIT_DURABILITY;

  const repairAmount = Math.min(damageAmount, maxRepairByMaterials, maxRepairByStamina);
  const materialsUsed = repairAmount * REPAIR_MATERIALS_PER_UNIT_DURABILITY;
  const staminaUsed = materialsUsed * REPAIR_STAMINA_PER_MATERIAL;
  const timeTaken = materialsUsed * REPAIR_TIME_PER_MATERIAL;

  return {
    materialsUsed: Math.round(materialsUsed * 100) / 100,
    staminaUsed: Math.round(staminaUsed * 100) / 100,
    repairAmount: Math.round(repairAmount * 100) / 100,
    timeTaken: Math.round(timeTaken * 100) / 100,
  };
}

export function applyRepair(
  logistics: LogisticsState,
  repair: RepairResult
): LogisticsState {
  return {
    ...logistics,
    repairMaterials: Math.max(0, logistics.repairMaterials - repair.materialsUsed),
    soldierStamina: Math.max(0, logistics.soldierStamina - repair.staminaUsed),
    totalRepairCount: logistics.totalRepairCount + 1,
  };
}

export function restSoldiers(logistics: LogisticsState, restMinutes: number): LogisticsState {
  const staminaRecovered = restMinutes * 2;
  return {
    ...logistics,
    soldierStamina: Math.min(
      logistics.maxSoldierStamina,
      logistics.soldierStamina + staminaRecovered
    ),
  };
}

export function resupply(
  logistics: LogisticsState,
  projectiles: number,
  counterweight: number,
  materials: number
): LogisticsState {
  return {
    ...logistics,
    projectileStock: Math.min(logistics.maxProjectileStock, logistics.projectileStock + projectiles),
    counterweightStock: Math.min(logistics.maxCounterweightStock, logistics.counterweightStock + counterweight),
    repairMaterials: Math.min(logistics.maxRepairMaterials, logistics.repairMaterials + materials),
  };
}

export function getLogisticsStatus(logistics: LogisticsState): {
  projectileStatus: 'critical' | 'low' | 'normal' | 'full';
  counterweightStatus: 'critical' | 'low' | 'normal' | 'full';
  materialsStatus: 'critical' | 'low' | 'normal' | 'full';
  staminaStatus: 'exhausted' | 'tired' | 'normal' | 'fresh';
  overallReadiness: number;
} {
  const projectileRatio = logistics.projectileStock / logistics.maxProjectileStock;
  const counterweightRatio = logistics.counterweightStock / logistics.maxCounterweightStock;
  const materialsRatio = logistics.repairMaterials / logistics.maxRepairMaterials;
  const staminaRatio = logistics.soldierStamina / logistics.maxSoldierStamina;

  const getStatus = (ratio: number): 'critical' | 'low' | 'normal' | 'full' => {
    if (ratio >= 0.8) return 'full';
    if (ratio >= 0.4) return 'normal';
    if (ratio >= 0.15) return 'low';
    return 'critical';
  };

  const getStaminaStatus = (ratio: number): 'exhausted' | 'tired' | 'normal' | 'fresh' => {
    if (ratio >= 0.8) return 'fresh';
    if (ratio >= 0.5) return 'normal';
    if (ratio >= 0.2) return 'tired';
    return 'exhausted';
  };

  const overallReadiness = (projectileRatio * 0.3 + counterweightRatio * 0.2 + materialsRatio * 0.2 + staminaRatio * 0.3) * 100;

  return {
    projectileStatus: getStatus(projectileRatio),
    counterweightStatus: getStatus(counterweightRatio),
    materialsStatus: getStatus(materialsRatio),
    staminaStatus: getStaminaStatus(staminaRatio),
    overallReadiness: Math.round(overallReadiness * 100) / 100,
  };
}

export function estimateSiegeResourceUsage(
  params: CatapultParams,
  env: EnvironmentParams,
  estimatedShots: number
): {
  projectilesNeeded: number;
  counterweightNeeded: number;
  totalStaminaNeeded: number;
  estimatedTimeMinutes: number;
} {
  const projectilesNeeded = estimatedShots;
  const counterweightNeeded = estimatedShots * params.counterweight * COUNTERWEAR_PER_SHOT * 1.2;
  const totalStaminaNeeded = estimatedShots * STAMINA_PER_SHOT_BASE * (params.projectileWeight / 10);

  const visibility = calculateVisibility(env);
  const visibilityFactor = 1 + (100 - visibility) / 200;
  const baseInterval = 20;
  const estimatedTimeMinutes = (estimatedShots * baseInterval * visibilityFactor) / 60;

  return {
    projectilesNeeded: Math.ceil(projectilesNeeded),
    counterweightNeeded: Math.ceil(counterweightNeeded),
    totalStaminaNeeded: Math.ceil(totalStaminaNeeded),
    estimatedTimeMinutes: Math.round(estimatedTimeMinutes * 10) / 10,
  };
}
