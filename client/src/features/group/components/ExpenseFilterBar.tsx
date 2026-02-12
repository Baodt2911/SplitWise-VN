import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Icon } from "../../../components/common/Icon";
import type { ExpenseFilters } from "../../../store/groupStore";
import type { GroupMember } from "../../../services/api/group.api";

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  onClear?: () => void;
  colors: any;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive,
  onPress,
  onClear,
  colors,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-3 py-2 rounded-full mr-2"
    style={{
      backgroundColor: isActive ? colors.primary : colors.surface,
      borderWidth: 1,
      borderColor: isActive ? colors.primary : colors.border,
    }}
    activeOpacity={0.7}
  >
    <Text
      className="text-sm font-medium"
      style={{ color: isActive ? "#FFFFFF" : colors.textSecondary }}
    >
      {label}
    </Text>
    {isActive && onClear && (
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation?.();
          onClear();
        }}
        className="ml-1"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="x" size={14} color="#FFFFFF" />
      </TouchableOpacity>
    )}
    {!isActive && (
      <Icon
        name="chevronDown"
        size={14}
        color={colors.textSecondary}
        style={{ marginLeft: 4 }}
      />
    )}
  </TouchableOpacity>
);

// Category options
const CATEGORIES = [
  { value: "FOOD", label: "Ăn uống" },
  { value: "TRANSPORT", label: "Di chuyển" },
  { value: "ENTERTAINMENT", label: "Giải trí" },
  { value: "HOUSING", label: "Nhà ở" },
  { value: "TRAVEL", label: "Du lịch" },
  { value: "SHOPPING", label: "Mua sắm" },
  { value: "HEALTH", label: "Sức khỏe" },
  { value: "EDUCATION", label: "Giáo dục" },
  { value: "PETS", label: "Thú cưng" },
  { value: "GIFTS", label: "Quà tặng" },
  { value: "OTHER", label: "Khác" },
];

const SORT_OPTIONS = [
  { value: "expenseDate", label: "Ngày chi tiêu" },
  { value: "createdAt", label: "Ngày tạo" },
];

interface ExpenseFilterBarProps {
  filters: ExpenseFilters;
  members: GroupMember[];
  colors: any;
  onFilterChange: (filters: Partial<ExpenseFilters>) => void;
  onDatePress: () => void;
  activeFilterCount: number;
}

