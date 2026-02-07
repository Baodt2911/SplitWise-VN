import type { Notification } from "../services/api/notification.api";

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

export type RelatedType = "EXPENSE" | "SETTLEMENT" | "GROUP" | "USER" | "COMMENT";

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
    EXPENSE_UPDATED: { icon: "edit", color: "#3B82F6" }, // blue
    EXPENSE_DELETED: { icon: "trash", color: "#EF4444" }, // red

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

  return typeMap[type as NotificationType] || { icon: "bell", color: "#6B7280" };
};

/**
 * Format notification timestamp
 */
export const formatNotificationTime = (createdAt: string): string => {
  // Convert UTC to Vietnam timezone
  const utcDate = new Date(createdAt);
  const vietnamDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000); // Add 7 hours
  
  const now = new Date();
  const nowVietnam = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  
  const diffMs = nowVietnam.getTime() - vietnamDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  // Format as date in Vietnam timezone
  const hours = vietnamDate.getHours().toString().padStart(2, "0");
  const mins = vietnamDate.getMinutes().toString().padStart(2, "0");
  return `${vietnamDate.getDate()}/${vietnamDate.getMonth() + 1}, ${hours}:${mins}`;
};

/**
 * Get date label for grouping
 */
export const getDateLabel = (createdAt: string): string => {
  // Convert UTC to Vietnam timezone
  const utcDate = new Date(createdAt);
  const vietnamDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  
  const now = new Date();
  const nowVietnam = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const yesterday = new Date(nowVietnam);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time for comparison
  const dateOnly = new Date(vietnamDate.getFullYear(), vietnamDate.getMonth(), vietnamDate.getDate());
  const todayOnly = new Date(nowVietnam.getFullYear(), nowVietnam.getMonth(), nowVietnam.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Hôm nay";
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Hôm qua";
  } else {
    // Format as "24 Tháng 8, 2023"
    return `${vietnamDate.getDate()} Tháng ${vietnamDate.getMonth() + 1}, ${vietnamDate.getFullYear()}`;
  }
};

/**
 * Group notifications by date
 */
export const groupNotificationsByDate = (
  notifications: Notification[]
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

/**
 * Get navigation route for related item
 */
export const getRelatedRoute = (
  type: string,
  referenceId?: string
): string | null => {
  if (!referenceId) return null;

  const relatedType = type as RelatedType;

  switch (relatedType) {
    case "EXPENSE":
      return `/expense/${referenceId}`;
    case "GROUP":
      return `/group/${referenceId}`;
    case "SETTLEMENT":
      return `/settlement/${referenceId}`;
    case "COMMENT":
      // Comments are part of expenses, navigate to expense
      return `/expense/${referenceId}`;
    case "USER":
      return `/profile/${referenceId}`;
    default:
      return null;
  }
};
