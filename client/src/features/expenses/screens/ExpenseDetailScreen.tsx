import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import { Icon } from "../../../components/common/Icon";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import { useGroupStore } from "../../../store/groupStore";
import { useAuthStore } from "../../../store/authStore";
import { getExpenseDetail } from "../../../services/api/expense.api";
import { getCategoryIcon } from "../../../constants/category.constants";
import { getMemberInitials, getMemberAvatarColor, getMemberTextColor } from "../../../utils/memberUtils";

export const ExpenseDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string; expenseId: string }>();
  const { t } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const user = useAuthStore((state) => state.user);
  
  const group = useGroupStore((state) => 
    params.id ? state.groupDetails[params.id] : undefined
  );
  
  const storeExpense = useMemo(() => {
    if (!group?.expenses) return null;
    return group.expenses.find((e: any) => e.id === params.expenseId);
  }, [group, params.expenseId]);

  const [fetchedExpense, setFetchedExpense] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");

  // Fetch expense if not in store
  React.useEffect(() => {
    if (!storeExpense && params.id && params.expenseId) {
      const fetchExpense = async () => {
        try {
          setLoading(true);
          const res = await getExpenseDetail(params.id, params.expenseId);
          if (!('message' in res)) {
             setFetchedExpense(res);
          }
        } catch (error) {
          console.error("Failed to fetch expense detail", error);
        } finally {
          setLoading(false);
        }
      };
      fetchExpense();
    }
  }, [storeExpense, params.id, params.expenseId]);

  const expense = storeExpense || fetchedExpense;

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>Không tìm thấy chi phí</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format currency
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  };

  // Get category colors
  const getCategoryColors = (category: string) => {
    switch(category) {
      case "FOOD": return { bg: "#FFF7ED", text: "#F97316" };
      case "TRANSPORT": return { bg: "#EFF6FF", text: "#3B82F6" };
      case "HOUSING": return { bg: "#F0FDF4", text: "#22C55E" };
      case "ENTERTAINMENT": return { bg: "#FAF5FF", text: "#A855F7" };
      case "TRAVEL": return { bg: "#FEF2F2", text: "#EF4444" };
      case "SHOPPING": return { bg: "#FDF2F8", text: "#EC4899" };
      case "HEALTH": return { bg: "#ECFEFF", text: "#06B6D4" };
      case "EDUCATION": return { bg: "#FFFBEB", text: "#F59E0B" };
      case "PETS": return { bg: "#F5F3FF", text: "#8B5CF6" };
      case "GIFTS": return { bg: "#FFF1F2", text: "#F43F5E" };
      case "OTHER": return { bg: "#F3F4F6", text: "#6B7280" };
      default: return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const categoryColors = getCategoryColors(expense.category);
  const iconKey = expense.subCategory ? expense.subCategory.key : expense.category;
  const iconName = getCategoryIcon(iconKey);

  // Get member info helper
  const getMemberInfo = (userId: string) => {
    if (userId === user?.id) return { fullName: "Bạn", avatarUrl: user?.avatarUrl };
    const member = group?.members.find(m => m.userId === userId);
    return member || { fullName: "Unknown", avatarUrl: null };
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
          Chi tiết chi phí
        </Text>
        <TouchableOpacity 
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <Icon name="moreVertical" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Main Info Card */}
          <View 
            className="rounded-xl p-5 mb-4 shadow-sm"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center gap-4">
              <View 
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: categoryColors.bg }}
              >
                <Icon name={iconName as any} size={28} color={categoryColors.text} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                  {t(`categories.${expense.category}`)}
                  {expense.subCategory && ` - ${t(`categories.${expense.subCategory.key}`)}`}
                </Text>
                <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {expense.description}
                </Text>
              </View>
            </View>

            <View className="mt-4 pt-4 flex-row items-end justify-between border-t" style={{ borderColor: colors.border }}>
              <View>
                <Text className="text-2xl font-extrabold" style={{ color: colors.primary }}>
                  {formatCurrency(expense.amount)}
                </Text>
                <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                  {dayjs(new Date(new Date(expense.expenseDate).getTime() + 7 * 60 * 60 * 1000)).locale("vi").format("dddd, DD/MM/YYYY")}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                  {expense.paidById === user?.id ? "Bạn" : expense.paidBy} trả
                </Text>
                {getMemberInfo(expense.paidById).avatarUrl ? (
                  <Image 
                    source={{ uri: getMemberInfo(expense.paidById).avatarUrl! }}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: getMemberAvatarColor(expense.paidById) }}
                  >
                    <Text 
                      className="font-bold text-xs" 
                      style={{ color: getMemberTextColor(expense.paidById) }}
                    >
                      {getMemberInitials(expense.paidBy || "Unknown")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Split Details Card */}
          <View 
            className="rounded-xl p-5 mb-4 shadow-sm"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="pieChart" size={20} color={colors.textSecondary} />
              <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
                Chia cho {expense.splits.length} người ({expense.splitType === "EQUAL" ? "đều" : "khác"})
              </Text>
            </View>

            <View className="gap-3">
              {expense.splits.map((split: any) => {
                const memberInfo = getMemberInfo(split.userId);
                return (
                  <View key={split.id} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      {memberInfo.avatarUrl ? (
                        <Image 
                          source={{ uri: memberInfo.avatarUrl }}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <View 
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: getMemberAvatarColor(split.userId) }}
                        >
                          <Text 
                            className="font-bold" 
                            style={{ color: getMemberTextColor(split.userId) }}
                          >
                            {getMemberInitials(memberInfo.fullName)}
                          </Text>
                        </View>
                      )}
                      <Text className="font-medium" style={{ color: colors.textPrimary }}>
                        {memberInfo.fullName}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="font-semibold" style={{ color: colors.textPrimary }}>
                        {formatCurrency(split.amount)}
                      </Text>
                      {/* Assuming everyone is included/checked for now */}
                      <Icon name="check" size={20} color="#22C55E" />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Receipt Card */}
          {expense.receiptUrl && (
            <View 
              className="rounded-xl p-5 mb-4 shadow-sm"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="receipt" size={20} color={colors.textSecondary} />
                <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
                  Hóa đơn
                </Text>
              </View>
              <Image 
                source={{ uri: expense.receiptUrl }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
            </View>
          )}

          {/* Note Card */}
          {expense.notes && (
            <View 
              className="rounded-xl p-5 mb-4 shadow-sm"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="edit" size={20} color={colors.textSecondary} />
                <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
                  Ghi chú
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary }}>
                {expense.notes}
              </Text>
            </View>
          )}

          {/* Comments Section - Placeholder for now */}
          <View className="mb-4">
            <Text className="text-base font-bold mb-4 px-1" style={{ color: colors.textPrimary }}>
              Bình luận (0)
            </Text>
            {/* Comments list would go here */}
          </View>
        </ScrollView>

        <View className="relative flex-row items-center mx-4 mb-4 ">
          <TextInput
            className="flex-1 rounded-full py-4 pl-5 text-sm"
            style={{ 
              backgroundColor: colors.background,
              color: colors.textPrimary,
              borderColor: colors.border,
              borderWidth: 1
            }}
            placeholder="Thêm bình luận..."
            placeholderTextColor={colors.textTertiary}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity 
            className="absolute right-2 w-9 h-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Icon name="arrowRight" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
