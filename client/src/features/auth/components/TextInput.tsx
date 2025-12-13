import { forwardRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput as RNTextInput, TouchableOpacity, View } from "react-native";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";

interface TextInputProps {
  label?: string;
  placeholder?: string;
  name: string;
  control?: any;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  hint?: string;
  scrollToInput?: () => void;
}

export const TextInput = forwardRef<View, TextInputProps>(
  (
    {
      label,
      placeholder,
      name,
      control,
      secureTextEntry = false,
      showPasswordToggle = false,
      keyboardType = "default",
      autoCapitalize = "none",
      hint,
      scrollToInput,
    },
    ref
  ) => {
    const theme = usePreferencesStore((state) => state.theme);
    const language = usePreferencesStore((state) => state.language);
    const colors = getThemeColors(theme);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const formContext = useFormContext();
    
    const passwordToggleText = language === "vi" 
      ? (isPasswordVisible ? "Ẩn" : "Hiện")
      : (isPasswordVisible ? "Hide" : "Show");

    const actualControl = control || formContext?.control;

    if (!actualControl) {
      console.warn(`TextInput: control is required for field "${name}"`);
      return null;
    }

    return (
      <Controller
        control={actualControl}
        name={name}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <View ref={ref} className="mb-3">
            {label && (
              <Text
                className="text-sm mb-1.5 font-semibold"
                style={{
                  fontSize: 13,
                  color: colors.textPrimary,
                }}
              >
                {label}
              </Text>
            )}
            <View
              className="rounded-xl border px-3.5 py-1.5 flex-row items-center"
              style={{
                backgroundColor: colors.surface,
                borderColor: error ? colors.danger : colors.border,
                borderWidth: error ? 1.5 : 1,
              }}
            >
              <RNTextInput
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  onBlur();
                  if (scrollToInput) {
                    scrollToInput();
                  }
                }}
                onFocus={() => {
                  if (scrollToInput) {
                    scrollToInput();
                  }
                }}
                placeholder={placeholder}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={secureTextEntry && !isPasswordVisible}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: colors.textPrimary,
                }}
              />
              {showPasswordToggle && (
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color: colors.primary,
                    }}
                  >
                    {passwordToggleText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {hint && !error && (
              <Text
                className="text-xs mt-1.5 font-normal"
                style={{
                  fontSize: 12,
                  color: colors.textTertiary,
                }}
              >
                {hint}
              </Text>
            )}
            {error && (
              <Text
                className="text-xs mt-1.5 font-normal"
                style={{
                  fontSize: 12,
                  color: colors.danger,
                }}
              >
                {error.message}
              </Text>
            )}
          </View>
        )}
      />
    );
  }
);

TextInput.displayName = "TextInput";

