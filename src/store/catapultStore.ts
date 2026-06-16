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
} from '@/types/catapult';
import { runSimulation, runBatchSimulation } from '@/lib/physics';

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
  setParams: (params: Partial<CatapultParams>) => void;
  resetParams: () => void;
  setWindParams: (params: Partial<WindParams>) => void;
  resetWindParams: () => void;
  setTargetParams: (params: Partial<TargetParams>) => void;
  resetTargetParams: () => void;
  setCurrentResult: (result: SimulationResult | null) => void;
  setIsSimulating: (simulating: boolean) => void;
  runSingleSimulation: () => void;
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
    }),
    {
      name: 'catapult-storage',
      partialize: (state) => ({
        savedSchemes: state.savedSchemes,
        batchExperiments: state.batchExperiments,
      }),
    }
  )
);
