import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getThemeColors } from "../../src/utils/themeColors";
import { usePreferencesStore } from "../../src/store/preferencesStore";
import { Icon } from "../../src/components/common/Icon";
import { apiClient } from "../../src/services/api/config";
import {
  getMemberInitials,
  getMemberAvatarColor,
  getMemberTextColor,
} from "../../src/utils/memberUtils";
import dayjs from "dayjs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchGroup {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  expenseCount: number;
}

interface SearchExpense {
  id: string;
  description: string;
  amount: string;
  category: string;
  expenseDate: string;
  groupId: string;
  groupName?: string;
  paidBy: string;
}

type SearchMode = "group" | "expense";

// ─── API helpers ──────────────────────────────────────────────────────────────

const searchGroups = async (q: string): Promise<SearchGroup[]> => {
  const res = await apiClient.get("/groups", { params: { q, pageSize: 20 } });
  return res.data.groups ?? [];
};

const searchExpenses = async (q: string): Promise<SearchExpense[]> => {
  const res = await apiClient.get("/expenses", { params: { q, pageSize: 20 } });
  return res.data.expenses ?? [];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const GroupRow = ({
  item,
  colors,
}: {
  item: SearchGroup;
  colors: ReturnType<typeof getThemeColors>;
}) => (
  <TouchableOpacity
    onPress={() => router.push(`/group/${item.id}` as any)}
    activeOpacity={0.7}
    className="flex-row items-center px-4 py-3.5 gap-3.5"
    style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
  >
    {item.avatarUrl ? (
      <Image
        source={{ uri: item.avatarUrl }}
        className="w-12 h-12 rounded-2xl"
      />
    ) : (
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center"
        style={{ backgroundColor: getMemberAvatarColor(item.id) }}
      >
        <Text
          className="text-base font-bold"
          style={{ color: getMemberTextColor(item.id) }}
        >
          {getMemberInitials(item.name)}
        </Text>
      </View>
    )}
    <View className="flex-1">
      <Text
        className="text-base font-semibold"
        style={{ color: colors.textPrimary }}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
        {item.memberCount} thành viên · {item.expenseCount} chi phí
      </Text>
    </View>
    <Icon name="chevronRight" size={20} color={colors.textTertiary} />
  </TouchableOpacity>
);

const CATEGORY_STYLE: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  FOOD: { bg: "#FFF7ED", text: "#F97316", icon: "utensils" },
  TRANSPORT: { bg: "#EFF6FF", text: "#3B82F6", icon: "car" },
  HOUSING: { bg: "#F0FDF4", text: "#22C55E", icon: "bed" },
  ENTERTAINMENT: { bg: "#FAF5FF", text: "#A855F7", icon: "movie" },
  TRAVEL: { bg: "#FEF2F2", text: "#EF4444", icon: "airplane" },
  SHOPPING: { bg: "#FDF2F8", text: "#EC4899", icon: "shoppingCart" },
  HEALTH: { bg: "#ECFEFF", text: "#06B6D4", icon: "stethoscope" },
  EDUCATION: { bg: "#FFFBEB", text: "#F59E0B", icon: "book" },
  PETS: { bg: "#F5F3FF", text: "#8B5CF6", icon: "bone" },
  GIFTS: { bg: "#FFF1F2", text: "#F43F5E", icon: "gift" },
  OTHER: { bg: "#F3F4F6", text: "#6B7280", icon: "receipt" },
};

