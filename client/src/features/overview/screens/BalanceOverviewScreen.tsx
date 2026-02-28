import React, { useEffect, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Icon } from "../../../components/common/Icon";
import { OverviewCard } from "../../home/components/OverviewCard";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import { useQuery } from "@tanstack/react-query";
import {
  getBalancesStats,
  type BalanceDetail,
} from "../../../services/api/stats.api";

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

// Memoized balance detail item
interface BalanceItemProps {
  item: BalanceDetail;
  colors: ReturnType<typeof getThemeColors>;
  onPress: (item: BalanceDetail) => void;
}

const BalanceItem = memo(({ item, colors, onPress }: BalanceItemProps) => {
  const isOweYou = item.type === "oweYou";
  const initials = item.fullName.charAt(0).toUpperCase();

  const avatarColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];
  const colorIndex = item.payeeId.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      className="flex-row items-center rounded-2xl p-4 mb-2.5"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Avatar */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: avatarColor }}
      >
        <Text className="text-base font-bold text-white">{initials}</Text>
      </View>

      {/* Info */}
      <View className="flex-1 ml-3">
        <Text
          className="text-base font-semibold"
          style={{ color: colors.textPrimary }}
          numberOfLines={1}
        >
          {item.fullName}
        </Text>
        <Text
          className="text-sm mt-0.5"
          style={{ color: colors.textSecondary }}
        >
          {isOweYou ? "Nợ bạn" : "Bạn nợ"}
        </Text>
      </View>

      {/* Amount */}
      <View className="items-end">
        <Text
          className="text-base font-bold"
          style={{ color: isOweYou ? colors.success : colors.danger }}
        >
          {isOweYou ? "+" : "-"}
          {formatCurrency(item.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

BalanceItem.displayName = "BalanceItem";

export const BalanceOverviewScreen: React.FC = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const {
    data,
    isLoading,
    isRefetching: refreshing,
    refetch,
  } = useQuery({
    queryKey: ["balances"],
    queryFn: getBalancesStats,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleItemPress = useCallback((item: BalanceDetail) => {
    router.push(`/group/${item.groupId}` as any);
  }, []);

  // Render item callback
  const renderItem = useCallback(
    ({ item }: { item: BalanceDetail }) => (
      <BalanceItem item={item} colors={colors} onPress={handleItemPress} />
    ),
    [colors, handleItemPress],
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: BalanceDetail, index: number) =>
      `${item.payeeId}-${item.groupId}-${index}`,
    [],
  );

  // List header - Overview cards
  const renderListHeader = useCallback(() => {
    return (
      <View className="pb-4">
        {/* Overview Cards */}
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

        {/* Details header */}
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-xl font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Chi tiết
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {data?.details.length || 0} khoản
          </Text>
        </View>
      </View>
    );
  }, [data, colors]);

  // Empty component
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View className="items-center justify-center pt-16 px-8">
        <Icon name="checkCircle" size={64} color={colors.textTertiary} />
        <Text
          className="mt-4 text-base font-semibold text-center"
          style={{ color: colors.textPrimary }}
        >
          Không có khoản nợ nào
        </Text>
        <Text
          className="mt-2 text-sm text-center"
          style={{ color: colors.textSecondary }}
        >
          Tất cả các khoản đã được thanh toán
        </Text>
      </View>
    );
  }, [isLoading, colors]);

  // Refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={colors.primary}
      />
    ),
    [refreshing, handleRefresh, colors],
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-center px-4 py-4 border-b relative"
        style={{
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4"
        >
          <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text
          className="text-lg font-bold"
          style={{ color: colors.textPrimary }}
        >
          Tổng quan nhanh
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            Đang tải...
          </Text>
        </View>
      ) : (
        <FlatList
          data={data?.details || []}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 25,
            paddingTop: 20,
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default BalanceOverviewScreen;
