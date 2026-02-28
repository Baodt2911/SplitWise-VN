/**
 * Reset all stores on logout
 * This ensures no data from the previous user persists
 */
import { queryClient } from "../lib/queryClient";
import { usePreferencesStore } from "./preferencesStore";

export const resetAllStores = () => {
  // Clear all React Query caches for server-state
  queryClient.clear();

  console.log("[Stores] All stores have been reset");
};
