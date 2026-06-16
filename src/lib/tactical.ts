import {
  TacticalCombo,
  TacticalComparisonResult,
  WallParams,
  CatapultParams,
  WindParams,
  EnvironmentParams,
  LogisticsState,
  DEFAULT_LOGISTICS_STATE,
} from '@/types/catapult';
import { runSimulation } from './physics';
import {
  createInitialSiegeState,
  applyImpactToSiegeState,
  calculateWallHitResult,
  extractImpactParamsFromSimulation,
} from './siegePhysics';
import {
  calculateAccuracyModifier,
  calculateVisibility,
  modifyWindParams,
  calculateFailureRate,
  calculateShotInterval,
  calculateNightBattleStats,
} from './environment';
import {
  calculateShotCost,
  applyShotCost,
  calculateRepair,
  applyRepair,
} from './logistics';

export function runTacticalSimulation(
  combo: TacticalCombo,
  wallParams: WallParams,
  baseWindParams: WindParams,
  maxShots: number = 200
): TacticalComparisonResult {
  const env: EnvironmentParams = {
    timeOfDay: combo.timeOfDay,
    weather: combo.weather,
    moonPhase: combo.moonPhase,
    torchCount: combo.torchCount,
    visibility: 100,
  };

  env.visibility = calculateVisibility(env);

  const catapultParams: CatapultParams = {
    armLength: 5,
    counterweight: combo.counterweight,
    projectileWeight: combo.projectileWeight,
    releaseAngle: combo.releaseAngle,
  };

  const modifiedWind = modifyWindParams(baseWindParams, env);
  const accuracyMod = calculateAccuracyModifier(env);

  let siegeState = createInitialSiegeState(wallParams);
  let logistics: LogisticsState = { ...DEFAULT_LOGISTICS_STATE };
  let totalTimeMinutes = 0;
  let hitsOnWall = 0;
  let totalDamage = 0;
  let shotsFired = 0;
  let repairsDone = 0;

  for (let i = 0; i < maxShots; i++) {
    if (siegeState.isDestroyed) break;
    if (logistics.projectileStock <= 0 || logistics.soldierStamina <= 5) break;

    const shotCostResult = calculateShotCost(
      catapultParams,
      env,
      logistics.soldierStamina,
      logistics.shotsFiredInSession
    );

    if (!shotCostResult.canFire) break;

    const failureRoll = Math.random();
    if (failureRoll < shotCostResult.failureChance) {
      logistics = applyShotCost(logistics, shotCostResult.cost);
      shotsFired++;
      const interval = calculateShotInterval(combo.shotInterval, env, logistics.soldierStamina);
      totalTimeMinutes += interval / 60;
      continue;
    }

    const noisyParams: CatapultParams = {
      ...catapultParams,
      releaseAngle: catapultParams.releaseAngle * (1 + (Math.random() - 0.5) * 0.03 / accuracyMod),
      counterweight: catapultParams.counterweight * (1 + (Math.random() - 0.5) * 0.01),
    };

    const noisyWind = {
      ...modifiedWind,
      windSpeed: Math.max(0, modifiedWind.windSpeed * (1 + (Math.random() - 0.5) * 0.3)),
      windDirection: modifiedWind.windDirection + (Math.random() - 0.5) * 20,
    };

    const simResult = runSimulation(noisyParams, noisyWind, { targetDistance: 115, targetRadius: 5 });
    const { impactParams, hitWall } = extractImpactParamsFromSimulation(
      simResult,
      wallParams,
      catapultParams.projectileWeight
    );

    logistics = applyShotCost(logistics, shotCostResult.cost);
    shotsFired++;

    const interval = calculateShotInterval(combo.shotInterval, env, logistics.soldierStamina);
    totalTimeMinutes += interval / 60;

    if (hitWall && impactParams) {
      const impactResult = calculateWallHitResult(impactParams, wallParams, siegeState);
      siegeState = applyImpactToSiegeState(siegeState, impactResult);
      hitsOnWall++;
      totalDamage += impactResult.damageScore;

      const wallDurabilityRatio = siegeState.wallCurrentDurability / siegeState.wallMaxDurability;
      if (wallDurabilityRatio < 1 - combo.repairThreshold / 100 && logistics.repairMaterials > 10) {
        const repair = calculateRepair(
          siegeState.wallCurrentDurability,
          siegeState.wallMaxDurability,
          logistics.repairMaterials,
          logistics.soldierStamina
        );
        if (repair.materialsUsed > 5) {
          logistics = applyRepair(logistics, repair);
          siegeState = {
            ...siegeState,
            wallCurrentDurability: Math.min(
              siegeState.wallMaxDurability,
              siegeState.wallCurrentDurability + repair.repairAmount
            ),
          };
          totalTimeMinutes += repair.timeTaken;
          repairsDone++;
        }
      }
    }
  }

  const hitRate = shotsFired > 0 ? hitsOnWall / shotsFired : 0;
  const avgDamagePerShot = hitsOnWall > 0 ? totalDamage / hitsOnWall : 0;

  const nightStats = calculateNightBattleStats(env);

  const totalProjectilesUsed = logistics.shotsFiredInSession;
  const totalCounterweightUsed = DEFAULT_LOGISTICS_STATE.counterweightStock - logistics.counterweightStock;
  const totalRepairMaterialsUsed = DEFAULT_LOGISTICS_STATE.repairMaterials - logistics.repairMaterials;
  const soldierFatigue = DEFAULT_LOGISTICS_STATE.maxSoldierStamina - logistics.soldierStamina;

  const totalResourceCost =
    totalProjectilesUsed * 2 +
    totalCounterweightUsed * 0.5 +
    totalRepairMaterialsUsed * 1 +
    soldierFatigue * 0.3;

  const costEffectiveness = totalResourceCost > 0 ? (siegeState.totalDamageScore / totalResourceCost) * 100 : 0;

  const breakSpeedScore = siegeState.isDestroyed
    ? (1000 / (totalTimeMinutes || 1))
    : (siegeState.totalDamageScore / siegeState.wallMaxDurability) * 50;

  const resourceScore = Math.min(100, costEffectiveness);
  const nightSuccessScore = nightStats.nightSuccessRate;
  const damageScore = Math.min(100, (siegeState.totalDamageScore / siegeState.wallMaxDurability) * 100);

  const overallScore =
    breakSpeedScore * 0.3 +
    resourceScore * 0.25 +
    nightSuccessScore * 0.2 +
    damageScore * 0.25;

  return {
    id: combo.id + '-' + Date.now(),
    name: combo.name,
    combo,
    shotsToDestroy: siegeState.isDestroyed ? shotsFired : null,
    wallDestroyed: siegeState.isDestroyed,
    totalTimeMinutes: Math.round(totalTimeMinutes * 100) / 100,
    totalProjectilesUsed,
    totalCounterweightUsed: Math.round(totalCounterweightUsed * 100) / 100,
    totalRepairMaterialsUsed: Math.round(totalRepairMaterialsUsed * 100) / 100,
    soldierFatigue: Math.round(soldierFatigue * 100) / 100,
    nightSuccessRate: nightStats.nightSuccessRate,
    avgDamagePerShot: Math.round(avgDamagePerShot * 100) / 100,
    hitRate: Math.round(hitRate * 10000) / 100,
    costEffectiveness: Math.round(costEffectiveness * 100) / 100,
    overallScore: Math.round(overallScore * 100) / 100,
    durabilityCurve: [...siegeState.durabilityCurve],
    timestamp: Date.now(),
  };
}

export function compareTacticalResults(
  results: TacticalComparisonResult[]
): { ranked: TacticalComparisonResult[]; bestByCategory: Record<string, TacticalComparisonResult> } {
  const ranked = [...results].sort((a, b) => b.overallScore - a.overallScore);

  const bestByCategory: Record<string, TacticalComparisonResult> = {};

  if (results.length === 0) return { ranked, bestByCategory };

  bestByCategory.overall = ranked[0];

  bestByCategory.fastest = [...results]
    .filter((r) => r.wallDestroyed)
    .sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes)[0] || ranked[0];

  bestByCategory.mostEfficient = [...results]
    .sort((a, b) => b.costEffectiveness - a.costEffectiveness)[0];

  bestByCategory.mostAccurate = [...results]
    .sort((a, b) => b.hitRate - a.hitRate)[0];

  bestByCategory.nightBest = [...results]
    .sort((a, b) => b.nightSuccessRate - a.nightSuccessRate)[0];

  return { ranked, bestByCategory };
}
