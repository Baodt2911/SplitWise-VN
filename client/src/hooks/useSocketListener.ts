import { useEffect } from "react";
import { socketService } from "../services/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useDynamicIslandStore } from "../store/dynamicIslandStore";
import { useAuthStore } from "../store/authStore";

export const useSocketListener = () => {
  const queryClient = useQueryClient();
  const showNotification = useDynamicIslandStore((state) => state.show);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // 1. Notification Listener
    socketService.on("notification:new", (payload: any) => {
      console.log("[SOCKET] New notification:", payload);
      showNotification({
        type: payload.type,
        relatedId: payload.relatedId,
        relatedType: payload.relatedType,
        groupName: payload.groupName,
        title: payload.title, // Backup if type mapping fails
        body: payload.body,   // Backup if type mapping fails
      });

      // Invalidate notifications list
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    });

    // 2. Expense Realtime Sync
    socketService.on("expense:create", (expense: any) => {
      // Patch group expenses list
      queryClient.setQueryData(["expenses", expense.groupId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          expenses: [expense, ...old.expenses],
        };
      });
    });

    socketService.on("expense:update", (expense: any) => {
      queryClient.setQueryData(["expenses", expense.groupId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          expenses: old.expenses.map((e: any) => e.id === expense.id ? expense : e),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["expense-detail", expense.id] });
    });

    socketService.on("expense:delete", (payload: { id: string; groupId: string }) => {
      queryClient.setQueryData(["expenses", payload.groupId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          expenses: old.expenses.filter((e: any) => e.id !== payload.id),
        };
      });
    });

    // 3. Balance & Group Stats Sync
    socketService.on("balance:update", (payload: any) => {
      // payload: { groupId, total: { youOwe, oweYou }, details: [...] }
      
      // Update personal summary on home screen
      queryClient.invalidateQueries({ queryKey: ["balance-stats"] });

      // Patch the specific group balance in the groups list
      queryClient.setQueryData(["groups"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          groups: old.groups.map((g: any) => {
            if (g.id === payload.groupId) {
              return {
                ...g,
                totalPeopleOweYou: payload.total.oweYou,
                totalYouOwePeople: payload.total.youOwe,
              };
            }
            return g;
          }),
        };
      });
    });

    socketService.on("group:update", (payload: any) => {
       // payload: { groupId, memberCount, expenseCount }
       queryClient.setQueryData(["groups"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          groups: old.groups.map((g: any) => {
            if (g.id === payload.groupId) {
              return {
                ...g,
                memberCount: payload.memberCount,
                expenseCount: payload.expenseCount,
              };
            }
            return g;
          }),
        };
      });
    });

    return () => {
      socketService.off("notification:new");
      socketService.off("expense:create");
      socketService.off("expense:update");
      socketService.off("expense:delete");
      socketService.off("balance:update");
      socketService.off("group:update");
    };
  }, [user, queryClient, showNotification]);
};
