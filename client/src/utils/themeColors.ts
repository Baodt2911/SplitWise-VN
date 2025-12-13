import type { AppTheme } from "../features/onboarding/types";

/**
 * Theme colors based on Splitwise design system
 * Light theme: Modern Mint Light
 * Dark theme: Complementary dark version
 */
export const getThemeColors = (theme: AppTheme) => {
  // Handle system theme - default to light if system is not available
  // In components, use useColorScheme() hook to get actual system theme
  const effectiveTheme = theme === "system" ? "light" : theme;
  const isDark = effectiveTheme === "dark";

  if (isDark) {
    // Dark Theme - Complementary to Modern Mint Light
    return {
      // Core colors
      background: "#1a1a1a", // Dark background
      surface: "#2a2a2a", // Card/surface background
      card: "#2a2a2a", // Card background
      
      // Text colors
      textPrimary: "#F5F5F5", // Primary text (light)
      textSecondary: "#B0B0B0", // Subtext (medium gray)
      textTertiary: "#808080", // Tertiary text (lighter gray)
      
      // Primary colors
      primary: "#41AE8F", // Brand primary (mint green)
      primaryDark: "#20856B", // Primary dark (hover/pressed)
      primaryLight: "#1a3d33", // Primary light background (dark mode version)
      
      // UI elements
      border: "#404040", // Border color
      primaryText: "#FFFFFF", // Text on primary buttons
      
      // Status colors
      success: "#27AE60", // Success green
      warning: "#F39C12", // Warning orange
      danger: "#D9534F", // Danger red
      
      // Special
      paginationDot: "#41AE8F", // Pagination dot (primary color)
      imageBackground: "#2a2a2a", // Image container background
    };
  }

  // Light Theme - Modern Mint Light
  return {
    // Core colors
    background: "#FAFAFA", // Overall light background
    surface: "#FFFFFF", // Card/surface background
    card: "#FFFFFF", // Card background
    
    // Text colors
    textPrimary: "#333333", // Primary text (dark, easy to read)
    textSecondary: "#6E6E6E", // Subtext (soft gray)
    textTertiary: "#9E9E9E", // Tertiary text (lighter gray)
    
    // Primary colors
    primary: "#41AE8F", // Brand primary (mint green)
    primaryDark: "#20856B", // Primary dark (hover/pressed)
    primaryLight: "#F0FBF8", // Primary light background (mint super light)
    
    // UI elements
    border: "#E5E7EB", // Border color (compatible with new UI)
    primaryText: "#FFFFFF", // Text on primary buttons
    
    // Status colors
    success: "#27AE60", // Success green
    warning: "#F39C12", // Warning orange
    danger: "#D9534F", // Danger red (lighter than classic)
    
    // Special
    paginationDot: "#41AE8F", // Pagination dot (primary color)
    imageBackground: "#F0FBF8", // Image container background (mint light)
  };
};

