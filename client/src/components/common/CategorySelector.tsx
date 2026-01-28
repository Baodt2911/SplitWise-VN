import React, { useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
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
  
  // Categories are already grouped by the API
  const groupedCategories = useMemo(() => {
    // Fallsback to object check if for some reason it's still an array (shouldn't happen with new store)
    if (Array.isArray(categories)) return {}; 
    
    // Check if categories has a 'data' wrapper (API response structure)
    if (categories && typeof categories === 'object' && 'data' in categories) {
      return (categories as any).data;
    }
    
    return categories;
  }, [categories]);

  // Order of parent categories to display
  const parentOrder = [
    "FOOD",
    "TRANSPORT",
    "ENTERTAINMENT",
    "HOUSING",
    "TRAVEL",
    "SHOPPING",
    "HEALTH",
    "EDUCATION",
    "PETS",
    "GIFTS",
    "OTHER",
  ];

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

          {/* List */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {isLoading || Object.keys(groupedCategories).length === 0 ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-gray-500 mt-2">Đang tải danh mục...</Text>
              </View>
            ) : (
              Object.keys(groupedCategories).map((parentKey) => {
                const groupItems = groupedCategories[parentKey];
                if (!Array.isArray(groupItems) || groupItems.length === 0) return null;

                return (
                  <View key={parentKey} className="mb-6">
                    <Text
                      className="text-sm font-bold mb-3 uppercase"
                      style={{ color: colors.textSecondary }}
                    >
                      {t(`categories.${parentKey}`)}
                    </Text>
                    
                    <View>
                      {groupItems.map((item, index) => {
                        const iconName = getCategoryIcon(item.key);
                        // Check if this subcategory is selected (by ID)
                        const isSelected = selectedSubCategoryId === String(item.id);
                        
                        // Determine colors based on parent category
                        let iconBgColor = "#F3F4F6"; // gray-50
                        let iconColor = "#6B7280"; // gray-500
                        
                        switch(parentKey) {
                          case "FOOD": iconBgColor = "#FFF7ED"; iconColor = "#F97316"; break; // orange
                          case "TRANSPORT": iconBgColor = "#EFF6FF"; iconColor = "#3B82F6"; break; // blue
                          case "HOUSING": iconBgColor = "#F0FDF4"; iconColor = "#22C55E"; break; // green
                          case "ENTERTAINMENT": iconBgColor = "#FAF5FF"; iconColor = "#A855F7"; break; // purple
                          case "TRAVEL": iconBgColor = "#FEF2F2"; iconColor = "#EF4444"; break; // red
                          case "SHOPPING": iconBgColor = "#FDF2F8"; iconColor = "#EC4899"; break; // pink
                          case "HEALTH": iconBgColor = "#ECFEFF"; iconColor = "#06B6D4"; break; // cyan
                          case "EDUCATION": iconBgColor = "#FFFBEB"; iconColor = "#F59E0B"; break; // amber
                          case "PETS": iconBgColor = "#F5F3FF"; iconColor = "#8B5CF6"; break; // violet
                          case "GIFTS": iconBgColor = "#FFF1F2"; iconColor = "#F43F5E"; break; // rose
                          case "OTHER": iconBgColor = "#F3F4F6"; iconColor = "#6B7280"; break; // gray
                          default: break;
                        }

                        return (
                          <TouchableOpacity
                            key={item.id}
                            className="flex-row items-center p-3 rounded-xl border"
                            style={{
                              backgroundColor: isSelected ? iconBgColor : colors.surface,
                              borderColor: isSelected ? iconColor : colors.border,
                              marginBottom: index < groupItems.length - 1 ? 12 : 0,
                            }}
                            onPress={() => {
                              // Send parent category and subcategory ID
                              onSelect(parentKey as ParentCategory, String(item.id));
                              onClose();
                            }}
                          >
                            <View
                              className="w-10 h-10 rounded-full items-center justify-center mr-3"
                              style={{ backgroundColor: iconBgColor }}
                            >
                              <MaterialCommunityIcons 
                                name={iconName as any} 
                                size={20} 
                                color={iconColor} 
                              />
                            </View>
                            <Text
                              className="flex-1 font-medium"
                              style={{
                                fontSize: 16,
                                color: isSelected ? iconColor : colors.textPrimary,
                              }}
                            >
                              {t(`categories.${item.key}`)}
                            </Text>
                            {isSelected && (
                              <Icon name="check" size={20} color={iconColor} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
