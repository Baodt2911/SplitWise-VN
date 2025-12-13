export type AppLanguage = "vi" | "en";
export type AppTheme = "light" | "dark" | "system";

export interface OnboardingSlide {
  key: string;
  title: Record<AppLanguage, string>;
  description: Record<AppLanguage, string>;
  image: string | number; // string for URL, number for require()
}

