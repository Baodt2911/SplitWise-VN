import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";

// Map icon names to MaterialCommunityIcons names
const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  // Navigation
  home: "home",
  users: "account-group",
  barChart: "chart-bar",
  user: "account",
  userPlus: "account-plus",
  shoppingCart: "cart",
  building: "office-building",

  // Common actions
  plus: "plus",
  minus: "minus",
  edit: "pencil",
  trash: "delete",
  check: "check",
  x: "close",
  arrowLeft: "arrow-left",
  arrowRight: "arrow-right",
  chevronDown: "chevron-down",
  chevronUp: "chevron-up",
  delete: "backspace",
  backspace: "backspace",

  // Money & Finance
  dollarSign: "currency-usd",
  wallet: "wallet",
  receipt: "receipt-text-outline",
  creditCard: "credit-card",
  pieChart: "chart-pie",

  // Settings & More
  settings: "cog",
  bell: "bell",
  search: "magnify",
  filter: "filter",
  moreVertical: "dots-vertical",
  list: "format-list-bulleted",
  eye: "eye",
  eyeOff: "eye-off",
  lock: "lock",
  mail: "email",
  phone: "phone",
  calendar: "calendar",
  clock: "clock-outline",
  chevronRight: "chevron-right",
  globe: "earth",
  info: "information",
  qrcode: "qrcode",
  database: "database",
  alertTriangle: "alert",
  link: "link",
  camera: "camera",
  lightbulb: "lightbulb-on",
  image: "image",
  download: "download",

  // Notification icons
  checkCircle: "check-circle",
  xCircle: "close-circle",
  alertCircle: "alert-circle",
  xOctagon: "octagon",
  userCheck: "account-check",
  userMinus: "account-minus",
  logOut: "logout",
  shield: "shield",
  messageSquare: "message-text",
  atSign: "at",
  bellOff: "bell-off",

  // Categories
  utensils: "silverware-fork-knife",
  car: "car",
  bed: "bed",
  movie: "movie",
  shoppingBag: "shopping",
  fileText: "file-document",
  book: "book",

  // Category Icons (from category.constants.ts)
  // FOOD
  "silverware-fork-knife": "silverware-fork-knife",
  coffee: "coffee",
  beer: "beer",
  cookie: "cookie",
  cart: "cart",

  // TRANSPORT
  taxi: "taxi",
  "gas-station": "gas-station",
  parking: "parking",
  wrench: "wrench",
  bus: "bus",

  // ENTERTAINMENT
  microphone: "microphone",
  "dice-5": "dice-5",
  dumbbell: "dumbbell",
  "calendar-heart": "calendar-heart",

  // HOUSING
  "lightning-bolt": "lightning-bolt",
  water: "water",
  wifi: "wifi",
  shimmer: "shimmer",
  sofa: "sofa",
  hammer: "hammer",

  // TRAVEL
  "bed-double": "bed-double",
  "home-account": "home-account",
  ticket: "ticket",
  airplane: "airplane",
  map: "map",

  // SHOPPING
  "tshirt-crew": "tshirt-crew",
  lipstick: "lipstick",
  "diamond-stone": "diamond-stone",
  "monitor-cellphone": "monitor-cellphone",
  "shopping-outline": "shopping-outline",

  // HEALTH
  pill: "pill",
  stethoscope: "stethoscope",
  "heart-pulse": "heart-pulse",

  // EDUCATION
  "book-open-page-variant": "book-open-page-variant",
  school: "school",
  briefcase: "briefcase",
  "monitor-screenshot": "monitor-screenshot",

  // PETS
  bone: "bone",
  needle: "needle",
  "content-cut": "content-cut",

  // GIFTS
  gift: "gift",
  "party-popper": "party-popper",
  "hand-coin": "hand-coin",

  // OTHER
  "help-circle": "help-circle",
  "circle-outline": "circle-outline",
};

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Icon component using MaterialCommunityIcons from @expo/vector-icons
 *
 * @example
 * <Icon name="home" size={24} color="#000" />
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  style,
}) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const iconName = iconMap[name];

  if (!iconName) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  return (
    <MaterialCommunityIcons
      name={iconName as any}
      size={size}
      color={color || colors.textPrimary}
      style={style}
    />
  );
};
