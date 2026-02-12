import { create } from "zustand";
import {
  getGroups,
  getGroupDetail,
  type Group,
  type GroupDetail,
  type CreateGroupResponse,
  type GroupsResponse,
  type GroupBalance,
} from "../services/api/group.api";
import { getExpenses, deleteExpense } from "../services/api/expense.api";
// Expense filter types
export interface ExpenseFilters {
  category?: string;
  expenseDateFrom?: Date;
  expenseDateTo?: Date;
  paidBy?: string;
  q?: string;
  sort?: "createdAt" | "expenseDate";
  order?: "asc" | "desc";
}

export interface ExpensePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const defaultExpenseFilters: ExpenseFilters = {
  sort: "expenseDate",
  order: "desc",
};

const defaultExpensePagination: ExpensePagination = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasMore: true,
  isLoadingMore: false,
};

interface GroupState {
  groups: Group[];
  groupDetails: Record<string, GroupDetail>; // Map groupId to GroupDetail
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  pageSize: number;
  error: string | null;
  refreshTrigger: number;

  // Expense filter & pagination state (per group)
  expenseFilters: Record<string, ExpenseFilters>;
  expensePagination: Record<string, ExpensePagination>;

  setGroupsBatch: (payload: {
    groups?: Group[];
    isLoading?: boolean;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    currentPage?: number;
    error?: string | null;
  }) => void;
  setGroups: (groups: Group[]) => void;
  addGroups: (groups: Group[]) => void;
  prependGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void; // Remove group from list and details
  setGroupDetail: (groupId: string, groupDetail: GroupDetail) => void;
  getGroupDetail: (groupId: string) => GroupDetail | undefined;
  updateGroupDetail: (
    groupId: string,
    updater: (detail: GroupDetail) => GroupDetail,
  ) => void;
  removeGroupDetail: (groupId: string) => void;
  setExpenses: (groupId: string, expenses: any[]) => void;
  appendExpenses: (groupId: string, expenses: any[]) => void;
  addExpense: (groupId: string, expense: any) => void;
  updateExpense: (
    groupId: string,
    expenseId: string,
    updatedExpense: any,
  ) => void;
  deleteExpense: (groupId: string, expenseId: string) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setCurrentPage: (page: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  triggerRefresh: () => void;

  // Expense filter actions
  getExpenseFilters: (groupId: string) => ExpenseFilters;
  setExpenseFilters: (
    groupId: string,
    filters: Partial<ExpenseFilters>,
  ) => void;
  resetExpenseFilters: (groupId: string) => void;
  getExpensePagination: (groupId: string) => ExpensePagination;
  setExpensePagination: (
    groupId: string,
    pagination: Partial<ExpensePagination>,
  ) => void;
  resetExpensePagination: (groupId: string) => void;
  // Async actions
  fetchGroup: (groupId: string) => Promise<void>;
  fetchExpenses: (groupId: string, filters?: any) => Promise<void>;
  loadMoreExpenses: (groupId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  groupDetails: {},
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  currentPage: 1,
  pageSize: 10,
  error: null,
  refreshTrigger: 0,
  expenseFilters: {},
  expensePagination: {},

  setGroupsBatch: (payload) => set((state) => ({ ...state, ...payload })),

  setGroups: (groups) => set({ groups }),

  addGroups: (groups) =>
    set((state) => ({
      groups: [...state.groups, ...groups],
    })),

  prependGroup: (group) =>
    set((state) => ({
      groups: [group, ...state.groups],
    })),

  removeGroup: (groupId) =>
    set((state) => {
      const { [groupId]: _, ...restDetails } = state.groupDetails;
      return {
        groups: state.groups.filter((g) => g.id !== groupId),
        groupDetails: restDetails,
      };
    }),

  setGroupDetail: (groupId, groupDetail) =>
    set((state) => {
      const existingGroup = state.groupDetails[groupId];
      // Preserve existing expenses if the new detail doesn't contain them
      // This prevents race conditions where fetchGroup overwrites expenses loaded by fetchExpenses
      const expenses =
        groupDetail.expenses && groupDetail.expenses.length > 0
          ? groupDetail.expenses
          : existingGroup?.expenses || [];

      return {
        groupDetails: {
          ...state.groupDetails,
          [groupId]: {
            ...groupDetail,
            expenses,
          },
        },
      };
    }),

  getGroupDetail: (groupId) => {
    return get().groupDetails[groupId];
  },

  updateGroupDetail: (groupId, updater) =>
    set((state) => {
      const currentDetail = state.groupDetails[groupId];
      if (!currentDetail) return state;

      return {
        groupDetails: {
          ...state.groupDetails,
          [groupId]: updater(currentDetail),
        },
      };
    }),

  removeGroupDetail: (groupId) =>
    set((state) => {
      const { [groupId]: _, ...rest } = state.groupDetails;
      return { groupDetails: rest };
    }),

  setExpenses: (groupId, expenses) =>
    set((state) => {
      // Ensure group object exists even if details aren't loaded yet
      const currentGroup = state.groupDetails[groupId] || {
        id: groupId,
        name: "Loading...",
        members: [],
        expenses: [],
      };

      // Strict deduplication using Map
      const uniqueExpenses = Array.from(
        new Map(expenses.map((e: any) => [e.id, e])).values(),
      );

      return {
        groupDetails: {
          ...state.groupDetails,
          [groupId]: {
            ...currentGroup,
            expenses: uniqueExpenses,
          },
        },
      };
    }),

  appendExpenses: (groupId, expenses) =>
    set((state) => {
      // Ensure group object exists
      const currentGroup = state.groupDetails[groupId] || {
        id: groupId,
        name: "Loading...",
        members: [],
        expenses: [],
      };

      const existingExpenses = currentGroup.expenses || [];

      // Robust merge: Combine existing + new, then dedupe by ID
      // This handles overlap, pure duplicates, and entirely new items correctly
      const mergedExpenses = [...existingExpenses, ...expenses];
      const uniqueExpenses = Array.from(
        new Map(mergedExpenses.map((e: any) => [e.id, e])).values(),
      );

      return {
        groupDetails: {
          ...state.groupDetails,
          [groupId]: {
            ...currentGroup,
            expenses: uniqueExpenses,
          },
        },
      };
    }),

  addExpense: (groupId, expense) =>
    set((state) => {
      const currentDetail = state.groupDetails[groupId];
      if (!currentDetail) return state;

      const currentExpenses = currentDetail.expenses || [];

      return {
        groupDetails: {
          ...state.groupDetails,
          [groupId]: {
            ...currentDetail,
            expenses: [expense, ...currentExpenses],
          },
        },
      };
    }),

  updateExpense: (groupId, expenseId, updatedExpense) =>
    set((state) => {
      const currentDetail = state.groupDetails[groupId];
      if (!currentDetail) return state;

      const currentExpenses = currentDetail.expenses || [];
      const updatedExpenses = currentExpenses.map((exp: any) =>
        exp.id === expenseId ? { ...exp, ...updatedExpense } : exp,
      );

      return {
        groupDetails: {
          ...state.groupDetails,
          [groupId]: {
            ...currentDetail,
            expenses: updatedExpenses,
          },
        },
      };
    }),

  deleteExpense: (groupId, expenseId) =>
    set((state) => {
      const currentDetail = state.groupDetails[groupId];
      if (!currentDetail) return state;

      const currentExpenses = currentDetail.expenses || [];
      const updatedExpenses = currentExpenses.filter(
        (exp: any) => exp.id !== expenseId,
      );

      return {
        groupDetails: {
          ...state.groupDetails,
          [groupId]: {
            ...currentDetail,
            expenses: updatedExpenses,
          },
        },
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),

  setHasMore: (hasMore) => set({ hasMore }),

  setCurrentPage: (currentPage) => set({ currentPage }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      groups: [],
      groupDetails: {},
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      currentPage: 1,
      error: null,
      expenseFilters: {},
      expensePagination: {},
    }),

  triggerRefresh: () =>
    set((state) => ({
      refreshTrigger: state.refreshTrigger + 1,
      currentPage: 1,
    })),

  // Expense filter actions
  getExpenseFilters: (groupId) => {
    return get().expenseFilters[groupId] || defaultExpenseFilters;
  },

  setExpenseFilters: (groupId, filters) =>
    set((state) => ({
      expenseFilters: {
        ...state.expenseFilters,
        [groupId]: {
          ...(state.expenseFilters[groupId] || defaultExpenseFilters),
          ...filters,
        },
      },
    })),

  resetExpenseFilters: (groupId) =>
    set((state) => ({
      expenseFilters: {
        ...state.expenseFilters,
        [groupId]: defaultExpenseFilters,
      },
    })),

  getExpensePagination: (groupId) => {
    return get().expensePagination[groupId] || defaultExpensePagination;
  },

  setExpensePagination: (groupId, pagination) =>
    set((state) => ({
      expensePagination: {
        ...state.expensePagination,
        [groupId]: {
          ...(state.expensePagination[groupId] || defaultExpensePagination),
          ...pagination,
        },
      },
    })),

  resetExpensePagination: (groupId) =>
    set((state) => ({
      expensePagination: {
        ...state.expensePagination,
        [groupId]: defaultExpensePagination,
      },
    })),

  // Async Actions Implementation
  fetchGroup: async (groupId: string) => {
    try {
      const detailRes = await getGroupDetail(groupId);
      get().setGroupDetail(groupId, {
        ...detailRes.group,
        members: Array.isArray(detailRes.group.members)
          ? detailRes.group.members
          : [],
        expenses: [],
      });
    } catch (error) {
      console.error("Failed to fetch group", error);
    }
  },

  fetchExpenses: async (groupId: string, filters = {}) => {
    // Reset pagination to initial for fresh load
    get().setExpensePagination(groupId, {
      page: 1,
      isLoadingMore: false,
      hasMore: true,
    });

    try {
      const state = get();
      const queryFilters = {
        ...(state.expenseFilters[groupId] || {}),
        ...filters,
      };

      const res = await getExpenses(groupId, {
        page: 1,
        pageSize: 10,
        ...queryFilters,
      });

      if ("expenses" in res) {
        // Set expenses (overwrites existing for page 1/fresh load)
        get().setExpenses(groupId, res.expenses);

        if (res.pagination) {
          get().setExpensePagination(groupId, {
            page: res.pagination.page,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
            hasMore: res.pagination.page < res.pagination.totalPages,
            isLoadingMore: false,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    }
  },

  loadMoreExpenses: async (groupId: string) => {
    const state = get();
    const pagination = state.expensePagination[groupId];

    // Strict safety check
    if (!pagination || pagination.isLoadingMore || !pagination.hasMore) return;

    // Set loading state
    get().setExpensePagination(groupId, { isLoadingMore: true });

    try {
      const nextPage = pagination.page + 1;
      const filters = state.expenseFilters[groupId] || {};

      const res = await getExpenses(groupId, {
        page: nextPage,
        pageSize: 10,
        ...filters,
      });

      if ("expenses" in res) {
        // Append expenses with strict deduplication
        get().appendExpenses(groupId, res.expenses);

        if (res.pagination) {
          get().setExpensePagination(groupId, {
            page: res.pagination.page,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
            hasMore: res.pagination.page < res.pagination.totalPages,
            isLoadingMore: false,
          });
        } else {
          // Fallback if pagination metadata is missing
          // Assume hasMore if we got a full page of results
          const hasMore = res.expenses.length >= 10;
          get().setExpensePagination(groupId, {
            page: nextPage,
            hasMore,
            isLoadingMore: false,
          });
        }
      } else {
        // Handle case where API returns error message but no exception
        get().setExpensePagination(groupId, { isLoadingMore: false });
      }
    } catch (error) {
      console.error("Failed to load more expenses", error);
      get().setExpensePagination(groupId, { isLoadingMore: false });
    }
  },
}));
