import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { View, BackHandler, Pressable } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";
import { MoneyKeypad } from "./MoneyKeypad";

interface AmountKeypadBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export const AmountKeypadBottomSheet = ({
  isOpen,
  onClose,
  value,
  onChange,
  maxLength = 50, // Increased to allow longer expressions with operators
}: AmountKeypadBottomSheetProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [internalAmount, setInternalAmount] = useState(value || "");
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ["45%"], []);

  // Sync external value with internal state when opening
  useEffect(() => {
    if (isOpen) {
      const safeValue = value && typeof value === "string" ? value : "";
      // Remove commas (dấu phẩy) - chỉ giữ dấu chấm cho thập phân trong state
      const cleanedValue = safeValue.replace(/,/g, "");
      setInternalAmount(cleanedValue);
    }
  }, [isOpen, value]);

  // Open/close sheet based on isOpen prop
  useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      // Small delay to ensure BottomSheet is mounted
      setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 100);
    }
  }, [isOpen]);

  // Handle Android back button
  useEffect(() => {
    if (!isOpen) return;

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [isOpen, onClose]);

  // Calculate result from expression
  const calculateResult = useCallback((expression: string): string => {
    if (!expression || typeof expression !== "string" || expression.trim() === "") return "";

    try {
      // Remove commas (dấu phẩy) - chỉ giữ dấu chấm cho thập phân
      let processed = expression.replace(/,/g, "");
      
      // Replace operators with JavaScript operators
      processed = processed
        .replace(/×/g, "*")
        .replace(/÷/g, "/");

      // Validate expression format - allow numbers, operators, and decimal points (no commas)
      if (!/^[\d.+\-*/]+$/.test(processed)) {
        return expression; // Return original if invalid
      }

      // Check if expression ends with operator
      if (/[+\-*/]$/.test(processed)) {
        // Remove trailing operator and calculate
        processed = processed.slice(0, -1);
      }

      // Check if processed is empty after removing operator
      if (!processed || processed.trim() === "") {
        return expression;
      }

      // Validate that we have at least one number
      if (!/\d/.test(processed)) {
        return expression;
      }

      // Evaluate expression safely
      // Split by operators and validate each part
      const parts = processed.split(/([+\-*/])/);
      let isValid = true;
      for (let i = 0; i < parts.length; i += 2) {
        const numPart = parts[i]?.trim();
        // Validate number format: digits, optional decimal point with digits
        // Examples: "2000", "2000.5", "0.5", ".5" -> not allowed, must be "0.5"
        if (numPart && numPart !== "") {
          // Must start with digit, can have decimal point followed by digits
          if (!/^\d+(\.\d*)?$/.test(numPart)) {
            isValid = false;
            break;
          }
        }
      }

      if (!isValid) {
        return expression;
      }

      // Use eval as fallback, but with validation
      const result = eval(processed);
      
      if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
        return expression; // Return original if invalid result
      }

      // Format result: max 2 decimal places
      const rounded = Math.round(result * 100) / 100;
      // Remove trailing zeros after decimal point only
      const resultStr = rounded.toString();
      if (resultStr.includes(".")) {
        return resultStr.replace(/\.?0+$/, "");
      }
      return resultStr;
    } catch (error) {
      // Return original on any error
      return expression;
    }
  }, []);

  // Check if decimal part has max 2 digits
  // When there's an operator, check each number part separately
  const isValidDecimal = useCallback((value: string): boolean => {
    if (!value.includes(".")) return true;
    
    // If value contains operators, check each number part separately
    if (/[+\-×÷]/.test(value)) {
      // Split by operators but keep operators
      const parts = value.split(/([+\-×÷])/);
      for (let i = 0; i < parts.length; i += 2) {
        const numPart = parts[i]?.trim();
        if (numPart && numPart.includes(".")) {
          const decimalParts = numPart.split(".");
          if (decimalParts.length === 2 && decimalParts[1].length > 2) {
            return false; // More than 2 decimal places
          }
        }
      }
      return true;
    }
    
    // Single number - check decimal part
    const parts = value.split(".");
    if (parts.length !== 2) return true;
    return parts[1].length <= 2;
  }, []);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === "=") {
        // Calculate result, don't close keypad
        setInternalAmount((prev) => {
          const result = calculateResult(prev);
          onChange(result);
          return result;
        });
        return;
      }

      setInternalAmount((prev) => {
        let newValue = prev;

        if (key === "AC" || key === "C") {
          // All Clear - reset to empty
          newValue = "";
        } else if (key === "del") {
          // Delete last character
          newValue = prev.slice(0, -1);
        } else if (key === "000") {
          // Add triple zero (only if not in decimal part of current number)
          // Check only the current number part (after last operator)
          const lastOperatorIndex = Math.max(
            prev.lastIndexOf("+"),
            prev.lastIndexOf("-"),
            prev.lastIndexOf("×"),
            prev.lastIndexOf("÷")
          );
          let currentNumber = lastOperatorIndex >= 0 
            ? prev.slice(lastOperatorIndex + 1) 
            : prev;
          
          // Remove commas before checking (commas are only for display)
          currentNumber = currentNumber.replace(/,/g, "");
          
          // Can't add 000 if current number has decimal point
          if (currentNumber.includes(".")) {
            return prev;
          }
          
          // Not in decimal part, add 000
          // Check max length - allow more for expressions
          const maxAllowed = /[+\-×÷]/.test(prev) ? maxLength * 2 : maxLength;
          if (prev.length + 3 > maxAllowed) return prev;
          newValue = prev ? prev + "000" : "000";
        } else if (key === ".") {
          // Add decimal point (if not already present in current number)
          // Check only the current number part (after last operator)
          const lastOperatorIndex = Math.max(
            prev.lastIndexOf("+"),
            prev.lastIndexOf("-"),
            prev.lastIndexOf("×"),
            prev.lastIndexOf("÷")
          );
          let currentNumber = lastOperatorIndex >= 0 
            ? prev.slice(lastOperatorIndex + 1) 
            : prev;
          
          // Remove commas before checking (commas are only for display)
          currentNumber = currentNumber.replace(/,/g, "");
          
          // Can't add decimal point if current number already has one
          if (currentNumber.includes(".")) {
            return prev;
          }
          
          // Check if last character is an operator
          const lastChar = prev.slice(-1);
          if (["÷", "×", "-", "+"].includes(lastChar)) {
            newValue = prev + "0."; // Add 0. after operator
          } else if (prev === "" || prev === "0") {
            newValue = "0.";
          } else {
            newValue = prev + ".";
          }
        } else if (["÷", "×", "-", "+"].includes(key)) {
          // Operators - replace trailing operator or append
          const lastChar = prev.slice(-1);
          if (["÷", "×", "-", "+", "."].includes(lastChar)) {
            // Remove trailing operator or decimal point before adding new operator
            newValue = prev.slice(0, -1) + key;
          } else if (prev === "") {
            // Can't start with operator
            return prev;
          } else {
            newValue = prev + key;
          }
        } else {
          // Regular number key
          // Check if we're in decimal part of the current number (after last operator)
          const lastOperatorIndex = Math.max(
            prev.lastIndexOf("+"),
            prev.lastIndexOf("-"),
            prev.lastIndexOf("×"),
            prev.lastIndexOf("÷")
          );
          const currentNumber = lastOperatorIndex >= 0 
            ? prev.slice(lastOperatorIndex + 1) 
            : prev;
          
          if (currentNumber.includes(".")) {
            const decimalParts = currentNumber.split(".");
            if (decimalParts.length === 2 && decimalParts[1].length >= 2) {
              // Max 2 decimal places for current number
              return prev;
            }
          }

          // Check max length - only check if no operators (single number)
          // For expressions with operators, allow longer input
          if (!/[+\-×÷]/.test(prev) && prev.length >= maxLength) {
            return prev;
          }
          // For expressions, check total length but allow more
          if (prev.length >= maxLength * 2) {
            return prev;
          }

          // Handle leading zero
          if (prev === "0" && key !== "0") {
            newValue = key;
          } else if (prev === "" || /[+\-×÷]/.test(prev.slice(-1))) {
            // Start new number after operator
            newValue = prev + key;
          } else {
            newValue = prev + key;
          }
        }

        // Validate decimal format
        if (newValue && !isValidDecimal(newValue)) {
          return prev; // Don't update if invalid decimal
        }

        // Remove commas (dấu phẩy) before saving to state - only keep decimal point
        const cleanedValue = newValue.replace(/,/g, "");

        // Update parent component immediately
        onChange(cleanedValue);
        return cleanedValue;
      });
    },
    [onChange, maxLength, calculateResult, isValidDecimal]
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Sheet closed
        onClose();
      }
    },
    [onClose]
  );

  // Don't render BottomSheet at all if not open
  if (!isOpen) {
    return null;
  }

  return (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        animateOnMount={true}
        enableDynamicSizing={false}
        enableOverDrag={false}
      >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Keypad */}
        <MoneyKeypad 
          onKeyPress={handleKeyPress} 
          hasOperator={/[\÷×\-\+]/.test(internalAmount)}
        />

        {/* Bottom padding to avoid screen edge - use safe area insets */}
        <View style={{ paddingBottom: Math.max(insets.bottom, 40) + 20 }} />
      </BottomSheetView>
    </BottomSheet>
  );
};

