import { View, Text, Pressable } from "react-native";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";

interface AmountInputProps {
  value: string;
  onPress: () => void;
  error?: boolean;
  placeholder?: string;
}

// Format VND currency - handle expressions and decimals
// Dấu phẩy (,) cho hàng nghìn, dấu chấm (.) cho thập phân
const formatVND = (value: string): string => {
  if (!value || typeof value !== "string" || value.trim() === "") return "0";
  
  // If value contains operators, format each number part separately
  if (/[+\-×÷]/.test(value)) {
    // Split by operators but keep operators
    const parts = value.split(/([+\-×÷])/);
    return parts.map((part, index) => {
      // If it's an operator, return as is
      if (/[+\-×÷]/.test(part)) {
        return part;
      }
      // Format number part (remove existing commas first)
      const numPart = part.replace(/,/g, "");
      if (!numPart || numPart === "") return "";
      
      // Handle decimal
      if (numPart.includes(".")) {
        const [intPart, decPart] = numPart.split(".");
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return decPart ? `${formattedInt}.${decPart}` : `${formattedInt}.`;
      }
      
      // Format integer
      const formatted = numPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return formatted;
    }).join("");
  }
  
  // Handle decimal numbers (dấu chấm cho thập phân)
  if (value.includes(".")) {
    // Split into integer and decimal parts
    const parts = value.split(".");
    const integerPart = parts[0] || "0";
    const decimalPart = parts[1] || "";
    
    // Format integer part with comma separator (dấu phẩy cho hàng nghìn)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Combine with decimal part (giữ dấu chấm cho thập phân)
    if (decimalPart) {
      return formattedInteger + "." + decimalPart;
    } else {
      return formattedInteger + ".";
    }
  }
  
  // Regular number formatting (số nguyên)
  const cleaned = value.replace(/[^\d]/g, "");
  if (!cleaned || cleaned === "0") return "0";
  
  // Format with comma separator (dấu phẩy cho hàng nghìn)
  const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return formatted;
};

export const AmountInput = ({ value, onPress, error, placeholder = "Nhập số tiền" }: AmountInputProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const displayValue = value ? formatVND(value) : placeholder;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border-2 px-4 py-4 flex-row items-center justify-between"
      style={{
        backgroundColor: colors.surface,
        borderColor: error ? colors.danger : colors.border,
      }}
    >
      <Text
        className="flex-1 font-normal"
        style={{
          color: value ? colors.textPrimary : colors.textTertiary,
        }}
      >
        {displayValue}
      </Text>
      <Text
        className="ml-2 font-medium"
        style={{
          color: colors.textSecondary,
        }}
      >
        VNĐ
      </Text>
    </Pressable>
  );
};

