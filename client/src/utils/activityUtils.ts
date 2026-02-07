import type { Activity, ActivityAction } from "../services/api/activity.api";
import type { IconName } from "../components/common/Icon";

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

/**
 * Format activity time with Vietnam timezone
 */
export const formatActivityTime = (createdAt: string): string => {
  // Convert UTC to Vietnam timezone
  const utcDate = new Date(createdAt);
  const vietnamDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  
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
 * Get date label for grouping activities
 */
export const getActivityDateLabel = (createdAt: string): string => {
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
    return `${vietnamDate.getDate()} Tháng ${vietnamDate.getMonth() + 1}, ${vietnamDate.getFullYear()}`;
  }
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
