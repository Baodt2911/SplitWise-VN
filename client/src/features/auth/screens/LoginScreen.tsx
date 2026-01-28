import { Image, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { createLoginSchema, type LoginFormData } from "../schemas/auth.schema";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useToast } from "../../../hooks/useToast";
import { login, type ApiError, type LoginResponse } from "../../../services/api/auth.api";
import { useAuthStore } from "../../../store/authStore";

const LoginScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const { success, error: showError } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema()),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({
        email: data.email,
        password: data.password,
      });
      
      // Check if result is an error response (has field property)
      if ("field" in result) {
        const apiError = result as ApiError;
        
        // Show toast with error message
        showError(apiError.message, "Lỗi");
        
        // Set error to form field to highlight with red border
        if (apiError.field === "email") {
          setError("email", {
            type: "server",
            message: apiError.message,
          });
        } else if (apiError.field === "password") {
          setError("password", {
            type: "server",
            message: apiError.message,
          });
        }
        
        return;
      }
      
      // Success - TypeScript now knows result is LoginResponse
      const loginResponse = result as LoginResponse;
      await setAuth({
        user: loginResponse.user,
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        sessionId: loginResponse.sessionId,
      });

      success("Đăng nhập thành công!", "Đăng nhập");
      // Navigate to home after successful login
      router.replace("/(tabs)/home");
    } catch (err: any) {
      // Network error or other unexpected errors
      const errorMessage = err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      showError(errorMessage, "Lỗi");
    }
  };

  const t = {
    title: "Chào mừng trở lại",
    subtitle: "Nhập email và mật khẩu để đăng nhập",
    emailLabel: "Email",
    emailPlaceholder: "Nhập địa chỉ email",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu",
    loginButton: "Đăng nhập",
    forgotPassword: "Quên mật khẩu?",
    orLoginWith: "Hoặc đăng nhập bằng",
    noAccount: "Chưa có tài khoản?",
    signUp: "Đăng ký",
  };


  const isDark = theme === "dark";
  
  // Gradient colors based on theme
  const gradientColors = isDark
    ? [colors.primaryLight, colors.background, colors.surface] as const
    : [colors.primaryLight, "#E8F5F0", "#F0FBF8", colors.background] as const;

  const handleSocialLogin = (provider: "google" | "facebook") => {
    // TODO: Implement social login
    console.log(`Login with ${provider}`);
  };

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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View
            className="flex-1 px-5 pt-4 pb-4"
            style={{ justifyContent: "center" }}
          >
            {/* Form Container */}
            <View
              className="rounded-3xl px-5 pt-6 pb-5 "
              style={{
                backgroundColor: colors.card,
              }}
            >
              {/* Header */}
              <View className="items-center mb-8 ">
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
                label={t.emailLabel}
                placeholder={t.emailPlaceholder}
                control={control}
                name="email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label={t.passwordLabel}
                placeholder={t.passwordPlaceholder}
                control={control}
                name="password"
                secureTextEntry
                showPasswordToggle
              />

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => router.push("/auth/forgot-password")}
                className="self-end mb-4"
              >
                <Text
                  className="text-sm font-semibold"
                  style={{

                    color: colors.primary,
                  }}
                >
                  {t.forgotPassword}
                </Text>
              </TouchableOpacity>

              <Button
                title={t.loginButton}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />

              {/* Divider */}
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
                <Text
                  className="px-3 text-sm font-medium"
                  style={{

                    color: colors.textSecondary,
                  }}
                >
                  {t.orLoginWith}
                </Text>
                <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
              </View>

              {/* Social Login Buttons */}
              <View className="flex-row justify-center gap-3 mb-4">
                <TouchableOpacity
                  onPress={() => handleSocialLogin("google")}
                  className="w-14 h-14 rounded-xl items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: colors.surface,
                  }}
                >
                  <Image
                    source={require("../../../../assets/icons/google.png")}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSocialLogin("facebook")}
                  className="w-14 h-14 rounded-xl items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: colors.surface,
                  }}
                >
                  <Image
                    source={require("../../../../assets/icons/facebook.png")}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Link */}
            <View className="mt-8 flex-row justify-center items-center">
              <Text
                className="text-sm font-medium"
                style={{
                  color: colors.textSecondary,
                }}
              >
                {t.noAccount}
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/register")}>
                <Text
                  className="text-sm font-semibold"
                  style={{

                    color: colors.primary,
                  }}
                >
                  {t.signUp}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LoginScreen;

