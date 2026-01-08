import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
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
  const colors = getThemeColors(theme);
  const { success, error } = useToast();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(createResetPasswordSchema()),
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
      
      success("Đặt lại mật khẩu thành công!", "Thành công");
      router.replace("/auth/login");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      error(errorMessage, "Lỗi");
    }
  };

  const t = {
    title: "Đặt lại mật khẩu",
    subtitle: "Nhập mật khẩu mới của bạn",
    passwordLabel: "Mật khẩu mới",
    passwordPlaceholder: "Nhập mật khẩu mới",
    passwordHint: "ít nhất 8 ký tự",
    confirmPasswordLabel: "Nhập lại mật khẩu",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu",
    resetButton: "Đặt lại mật khẩu",
  };

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

