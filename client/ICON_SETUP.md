# Icon Library Setup - Lucide React Native

## Installation

```bash
cd client
npm install lucide-react-native
```

## Usage

### Basic Usage

```tsx
import { Icon } from "../components/common/Icon";

// Simple usage
<Icon name="home" size={24} />

// With custom color
<Icon name="user" size={24} color="#FF5733" />

// With style
<Icon name="settings" size={20} style={{ marginRight: 8 }} />
```

### Available Icons

The following icons are pre-configured in the Icon component:

**Navigation:**
- `home` - Home icon
- `users` - Users/Groups icon
- `barChart` - Statistics/Chart icon
- `user` - Profile/User icon

**Common Actions:**
- `plus` - Add/Create
- `minus` - Remove
- `edit` - Edit
- `trash` - Delete
- `check` - Confirm/Check
- `x` - Close/Cancel
- `arrowLeft` - Back arrow
- `arrowRight` - Forward arrow
- `chevronDown` - Dropdown indicator
- `chevronUp` - Dropup indicator

**Money & Finance:**
- `dollarSign` - Money/Currency
- `wallet` - Wallet
- `receipt` - Receipt/Transaction
- `creditCard` - Payment

**Settings & More:**
- `settings` - Settings
- `bell` - Notifications
- `search` - Search
- `filter` - Filter
- `moreVertical` - More options (vertical)
- `eye` - Show/View
- `eyeOff` - Hide
- `lock` - Security/Lock
- `mail` - Email
- `phone` - Phone
- `calendar` - Calendar/Date
- `clock` - Time

### Adding New Icons

1. Import the icon from `lucide-react-native` in `src/components/common/Icon.tsx`
2. Add it to the `iconMap` object
3. Use it with `<Icon name="yourIconName" />`

Example:
```tsx
// In Icon.tsx
import { Star } from "lucide-react-native";

const iconMap = {
  // ... existing icons
  star: Star,
};
```

### Direct Usage (Advanced)

You can also import icons directly from `lucide-react-native`:

```tsx
import { Home, User, Settings } from "lucide-react-native";

<Home size={24} color="#000" />
```

## Benefits

- ✅ Modern, beautiful icons
- ✅ Lightweight and optimized
- ✅ Tree-shaking support (only imports what you use)
- ✅ Works perfectly with Expo
- ✅ Consistent design language
- ✅ TypeScript support
- ✅ Automatic theme color support

## Migration from Emoji Icons

Replace emoji icons with Lucide icons:

```tsx
// Before
<Text className="text-2xl">🏠</Text>

// After
<Icon name="home" size={24} />
```

