import { create } from "zustand";
import { getGroupActivities, type Activity } from "../services/api/activity.api";

interface GroupActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  
  fetchActivities: (groupId: string) => Promise<void>;
  clearActivities: () => void;
}

export const useGroupActivityStore = create<GroupActivityState>((set) => ({
  activities: [],
  isLoading: false,
  error: null,

  fetchActivities: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getGroupActivities(groupId);
      set({ activities: data.activities, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch activities",
        isLoading: false,
      });
    }
  },

  clearActivities: () => {
    set({ activities: [], error: null });
  },
}));
