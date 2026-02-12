import { create } from "zustand";
import {
  getNotifications,
  markRead,
  markReadAll,
  type Notification,
} from "../services/api/notification.api";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;

  fetchNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  currentPage: 1,
  hasMore: true,
  isLoadingMore: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await getNotifications(1, 10);
      const list = data.notifications || [];
      const unread = list.filter((n: Notification) => !n.isRead).length;

      set({
        notifications: list,
        unreadCount: unread,
        isLoading: false,
        currentPage: 1,
        hasMore: list.length === 10, // If we got 10 items, there might be more
      });
    } catch (error) {
      set({ isLoading: false });
      console.error("Failed to fetch notifications", error);
    }
  },

  loadMoreNotifications: async () => {
    const { currentPage, isLoadingMore, hasMore } = get();

    if (isLoadingMore || !hasMore) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = currentPage + 1;
      const data = await getNotifications(nextPage, 10);
      const newList = data.notifications || [];

      set((state) => {
        // Strict deduplication: Filter out any items already in state
        const existingIds = new Set(state.notifications.map((n) => n.id));
        const uniqueNewList = newList.filter((n) => !existingIds.has(n.id));

        if (uniqueNewList.length === 0) {
          // If no new unique items, we might have reached the end or received duplicates
          return {
            isLoadingMore: false,
            hasMore: newList.length === 10, // Keep calling if we got full page, might be duplicates across pages
          };
        }

        const combined = [...state.notifications, ...uniqueNewList];
        const unread = combined.filter((n: Notification) => !n.isRead).length;

        return {
          notifications: combined,
          unreadCount: unread,
          currentPage: nextPage,
          hasMore: newList.length === 10,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      set({ isLoadingMore: false });
      console.error("Failed to load more notifications", error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await markRead(id);
      set((state) => {
        const newNotifications = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        );
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter((n) => !n.isRead).length,
        };
      });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await markReadAll();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  },
}));
