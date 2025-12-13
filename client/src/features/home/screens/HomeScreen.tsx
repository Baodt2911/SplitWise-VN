import { useEffect, useCallback, useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View, Image, ActivityIndicator, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { OverviewCard } from "../components/OverviewCard";
import { GroupCard } from "../components/GroupCard";
import { BottomNavBar } from "../components/BottomNavBar";
import { Icon } from "../../../components/common/Icon";
import { useGroupStore } from "../../../store/groupStore";
import { getGroups } from "../../../services/api/group.api";
import { useToast } from "../../../hooks/useToast";

export const HomeScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const { error: showError } = useToast();

  // Group store
  const {
    groups,
    isLoading,
    isLoadingMore,
    hasMore,
    currentPage,
    pageSize,
    error,
    refreshTrigger,
    setGroups,
    addGroups,
    setLoading,
    setLoadingMore,
    setHasMore,
    setCurrentPage,
    setError,
    reset,
  } = useGroupStore();

  const translations = {
    vi: {
      overview: "Tổng quan",
      youOwe: "Bạn đang nợ",
      owedToYou: "Nợ bạn",
      yourGroups: "Nhóm của bạn",
    },
    en: {
      overview: "Overview",
      youOwe: "You owe",
      owedToYou: "Owed to you",
      yourGroups: "Your groups",
    },
  };

  const t = useMemo(() => translations[language], [language]);
  const [refreshing, setRefreshing] = useState(false);

  // Load groups
  const loadGroups = useCallback(async (page: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getGroups({ page, pageSize });
      
      if (page === 1) {
        setGroups(response.groups);
      } else {
        addGroups(response.groups);
      }

      // Check if there are more groups to load
      setHasMore(response.groups.length === pageSize);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.message || (language === "vi" ? "Không thể tải danh sách nhóm" : "Failed to load groups");
      setError(errorMessage);
      showError(errorMessage, language === "vi" ? "Lỗi" : "Error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageSize, language, showError]);

  // Initial load - check store first
  useEffect(() => {
    // If we already have groups in store, don't reset and reload
    if (groups.length > 0) {
      // Groups already loaded, just ensure we're not loading
      setLoading(false);
      return;
    }
    // No groups in store, load from API
    reset();
    loadGroups(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh when trigger changes (e.g., after creating a group)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadGroups(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadGroups(1, false);
    } finally {
      setRefreshing(false);
    }
  }, [loadGroups]);

  // Load more when reaching end
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading && !refreshing) {
      loadGroups(currentPage + 1, true);
    }
  }, [isLoadingMore, hasMore, isLoading, refreshing, currentPage, loadGroups]);

  // Handle group press
  const handleGroupPress = useCallback((groupId: string) => {
    router.push(`/group/${groupId}`);
  }, []);

  // Track if this is initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!isLoading && groups.length > 0) {
      setIsInitialLoad(false);
    }
  }, [isLoading, groups.length]);

  // Render group item
  const renderGroupItem = useCallback(({ item, index }: { item: typeof groups[0]; index: number }) => {
    const groupCard = (
      <GroupCard
        group={item}
        onPress={() => handleGroupPress(item.id)}
      />
    );

    // Only animate on initial load, not on refresh or load more
    if (isInitialLoad && !refreshing && !isLoadingMore && index < 10) {
      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
          {groupCard}
        </Animated.View>
      );
    }

    return groupCard;
  }, [handleGroupPress, refreshing, isLoadingMore, isInitialLoad]);

  // Render footer (loading indicator)
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={colors.primary} />
              </View>
    );
  }, [isLoadingMore, colors.primary]);

  // Render list header (Overview section) - memoized
  const renderListHeader = useMemo(() => {
    return (
      <View className="px-4 pt-4 pb-2">
          {/* Overview Section */}
          <Text
          className="text-lg font-bold mb-4 font-semibold"
            style={{
              color: colors.textPrimary,
            }}
          >
            {t.overview}
          </Text>

          <View className="flex-row gap-3 mb-6">
            <OverviewCard
              title={t.youOwe}
              amount="450,000₫"
              type="owe"
            />
            <OverviewCard
              title={t.owedToYou}
              amount="320,000₫"
              type="owed"
            />
          </View>

          {/* Groups Section */}
          <Text
          className="text-lg font-bold mb-4 font-semibold"
            style={{
              color: colors.textPrimary,
            }}
          >
            {t.yourGroups}
          </Text>
      </View>
    );
  }, [t, colors.textPrimary]);

  // RefreshControl
  const refreshControl = useMemo(() => {
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={colors.primary}
        colors={[colors.primary]}
      />
    );
  }, [refreshing, handleRefresh, colors.primary]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />

        {/* Header */}
        <View
          className="flex-row items-center justify-between px-6 py-6"
        >
          {/* Logo bên trái */}
          <Image
            source={require("../../../../assets/icons/logo.png")}
            className="w-32 h-8"
          />

          {/* Icon thông báo bên phải */}
          <TouchableOpacity className="relative pr-1">
            <Icon name="bell" size={24} color={colors.textPrimary} />
            <View
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.warning }}
            />
          </TouchableOpacity>
        </View>

        {isLoading && groups.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderFooter}
            refreshControl={refreshControl}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 100, // Approximate height of GroupCard + margin
              offset: 100 * index,
              index,
            })}
          />
        )}

        {/* Bottom Navigation */}
        <BottomNavBar />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default HomeScreen;

