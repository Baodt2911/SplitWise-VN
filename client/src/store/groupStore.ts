import { create } from "zustand";
import type { Group, GroupDetail } from "../services/api/group.api";

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
  setGroups: (groups: Group[]) => void;
  addGroups: (groups: Group[]) => void;
  prependGroup: (group: Group) => void; // Add new group at the beginning
  setGroupDetail: (groupId: string, groupDetail: GroupDetail) => void;
  getGroupDetail: (groupId: string) => GroupDetail | undefined;
  updateGroupDetail: (groupId: string, updater: (detail: GroupDetail) => GroupDetail) => void;
  removeGroupDetail: (groupId: string) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setCurrentPage: (page: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  triggerRefresh: () => void;
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
  
  setGroups: (groups) => set({ groups }),
  
  addGroups: (groups) => set((state) => ({
    groups: [...state.groups, ...groups],
  })),
  
  prependGroup: (group) => set((state) => ({
    groups: [group, ...state.groups],
  })),
  
  setGroupDetail: (groupId, groupDetail) => set((state) => ({
    groupDetails: {
      ...state.groupDetails,
      [groupId]: groupDetail,
    },
  })),
  
  getGroupDetail: (groupId) => {
    return get().groupDetails[groupId];
  },
  
  updateGroupDetail: (groupId, updater) => set((state) => {
    const currentDetail = state.groupDetails[groupId];
    if (!currentDetail) return state;
    
    return {
      groupDetails: {
        ...state.groupDetails,
        [groupId]: updater(currentDetail),
      },
    };
  }),
  
  removeGroupDetail: (groupId) => set((state) => {
    const { [groupId]: _, ...rest } = state.groupDetails;
    return { groupDetails: rest };
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  
  setHasMore: (hasMore) => set({ hasMore }),
  
  setCurrentPage: (currentPage) => set({ currentPage }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({
    groups: [],
    groupDetails: {},
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    currentPage: 1,
    error: null,
  }),
  
  triggerRefresh: () => set((state) => ({
    refreshTrigger: state.refreshTrigger + 1,
    currentPage: 1,
  })),
}));

