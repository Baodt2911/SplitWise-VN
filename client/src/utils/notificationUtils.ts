import type { Notification } from "../services/api/notification.api";
import { dayjs } from "../utils/dateUtils";

export type NotificationType =
  // Expense
  | "EXPENSE_ADDED"
  | "EXPENSE_UPDATED"
  | "EXPENSE_DELETED"
  // Payment flow
  | "PAYMENT_REQUEST"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REJECTED"
  | "PAYMENT_DISPUTED"
  | "PAYMENT_DISPUTE_REJECTED"
  // Member events
  | "MEMBER_ADDED"
  | "MEMBER_INVITED"
  | "MEMBER_JOINED"
  | "MEMBER_REMOVED"
  | "MEMBER_LEFT"
  | "MEMBER_ROLE_CHANGED"
  | "MEMBER_SELF_JOINED"
  | "YOU_WERE_REMOVED"
  // Comment
  | "COMMENT_ADDED"
  | "COMMENT_MENTION"
  // Other
  | "REMINDER";

export type RelatedType =
  | "EXPENSE"
  | "SETTLEMENT"
  | "GROUP"
  | "GROUP_INVITE"
  | "USER"
  | "COMMENT";

interface NotificationStyle {
  icon: string;
  color: string;
}

/**
 * Get icon and color for notification type
 */
export const getNotificationStyle = (type: string): NotificationStyle => {
  const typeMap: Record<NotificationType, NotificationStyle> = {
    // Expense
    EXPENSE_ADDED: { icon: "receipt", color: "#10B981" }, // green
    EXPENSE_UPDATED: { icon: "receipt", color: "#3B82F6" }, // blue
    EXPENSE_DELETED: { icon: "receipt", color: "#EF4444" }, // red

    // Payment
    PAYMENT_REQUEST: { icon: "dollarSign", color: "#F59E0B" }, // yellow
    PAYMENT_CONFIRMED: { icon: "checkCircle", color: "#10B981" }, // green
    PAYMENT_REJECTED: { icon: "xCircle", color: "#EF4444" }, // red
    PAYMENT_DISPUTED: { icon: "alertCircle", color: "#F97316" }, // orange
    PAYMENT_DISPUTE_REJECTED: { icon: "xOctagon", color: "#EF4444" }, // red

    // Member
    MEMBER_ADDED: { icon: "userPlus", color: "#10B981" }, // green
    MEMBER_INVITED: { icon: "mail", color: "#3B82F6" }, // blue
    MEMBER_JOINED: { icon: "userCheck", color: "#10B981" }, // green
    MEMBER_REMOVED: { icon: "userMinus", color: "#EF4444" }, // red
    MEMBER_LEFT: { icon: "logOut", color: "#6B7280" }, // gray
    MEMBER_ROLE_CHANGED: { icon: "shield", color: "#8B5CF6" }, // purple
    MEMBER_SELF_JOINED: { icon: "userCheck", color: "#10B981" }, // green
    YOU_WERE_REMOVED: { icon: "alertTriangle", color: "#EF4444" }, // red

    // Comment
    COMMENT_ADDED: { icon: "messageSquare", color: "#3B82F6" }, // blue
    COMMENT_MENTION: { icon: "atSign", color: "#8B5CF6" }, // purple

    // Other
    REMINDER: { icon: "bell", color: "#F59E0B" }, // yellow
  };

  return (
    typeMap[type as NotificationType] || { icon: "bell", color: "#6B7280" }
  );
};

/**
 * Format notification timestamp
 */
export const formatNotificationTime = (createdAt: string): string => {
  return dayjs(createdAt).fromNow();
};

/**
 * Get date label for grouping
 */
export const getDateLabel = (createdAt: string): string => {
  const date = dayjs(createdAt);
  const now = dayjs();

  if (date.isSame(now, "day")) {
    return "Hôm nay";
  }

  if (date.isSame(now.subtract(1, "day"), "day")) {
    return "Hôm qua";
  }

  return date.format("DD/MM/YYYY");
};

/**
 * Group notifications by date
 */
export const groupNotificationsByDate = (
  notifications: Notification[],
): { date: string; items: Notification[] }[] => {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((notif) => {
    const label = getDateLabel(notif.createdAt);
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(notif);
  });

  // Convert to array and sort by date (most recent first)
  return Object.entries(groups)
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => {
      // "Hôm nay" first, then "Hôm qua", then by date
      if (a.date === "Hôm nay") return -1;
      if (b.date === "Hôm nay") return 1;
      if (a.date === "Hôm qua") return -1;
      if (b.date === "Hôm qua") return 1;

      // Parse dates and compare
      const dateA = new Date(a.items[0].createdAt);
      const dateB = new Date(b.items[0].createdAt);
      return dateB.getTime() - dateA.getTime();
    });
};

export type NotificationListItem =
  | { type: "header"; title: string; id: string }
  | { type: "item"; data: Notification };

// Helper functions
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Flatten notifications for FlatList with strict deduplication
 */
export const flattenNotifications = (
  notifications: Notification[],
): NotificationListItem[] => {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  const seenIds = new Set<string>();

  // Group by date
  // We manually implement grouping to ensure we handle duplicates correctly
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((notification) => {
    // Skip if we've seen this notification ID in this batch
    if (seenIds.has(notification.id)) {
      return;
    }
    seenIds.add(notification.id);

    // Calculate date key
    const utcDate = new Date(notification.createdAt);
    // Add 7 hours for Vietnam time
    const vietnamDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);

    const now = new Date();
    const nowVietnam = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const yesterday = new Date(nowVietnam);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    const dateOnly = new Date(
      vietnamDate.getFullYear(),
      vietnamDate.getMonth(),
      vietnamDate.getDate(),
    );
    const todayOnly = new Date(
      nowVietnam.getFullYear(),
      nowVietnam.getMonth(),
      nowVietnam.getDate(),
    );
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    );

    let key: string;
    if (dateOnly.getTime() === todayOnly.getTime()) {
      key = "Hôm nay";
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      key = "Hôm qua";
    } else {
      key = `${vietnamDate.getDate()} Tháng ${vietnamDate.getMonth() + 1}, ${vietnamDate.getFullYear()}`;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
  });

  const result: NotificationListItem[] = [];

  // Convert to flat list with headers
  // Sort keys: Hôm nay -> Hôm qua -> Others by date desc
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === "Hôm nay") return -1;
    if (b === "Hôm nay") return 1;
    if (a === "Hôm qua") return -1;
    if (b === "Hôm qua") return 1;

    // Parse simplified dates for sorting if needed, but the current keys are string based
    // Ideally we would carry the timestamp. For now rely on string parsing or assume correct order from input if sorted
    return 0;
  });

  sortedKeys.forEach((dateKey) => {
    // Add header
    result.push({
      type: "header",
      id: `header-${dateKey}`,
      title: dateKey,
    });

    // Add items
    groups[dateKey].forEach((item) => {
      result.push({
        type: "item",
        data: item,
      });
    });
  });

  return result;
};

/**
 * Get navigation route for related item
 */
export const getRelatedRoute = (
  type: string,
  referenceId?: string,
): string | null => {
  if (!referenceId && type !== "GROUP_INVITE") return null;

  const relatedType = type as RelatedType;

  switch (relatedType) {
    case "GROUP":
      return `/group/${referenceId}`;
    case "SETTLEMENT":
      return `/settlement/${referenceId}`;
    case "USER":
      return `/profile/${referenceId}`;
    case "GROUP_INVITE":
      return `/invites`;
    case "EXPENSE":
    case "COMMENT":
    default:
      return null;
  }
};
