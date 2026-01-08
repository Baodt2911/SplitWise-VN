import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput as RNTextInput, View } from "react-native";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";

interface OTPInputProps {
  name: string;
  control?: any;
  length?: number;
}

export const OTPInput = ({ name, control, length = 6 }: OTPInputProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const formContext = useFormContext();
  const previousFormValue = useRef<string>("");

  const actualControl = control || formContext?.control;

  if (!actualControl) {
    console.warn(`OTPInput: control is required for field "${name}"`);
    return null;
  }

  const handleChange = (text: string, index: number, onChange: (value: string) => void, currentOtp: string[]) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "");
    
    if (numericText.length > 1) {
      // Handle paste: fill multiple inputs
      const digits = numericText.slice(0, length).split("");
      const newOtp = [...currentOtp];
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newOtp[index + i] = digit;
        }
      });
      const newValue = newOtp.join("");
      setOtp(newOtp);
      previousFormValue.current = newValue;
      onChange(newValue);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single digit input
      const newOtp = [...currentOtp];
      newOtp[index] = numericText;
      const newValue = newOtp.join("");
      setOtp(newOtp);
      previousFormValue.current = newValue;
      onChange(newValue);
      
      // Move to next input if digit entered
      if (numericText && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Controller
      control={actualControl}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // Sync form value with local state when value changes from outside (not from user input)
        useEffect(() => {
          // Only sync if value changed from outside (not from our onChange call)
          if (value !== previousFormValue.current) {
            const digits = value.split("").slice(0, length);
            const newOtp = Array(length).fill("");
            digits.forEach((digit: string, i: number) => {
              if (i < length) {
                newOtp[i] = digit;
              }
            });
            setOtp(newOtp);
            previousFormValue.current = value;
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [value, length]);

        const isDark = theme === "dark";

        return (
          <View>
            <View className="flex-row justify-between mb-2 gap-2">
              {Array.from({ length }).map((_, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  value={otp[index]}
                  onChangeText={(text) => {
                    handleChange(text, index, onChange, otp);
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    handleKeyPress(nativeEvent.key, index);
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  className="flex-1 rounded-2xl border text-center text-xl font-bold"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: error ? colors.danger : colors.border,
                    borderWidth: error ? 1.5 : 1,
                    color: colors.textPrimary,
                    fontSize: 20,
                  }}
                  selectTextOnFocus
                />
              ))}
            </View>
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
        );
      }}
    />
  );
};

