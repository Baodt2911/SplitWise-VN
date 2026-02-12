import type { Activity, ActivityAction } from "../services/api/activity.api";
import type { IconName } from "../components/common/Icon";
import { dayjs } from "../utils/dateUtils";

/**
 * Get icon for activity type
 */
export const getActivityIcon = (action: ActivityAction): IconName => {
  const iconMap: Record<ActivityAction, IconName> = {
    // Group
    CREATE_GROUP: "userPlus",
    UPDATE_GROUP: "edit",
    DELETE_GROUP: "trash",
    LEAVE_GROUP: "logOut",

    // Member
    ADD_MEMBER: "userPlus",
    REMOVE_MEMBER: "userMinus",
    INVITE_MEMBER: "mail",
    ACCEPT_INVITE: "userCheck",
    REJECT_INVITE: "xCircle",
    CHANGE_ROLE: "shield",

    // Expense
    ADD_EXPENSE: "receipt",
    UPDATE_EXPENSE: "edit",
    DELETE_EXPENSE: "trash",

    // Payment
    CREATE_PAYMENT: "dollarSign",
    CONFIRM_PAYMENT: "checkCircle",
    REJECT_PAYMENT: "xCircle",
    DISPUTE_PAYMENT: "alertCircle",
    REJECT_DISPUTE_PAYMENT: "xOctagon",
  };

  return iconMap[action] || "bell";
};

/**
 * Get color for activity type
 */
export const getActivityColor = (action: ActivityAction): string => {
  const colorMap: Record<ActivityAction, string> = {
    // Group
    CREATE_GROUP: "#10B981", // green
    UPDATE_GROUP: "#3B82F6", // blue
    DELETE_GROUP: "#EF4444", // red
    LEAVE_GROUP: "#6B7280", // gray

    // Member
    ADD_MEMBER: "#10B981", // green
    REMOVE_MEMBER: "#EF4444", // red
    INVITE_MEMBER: "#3B82F6", // blue
    ACCEPT_INVITE: "#10B981", // green
    REJECT_INVITE: "#EF4444", // red
    CHANGE_ROLE: "#8B5CF6", // purple

    // Expense
    ADD_EXPENSE: "#10B981", // green
    UPDATE_EXPENSE: "#3B82F6", // blue
    DELETE_EXPENSE: "#EF4444", // red

    // Payment
    CREATE_PAYMENT: "#F59E0B", // yellow
    CONFIRM_PAYMENT: "#10B981", // green
    REJECT_PAYMENT: "#EF4444", // red
    DISPUTE_PAYMENT: "#F97316", // orange
    REJECT_DISPUTE_PAYMENT: "#EF4444", // red
  };

  return colorMap[action] || "#6B7280";
};

// ... existing code ...

/**
 * Format activity time with Vietnam timezone
 */
export const formatActivityTime = (createdAt: string): string => {
  const date = dayjs(createdAt);
  const now = dayjs();
  const diffHours = now.diff(date, "hour");

  if (diffHours < 24) {
    return date.fromNow();
  }

  return date.format("DD/MM, HH:mm");
};

/**
 * Get date label for grouping activities
 */
export const getActivityDateLabel = (createdAt: string): string => {
  const date = dayjs(createdAt);
  const now = dayjs();

  if (date.isSame(now, "day")) {
    return "Hôm nay";
  }

  if (date.isSame(now.subtract(1, "day"), "day")) {
    return "Hôm qua";
  }

  return date.format("DD [Tháng] M, YYYY");
};

/**
 * Group activities by date
 */
export const groupActivitiesByDate = (activities: Activity[]) => {
  const grouped = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const label = getActivityDateLabel(activity.createdAt);
    if (!grouped.has(label)) {
      grouped.set(label, []);
    }
    grouped.get(label)!.push(activity);
  });

  // Convert to array of objects
  return Array.from(grouped.entries()).map(([label, items]) => ({
    label,
    items,
  }));
};
