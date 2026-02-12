import React, { useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Icon } from "./Icon";
import { usePreferencesStore } from "../../store/preferencesStore";
import { getThemeColors } from "../../utils/themeColors";
import { useCategoryStore } from "../../store/categoryStore";
import { getCategoryIcon } from "../../constants/category.constants";
import { ParentCategory } from "../../services/api/expense.api";

interface CategorySelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (category: ParentCategory, subCategoryId?: string) => void;
  selectedCategory: ParentCategory;
  selectedSubCategoryId?: string;
}

interface CategoryItem {
  id: string | number;
  key: string;
  name?: string;
}

interface CategorySection {
  title: string;
  parentKey: string;
  data: CategoryItem[];
}

// Get category colors based on parent key
const getCategoryColors = (parentKey: string) => {
  switch (parentKey) {
    case "FOOD":
      return { bg: "#FFF7ED", icon: "#F97316" };
    case "TRANSPORT":
      return { bg: "#EFF6FF", icon: "#3B82F6" };
    case "HOUSING":
      return { bg: "#F0FDF4", icon: "#22C55E" };
    case "ENTERTAINMENT":
      return { bg: "#FAF5FF", icon: "#A855F7" };
    case "TRAVEL":
      return { bg: "#FEF2F2", icon: "#EF4444" };
    case "SHOPPING":
      return { bg: "#FDF2F8", icon: "#EC4899" };
    case "HEALTH":
      return { bg: "#ECFEFF", icon: "#06B6D4" };
    case "EDUCATION":
      return { bg: "#FFFBEB", icon: "#F59E0B" };
    case "PETS":
      return { bg: "#F5F3FF", icon: "#8B5CF6" };
    case "GIFTS":
      return { bg: "#FFF1F2", icon: "#F43F5E" };
    default:
      return { bg: "#F3F4F6", icon: "#6B7280" };
  }
};

// Memoized category item component
const CategoryItemComponent = React.memo(
  ({
    item,
    parentKey,
    isSelected,
    colors,
    onPress,
    t,
  }: {
    item: CategoryItem;
    parentKey: string;
    isSelected: boolean;
    colors: any;
    onPress: () => void;
    t: any;
  }) => {
    const iconName = getCategoryIcon(item.key);
    const categoryColors = getCategoryColors(parentKey);

    return (
      <TouchableOpacity
        className="flex-row items-center p-3 rounded-xl border mb-3"
        style={{
          backgroundColor: isSelected ? categoryColors.bg : colors.surface,
          borderColor: isSelected ? categoryColors.icon : colors.border,
        }}
        onPress={onPress}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: categoryColors.bg }}
        >
          <MaterialCommunityIcons
            name={iconName as any}
            size={20}
            color={categoryColors.icon}
          />
        </View>
        <Text
          className="flex-1 font-medium"
          style={{
            fontSize: 16,
            color: isSelected ? categoryColors.icon : colors.textPrimary,
          }}
        >
          {t(`categories.${item.key}`)}
        </Text>
        {isSelected && (
          <Icon name="check" size={20} color={categoryColors.icon} />
        )}
      </TouchableOpacity>
    );
  },
);

CategoryItemComponent.displayName = "CategoryItemComponent";

export const CategorySelector = ({
  isVisible,
  onClose,
  onSelect,
  selectedCategory,
  selectedSubCategoryId,
}: CategorySelectorProps) => {
  const { t } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const categories = useCategoryStore((state) => state.categories) || {};
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const isLoading = useCategoryStore((state) => state.isLoading);

  // Fetch categories when modal opens if not already loaded
  useEffect(() => {
    if (isVisible) {
      fetchCategories();
    }
  }, [isVisible, fetchCategories]);

  // Transform grouped categories to SectionList format
  const sections: CategorySection[] = useMemo(() => {
    let groupedCategories = categories;

    if (Array.isArray(categories)) return [];
    if (categories && typeof categories === "object" && "data" in categories) {
      groupedCategories = (categories as any).data;
    }

    return Object.keys(groupedCategories)
      .filter((key) => {
        const items = groupedCategories[key];
        return Array.isArray(items) && items.length > 0;
      })
      .map((parentKey) => ({
        title: t(`categories.${parentKey}`),
        parentKey,
        data: groupedCategories[parentKey],
      }));
  }, [categories, t]);

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: CategorySection }) => (
      <Text
        className="text-sm font-bold mb-3 uppercase bg-transparent"
        style={{
          color: colors.textSecondary,
          backgroundColor: colors.background,
        }}
      >
        {section.title}
      </Text>
    ),
    [colors],
  );

  // Render item
  const renderItem = useCallback(
    ({ item, section }: { item: CategoryItem; section: CategorySection }) => {
      const isSelected = selectedSubCategoryId === String(item.id);
      return (
        <CategoryItemComponent
          item={item}
          parentKey={section.parentKey}
          isSelected={isSelected}
          colors={colors}
          onPress={() => {
            onSelect(section.parentKey as ParentCategory, String(item.id));
            onClose();
          }}
          t={t}
        />
      );
    },
    [selectedSubCategoryId, colors, onSelect, onClose, t],
  );

  // Key extractor using stable item id
  const keyExtractor = useCallback((item: CategoryItem) => String(item.id), []);

  // Section separator
  const SectionSeparator = useCallback(() => <View className="h-4" />, []);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View
          style={{
            flex: 1,
            marginTop: 60,
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 py-4 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <TouchableOpacity onPress={onClose} className="p-2">
              <Icon name="x" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text
              className="text-lg font-bold"
              style={{ color: colors.textPrimary }}
            >
              Chọn danh mục
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* List - Using SectionList per Rule 3 */}
          {isLoading || sections.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-gray-500 mt-2">Đang tải danh mục...</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              SectionSeparatorComponent={SectionSeparator}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};
