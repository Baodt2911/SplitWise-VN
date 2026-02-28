import React, { memo, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { OverviewCard } from "./OverviewCard";
import { useQuery } from "@tanstack/react-query";
import { getBalancesStats } from "../../../services/api/stats.api";
import type { ThemeColors } from "../../../utils/themeColors";

// Format currency VND
function formatCurrency(amount: string | null): string {
  if (!amount) return "0₫";
  const num = parseFloat(amount);
  if (isNaN(num)) return "0₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

interface HomeHeaderProps {
  colors: ThemeColors;
  hasGroups: boolean;
}

export const HomeHeader = memo(({ colors, hasGroups }: HomeHeaderProps) => {
  const { data } = useQuery({
    queryKey: ["balances"],
    queryFn: getBalancesStats,
  });

  return (
    <View className="px-4 pt-4 pb-2">
      {/* Overview Section */}
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-lg font-semibold"
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
        <OverviewCard
          title="Bạn đang nợ"
          amount={formatCurrency(data?.total.youOwe ?? null)}
          type="owe"
        />
        <OverviewCard
          title="Nợ bạn"
          amount={formatCurrency(data?.total.oweYou ?? null)}
          type="owed"
        />
      </View>

      {/* Groups Section - Only show header if there are groups */}
      {hasGroups && (
        <Text
          className="text-lg font-semibold mb-4"
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
