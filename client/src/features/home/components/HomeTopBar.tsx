import React, { memo } from "react";
import { View, Image, TouchableOpacity, Text } from "react-native";
import { Icon } from "../../../components/common/Icon";
import { ThemeColors } from "../../../utils/themeColors";

interface HomeTopBarProps {
  colors: ThemeColors;
  unreadCount: number;
  onNotificationPress: () => void;
}

export const HomeTopBar = memo(
  ({ colors, unreadCount, onNotificationPress }: HomeTopBarProps) => {
    return (
      <View className="flex-row items-center justify-between px-6 py-6">
        {/* Logo bên trái */}
        <Image
          source={require("../../../../assets/icons/logo.png")}
          className="w-32 h-8"
        />

        {/* Icon thông báo bên phải */}
        <TouchableOpacity
          className="relative pr-1"
          onPress={onNotificationPress}
        >
          <Icon name="bell" size={24} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full items-center justify-center"
              style={{ backgroundColor: colors.danger }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

HomeTopBar.displayName = "HomeTopBar";
