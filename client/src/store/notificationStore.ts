import { create } from "zustand";
import { 
  markRead, 
  markReadAll 
} from "../services/api/notification.api";
import { getNotifications } from "../services/api/user.api";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  referenceId?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await getNotifications();
      // Server returns list of notifications
      const list = Array.isArray(data) ? data : [];
      const unread = list.filter((n: Notification) => !n.isRead).length;
      
      set({ 
        notifications: list, 
        unreadCount: unread,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      console.error("Failed to fetch notifications", error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await markRead(id);
      set((state) => {
        const newNotifications = state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        );
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter(n => !n.isRead).length
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
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  }
}));
