import { create } from "zustand";
import { 
  updateProfile, 
  updateSettings, 
  getActivities, 
  getNotifications,
  type UpdateProfileRequest,
  type UpdateSettingsRequest
} from "../services/api/user.api";
import { useAuthStore } from "./authStore";

interface UserState {
  // Stats/Activities (Global)
  activities: any[];
  isLoadingActivities: boolean;
  
  // Actions
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  updateSettings: (data: UpdateSettingsRequest) => Promise<void>;
  fetchActivities: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  activities: [],
  isLoadingActivities: false,

  updateProfile: async (data) => {
    try {
      const response = await updateProfile(data);
      if ("user" in response) {
        // Update auth store user
        useAuthStore.getState().setUser(response.user);
      }
    } catch (error) {
      throw error;
    }
  },

  updateSettings: async (data) => {
    try {
      const response = await updateSettings(data);
      if (response.user) {
         useAuthStore.getState().setUser(response.user);
      }
    } catch (error) {
      throw error;
    }
  },

  fetchActivities: async () => {
    set({ isLoadingActivities: true });
    try {
      const data = await getActivities();
      set({ activities: data, isLoadingActivities: false });
    } catch (error) {
      set({ isLoadingActivities: false });
      console.error("Failed to fetch activities", error);
    }
  }
}));