const ExpenseRow = ({
  item,
  colors,
}: {
  item: SearchExpense;
  colors: ReturnType<typeof getThemeColors>;
}) => {
  const cat = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.OTHER;
  const formatAmount = (amount: string) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/group/${item.groupId}/expense/${item.id}` as any)
      }
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3.5 gap-3.5"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center"
        style={{ backgroundColor: cat.bg }}
      >
        <Icon name={cat.icon as any} size={22} color={cat.text} />
      </View>
      <View className="flex-1">
        <Text
          className="text-base font-semibold"
          style={{ color: colors.textPrimary }}
          numberOfLines={1}
        >
          {item.description}
        </Text>
        <Text
          className="text-sm mt-0.5"
          style={{ color: colors.textSecondary }}
        >
          {item.groupName ? `${item.groupName} · ` : ""}
          {dayjs(item.expenseDate).format("DD/MM/YYYY")}
        </Text>
      </View>
      <Text className="text-base font-bold" style={{ color: colors.primary }}>
        {formatAmount(item.amount)}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const [mode, setMode] = useState<SearchMode>("group");
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTextChange = useCallback((text: string) => {
    setInputValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(text.trim()), 400);
  }, []);

  const handleClear = () => {
    setInputValue("");
    setQuery("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const { data: groupResults, isFetching: fetchingGroups } = useQuery({
    queryKey: ["search", "group", query],
    queryFn: () => searchGroups(query),
    enabled: mode === "group" && query.length >= 1,
    placeholderData: (prev) => prev,
  });

  const { data: expenseResults, isFetching: fetchingExpenses } = useQuery({
    queryKey: ["search", "expense", query],
    queryFn: () => searchExpenses(query),
    enabled: mode === "expense" && query.length >= 1,
    placeholderData: (prev) => prev,
  });

  const isLoading = mode === "group" ? fetchingGroups : fetchingExpenses;
  const results =
    mode === "group" ? (groupResults ?? []) : (expenseResults ?? []);
  const isEmpty = query.length >= 1 && !isLoading && results.length === 0;

  const MODE_TABS: { key: SearchMode; label: string; icon: string }[] = [
    { key: "group", label: "Nhóm", icon: "users" },
    { key: "expense", label: "Chi phí", icon: "receipt" },
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Top hero area */}
      <View className="px-5 pt-6 pb-4">
        <Text
          className="text-2xl font-extrabold mb-1"
          style={{ color: colors.textPrimary }}
        >
          Tìm kiếm
        </Text>
        <Text className="text-sm mb-5" style={{ color: colors.textSecondary }}>
          {mode === "group" ? "Tìm nhóm theo tên" : "Tìm chi phí theo mô tả"}
        </Text>

        {/* Search input */}
        <View
          className="flex-row items-center rounded-2xl px-4 gap-3"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: query.length > 0 ? colors.primary : colors.border,
            height: 52,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Icon
            name="search"
            size={20}
            color={query.length > 0 ? colors.primary : colors.textSecondary}
          />
          <TextInput
            className="flex-1 text-base"
            style={{ color: colors.textPrimary }}
            placeholder={mode === "group" ? "Tên nhóm..." : "Mô tả chi phí..."}
            placeholderTextColor={colors.textTertiary}
            value={inputValue}
            onChangeText={handleTextChange}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isLoading && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          {!isLoading && inputValue.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={10}>
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.border }}
              >
                <Icon name="x" size={14} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mode Switcher */}
      <View
        className="flex-row mx-5 mb-4 rounded-2xl p-1"
        style={{ backgroundColor: colors.surface }}
      >
        {MODE_TABS.map((tab) => {
          const isActive = mode === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                setMode(tab.key);
                setQuery(inputValue.trim());
              }}
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center py-2.5 gap-2 rounded-xl"
              style={{
                backgroundColor: isActive ? colors.primary : "transparent",
              }}
            >
              <Icon
                name={tab.icon}
                size={17}
                color={isActive ? "#FFFFFF" : colors.textSecondary}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: isActive ? "#FFFFFF" : colors.textSecondary }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Result count pill */}
      {query.length >= 1 && !isEmpty && (
        <View className="px-5 mb-2">
          <Text
            className="text-xs font-medium"
            style={{ color: colors.textSecondary }}
          >
            {results.length} kết quả cho "{query}"
          </Text>
        </View>
      )}

      {/* Empty states */}
      {query.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 pb-10">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-2"
            style={{ backgroundColor: colors.surface }}
          >
            <Icon name="search" size={38} color={colors.primary} />
          </View>
          <Text
            className="text-lg font-bold"
            style={{ color: colors.textPrimary }}
          >
            {mode === "group" ? "Tìm nhóm" : "Tìm chi phí"}
          </Text>
          <Text
            className="text-sm text-center px-10"
            style={{ color: colors.textSecondary }}
          >
            {mode === "group"
              ? "Nhập tên nhóm vào ô tìm kiếm bên trên để xem kết quả"
              : "Nhập mô tả chi phí vào ô tìm kiếm bên trên để tìm kiếm"}
          </Text>
        </View>
      ) : isEmpty ? (
        <View className="flex-1 items-center justify-center gap-3 pb-10">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-2"
            style={{ backgroundColor: colors.surface }}
          >
            <Icon name="alertTriangle" size={38} color={colors.textSecondary} />
          </View>
          <Text
            className="text-lg font-bold"
            style={{ color: colors.textPrimary }}
          >
            Không tìm thấy
          </Text>
          <Text
            className="text-sm text-center px-10"
            style={{ color: colors.textSecondary }}
          >
            Không có kết quả nào cho{" "}
            <Text
              className="font-semibold"
              style={{ color: colors.textPrimary }}
            >
              "{query}"
            </Text>
            {"\n"}Hãy thử từ khoá khác.
          </Text>
        </View>
      ) : mode === "group" ? (
        <FlatList
          data={groupResults ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GroupRow item={item} colors={colors} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <FlatList
          data={expenseResults ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExpenseRow item={item} colors={colors} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}
