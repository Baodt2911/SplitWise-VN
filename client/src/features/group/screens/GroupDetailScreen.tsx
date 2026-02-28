import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { dayjs } from "../../../utils/dateUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { Icon } from "../../../components/common/Icon";
import {
  getGroupDetail,
  type GroupDetail,
  type GroupBalance,
} from "../../../services/api/group.api";
import {
  getExpenses,
  deleteExpense,
  type ExpenseFilters,
} from "../../../services/api/expense.api";
import { useToast } from "../../../hooks/useToast";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAlertStore } from "../../../store/alertStore";
import { LinearGradient } from "expo-linear-gradient";
import { ExpenseListItem } from "../components/ExpenseListItem";
import { GroupHeader } from "../components/GroupHeader";
import { ExpenseFilterBar } from "../components/ExpenseFilterBar";
import { ExpenseSearchHeader } from "../components/ExpenseSearchHeader";
import { DateRangePickerModal } from "../components/DateRangePickerModal";

export const GroupDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const theme = usePreferencesStore((state) => state.theme);
  const user = useAuthStore((state) => state.user);
  const colors = getThemeColors(theme);
  const { error: showError } = useToast();

  const queryClient = useQueryClient();

  // Local state for filters since they don't need to be global
  const [filters, setFilters] = useState<Partial<ExpenseFilters>>({
    sort: "expenseDate",
    order: "desc",
  });

  // Date picker modal state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const gradientColors: [string, string] = [colors.primary, colors.primaryDark];

  // Use refs to avoid dependency issues
  const showErrorRef = useRef(showError);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  // Fetch group detail
  const { data: groupData, isLoading: initialLoading } = useQuery({
    queryKey: ["group", params.id],
    queryFn: () => getGroupDetail(params.id!),
    enabled: !!params.id,
  });

  const group = useMemo(() => {
    if (!groupData?.group) return null;
    return {
      ...groupData.group,
      members: Array.isArray(groupData.group.members)
        ? groupData.group.members
        : [],
    };
  }, [groupData]);

  // Fetch expenses with infinite scrolling and filters
  const {
    data: expensesData,
    isLoading: loadingExpenses,
    isFetchingNextPage: paginationIsLoadingMore,
    hasNextPage: paginationHasMore,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["expenses", params.id, filters],
    queryFn: async ({ pageParam = 1 }) =>
      await getExpenses(params.id!, {
        ...filters,
        page: pageParam,
        pageSize: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // @ts-ignore Ignore type checking for server response struct
      return lastPage.pagination &&
        lastPage.pagination.page < lastPage.pagination.totalPages
        ? // @ts-ignore
          lastPage.pagination.page + 1
        : undefined;
    },
    enabled: !!params.id,
  });

  const expenses = useMemo(() => {
    // @ts-ignore
    return expensesData?.pages.flatMap((page) => page.expenses) || [];
  }, [expensesData]);

  // Strict deduplication for FlatList
  const deduplicatedExpenses = useMemo(() => {
    const seenIds = new Set<string>();
    return expenses.filter((item: any) => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
  }, [expenses]);

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters: Partial<ExpenseFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.expenseDateFrom || filters.expenseDateTo) count++;
    if (filters.paidBy) count++;
    if (filters.q) count++;
    return count;
  }, [filters]);

  // Initial load checks
  useEffect(() => {
    if (!params.id) {
      showErrorRef.current("Không tìm thấy ID nhóm", "Lỗi");
      router.back();
    }
  }, [params.id]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (paginationHasMore && !paginationIsLoadingMore && !refreshing) {
      fetchNextPage();
    }
  }, [paginationHasMore, paginationIsLoadingMore, refreshing, fetchNextPage]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!params.id) return;
    setRefreshing(true);
    // Invalidate everything to refresh properly
    await queryClient.invalidateQueries({ queryKey: ["group", params.id] });
    await queryClient.invalidateQueries({ queryKey: ["expenses", params.id] });
    setRefreshing(false);
  }, [params.id, queryClient]);

  // Format date - convert UTC to Vietnam timezone
  // Format date - convert UTC to Vietnam timezone
  const formatDate = useCallback((dateString: string) => {
    const date = dayjs(dateString);
    const now = dayjs();

    if (date.isSame(now, "day")) {
      return "Hôm nay";
    }

    if (date.isSame(now.subtract(1, "day"), "day")) {
      return "Hôm qua";
    }

    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayName = days[date.day()];
    return `${dayName}, ${date.date()}/${date.month() + 1}`;
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  }, []);

  const { show: showAlert } = useAlertStore();

  // Handle delete expense
  const handleDeleteExpense = useCallback(
    (expenseId: string) => {
      showAlert("Bạn có chắc chắn muốn xóa chi phí này không?", "Xóa chi phí", [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            if (!params.id) return;
            try {
              const result = await deleteExpense(params.id, expenseId);
              if (result.message && !result.message.includes("thành công")) {
                showErrorRef.current(result.message, "Lỗi");
              } else {
                // Success: invalidate
                queryClient.invalidateQueries({
                  queryKey: ["expenses", params.id],
                });
                queryClient.invalidateQueries({
                  queryKey: ["group", params.id],
                });
                // Also invalidate global balances if any
                queryClient.invalidateQueries({ queryKey: ["balances"] });
                queryClient.invalidateQueries({ queryKey: ["groups"] });
              }
            } catch (err: any) {
              showErrorRef.current(
                err.message || "Không thể xóa chi phí",
                "Lỗi",
              );
            }
          },
        },
      ]);
    },
    [params.id, queryClient, showAlert],
  );

  // Handle balance press - navigate to payment screen
  const handleBalancePress = useCallback((balance: GroupBalance) => {
    // TODO: Navigate to payment detail screen
    console.log("Balance pressed:", balance);
  }, []);

  // Handle payment button press
  const handlePaymentPress = useCallback((balance: GroupBalance) => {
    // TODO: Navigate to payment screen with pre-filled data
    console.log("Payment button pressed:", balance);
    // router.push(`/group/${params.id}/payment?payerId=${balance.payer.id}&payeeId=${balance.payee.id}&amount=${balance.amount}`);
  }, []);

  // Render expense item
  const handleExpensePress = useCallback(
    (expenseId: string) => {
      router.push(`/group/${params.id}/expense/${expenseId}`);
    },
    [params.id],
  );

  const handleExpenseEdit = useCallback(
    (expenseId: string) => {
      router.push(`/group/${params.id}/expense/${expenseId}/edit`);
    },
    [params.id],
  );

  const handleExpenseDelete = useCallback(
    (expenseId: string) => {
      handleDeleteExpense(expenseId);
    },
    [handleDeleteExpense],
  );

  // Render expense item with stable callbacks
  const renderExpenseItem = useCallback(
    ({ item }: { item: any }) => {
      return (
        <ExpenseListItem
          item={item}
          colors={colors}
          theme={theme}
          currentUserId={user?.id}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          onPress={() => handleExpensePress(item.id)}
          onEdit={() => handleExpenseEdit(item.id)}
          onDelete={() => handleExpenseDelete(item.id)}
        />
      );
    },
    [
      colors,
      formatDate,
      formatCurrency,
      user?.id,
      theme,
      handleExpensePress,
      handleExpenseEdit,
      handleExpenseDelete,
    ],
  );

  // Render list header with search/filter
  const renderListHeader = useCallback(() => {
    if (!group || !user) return null;
    return (
      <>
        <GroupHeader
          group={group}
          colors={colors}
          hasExpenses={expenses.length > 0}
          currentUserId={user.id}
          formatCurrency={formatCurrency}
          onBalancePress={handleBalancePress}
          onPaymentPress={handlePaymentPress}
        />
        {/* Search and Filter Bar - only show when has expenses */}
        <View
          className="rounded-lg pb-3 mb-4 shadow-sm"
          style={{ backgroundColor: colors.surface }}
        >
          <ExpenseSearchHeader
            value={filters.q || ""}
            onChangeText={(q) => handleFilterChange({ q: q || undefined })}
            colors={colors}
          />
          <ExpenseFilterBar
            filters={filters}
            members={group?.members || []}
            colors={colors}
            onFilterChange={handleFilterChange}
            onDatePress={() => setShowDatePicker(true)}
            activeFilterCount={activeFilterCount}
          />
        </View>
      </>
    );
  }, [
    group,
    colors,
    expenses.length,
    user,
    formatCurrency,
    handleBalancePress,
    handlePaymentPress,
    filters,
    handleFilterChange,
    activeFilterCount,
    setShowDatePicker,
  ]);

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

  if (initialLoading && !group) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center px-4">
          <Text
            className="text-base text-center font-normal"
            style={{ color: colors.textSecondary }}
          >
            Không tìm thấy nhóm
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header - Fixed/Sticky */}
      <SafeAreaView
        edges={["top"]}
        style={{
          backgroundColor: colors.surface,
          zIndex: 50,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          elevation: 1,
        }}
      >
        <View
          className="flex-row items-center justify-between px-4 h-14 border-b"
          style={{ borderColor: colors.border }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center hover:bg-gray-100 rounded-full"
          >
            <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text
            className="text-lg font-bold flex-1 text-center"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {group.name}
          </Text>

          <TouchableOpacity
            onPress={() => router.push(`/group/${params.id}/settings`)}
            className="w-10 h-10 items-center justify-center rounded-full"
          >
            <Icon name="settings" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <View className="flex-1">
        {loadingExpenses && expenses.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-10">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                color: colors.textSecondary,
                marginTop: 12,
                fontSize: 14,
              }}
            >
              Đang tải chi phí...
            </Text>
          </View>
        ) : (
          <FlatList
            data={deduplicatedExpenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={
              !loadingExpenses && !initialLoading ? (
                <View className="flex-1 mt-6 px-4">
                  <Text
                    className="text-base text-center font-normal mt-10"
                    style={{ color: colors.textSecondary }}
                  >
                    {activeFilterCount > 0
                      ? "Không tìm thấy chi phí nào phù hợp"
                      : "Chưa có chi phí nào"}
                  </Text>
                  {activeFilterCount > 0 && (
                    <TouchableOpacity
                      onPress={() =>
                        handleFilterChange({
                          category: undefined,
                          paidBy: undefined,
                          expenseDateFrom: undefined,
                          expenseDateTo: undefined,
                          q: undefined,
                        })
                      }
                      className="mt-4"
                    >
                      <Text
                        className="text-sm font-medium text-center"
                        style={{ color: colors.primary }}
                      >
                        Xóa bộ lọc
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null
            }
            ListFooterComponent={
              paginationIsLoadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : paginationHasMore && deduplicatedExpenses.length >= 10 ? (
                <View className="py-4 items-center">
                  <Text style={{ color: colors.textSecondary }}>
                    Kéo xuống để tải thêm
                  </Text>
                </View>
              ) : deduplicatedExpenses.length > 0 && !paginationHasMore ? (
                <View className="py-4 items-center">
                  <Text style={{ color: colors.textSecondary }}>
                    Đã hiển thị tất cả {deduplicatedExpenses.length} chi phí
                  </Text>
                </View>
              ) : null
            }
            refreshControl={refreshControl}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            windowSize={10}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
          />
        )}
      </View>

      {/* Date Range Picker Modal */}
      <DateRangePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onApply={(fromDate, toDate) => {
          handleFilterChange({
            expenseDateFrom: fromDate,
            expenseDateTo: toDate,
          });
        }}
        initialFromDate={filters.expenseDateFrom}
        initialToDate={filters.expenseDateTo}
        colors={colors}
      />

      {/* Bottom Action Button - Fixed */}
      <View
        className="absolute bottom-0 left-0 right-0 p-4 pt-2 bg-gradient-to-t"
        style={{ backgroundColor: colors.background }}
      >
        <SafeAreaView edges={["bottom"]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/group/${params.id}/add-expense`)}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-14 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-primary/30"
              style={{
                borderRadius: 16,
              }}
            >
              <Icon name="plus" size={24} color="#FFFFFF" />
              <Text className="font-bold text-white tracking-wide">
                Thêm chi phí
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
};
