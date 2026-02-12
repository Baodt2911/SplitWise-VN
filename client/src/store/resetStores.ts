/**
 * Reset all stores on logout
 * This ensures no data from the previous user persists
 */
import { useGroupStore } from "./groupStore";
import { useNotificationStore } from "./notificationStore";
import { useUserActivityStore } from "./userActivityStore";
import { useUserStore } from "./userStore";
import { usePreferencesStore } from "./preferencesStore";

export const resetAllStores = () => {
  // Reset group store
  useGroupStore.getState().reset();

  // Reset notification store - manually reset state
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    currentPage: 1,
    hasMore: true,
    isLoadingMore: false,
  });

  // Reset user activity store
  useUserActivityStore.getState().clearActivities();

  // Reset user store
  useUserStore.setState({
    activities: [],
    isLoadingActivities: false,
  });

  console.log("[Stores] All stores have been reset");
};
