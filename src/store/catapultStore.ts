import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CatapultParams,
  WindParams,
  TargetParams,
  SimulationResult,
  SavedScheme,
  BatchExperimentResult,
  BatchShotResult,
  DEFAULT_PARAMS,
  DEFAULT_WIND_PARAMS,
  DEFAULT_TARGET_PARAMS,
  WallParams,
  DEFAULT_WALL_PARAMS,
  SiegeState,
  SingleImpactResult,
  SiegeExperimentResult,
  BestParamsSuggestion,
} from '@/types/catapult';
import { runSimulation, runBatchSimulation } from '@/lib/physics';
import {
  createInitialSiegeState,
  applyImpactToSiegeState,
  calculateWallHitResult,
  extractImpactParamsFromSimulation,
  findBestBreakParams,
  runSiegeBatchSimulation,
  calculateWallMaxDurability,
} from '@/lib/siegePhysics';

interface CatapultState {
  params: CatapultParams;
  windParams: WindParams;
  targetParams: TargetParams;
  currentResult: SimulationResult | null;
  savedSchemes: SavedScheme[];
  batchExperiments: BatchExperimentResult[];
  currentBatchShots: BatchShotResult[];
  currentBatchStats: BatchExperimentResult['stats'] | null;
  isSimulating: boolean;
  isBatchSimulating: boolean;
  activeExperimentId: string | null;
  wallParams: WallParams;
  siegeState: SiegeState;
  currentImpactResult: SingleImpactResult | null;
  siegeExperiments: SiegeExperimentResult[];
  isSiegeSimulating: boolean;
  activeSiegeExperimentId: string | null;
  bestParamsSuggestion: BestParamsSuggestion | null;
  setParams: (params: Partial<CatapultParams>) => void;
  resetParams: () => void;
  setWindParams: (params: Partial<WindParams>) => void;
  resetWindParams: () => void;
  setTargetParams: (params: Partial<TargetParams>) => void;
  resetTargetParams: () => void;
  setCurrentResult: (result: SimulationResult | null) => void;
  setIsSimulating: (simulating: boolean) => void;
  runSingleSimulation: () => void;
  runSingleSimulationWithSiege: () => void;
  runBatchSimulation: (shotCount: number, randomness?: number) => void;
  stopBatchSimulation: () => void;
  clearCurrentBatch: () => void;
  saveScheme: (name: string) => void;
  deleteScheme: (id: string) => void;
  clearSchemes: () => void;
  loadScheme: (id: string) => void;
  saveBatchExperiment: (name: string) => void;
  deleteBatchExperiment: (id: string) => void;
  clearBatchExperiments: () => void;
  loadBatchExperiment: (id: string) => void;
  setActiveExperiment: (id: string | null) => void;
  setWallParams: (params: Partial<WallParams>) => void;
  resetWallParams: () => void;
  resetSiegeState: () => void;
  applyImpactToState: (result: SingleImpactResult) => void;
  processSimulationForSiege: (simResult: SimulationResult) => void;
  runSiegeBatch: (maxShots: number) => void;
  saveSiegeExperiment: (name: string) => void;
  deleteSiegeExperiment: (id: string) => void;
  clearSiegeExperiments: () => void;
  loadSiegeExperiment: (id: string) => void;
  setActiveSiegeExperiment: (id: string | null) => void;
  computeBestParams: () => void;
}

