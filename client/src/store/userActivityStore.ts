import { create } from "zustand";
import { getUserActivities, type Activity } from "../services/api/activity.api";

interface UserActivityState {
  activities: Activity[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  error: string | null;
  
  fetchActivities: () => Promise<void>;
  loadMoreActivities: () => Promise<void>;
  clearActivities: () => void;
}

const PAGE_SIZE = 10;

export const useUserActivityStore = create<UserActivityState>((set, get) => ({
  activities: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  currentPage: 1,
  error: null,

  fetchActivities: async () => {
    set({ isLoading: true, error: null, currentPage: 1 });
    try {
      const data = await getUserActivities(1, PAGE_SIZE);
      set({ 
        activities: data.activities, 
        isLoading: false,
        hasMore: data.activities.length === PAGE_SIZE,
        currentPage: 1,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch activities",
        isLoading: false,
      });
    }
  },

  loadMoreActivities: async () => {
    const { isLoadingMore, hasMore, currentPage } = get();
    
    if (isLoadingMore || !hasMore) return;

    set({ isLoadingMore: true, error: null });
    try {
      const nextPage = currentPage + 1;
      const data = await getUserActivities(nextPage, PAGE_SIZE);
      
      set((state) => ({
        activities: [...state.activities, ...data.activities],
        isLoadingMore: false,
        hasMore: data.activities.length === PAGE_SIZE,
        currentPage: nextPage,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to load more activities",
        isLoadingMore: false,
      });
    }
  },

  clearActivities: () => {
    set({ activities: [], error: null, currentPage: 1, hasMore: true });
  },
}));
