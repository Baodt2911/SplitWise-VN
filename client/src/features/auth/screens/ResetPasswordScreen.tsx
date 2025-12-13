import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { createResetPasswordSchema, type ResetPasswordFormData } from "../schemas/auth.schema";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useToast } from "../../../hooks/useToast";

const ResetPasswordScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const { success, error } = useToast();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(createResetPasswordSchema(language)),
    mode: "onBlur",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      // TODO: Implement reset password API
      console.log("Reset password:", data);
      
      success(
        language === "vi" ? "Đặt lại mật khẩu thành công!" : "Password reset successful!",
        language === "vi" ? "Thành công" : "Success"
      );
      router.replace("/auth/login");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        (language === "vi" ? "Đặt lại mật khẩu thất bại. Vui lòng thử lại." : "Password reset failed. Please try again.");
      error(errorMessage, language === "vi" ? "Lỗi" : "Error");
    }
  };

  const translations = {
    vi: {
      title: "Đặt lại mật khẩu",
      subtitle: "Nhập mật khẩu mới của bạn",
      passwordLabel: "Mật khẩu mới",
      passwordPlaceholder: "Nhập mật khẩu mới",
      passwordHint: "ít nhất 8 ký tự",
      confirmPasswordLabel: "Nhập lại mật khẩu",
      confirmPasswordPlaceholder: "Nhập lại mật khẩu",
      resetButton: "Đặt lại mật khẩu",
    },
    en: {
      title: "Reset password",
      subtitle: "Enter your new password",
      passwordLabel: "New password",
      passwordPlaceholder: "Enter new password",
      passwordHint: "at least 8 characters",
      confirmPasswordLabel: "Re-enter password",
      confirmPasswordPlaceholder: "Re-enter password",
      resetButton: "Reset password",
    },
  };

  const t = translations[language];
  const isDark = theme === "dark";
  
  // Gradient colors based on theme
  const gradientColors = isDark
    ? [colors.primaryLight, colors.background, colors.surface] as const
    : [colors.primaryLight, "#E8F5F0", "#F0FBF8", colors.background] as const;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" style={{ backgroundColor: "transparent" }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View
            className="flex-1 px-5 pt-4 pb-4"
            style={{ justifyContent: "center" }}
          >
            {/* Form Container */}
            <View
              className="rounded-3xl px-5 pt-6 pb-5"
              style={{
                backgroundColor: colors.card,
                shadowColor: theme === "dark" ? "#000" : "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: theme === "dark" ? 0.2 : 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Header */}
              <View className="items-center mb-8">
                <Text
                  className="text-3xl text-center mb-1.5"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {t.title}
                </Text>
                <Text
                  className="text-base text-center"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {t.subtitle}
                </Text>
              </View>

              {/* Form */}
              <TextInput
                label={t.passwordLabel}
                placeholder={t.passwordPlaceholder}
                control={control}
                name="password"
                secureTextEntry
                showPasswordToggle
                hint={t.passwordHint}
              />

              <TextInput
                label={t.confirmPasswordLabel}
                placeholder={t.confirmPasswordPlaceholder}
                control={control}
                name="confirmPassword"
                secureTextEntry
                showPasswordToggle
              />

              <Button
                title={t.resetButton}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ResetPasswordScreen;

