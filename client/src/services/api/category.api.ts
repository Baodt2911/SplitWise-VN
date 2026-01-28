import { apiClient } from "./config";

export interface ExpenseCategory {
  id: number;
  name: string;
  slug: string;
  key: string; // Mapping key for i18n and icons
  icon: string;
  parent?: string; // Added to store the grouping key
  parentId?: number;
  subCategories?: ExpenseCategory[];
}

export type CategoryResponse = Record<string, ExpenseCategory[]>;

export const getExpenseCategories = async (parentCategory?: string): Promise<CategoryResponse> => {
  const params = parentCategory ? { parent: parentCategory } : {};
  // The server returns nested data object { data: { ... } }
  const response = await apiClient.get<any>("/expense-categories", { params });
  return response.data.data;
};
