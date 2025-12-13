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
import { useToast } from "../../../hooks/useToast";
import { useGroupStore } from "../../../store/groupStore";

export const GroupDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const user = useAuthStore((state) => state.user);
  const colors = getThemeColors(theme);
  const { error: showError } = useToast();
  const getGroupDetailFromStore = useGroupStore((state) => state.getGroupDetail);
  const setGroupDetail = useGroupStore((state) => state.setGroupDetail);
  const groupFromStore = useGroupStore((state) => params.id ? state.groupDetails[params.id] : undefined);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use refs to avoid dependency issues
  const showErrorRef = useRef(showError);
  const languageRef = useRef(language);
  
  useEffect(() => {
    showErrorRef.current = showError;
    languageRef.current = language;
  }, [showError, language]);

  // Load group detail
  const loadGroupDetail = useCallback(async (forceRefresh = false) => {
    if (!params.id) {
      showErrorRef.current("Không tìm thấy ID nhóm", "Lỗi");
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const response = await getGroupDetail(params.id);
      setGroup(response.group);
      // Save to store
      setGroupDetail(params.id, response.group);
    } catch (err: any) {
      const errorMessage = err.message || (languageRef.current === "vi" ? "Không thể tải thông tin nhóm" : "Failed to load group");
      showErrorRef.current(errorMessage, languageRef.current === "vi" ? "Lỗi" : "Error");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, setGroupDetail]);

  // Initial load - check store first, only call API if not in store
  useEffect(() => {
    if (params.id) {
      const storedGroup = getGroupDetailFromStore(params.id);
      if (storedGroup) {
        // Use data from store, no API call needed
        setGroup(storedGroup);
        setIsLoading(false);
      } else {
        // Not in store, load from API
        loadGroupDetail();
      }
    }
  }, [params.id, getGroupDetailFromStore, loadGroupDetail]);

  // Update when store changes
  useEffect(() => {
    if (groupFromStore) {
      setGroup(groupFromStore);
    }
  }, [groupFromStore]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadGroupDetail();
    } finally {
      setRefreshing(false);
    }
  }, [loadGroupDetail]);

  // Get group icon
  const getGroupIcon = useCallback((name: string) => {
    const icons = ["🏖️", "🍕", "🏠", "🚗", "🎉", "☕", "🍔", "🎬", "✈️", "🎮"];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return icons[hash % icons.length];
  }, []);

  // Get member initials - first letter of last word
  const getMemberInitials = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return "?";
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) return "?";
    // Get first letter of last word
    const lastWord = words[words.length - 1];
    return lastWord[0].toUpperCase();
  }, []);

  // Get member avatar color - lighter pastel colors
  const getMemberAvatarColor = useCallback((id: string) => {
    const colors = [
      "#E1BEE7", // Light purple
      "#C8E6C9", // Light green
      "#BBDEFB", // Light blue
      "#FFE0B2", // Light orange
      "#F8BBD0", // Light pink
      "#B2DFDB", // Light teal
      "#D1C4E9", // Light deep purple
      "#FFCCBC", // Light deep orange
    ];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Get member text color (darker version of background)
  const getMemberTextColor = useCallback((id: string) => {
    const colors = [
      "#7B1FA2", // Dark purple
      "#388E3C", // Dark green
      "#1976D2", // Dark blue
      "#F57C00", // Dark orange
      "#C2185B", // Dark pink
      "#00796B", // Dark teal
      "#512DA8", // Dark deep purple
      "#E64A19", // Dark deep orange
    ];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return language === "vi" ? "Hôm nay" : "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return language === "vi" ? "Hôm qua" : "Yesterday";
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  }, [language]);

  // Format currency
  const formatCurrency = useCallback((amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  }, []);


  // Render expense item
  const renderExpenseItem = useCallback(({ item }: { item: GroupDetail["expenses"][0] }) => {
    // yourDebts already has negative sign in the data (e.g., "-120000")
    // yourCredits is positive (e.g., "150000")
    const hasDebt = item.yourDebts && item.yourDebts !== "0";
    const hasCredit = item.yourCredits && item.yourCredits !== "0";

    // Get expense icon based on category
    const getExpenseIcon = () => {
      const categoryIcons: Record<string, string> = {
        FOOD: "☕",
        TRANSPORT: "🚗",
        ACCOMMODATION: "🏠",
        ENTERTAINMENT: "🎬",
        SHOPPING: "🛍️",
        OTHER: "📝",
      };
      return categoryIcons[item.category] || "📝";
    };

    // Calculate split count based on amount comparison
    // If total splits amount = expense amount → paidBy is included in splits → count = splits.length
    // If total splits amount < expense amount → paidBy is NOT in splits → count = splits.length + 1
    let splitCount = 1; // Default to 1 (at least paidBy)
    
    if (item.splits && item.splits.length > 0) {
      // Calculate total amount of splits
      const totalSplitAmount = item.splits.reduce((sum, split) => {
        const splitAmount = parseFloat(split.amount || "0");
        return sum + splitAmount;
      }, 0);
      
      // Parse expense amount
      const expenseAmount = parseFloat(item.amount || "0");
      
      // Compare amounts (with small tolerance for floating point errors)
      const tolerance = 0.01;
      if (Math.abs(totalSplitAmount - expenseAmount) < tolerance) {
        // Amounts are equal → paidBy is included in splits
        splitCount = item.splits.length;
      } else {
        // Split amount < expense amount → paidBy is NOT in splits
        splitCount = item.splits.length + 1;
      }
    } else {
      // No splits data, estimate based on debt/credit
      splitCount = hasDebt || hasCredit ? 2 : 2;
    }

    // Always show "Chia X người" format
    const getSplitTypeText = () => {
      return language === "vi" ? `Chia ${splitCount} người` : `Split ${splitCount} people`;
    };

    return (
      <TouchableOpacity
        className="rounded-2xl p-4 mb-3"
        style={{
          backgroundColor: colors.surface,

        }}
        activeOpacity={0.7}
      >
        {/* Top Section */}
        <View className="flex-row items-start mb-3">
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "#E3F2FD" }}
          >
            <Text className="text-2xl">{getExpenseIcon()}</Text>
          </View>

          {/* Expense Name and Amount */}
          <View className="flex-1 flex-row items-start justify-between">
            <View className="flex-1 mr-2">
              <Text
                className="text-lg font-bold"
                style={{
                  color: colors.textPrimary,
                }}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className="text-lg font-bold"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {formatCurrency(item.amount)}
              </Text>
              <Text
                className="text-xs mt-1 font-normal"
                style={{
                  color: colors.textSecondary,
                }}
              >
                {item.paidById === user?.id 
                  ? (language === "vi" ? "Bạn trả" : "You paid")
                  : `${item.paidBy} ${language === "vi" ? "trả" : "paid"}`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View
          className="h-px mb-3"
          style={{ backgroundColor: colors.border }}
        />

        {/* Bottom Section */}
        <View className="flex-row items-center justify-between">
          {/* Date */}
          <Text
            className="text-sm font-bold"
            style={{
              color: colors.textPrimary,
            }}
          >
            {formatDate(item.expenseDate)}
          </Text>

          {/* Split Info and User's Share - grouped together */}
          <View className="flex-row items-center gap-4">
            <Text
              className="text-xs font-normal"
              style={{
                color: colors.textPrimary,
              }}
            >
              {getSplitTypeText()}
            </Text>

            {/* User's Share */}
            {(hasDebt || hasCredit) && (
              <Text
                className="text-base font-bold"
                style={{
                  color: hasCredit ? "#22C55E" : "#EF4444", // Green for credits, Red for debts
                }}
              >
                {language === "vi" ? "Bạn: " : "You: "}
                {hasCredit ? "+" : ""}
                {formatCurrency(hasCredit ? item.yourCredits : item.yourDebts)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [language, colors, formatDate, formatCurrency, user]);

  // Render list header
  const renderListHeader = useCallback(() => {
    if (!group) return null;

    return (
      <View className=" pt-4 pb-2">
        {/* Group Members Section */}
        <View className="mb-6">
          <Text
            className="text-base mb-3 font-medium"
            style={{
              color: colors.textPrimary,
            }}
          >
            {group.members.length} {language === "vi" ? "thành viên" : "members"}
          </Text>
          <View className="flex-row items-center">
            {group.members.map((member, index) => {
              const initials = getMemberInitials(member.fullName);
              const avatarColor = getMemberAvatarColor(member.id);
              const textColor = getMemberTextColor(member.id);
              return (
                <View
                  key={member.id}
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: avatarColor,
                    marginLeft: index > 0 ? -8 : 0,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  {member.avatarUrl ? (
                    <Image
                      source={{ uri: member.avatarUrl }}
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      className="text-base font-extrabold"
                      style={{
                        color: textColor,
                      }}
                    >
                      {initials}
                    </Text>
                  )}
                </View>
              );
            })}
            {/* Add member button */}
            <TouchableOpacity
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: colors.surface,
                marginLeft: group.members.length > 0 ? -8 : 0,
                borderWidth: 2,
                borderColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
              activeOpacity={0.7}
            >
              <Icon name="userPlus" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Expenses Section */}
        <Text
          className="text-lg font-semibold ml-2 mb-4"
          style={{
            color: colors.textPrimary,
          }}
        >
          {language === "vi" ? "Chi phí gần đây" : "Recent Expenses"}
        </Text>

      </View>
    );
  }, [group, language, colors, getMemberInitials, getMemberAvatarColor, getMemberTextColor]);

  // Refresh control - must be before early returns
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

  if (isLoading && !group) {
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
          <Text
            className="text-base text-center font-normal"
            style={{
              color: colors.textSecondary,
            }}
          >
            {language === "vi" ? "Không tìm thấy nhóm" : "Group not found"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 px-2" style={{ backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }}
      >
        <View className="flex-row items-center justify-between px-4 py-4">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Group Name - Centered */}
          <View className="flex-1 items-center px-4">
            <Text
              className="text-lg font-bold"
              style={{
                color: colors.textPrimary,
              }}
              numberOfLines={1}
            >
              {group.name}
            </Text>
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/group/${params.id}/settings`)}
          >
            <Icon name="settings" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {group.expenses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text
            className="text-base text-center font-normal"
            style={{
              color: colors.textSecondary,
            }}
          >
            {language === "vi" ? "Chưa có chi phí nào" : "No expenses yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={group.expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          refreshControl={refreshControl}
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}

      {/* FAB Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: colors.primary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.8}
        onPress={() => router.push(`/group/${params.id}/add-expense`)}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

