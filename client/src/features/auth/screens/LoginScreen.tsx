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
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const { success, error: showError } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(language)),
    mode: "onBlur",
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({
        phone: data.phone,
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
        if (apiError.field === "phone") {
          setError("phone", {
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

      success(
        language === "vi" ? "Đăng nhập thành công!" : "Login successful!",
        language === "vi" ? "Đăng nhập" : "Login"
      );
      // Navigate to home after successful login
      router.replace("/(tabs)/home");
    } catch (err: any) {
      // Network error or other unexpected errors
      const errorMessage =
        err.message ||
        (language === "vi" ? "Đăng nhập thất bại. Vui lòng thử lại." : "Login failed. Please try again.");
      showError(errorMessage, language === "vi" ? "Lỗi" : "Error");
    }
  };

  const translations = {
    vi: {
      title: "Đăng nhập",
      subtitle: "Nhập số điện thoại và mật khẩu để đăng nhập",
      phoneLabel: "Số điện thoại",
      phonePlaceholder: "Nhập số điện thoại",
      passwordLabel: "Mật khẩu",
      passwordPlaceholder: "Nhập mật khẩu",
      loginButton: "Đăng nhập",
      forgotPassword: "Quên mật khẩu?",
      orLoginWith: "Hoặc đăng nhập bằng",
      noAccount: "Chưa có tài khoản? Đăng ký",
    },
    en: {
      title: "Login",
      subtitle: "Enter your phone number and password to log in",
      phoneLabel: "Phone number",
      phonePlaceholder: "Enter your phone number",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      loginButton: "Log In",
      forgotPassword: "Forgot password?",
      orLoginWith: "Or login with",
      noAccount: "Don't have an account? Sign Up",
    },
  };

  const t = translations[language];

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
                shadowColor: theme === "dark" ? "#000 not-allowed" : "#000",
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
                label={t.phoneLabel}
                placeholder={t.phonePlaceholder}
                control={control}
                name="phone"
                keyboardType="phone-pad"
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
                  className="w-14 h-14 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: colors.surface,
                    shadowColor: theme === "dark" ? "#000" : "#000",
                    shadowOffset: {
                      width: 0,
                      height: 1,
                    },
                    shadowOpacity: theme === "dark" ? 0.2 : 0.05,
                    shadowRadius: 2,
                    elevation: 1,
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
                  className="w-14 h-14 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: colors.surface,
                    shadowColor: theme === "dark" ? "#000" : "#000",
                    shadowOffset: {
                      width: 0,
                      height: 1,
                    },
                    shadowOpacity: theme === "dark" ? 0.2 : 0.05,
                    shadowRadius: 2,
                    elevation: 1,
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
                {t.noAccount.split("?")[0]}?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/register")}>
                <Text
                  className="text-sm font-semibold"
                  style={{

                    color: colors.primary,
                  }}
                >
                  {t.noAccount.split("?")[1]?.trim() || (language === "vi" ? "Đăng ký" : "Sign Up")}
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

