import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CategoryResponse, ExpenseCategory, getExpenseCategories } from "../services/api/category.api";

export interface CategoryState {
  categories: CategoryResponse;
  isLoading: boolean;
  error: string | null;
  fetchCategories: (force?: boolean) => Promise<void>;
  reset: () => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: {},
      isLoading: false,
      error: null,

      fetchCategories: async (force = false) => {
        const { categories, isLoading } = get();

        // Check if categories is an array (legacy invalid state), reset if so
        if (Array.isArray(categories)) {
          set({ categories: {} });
          // Proceed to fetch
        } else if (!force && Object.keys(categories).length > 0) {
           // If data exists (valid object keys) and not forcing refresh, return early
          return;
        }

        // If already loading, avoid duplicate requests
        if (isLoading) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const data = await getExpenseCategories();
          set({ categories: data, isLoading: false });
        } catch (error: any) {
          console.error("Failed to fetch categories:", error);
          set({
            error: error.message || "Failed to fetch categories",
            isLoading: false,
          });
        }
      },

      reset: () => {
        set({ categories: {}, isLoading: false, error: null });
      },
    }),
    {
      name: "category-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ categories: state.categories }), // Only persist categories
    }
  )
);
