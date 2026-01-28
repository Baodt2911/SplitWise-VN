import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { FlatList, Text, TouchableOpacity, View, Image, ActivityIndicator, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { Icon } from "../../../components/common/Icon";
import { getGroupDetail, type GroupDetail } from "../../../services/api/group.api";
import { getExpenses, deleteExpense } from "../../../services/api/expense.api";
import { useToast } from "../../../hooks/useToast";
import { useGroupStore } from "../../../store/groupStore";
import { useAlertStore } from "../../../store/alertStore";
import { LinearGradient } from "expo-linear-gradient";
import { getCategoryIcon } from "../../../constants/category.constants";
import { getMemberInitials, getMemberAvatarColor, getMemberTextColor } from "../../../utils/memberUtils";
import { ExpenseListItem } from "../components/ExpenseListItem";
import { GroupHeader } from "../components/GroupHeader";

export const GroupDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const theme = usePreferencesStore((state) => state.theme);
  const user = useAuthStore((state) => state.user);
  const colors = getThemeColors(theme);
  const { error: showError } = useToast();
  const getGroupDetailFromStore = useGroupStore((state) => state.getGroupDetail);
  const setGroupDetail = useGroupStore((state) => state.setGroupDetail);
  const setExpensesInStore = useGroupStore((state) => state.setExpenses);
  const groupFromStore = useGroupStore((state) => params.id ? state.groupDetails[params.id] : undefined);
  
  const gradientColors: [string, string] = [colors.primary, colors.primaryDark];
  // Derived state from store - sanitization
  const group = useMemo(() => {
    if (!groupFromStore) return null;
    return {
      ...groupFromStore,
      members: Array.isArray(groupFromStore.members) ? groupFromStore.members : [],
    };
  }, [groupFromStore]);

  const expenses = useMemo(() => groupFromStore?.expenses || [], [groupFromStore]);

  // Loading state only for initial load when no data exists
  const [initialLoading, setInitialLoading] = useState(!group);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Use refs to avoid dependency issues
  const showErrorRef = useRef(showError);
  
  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  // Fetch group detail
  const fetchGroup = useCallback(async () => {
    if (!params.id) return;
    
    try {
        const currentGroup = getGroupDetailFromStore(params.id);
        if (!currentGroup) setInitialLoading(true);
        const detailRes = await getGroupDetail(params.id);
        const safeGroup = {
            ...detailRes.group,
            members: Array.isArray(detailRes.group.members) ? detailRes.group.members : [],
            expenses: currentGroup?.expenses || [], // Preserve existing expenses if any
        };
        setGroupDetail(params.id, safeGroup);
    } catch (err: any) {
        const errorMessage = err.message || "Không thể tải thông tin nhóm";
        const currentGroup = getGroupDetailFromStore(params.id);
        if (!currentGroup) showErrorRef.current(errorMessage, "Lỗi");
    } finally {
        setInitialLoading(false);
    }
  }, [params.id, setGroupDetail, getGroupDetailFromStore]);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!params.id) return;

    setLoadingExpenses(true);
    try {
        const expenseRes = await getExpenses(params.id, { pageSize: 20 });
        if ("expenses" in expenseRes) {
            setExpensesInStore(params.id, expenseRes.expenses);
        } else {
            console.error("Failed to load expenses:", expenseRes.message);
        }
    } catch (err: any) {
        console.error("Failed to load expenses", err);
    } finally {
        setLoadingExpenses(false);
    }
  }, [params.id, setExpensesInStore]);

  // Initial load
  useEffect(() => {
    if (!params.id) {
        showErrorRef.current("Không tìm thấy ID nhóm", "Lỗi");
        router.back();
        return;
    }
    fetchGroup();
    fetchExpenses();
  }, [params.id, fetchGroup, fetchExpenses]);

  // Handle refresh - Only fetch expenses as requested
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  }, [fetchExpenses]);



  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hôm nay";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  }, []);


  const { show: showAlert } = useAlertStore();
  const deleteExpenseFromStore = useGroupStore((state) => state.deleteExpense);

  // Handle delete expense
  const handleDeleteExpense = useCallback((expenseId: string) => {
    showAlert(
      "Bạn có chắc chắn muốn xóa chi phí này không?",
      "Xóa chi phí",
      [
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
              // Optimistic update
              deleteExpenseFromStore(params.id, expenseId);
              
              const result = await deleteExpense(params.id, expenseId);
              if (result.message && !result.message.includes("thành công")) {
                 // Revert or show error if failed (for now just show error)
                 showErrorRef.current(result.message, "Lỗi");
                 fetchExpenses(); // Refresh to revert
              }
            } catch (err: any) {
              showErrorRef.current(err.message || "Không thể xóa chi phí", "Lỗi");
              fetchExpenses(); // Refresh to revert
            }
          },
        },
      ]
    );
  }, [params.id, deleteExpenseFromStore, fetchExpenses, showAlert]);

  // Render expense item
  const renderExpenseItem = useCallback(({ item }: { item: any }) => {
    return (
      <ExpenseListItem
        item={item}
        colors={colors}
        theme={theme}
        currentUserId={user?.id}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        onPress={() => router.push(`/group/${params.id}/expense/${item.id}`)}
        onEdit={() => router.push(`/group/${params.id}/expense/${item.id}/edit`)}
        onDelete={() => handleDeleteExpense(item.id)}
      />
    );
  }, [colors, formatDate, formatCurrency, user, theme, params.id, handleDeleteExpense]);

  // Render list header
  const renderListHeader = useCallback(() => {
    if (!group) return null;
    return <GroupHeader group={group} colors={colors} hasExpenses={expenses.length > 0} />;
  }, [group, colors, expenses.length]);

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
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-center font-normal" style={{ color: colors.textSecondary }}>
            Không tìm thấy nhóm
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header - Fixed/Sticky */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface, zIndex: 50, shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, elevation: 1 }}>
         <View className="flex-row items-center justify-between px-4 h-14 border-b" style={{ borderColor: colors.border }}>
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center hover:bg-gray-100 rounded-full">
               <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <Text className="text-lg font-bold flex-1 text-center" style={{ color: colors.textPrimary }} numberOfLines={1}>
              {group.name}
            </Text>
            
            <TouchableOpacity onPress={() => router.push(`/group/${params.id}/settings`)} className="w-10 h-10 items-center justify-center rounded-full">
               <Icon name="settings" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
         </View>
      </SafeAreaView>

      {/* Main Content */}
      <View className="flex-1">
          {expenses.length === 0 ? (
             <View className="flex-1 mt-6 px-4">
               {/* Show members even if empty */}
               {renderListHeader()}
               <Text className="text-base text-center font-normal mt-10" style={{ color: colors.textSecondary }}>
                 {loadingExpenses ? "Đang tải chi tiêu..." : "Chưa có chi phí nào"}
               </Text>
             </View>
          ) : (
             <FlatList
                data={expenses}
                renderItem={renderExpenseItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderListHeader}
                refreshControl={refreshControl}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
             />
          )}
      </View>
      
      {/* Bottom Action Button - Fixed */}
      <View className="absolute bottom-0 left-0 right-0 p-4 pt-2 bg-gradient-to-t" style={{ backgroundColor: colors.background }}>
         <SafeAreaView edges={['bottom']}>
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

