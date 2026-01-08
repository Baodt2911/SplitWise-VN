import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  Home,
  Users,
  BarChart3,
  User,
  UserPlus,
  Plus,
  Minus,
  Edit,
  Trash2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Wallet,
  Receipt,
  CreditCard,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShoppingCart,
  Building2,
  ChevronRight,
  Globe,
  Info,
  QrCode,
  Database,
  AlertTriangle,
  Link,
  Delete,
  Camera,
  Utensils,
  Car,
  BedDouble,
  Clapperboard,
  ShoppingBag,
  FileText,
  Lightbulb,
  type LucideIcon,
} from "lucide-react-native";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";

// Map icon names to Lucide components
// Add more icons as needed
const iconMap: Record<string, LucideIcon> = {
  // Navigation
  home: Home,
  users: Users,
  barChart: BarChart3,
  user: User,
  userPlus: UserPlus,
  shoppingCart: ShoppingCart,
  building: Building2,
  
  // Common actions
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash2,
  check: Check,
  x: X,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  delete: Delete,
  backspace: Delete,
  
  // Money & Finance
  dollarSign: DollarSign,
  wallet: Wallet,
  receipt: Receipt,
  creditCard: CreditCard,
  
  // Settings & More
  settings: Settings,
  bell: Bell,
  search: Search,
  filter: Filter,
  moreVertical: MoreVertical,
  eye: Eye,
  eyeOff: EyeOff,
  lock: Lock,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  clock: Clock,
  chevronRight: ChevronRight,
  globe: Globe,
  info: Info,
  qrcode: QrCode,
  database: Database,
  alertTriangle: AlertTriangle,
  link: Link,
  camera: Camera,
  lightbulb: Lightbulb,

  // Categories (added for GroupDetail)
  utensils: Utensils,
  car: Car,
  bed: BedDouble,
  movie: Clapperboard,
  shoppingBag: ShoppingBag,
  fileText: FileText,
};

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Icon component using Lucide React Native
 * Optimized for Expo with tree-shaking support
 * 
 * @example
 * <Icon name="home" size={24} color="#000" />
 */
export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color, 
  style 
}) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }
  
  return (
    <IconComponent
      size={size}
      color={color || colors.textPrimary}
      style={style}
    />
  );
};

