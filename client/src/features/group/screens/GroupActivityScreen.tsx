import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getGroupActivities,
  ActivityAction,
} from "../../../services/api/activity.api";
import { Icon } from "../../../components/common/Icon";
import { ActivityItem } from "../../profile/components/ActivityItem";
import { groupActivitiesByDate } from "../../../utils/activityUtils";
import type { Activity } from "../../../services/api/activity.api";

// Available actions for filter
const ACTIVITY_ACTIONS: { label: string; value: ActivityAction | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Thêm thành viên", value: "ADD_MEMBER" },
  { label: "Xóa thành viên", value: "REMOVE_MEMBER" },
  { label: "Thêm chi phí", value: "ADD_EXPENSE" },
  { label: "Sửa chi phí", value: "UPDATE_EXPENSE" },
  { label: "Xóa chi phí", value: "DELETE_EXPENSE" },
  { label: "Thanh toán", value: "CONFIRM_PAYMENT" },
];

interface ActivitySection {
  title: string;
  data: Activity[];
}

export const GroupActivityScreen: React.FC = () => {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);

  const [selectedAction, setSelectedAction] = useState<ActivityAction | "ALL">(
    "ALL",
  );

  const {
    data,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage: loadMoreActivities,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["activities", "group", groupId, selectedAction],
    queryFn: async ({ pageParam = 1 }) =>
      await getGroupActivities(
        groupId!,
        pageParam,
        15,
        selectedAction === "ALL" ? undefined : selectedAction,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.activities.length === 15
        ? allPages.length + 1
        : undefined;
    },
    enabled: !!groupId,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const activities = useMemo(() => {
    return data?.pages.flatMap((page) => page.activities) || [];
  }, [data]);

  const sections: ActivitySection[] = useMemo(() => {
    const grouped = groupActivitiesByDate(activities);
    return grouped.map((group) => ({
      title: group.label,
      data: group.items,
    }));
  }, [activities]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: ActivitySection }) => (
      <View
        className="px-4 py-2"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <Text
          className="text-xs font-semibold uppercase"
          style={{
            color: colors.textSecondary,
          }}
        >
          {section.title}
        </Text>
      </View>
    ),
    [colors],
  );

  const renderItem = useCallback(
    ({ item }: { item: Activity }) => (
      <View style={{ backgroundColor: colors.surface }}>
        <ActivityItem activity={item} />
      </View>
    ),
    [colors],
  );

  const keyExtractor = useCallback((item: Activity) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMoreActivities();
    }
  }, [hasMore, isLoadingMore, loadMoreActivities]);

  const renderFooter = useCallback(() => {
    if (!hasMore && activities.length > 0) return null;

    return (
      <View className="py-5 items-center">
        {isLoadingMore ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : activities.length > 0 ? (
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Kéo xuống để tải thêm
          </Text>
        ) : null}
      </View>
    );
  }, [hasMore, isLoadingMore, colors, activities.length]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View className="flex-1 items-center justify-center px-8 pt-[100px]">
        <Icon name="calendar" size={64} color={colors.textTertiary} />
        <Text
          className="mt-4 text-base font-semibold text-center"
          style={{ color: colors.textPrimary }}
        >
          Chưa có hoạt động nào
        </Text>
        <Text
          className="mt-2 text-sm text-center"
          style={{ color: colors.textSecondary }}
        >
          {selectedAction === "ALL"
            ? "Nhóm hiện tại chưa có hoạt động nào được ghi nhận"
            : "Không tìm thấy hoạt động nào phù hợp với bộ lọc"}
        </Text>
      </View>
    );
  }, [isLoading, colors, selectedAction]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        tintColor={colors.primary}
      />
    ),
    [isRefetching, handleRefresh, colors],
  );

  const renderFilterItem = ({
    item,
  }: {
    item: (typeof ACTIVITY_ACTIONS)[0];
  }) => {
    const isSelected = selectedAction === item.value;
    return (
      <TouchableOpacity
        onPress={() => setSelectedAction(item.value)}
        className={`px-4 py-2 rounded-full mr-2 border ${
          isSelected ? "border-transparent" : ""
        }`}
        style={{
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: colors.border,
        }}
        activeOpacity={0.7}
      >
        <Text
          className="text-sm font-medium"
          style={{
            color: isSelected ? "#FFFFFF" : colors.textPrimary,
          }}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

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
          backgroundColor: colors.surface,
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
          Nhật ký hoạt động
        </Text>
      </View>

      {/* Filter Chips */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <FlatList
          data={ACTIVITY_ACTIONS}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.value}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        />
      </View>

      {/* Content */}
      {isLoading && activities.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            Đang tải...
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={refreshControl}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 20,
          }}
        />
      )}
    </SafeAreaView>
  );
};
