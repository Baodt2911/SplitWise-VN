import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { createForgotPasswordSchema, type ForgotPasswordFormData } from "../schemas/auth.schema";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useToast } from "../../../hooks/useToast";
import { sendOtpRegister } from "../../../services/api/otp.api";

const ForgotPasswordScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const { success, error } = useToast();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(language)),
    mode: "onBlur",
    defaultValues: {
      phone: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // TODO: Replace with actual forgot password API
      await sendOtpRegister(data.phone);

      success(
        language === "vi" ? "Mã OTP đã được gửi đến số điện thoại của bạn." : "OTP code has been sent to your phone number.",
        language === "vi" ? "Thành công" : "Success"
      );
      router.push({
        pathname: "/auth/otp-verify",
        params: { phone: data.phone, type: "forgot-password" },
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        (language === "vi" ? "Gửi mã OTP thất bại. Vui lòng thử lại." : "Failed to send OTP. Please try again.");
      error(errorMessage, language === "vi" ? "Lỗi" : "Error");
    }
  };

  const translations = {
    vi: {
      title: "Quên mật khẩu",
      subtitle: "Nhập số điện thoại để nhận mã OTP đặt lại mật khẩu",
      phoneLabel: "Số điện thoại",
      phonePlaceholder: "Nhập số điện thoại",
      sendOtpButton: "Gửi mã OTP",
      rememberPassword: "Nhớ mật khẩu? Đăng nhập",
    },
    en: {
      title: "Forgot password",
      subtitle: "Enter your phone number to receive OTP code to reset password",
      phoneLabel: "Phone number",
      phonePlaceholder: "Enter your phone number",
      sendOtpButton: "Send OTP",
      rememberPassword: "Remember password? Login",
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
                  className="text-3xl text-center mb-1.5 font-extrabold"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {t.title}
                </Text>
                <Text
                  className="text-base text-center font-medium"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {t.subtitle}
                </Text>
              </View>

              {/* Form */}
              <TextInput
                label={t.phoneLabel}
                placeholder={t.phonePlaceholder}
                control={control}
                name="phone"
                keyboardType="phone-pad"
              />

              <Button
                title={t.sendOtpButton}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />
            </View>

            {/* Login Link */}
            <View className="mt-8 flex-row justify-center items-center">
              <Text
                className="text-sm font-medium"
                style={{
                  color: colors.textSecondary,
                }}
              >
                {t.rememberPassword.split("?")[0]}?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: colors.primary,
                  }}
                >
                  {t.rememberPassword.split("?")[1]?.trim() || (language === "vi" ? "Đăng nhập" : "Login")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen;

