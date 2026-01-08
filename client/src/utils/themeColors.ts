import type { AppTheme } from "../features/onboarding/types";

/**
 * Theme colors based on Modern Mint design system
 * Light theme: Modern Mint Light - Màu trong trẻo, phù hợp mobile UI
 * Dark theme: Modern Mint Dark - Tối hiện đại, hơi xanh mint, hợp fintech/expense app
 */
export const getThemeColors = (theme: AppTheme) => {
  // Handle system theme - default to light if system is not available
  // In components, use useColorScheme() hook to get actual system theme
  const effectiveTheme = theme === "system" ? "light" : theme;
  const isDark = effectiveTheme === "dark";

  if (isDark) {
    // Dark Theme - "Modern Mint Dark"
    // Tối hiện đại, hơi xanh mint, rất hợp app fintech / expense
    return {
      // Core colors
      background: "#0E1513", // Nền tối sâu
      surface: "#18201E", // Card hơi xanh
      card: "#18201E", // Card hơi xanh
      
      // Text colors
      textPrimary: "#F5F5F5", // Trắng dịu
      textSecondary: "#9CA3AF", // Xám xanh
      textTertiary: "#6B7280", // Xám đậm hơn
      
      // Primary colors
      primary: "#41AE8F", // Không đổi
      primaryDark: "#1B6F5A", // Đậm & sang
      primaryLight: "#7ADBC2", // Highlight
      
      // UI elements
      border: "#27302D", // Viền xanh đen
      primaryText: "#FFFFFF", // Text on primary buttons
      icon: "#D1D5DB", // Icon sáng
      
      // Status colors
      success: "#22C55E", // Xanh xác nhận
      warning: "#FBBF24", // Vàng ấm
      danger: "#EF4444", // Đỏ hiện đại
      
      // Special
      paginationDot: "#41AE8F", // Pagination dot (primary color)
      imageBackground: "#18201E", // Image container background
    };
  }

  // Light Theme - "Modern Mint Light"
  // Phiên bản sáng hiện đại, màu trong trẻo, phù hợp mobile UI
  return {
    // Core colors
    background: "#FAFAFA", // Nền tổng thể sáng mịn
    surface: "#FFFFFF", // Nền card
    card: "#FFFFFF", // Nền card
    
    // Text colors
    textPrimary: "#333333", // Đậm hơn để dễ đọc
    textSecondary: "#6E6E6E", // Xám mềm
    textTertiary: "#9E9E9E", // Xám nhạt
    
    // Primary colors
    primary: "#41AE8F", // Màu chính không đổi
    primaryDark: "#20856B", // Nhấn mạnh, rõ nét hơn
    primaryLight: "#F0FBF8", // Tone mint siêu nhẹ
    
    // UI elements
    border: "#E5E7EB", // Tương thích UI mới
    primaryText: "#FFFFFF", // Text on primary buttons
    icon: "#6E6E6E", // Icon color
    
    // Status colors
    success: "#27AE60", // Xanh xác nhận
    warning: "#F39C12", // Vàng nhấn mạnh
    danger: "#D9534F", // Đỏ nhẹ hơn bản classic
    
    // Special
    paginationDot: "#41AE8F", // Pagination dot (primary color)
    imageBackground: "#F0FBF8", // Image container background (mint light)
  };
};

