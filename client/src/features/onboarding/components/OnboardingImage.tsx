import { StyleProp, View, ViewStyle } from "react-native";
import React from "react";

import type { AppTheme } from "../types";
import { getThemeColors } from "../../../utils/themeColors";

// Import SVG components
import SocialInteractionSvg from "../../../../assets/images/Social-interaction-amico.svg";
import QRSvg from "../../../../assets/images/QR.svg";
import ChartsSvg from "../../../../assets/images/Charts-amico.svg";
import MobileUXSvg from "../../../../assets/images/Mobile-UX-amico.svg";

interface OnboardingImageProps {
  slideKey: string;
  theme: AppTheme;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

// Map slide keys to SVG components
const svgComponents: Record<string, React.ComponentType<any>> = {
  welcome: SocialInteractionSvg,
  qr: QRSvg,
  stats: ChartsSvg,
  start: MobileUXSvg,
};

export const OnboardingImage = ({
  slideKey,
  theme,
  backgroundColor,
  style,
  className,
}: OnboardingImageProps) => {
  const colors = getThemeColors(theme);
  const bgColor = backgroundColor || colors.background;
  const SvgComponent = svgComponents[slideKey];

  if (!SvgComponent) {
    return (
      <View className={className} style={style}>
        <View
          className="h-full w-full items-center justify-center rounded-3xl"
          style={{ backgroundColor: bgColor }}
        />
      </View>
    );
  }

  return (
    <View className={className} style={style}>
      <View
        className="h-full w-full rounded-3xl overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        <SvgComponent width="100%" height="100%" />
      </View>
    </View>
  );
};