export const useCatapultStore = create<CatapultState>()(
  persist(
    (set, get) => ({
      params: { ...DEFAULT_PARAMS },
      windParams: { ...DEFAULT_WIND_PARAMS },
      targetParams: { ...DEFAULT_TARGET_PARAMS },
      currentResult: null,
      savedSchemes: [],
      batchExperiments: [],
      currentBatchShots: [],
      currentBatchStats: null,
      isSimulating: false,
      isBatchSimulating: false,
      activeExperimentId: null,
      wallParams: { ...DEFAULT_WALL_PARAMS },
      siegeState: createInitialSiegeState(DEFAULT_WALL_PARAMS),
      currentImpactResult: null,
      siegeExperiments: [],
      isSiegeSimulating: false,
      activeSiegeExperimentId: null,
      bestParamsSuggestion: null,

      setParams: (newParams) => {
        set((state) => ({
          params: { ...state.params, ...newParams },
          currentResult: null,
        }));
      },

      resetParams: () => {
        set({ params: { ...DEFAULT_PARAMS }, currentResult: null });
      },

      setWindParams: (newParams) => {
        set((state) => ({
          windParams: { ...state.windParams, ...newParams },
          currentResult: null,
        }));
      },

      resetWindParams: () => {
        set({ windParams: { ...DEFAULT_WIND_PARAMS }, currentResult: null });
      },

      setTargetParams: (newParams) => {
        set((state) => ({
          targetParams: { ...state.targetParams, ...newParams },
          currentResult: null,
        }));
      },

      resetTargetParams: () => {
        set({ targetParams: { ...DEFAULT_TARGET_PARAMS }, currentResult: null });
      },

      setCurrentResult: (result) => {
        set({ currentResult: result });
      },

      setIsSimulating: (simulating) => {
        set({ isSimulating: simulating });
      },

      runSingleSimulation: () => {
        const { params, windParams, targetParams } = get();
        const result = runSimulation(params, windParams, targetParams);
        set({ currentResult: result });
      },

      runSingleSimulationWithSiege: () => {
        const { params, windParams, targetParams } = get();
        const result = runSimulation(params, windParams, targetParams);
        set({ currentResult: result });
        get().processSimulationForSiege(result);
      },

      runBatchSimulation: (shotCount: number, randomness: number = 0.02) => {
        const { params, windParams, targetParams } = get();
        set({ isBatchSimulating: true, currentBatchShots: [], currentBatchStats: null });

        const { shots, stats } = runBatchSimulation(params, windParams, targetParams, shotCount, randomness);

        set({
          currentBatchShots: shots,
          currentBatchStats: stats,
          isBatchSimulating: false,
        });
      },

      stopBatchSimulation: () => {
        set({ isBatchSimulating: false });
      },

      clearCurrentBatch: () => {
        set({ currentBatchShots: [], currentBatchStats: null });
      },

      saveScheme: (name) => {
        const { params, currentResult } = get();
        if (!currentResult) return;

        const newScheme: SavedScheme = {
          id: Date.now().toString(),
          name,
          params: { ...params },
          result: currentResult,
          timestamp: Date.now(),
        };

        set((state) => ({
          savedSchemes: [...state.savedSchemes, newScheme],
        }));
      },

      deleteScheme: (id) => {
        set((state) => ({
          savedSchemes: state.savedSchemes.filter((s) => s.id !== id),
        }));
      },

      clearSchemes: () => {
        set({ savedSchemes: [] });
      },

      loadScheme: (id) => {
        const scheme = get().savedSchemes.find((s) => s.id === id);
        if (scheme) {
          set({
            params: { ...scheme.params },
            currentResult: scheme.result,
          });
        }
      },

      saveBatchExperiment: (name) => {
        const { params, windParams, targetParams, currentBatchShots, currentBatchStats } = get();
        if (!currentBatchStats || currentBatchShots.length === 0) return;

        const newExperiment: BatchExperimentResult = {
          id: Date.now().toString(),
          name,
          params: { ...params },
          windParams: { ...windParams },
          targetParams: { ...targetParams },
          shots: [...currentBatchShots],
          stats: { ...currentBatchStats },
          timestamp: Date.now(),
        };

        set((state) => ({
          batchExperiments: [...state.batchExperiments, newExperiment],
          activeExperimentId: newExperiment.id,
        }));
      },

      deleteBatchExperiment: (id) => {
        set((state) => ({
          batchExperiments: state.batchExperiments.filter((e) => e.id !== id),
          activeExperimentId: state.activeExperimentId === id ? null : state.activeExperimentId,
        }));
      },

      clearBatchExperiments: () => {
        set({ batchExperiments: [], activeExperimentId: null });
      },

      loadBatchExperiment: (id) => {
        const experiment = get().batchExperiments.find((e) => e.id === id);
        if (experiment) {
          set({
            params: { ...experiment.params },
            windParams: { ...experiment.windParams },
            targetParams: { ...experiment.targetParams },
            currentBatchShots: [...experiment.shots],
            currentBatchStats: { ...experiment.stats },
            activeExperimentId: id,
          });
        }
      },

      setActiveExperiment: (id) => {
        set({ activeExperimentId: id });
      },

      setWallParams: (newWallParams) => {
        set((state) => {
          const updatedWall = { ...state.wallParams, ...newWallParams };
          return {
            wallParams: updatedWall,
            siegeState: createInitialSiegeState(updatedWall),
            currentImpactResult: null,
          };
        });
      },

      resetWallParams: () => {
        set({
          wallParams: { ...DEFAULT_WALL_PARAMS },
          siegeState: createInitialSiegeState(DEFAULT_WALL_PARAMS),
          currentImpactResult: null,
        });
      },

      resetSiegeState: () => {
        const { wallParams } = get();
        set({
          siegeState: createInitialSiegeState(wallParams),
          currentImpactResult: null,
        });
      },

      applyImpactToState: (impactResult) => {
        set((state) => ({
          siegeState: applyImpactToSiegeState(state.siegeState, impactResult),
          currentImpactResult: impactResult,
        }));
      },

      processSimulationForSiege: (simResult) => {
        const { wallParams, siegeState, params } = get();
        if (siegeState.isDestroyed) return;

        const { impactParams, hitWall } = extractImpactParamsFromSimulation(
          simResult,
          wallParams,
          params.projectileWeight
        );

        // 无论是否命中城墙，发射数都要累加
        set((state) => ({
          siegeState: {
            ...state.siegeState,
            totalShotsFired: state.siegeState.totalShotsFired + 1,
          },
        }));

        if (hitWall && impactParams) {
          const stateAfterShot = get().siegeState;
          const impactResult = calculateWallHitResult(impactParams, wallParams, stateAfterShot);
          get().applyImpactToState(impactResult);
        }
      },

      runSiegeBatch: (maxShots: number) => {
        const { params, windParams, wallParams, siegeState } = get();
        if (siegeState.isDestroyed) return;

        set({ isSiegeSimulating: true });

        setTimeout(() => {
          const result = runSiegeBatchSimulation(params, windParams, wallParams, maxShots, 0.02);
          const currentState = get().siegeState;

          let mergedState = { 
            ...currentState, 
            totalShotsFired: currentState.totalShotsFired + result.totalShots
          };
          result.siegeState.impactHistory.forEach((impact) => {
            mergedState = applyImpactToSiegeState(mergedState, impact);
          });

          const lastImpact = result.siegeState.impactHistory[result.siegeState.impactHistory.length - 1] || null;

          set({
            siegeState: mergedState,
            currentImpactResult: lastImpact,
            isSiegeSimulating: false,
          });
        }, 50);
      },

      saveSiegeExperiment: (name) => {
        const { wallParams, params, windParams, siegeState } = get();
        if (siegeState.impactHistory.length === 0) return;

        const shotCount = siegeState.totalShotsFired;
        const totalProjectilesKg = shotCount * params.projectileWeight;
        const totalCounterweightKg = params.counterweight * shotCount * 0.01;
        const totalKg = totalProjectilesKg + totalCounterweightKg;

        const avgDamage = siegeState.totalDamageScore / Math.max(1, siegeState.impactHistory.length);
        const maxPen = siegeState.impactHistory.reduce((m, i) => Math.max(m, i.penetrationDepth), 0);

        const resourceEfficiency = totalKg > 0 ? siegeState.totalDamageScore / totalKg : 0;
        const damageEfficiency = shotCount > 0 ? siegeState.totalDamageScore / shotCount : 0;

        const newExperiment: SiegeExperimentResult = {
          id: Date.now().toString(),
          name,
          wallParams: { ...wallParams },
          catapultParams: { ...params },
          windParams: { ...windParams },
          shotCount,
          totalShotsFired: shotCount,
          hitsOnWall: siegeState.impactHistory.length,
          wallDestroyed: siegeState.isDestroyed,
          shotsToDestroy: siegeState.isDestroyed ? siegeState.impactHistory.length : null,
          totalDamageScore: siegeState.totalDamageScore,
          maxPenetrationDepth: maxPen,
          avgDamagePerShot: Math.round(avgDamage * 100) / 100,
          resourceConsumption: {
            counterweightKg: Math.round(totalCounterweightKg * 100) / 100,
            projectilesKg: totalProjectilesKg,
            totalKg: Math.round(totalKg * 100) / 100,
          },
          damageEfficiency: Math.round(damageEfficiency * 100) / 100,
          resourceEfficiency: Math.round(resourceEfficiency * 10000) / 100,
          durabilityCurve: [...siegeState.durabilityCurve],
          impactHistory: [...siegeState.impactHistory],
          timestamp: Date.now(),
        };

        set((state) => ({
          siegeExperiments: [...state.siegeExperiments, newExperiment],
          activeSiegeExperimentId: newExperiment.id,
        }));
      },

      deleteSiegeExperiment: (id) => {
        set((state) => ({
          siegeExperiments: state.siegeExperiments.filter((e) => e.id !== id),
          activeSiegeExperimentId: state.activeSiegeExperimentId === id ? null : state.activeSiegeExperimentId,
        }));
      },

      clearSiegeExperiments: () => {
        set({ siegeExperiments: [], activeSiegeExperimentId: null });
      },

      loadSiegeExperiment: (id) => {
        const experiment = get().siegeExperiments.find((e) => e.id === id);
        if (experiment) {
          const maxDur = calculateWallMaxDurability(experiment.wallParams);
          set({
            wallParams: { ...experiment.wallParams },
            params: { ...experiment.catapultParams },
            windParams: { ...experiment.windParams },
            siegeState: {
              wallCurrentDurability: experiment.durabilityCurve[experiment.durabilityCurve.length - 1]?.durability ?? maxDur,
              wallMaxDurability: maxDur,
              totalDamageScore: experiment.totalDamageScore,
              impactHistory: [...experiment.impactHistory],
              durabilityCurve: [...experiment.durabilityCurve],
              allCracks: experiment.impactHistory.flatMap((h) => h.crackPropagation),
              allHeatZones: experiment.impactHistory.map((h) => h.heatZone),
              collapseProbability: experiment.impactHistory[experiment.impactHistory.length - 1]?.collapseRisk ?? 0,
              isDestroyed: experiment.wallDestroyed,
              totalShotsFired: experiment.totalShotsFired,
            },
            activeSiegeExperimentId: id,
            currentImpactResult: experiment.impactHistory[experiment.impactHistory.length - 1] || null,
          });
        }
      },

      setActiveSiegeExperiment: (id) => {
        set({ activeSiegeExperimentId: id });
      },

      computeBestParams: () => {
        const { wallParams, targetParams } = get();
        const suggestion = findBestBreakParams(wallParams, targetParams.targetDistance);
        set({ bestParamsSuggestion: suggestion });
      },
    }),
    {
      name: 'catapult-storage',
      partialize: (state) => ({
        savedSchemes: state.savedSchemes,
        batchExperiments: state.batchExperiments,
        siegeExperiments: state.siegeExperiments,
      }),
    }
  )
);
