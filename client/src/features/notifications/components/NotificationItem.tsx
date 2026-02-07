import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Icon } from "../../../components/common/Icon";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import {
  getNotificationStyle,
  formatNotificationTime,
} from "../../../utils/notificationUtils";
import type { Notification } from "../../../services/api/notification.api";

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  const { icon, color } = getNotificationStyle(notification.type);
  const timeText = formatNotificationTime(notification.createdAt);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        padding: 16,
        backgroundColor: notification.isRead
          ? colors.surface
          : colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Icon with background */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${color}15`, // lighter opacity
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon name={icon} size={18} color={color} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: notification.isRead ? "400" : "600",
                color: colors.textPrimary,
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {notification.body}
            </Text>
            
            <Text
              style={{
                fontSize: 13,
                color: colors.textTertiary,
              }}
            >
              {timeText}
            </Text>
          </View>
          
          {/* Unread badge */}
          {!notification.isRead && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#6366F1",
                marginTop: 4,
              }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
