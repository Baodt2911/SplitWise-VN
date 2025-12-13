import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { createRegisterSchema, type RegisterFormData } from "../schemas/auth.schema";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useToast } from "../../../hooks/useToast";
import { register, type ApiError } from "../../../services/api/auth.api";

const RegisterScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const { success, error: showError } = useToast();

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(createRegisterSchema(language)) as any,
    defaultValues: {
      fullName: "",
      phone: "",
      email: undefined,
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        password: data.password,
      });
      
      // Check if result is an error response (has field property)
      if ("field" in result) {
        const apiError = result as ApiError;
        
        // Show toast with error message
        showError(
          apiError.message,
          language === "vi" ? "Lỗi" : "Error"
        );
        
        // Set error to form field to highlight with red border
        if (apiError.field) {
          setError(apiError.field as keyof RegisterFormData, {
            type: "server",
            message: apiError.message,
          });
        }
        
        return;
      }

      // Success - Server automatically sends OTP after registration
      success(
        language === "vi" ? "Mã OTP đã được gửi đến số điện thoại của bạn." : "OTP code has been sent to your phone number.",
        language === "vi" ? "Thành công" : "Success"
      );
      router.replace({
        pathname: "/auth/otp-verify",
        params: { phone: data.phone, type: "register" },
      });
    } catch (err: any) {
      // Network error or other unexpected errors
      const errorMessage =
        err.message ||
        (language === "vi" ? "Đăng ký thất bại. Vui lòng thử lại." : "Registration failed. Please try again.");
      showError(errorMessage, language === "vi" ? "Lỗi" : "Error");
    }
  };

  const translations = {
    vi: {
      title: "Tạo tài khoản mới",
      subtitle: "Bắt đầu quản lý chi tiêu nhóm một cách dễ dàng.",
      fullNameLabel: "Họ tên",
      fullNamePlaceholder: "Nhập họ và tên",
      phoneLabel: "Số điện thoại",
      phonePlaceholder: "Nhập số điện thoại",
      emailLabel: "Email (tùy chọn)",
      emailPlaceholder: "Nhập email",
      passwordLabel: "Mật khẩu",
      passwordPlaceholder: "Nhập mật khẩu",
      passwordHint: "ít nhất 8 ký tự",
      confirmPasswordLabel: "Nhập lại mật khẩu",
      confirmPasswordPlaceholder: "Nhập lại mật khẩu",
      agreeToTerms: "Tôi đồng ý với Điều khoản và Chính sách bảo mật",
      registerButton: "Đăng ký",
      hasAccount: "Đã có tài khoản? Đăng nhập",
    },
    en: {
      title: "Create new account",
      subtitle: "Start managing group spending easily.",
      fullNameLabel: "Full name",
      fullNamePlaceholder: "Enter full name",
      phoneLabel: "Phone number",
      phonePlaceholder: "Enter phone number",
      emailLabel: "Email (optional)",
      emailPlaceholder: "Enter your email",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password",
      passwordHint: "at least 8 characters",
      confirmPasswordLabel: "Re-enter password",
      confirmPasswordPlaceholder: "Re-enter password",
      agreeToTerms: "I agree with Terms and Privacy Policy",
      registerButton: "Register",
      hasAccount: "Already have an account? Login",
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
                  className="text-3xl  text-center mb-1.5 font-extrabold"
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
                label={t.fullNameLabel}
                placeholder={t.fullNamePlaceholder}
                control={control}
                name="fullName"
                autoCapitalize="words"
              />

              <TextInput
                label={t.phoneLabel}
                placeholder={t.phonePlaceholder}
                control={control}
                name="phone"
                keyboardType="phone-pad"
              />

              <TextInput
                label={t.emailLabel}
                placeholder={t.emailPlaceholder}
                control={control}
                name="email"
                keyboardType="email-address"
              />

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

              {/* Terms Checkbox */}
              <View className="mb-4">
                <Controller
                  control={control}
                  name="agreeToTerms"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <>
                      <TouchableOpacity
                        onPress={() => onChange(!value)}
                        className="flex-row items-center"
                        activeOpacity={0.7}
                      >
                        <View
                          className="mr-3 h-5 w-5 items-center justify-center rounded-lg border"
                          style={{
                            backgroundColor: value ? colors.primary : colors.surface,
                            borderColor: error ? colors.danger : colors.border,
                            borderWidth: error ? 1.5 : 1,
                          }}
                        >
                          {value && (
                            <Text
                              className="text-white text-xs font-normal"
                              style={{
                                fontSize: 12,
                              }}
                            >
                              ✓
                            </Text>
                          )}
                        </View>
                        <Text
                          className="flex-1 text-sm font-normal"
                          style={{
        
                            color: colors.textPrimary,
                          }}
                        >
                          {t.agreeToTerms}
                        </Text>
                      </TouchableOpacity>
                      {error && (
                        <Text
                          className="mt-1.5 text-xs font-normal"
                          style={{
                            fontSize: 12,
                            color: colors.danger,
                          }}
                        >
                          {error.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </View>

              <Button
                title={t.registerButton}
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
                {t.hasAccount.split("?")[0]}?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text
                  className="text-sm font-semibold"
                  style={{

                    color: colors.primary,
                  }}
                >
                  {t.hasAccount.split("?")[1]?.trim() || (language === "vi" ? "Đăng nhập" : "Login")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default RegisterScreen;

