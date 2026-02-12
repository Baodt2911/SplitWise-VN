import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { OverviewCard } from "./OverviewCard";
import { ThemeColors } from "../../../utils/themeColors";

interface HomeHeaderProps {
  colors: ThemeColors;
  hasGroups: boolean;
}

export const HomeHeader = memo(({ colors, hasGroups }: HomeHeaderProps) => {
  return (
    <View className="px-4 pt-4 pb-2">
      {/* Overview Section */}
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-lg font-bold font-semibold"
          style={{
            color: colors.textPrimary,
          }}
        >
          Tổng quan
        </Text>
        <TouchableOpacity
          onPress={() => {
            router.push("/overview/balance");
          }}
        >
          <Text
            style={{
              color: colors.primary,
            }}
          >
            Xem chi tiết
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-3 mb-6">
        <OverviewCard title="Bạn đang nợ" amount="450,000₫" type="owe" />
        <OverviewCard title="Nợ bạn" amount="320,000₫" type="owed" />
      </View>

      {/* Groups Section - Only show header if there are groups */}
      {hasGroups && (
        <Text
          className="text-lg font-bold mb-4 font-semibold"
          style={{
            color: colors.textPrimary,
          }}
        >
          Nhóm của bạn
        </Text>
      )}
    </View>
  );
});

HomeHeader.displayName = "HomeHeader";