export const ExpenseFilterBar: React.FC<ExpenseFilterBarProps> = ({
  filters,
  members,
  colors,
  onFilterChange,
  onDatePress,
  activeFilterCount,
}) => {
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [showPayerModal, setShowPayerModal] = React.useState(false);
  const [showSortModal, setShowSortModal] = React.useState(false);

  // Get display labels
  const categoryLabel = useMemo(() => {
    if (!filters.category) return "Danh mục";
    const cat = CATEGORIES.find((c) => c.value === filters.category);
    return cat?.label || "Danh mục";
  }, [filters.category]);

  const payerLabel = useMemo(() => {
    if (!filters.paidBy) return "Người trả";
    const member = (members || []).find((m) => m.userId === filters.paidBy);
    return member?.fullName || "Người trả";
  }, [filters.paidBy, members]);

  const dateLabel = useMemo(() => {
    if (filters.expenseDateFrom && filters.expenseDateTo) {
      const from = new Date(filters.expenseDateFrom);
      const to = new Date(filters.expenseDateTo);
      return `${from.getDate()}/${from.getMonth() + 1} - ${to.getDate()}/${to.getMonth() + 1}`;
    }
    if (filters.expenseDateFrom) {
      const from = new Date(filters.expenseDateFrom);
      return `Từ ${from.getDate()}/${from.getMonth() + 1}`;
    }
    if (filters.expenseDateTo) {
      const to = new Date(filters.expenseDateTo);
      return `Đến ${to.getDate()}/${to.getMonth() + 1}`;
    }
    return "Thời gian";
  }, [filters.expenseDateFrom, filters.expenseDateTo]);

  const sortLabel = useMemo(() => {
    const sortOpt = SORT_OPTIONS.find((s) => s.value === filters.sort);
    const orderIcon = filters.order === "asc" ? "↑" : "↓";
    return `${sortOpt?.label || "Sắp xếp"} ${orderIcon}`;
  }, [filters.sort, filters.order]);

  const handleCategorySelect = useCallback(
    (category: string | undefined) => {
      onFilterChange({ category });
      setShowCategoryModal(false);
    },
    [onFilterChange],
  );

  const handlePayerSelect = useCallback(
    (paidBy: string | undefined) => {
      onFilterChange({ paidBy });
      setShowPayerModal(false);
    },
    [onFilterChange],
  );

  const handleSortSelect = useCallback(
    (sort: "createdAt" | "expenseDate", order: "asc" | "desc") => {
      onFilterChange({ sort, order });
      setShowSortModal(false);
    },
    [onFilterChange],
  );

  const renderSelectModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { value: string; label: string }[],
    selectedValue: string | undefined,
    onSelect: (value: string | undefined) => void,
    showClearOption = true,
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-3xl px-4 pt-4 pb-8"
          style={{ backgroundColor: colors.card }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
          <Text
            className="text-lg font-bold mb-4 text-center"
            style={{ color: colors.textPrimary }}
          >
            {title}
          </Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {showClearOption && (
              <TouchableOpacity
                className="py-3 px-4 rounded-xl mb-2"
                style={{
                  backgroundColor: !selectedValue
                    ? colors.primaryLight
                    : colors.surface,
                }}
                onPress={() => onSelect(undefined)}
              >
                <Text
                  className="text-base font-medium"
                  style={{
                    color: !selectedValue ? colors.primary : colors.textPrimary,
                  }}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>
            )}
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                className="py-3 px-4 rounded-xl mb-2"
                style={{
                  backgroundColor:
                    selectedValue === option.value
                      ? colors.primaryLight
                      : colors.surface,
                }}
                onPress={() => onSelect(option.value)}
              >
                <Text
                  className="text-base font-medium"
                  style={{
                    color:
                      selectedValue === option.value
                        ? colors.primary
                        : colors.textPrimary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <View className="py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* Category Filter */}
        <FilterChip
          label={categoryLabel}
          isActive={!!filters.category}
          onPress={() => setShowCategoryModal(true)}
          onClear={() => onFilterChange({ category: undefined })}
          colors={colors}
        />

        {/* Date Filter */}
        <FilterChip
          label={dateLabel}
          isActive={!!(filters.expenseDateFrom || filters.expenseDateTo)}
          onPress={onDatePress}
          onClear={() =>
            onFilterChange({
              expenseDateFrom: undefined,
              expenseDateTo: undefined,
            })
          }
          colors={colors}
        />

        {/* Payer Filter */}
        <FilterChip
          label={payerLabel}
          isActive={!!filters.paidBy}
          onPress={() => setShowPayerModal(true)}
          onClear={() => onFilterChange({ paidBy: undefined })}
          colors={colors}
        />

        {/* Sort */}
        <FilterChip
          label={sortLabel}
          isActive={false}
          onPress={() => setShowSortModal(true)}
          colors={colors}
        />

        {/* Clear all filters */}
        {activeFilterCount > 0 && (
          <TouchableOpacity
            onPress={() =>
              onFilterChange({
                category: undefined,
                expenseDateFrom: undefined,
                expenseDateTo: undefined,
                paidBy: undefined,
                q: undefined,
              })
            }
            className="flex-row items-center px-3 py-2"
          >
            <Icon name="x" size={16} color={colors.danger} />
            <Text
              className="text-sm font-medium ml-1"
              style={{ color: colors.danger }}
            >
              Xóa ({activeFilterCount})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Category Modal */}
      {renderSelectModal(
        showCategoryModal,
        () => setShowCategoryModal(false),
        "Chọn danh mục",
        CATEGORIES,
        filters.category,
        handleCategorySelect,
      )}

      {/* Payer Modal */}
      {renderSelectModal(
        showPayerModal,
        () => setShowPayerModal(false),
        "Chọn người trả",
        (members || []).map((m) => ({ value: m.userId, label: m.fullName })),
        filters.paidBy,
        handlePayerSelect,
      )}

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setShowSortModal(false)}
        >
          <Pressable
            className="rounded-t-3xl px-4 pt-4 pb-8"
            style={{ backgroundColor: colors.card }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            <Text
              className="text-lg font-bold mb-4 text-center"
              style={{ color: colors.textPrimary }}
            >
              Sắp xếp theo
            </Text>
            {SORT_OPTIONS.map((option) => (
              <View key={option.value} className="mb-3">
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.textSecondary }}
                >
                  {option.label}
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{
                      backgroundColor:
                        filters.sort === option.value &&
                        filters.order === "desc"
                          ? colors.primaryLight
                          : colors.surface,
                    }}
                    onPress={() =>
                      handleSortSelect(
                        option.value as "createdAt" | "expenseDate",
                        "desc",
                      )
                    }
                  >
                    <Text
                      style={{
                        color:
                          filters.sort === option.value &&
                          filters.order === "desc"
                            ? colors.primary
                            : colors.textPrimary,
                      }}
                    >
                      Mới nhất ↓
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{
                      backgroundColor:
                        filters.sort === option.value && filters.order === "asc"
                          ? colors.primaryLight
                          : colors.surface,
                    }}
                    onPress={() =>
                      handleSortSelect(
                        option.value as "createdAt" | "expenseDate",
                        "asc",
                      )
                    }
                  >
                    <Text
                      style={{
                        color:
                          filters.sort === option.value &&
                          filters.order === "asc"
                            ? colors.primary
                            : colors.textPrimary,
                      }}
                    >
                      Cũ nhất ↑
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
