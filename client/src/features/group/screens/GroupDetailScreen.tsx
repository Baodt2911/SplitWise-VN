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
import { LinearGradient } from "expo-linear-gradient";
export const GroupDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const theme = usePreferencesStore((state) => state.theme);
  const user = useAuthStore((state) => state.user);
  const colors = getThemeColors(theme);
  const { error: showError } = useToast();
  const getGroupDetailFromStore = useGroupStore((state) => state.getGroupDetail);
  const setGroupDetail = useGroupStore((state) => state.setGroupDetail);
  const groupFromStore = useGroupStore((state) => params.id ? state.groupDetails[params.id] : undefined);
  
  const gradientColors: [string, string] = [colors.primary, colors.primaryDark];
  // Derived state from store - sanitization
  const group = useMemo(() => {
    if (!groupFromStore) return null;
    return {
      ...groupFromStore,
      members: Array.isArray(groupFromStore.members) ? groupFromStore.members : [],
      expenses: Array.isArray(groupFromStore.expenses) ? groupFromStore.expenses : [],
    };
  }, [groupFromStore]);

  // Loading state only for initial load when no data exists
  const [initialLoading, setInitialLoading] = useState(!group);
  const [refreshing, setRefreshing] = useState(false);

  // Use refs to avoid dependency issues
  const showErrorRef = useRef(showError);
  
  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  // Load group detail
  const loadGroupDetail = useCallback(async () => {
    if (!params.id) {
      showErrorRef.current("Không tìm thấy ID nhóm", "Lỗi");
      router.back();
      return;
    }

    try {
      // Check store directly to avoid dependency cycle
      const currentGroup = getGroupDetailFromStore(params.id);
      
      // Only show full screen loading if we have absolutely no data
      if (!currentGroup) {
        setInitialLoading(true);
      }

      const response = await getGroupDetail(params.id);
      
      // Sanitize data
      const safeGroup = {
        ...response.group,
        members: Array.isArray(response.group.members) ? response.group.members : [],
        expenses: Array.isArray(response.group.expenses) ? response.group.expenses : [],
      };
      
      // Save to store
      setGroupDetail(params.id, safeGroup);
    } catch (err: any) {
      const errorMessage = err.message || "Không thể tải thông tin nhóm";
      // Only show error toast if we don't have data, or if it's a manual refresh 
      const currentGroup = getGroupDetailFromStore(params.id);
      if (!currentGroup || refreshing) {
        showErrorRef.current(errorMessage, "Lỗi");
      }
    } finally {
      setInitialLoading(false);
    }
  }, [params.id, setGroupDetail, getGroupDetailFromStore, refreshing]);

  // Initial load - Always fetch fresh data (Stale-while-revalidate)
  useEffect(() => {
    loadGroupDetail();
  }, [loadGroupDetail]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupDetail();
    setRefreshing(false);
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


  // Render expense item
  const renderExpenseItem = useCallback(({ item }: { item: GroupDetail["expenses"][0] }) => {
    const hasDebt = item.yourDebts && item.yourDebts !== "0";
    const hasCredit = item.yourCredits && item.yourCredits !== "0";

    // Get expense icon based on category
    const categoryIcons: Record<string, string> = {
      FOOD: "utensils",
      TRANSPORT: "car",
      ACCOMMODATION: "bed",
      ENTERTAINMENT: "movie",
      SHOPPING: "shoppingBag",
      OTHER: "fileText",
    };
    
    // Icon background colors (pastel)
    const categoryColors: Record<string, string> = {
      FOOD: "bg-orange-50 text-orange-500",
      TRANSPORT: "bg-blue-50 text-blue-500",
      ACCOMMODATION: "bg-red-50 text-red-500",
      ENTERTAINMENT: "bg-purple-50 text-purple-500",
      SHOPPING: "bg-pink-50 text-pink-500",
      OTHER: "bg-gray-50 text-gray-500",
    };
    
    const iconName = categoryIcons[item.category] || "fileText";
    // We'll manage colors manually since NativeWind dynamic class names might not work perfectly with interpolation
    // Using inline styles for dynamic colors based on the map above, adapting to theme colors where possible
    
    let iconBgColor = "#F3F4F6"; // gray-50
    let iconColor = "#6B7280"; // gray-500
    
    switch(item.category) {
      case "FOOD": iconBgColor = "#FFF7ED"; iconColor = "#F97316"; break; // orange
      case "TRANSPORT": iconBgColor = "#EFF6FF"; iconColor = "#3B82F6"; break; // blue
      case "ACCOMMODATION": iconBgColor = "#FEF2F2"; iconColor = "#EF4444"; break; // red
      case "ENTERTAINMENT": iconBgColor = "#FAF5FF"; iconColor = "#A855F7"; break; // purple
      case "SHOPPING": iconBgColor = "#FDF2F8"; iconColor = "#EC4899"; break; // pink
      default: break;
    }

    // Calculate split count
    let splitCount = 1; 
    if (item.splits && item.splits.length > 0) {
      const totalSplitAmount = item.splits.reduce((sum, split) => sum + parseFloat(split.amount || "0"), 0);
      const expenseAmount = parseFloat(item.amount || "0");
      if (Math.abs(totalSplitAmount - expenseAmount) < 0.01) {
        splitCount = item.splits.length;
      } else {
        splitCount = item.splits.length + 1;
      }
    } else {
      splitCount = hasDebt || hasCredit ? 2 : 2;
    }

    return (
      <TouchableOpacity
        className="flex-col gap-3 rounded-xl p-4 mb-3 shadow-sm"
        style={{
          backgroundColor: colors.surface,
        }}
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-3">
             {/* Icon Box */}
            <View 
              className="flex items-center justify-center rounded-lg w-10 h-10 shrink-0"
              style={{ backgroundColor: iconBgColor }}
            >
              <Icon name={iconName as any} size={20} color={iconColor} />
            </View>
            
            {/* Content */}
            <View className="flex-col">
              <Text 
                className="text-base font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {item.description}
              </Text>
              <Text 
                className="text-sm font-normal mt-0.5"
                style={{ color: colors.textSecondary }}
              >
                {formatCurrency(item.amount)} · {item.paidById === user?.id ? "Bạn trả" : `${item.paidBy} trả`}
              </Text>
            </View>
          </View>

          {/* Date */}
          <View className="text-right flex-col items-end">
             <View 
               className="rounded px-1.5 py-0.5 mb-1"
               style={{ backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }}
             >
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  {formatDate(item.expenseDate)}
                </Text>
             </View>
          </View>
        </View>

        {/* Footer (Split info) */}
        <View 
          className="flex-row items-center justify-between text-sm pt-3 border-t border-dashed"
          style={{ borderColor: colors.border + "60" }} // Semi-transparent border
        >
          <View className="px-2 py-1 rounded" style={{ backgroundColor: theme === 'dark' ? '#333' : '#F3F4F6' }}>
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              Chia {splitCount} người
            </Text>
          </View>
          
          {(hasDebt || hasCredit) && (
            <Text 
              className="font-bold text-sm"
              style={{ color: hasCredit ? "#22C55E" : "#EF4444" }}
            >
              Bạn: {formatCurrency(hasCredit ? item.yourCredits : item.yourDebts)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [colors, formatDate, formatCurrency, user, theme]);

  // Render list header
  const renderListHeader = useCallback(() => {
    if (!group) return null;

    return (
      <View className="w-full px-4 pt-6">
        {/* Members Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
             <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
               {group.members.length} thành viên
             </Text>
             <TouchableOpacity>
               <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Quản lý</Text>
             </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center">
            <View className="flex-row" style={{ marginLeft: 8 }}> 
            {group.members.map((member, index) => {
              const initials = getMemberInitials(member.fullName);
              const avatarColor = getMemberAvatarColor(member.id);
              const textColor = getMemberTextColor(member.id);
              return (
                <View
                  key={member.id}
                  className="w-10 h-10 rounded-full items-center justify-center border-2"
                  style={{
                    backgroundColor: avatarColor,
                    borderColor: colors.background,
                    marginLeft: -8, // Negative margin for overlap
                    zIndex: index,
                  }}
                >
                  {member.avatarUrl ? (
                    <Image
                      source={{ uri: member.avatarUrl }}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      className="text-sm font-bold"
                      style={{ color: textColor }}
                    >
                      {initials}
                    </Text>
                  )}
                </View>
              );
            })}
             {/* Add member button */}
             <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center border-2 border-dashed ml-2"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
                zIndex: 100
              }}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            </View>
           
          </View>
        </View>

        {/* Thanh toan (Payment) Section Placeholder - based on image */}
        {/* Only show if we had real settlement data, for now static visual as requested */}
        
        {
        group.expenses.length > 0 && (
        <View className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-6" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
             <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
                 <Icon name="lightbulb" size={20} color="#F59E0B" />
                 <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>Thanh toán</Text>
             </View>

        </View> 
          )
        }
       

        {/* Expenses Header */}
        {
        group.expenses.length > 0 && (
        <View className="flex-row items-center gap-2 mb-4">
           <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
             Chi phí gần đây
           </Text>
        </View>
          )
        }
      </View>
    );
  }, [group, colors, getMemberInitials, getMemberAvatarColor, getMemberTextColor]);

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
          {group.expenses.length === 0 ? (
             <View className="flex-1 mt-6 px-4">
               {/* Show members even if empty */}
               {renderListHeader()}
               <Text className="text-base text-center font-normal mt-10" style={{ color: colors.textSecondary }}>
                 Chưa có chi phí nào
               </Text>
             </View>
          ) : (
             <FlatList
                data={group.expenses}
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

