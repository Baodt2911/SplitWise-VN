import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Icon } from "../../../components/common/Icon";

interface ExpenseSearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  colors: any;
  debounceMs?: number;
}

export const ExpenseSearchHeader: React.FC<ExpenseSearchHeaderProps> = ({
  value,
  onChangeText,
  placeholder = "Tìm chi phí...",
  colors,
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the callback
      debounceRef.current = setTimeout(() => {
        onChangeText(text);
      }, debounceMs);
    },
    [onChangeText, debounceMs],
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChangeText("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, [onChangeText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <View
      className="flex-row items-center px-4 py-2 mx-4 my-2 rounded-xl"
      style={{ backgroundColor: colors.surface }}
    >
      <Icon name="search" size={20} color={colors.textSecondary} />
      <TextInput
        value={localValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        className="flex-1 ml-2 text-base"
        style={{ color: colors.textPrimary }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {localValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="x" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};
