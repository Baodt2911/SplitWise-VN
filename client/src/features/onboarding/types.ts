export type AppLanguage = "vi";
export type AppTheme = "light" | "dark" | "system";

export interface OnboardingSlide {
  key: string;
  title: string;
  description: string;
  image: string | number; // string for URL, number for require()
}

