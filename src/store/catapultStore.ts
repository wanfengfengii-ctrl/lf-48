import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CatapultParams,
  SimulationResult,
  SavedScheme,
  DEFAULT_PARAMS,
} from '@/types/catapult';

interface CatapultState {
  params: CatapultParams;
  currentResult: SimulationResult | null;
  savedSchemes: SavedScheme[];
  isSimulating: boolean;
  setParams: (params: Partial<CatapultParams>) => void;
  resetParams: () => void;
  setCurrentResult: (result: SimulationResult | null) => void;
  setIsSimulating: (simulating: boolean) => void;
  saveScheme: (name: string) => void;
  deleteScheme: (id: string) => void;
  clearSchemes: () => void;
  loadScheme: (id: string) => void;
}

export const useCatapultStore = create<CatapultState>()(
  persist(
    (set, get) => ({
      params: { ...DEFAULT_PARAMS },
      currentResult: null,
      savedSchemes: [],
      isSimulating: false,

      setParams: (newParams) => {
        set((state) => ({
          params: { ...state.params, ...newParams },
          currentResult: null,
        }));
      },

      resetParams: () => {
        set({ params: { ...DEFAULT_PARAMS }, currentResult: null });
      },

      setCurrentResult: (result) => {
        set({ currentResult: result });
      },

      setIsSimulating: (simulating) => {
        set({ isSimulating: simulating });
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
    }),
    {
      name: 'catapult-storage',
      partialize: (state) => ({ savedSchemes: state.savedSchemes }),
    }
  )
);
