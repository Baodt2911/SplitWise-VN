import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { Icon } from "../../../components/common/Icon";
import { getActivityIcon, getActivityColor, formatActivityTime } from "../../../utils/activityUtils";
import type { Activity } from "../../../services/api/activity.api";

interface ActivityItemProps {
  activity: Activity;
  onPress?: () => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onPress }) => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  
  const icon = getActivityIcon(activity.action);
  const color = getActivityColor(activity.action);
  const timeText = formatActivityTime(activity.createdAt);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        padding: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Icon with background */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${color}20`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon name={icon} size={22} color={color} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {/* Description - Bold */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: 4,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {activity.description}
        </Text>
        
        {/* Group info - if exists */}
        {activity.group && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <Icon name="users" size={14} color={colors.textSecondary} />
            <Text 
              style={{ 
                fontSize: 14, 
                color: colors.textSecondary,
                marginLeft: 6,
                fontWeight: "500",
              }}
              numberOfLines={1}
            >
              {activity.group.name}
            </Text>
          </View>
        )}
        
        {/* Time */}
        <Text style={{ fontSize: 13, color: colors.textTertiary }}>
          {timeText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
