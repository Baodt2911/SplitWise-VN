import { create } from "zustand";
import {
  getBalancesStats,
  type BalancesStats,
  type BalanceDetail,
} from "../services/api/stats.api";

interface BalanceStatsState {
  data: BalancesStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  fetchBalances: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  reset: () => void;
}

export const useBalanceStatsStore = create<BalanceStatsState>((set, get) => ({
  data: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchBalances: async () => {
    // Skip if already loading
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const result = await getBalancesStats();
      set({ data: result, isLoading: false });
    } catch (error: any) {
      console.error("[BalanceStats] Failed to fetch:", error);
      set({
        error: error.message || "Không thể tải dữ liệu",
        isLoading: false,
      });
    }
  },

  refreshBalances: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const result = await getBalancesStats();
      set({ data: result, isRefreshing: false });
    } catch (error: any) {
      console.error("[BalanceStats] Failed to refresh:", error);
      set({
        error: error.message || "Không thể tải dữ liệu",
        isRefreshing: false,
      });
    }
  },

  reset: () => {
    set({
      data: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
    });
  },
}));
