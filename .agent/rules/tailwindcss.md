---
trigger: always_on
---

### Rules for Using TailwindCSS in Expo React Native

#### 1. Use TailwindCSS (NativeWind) as the Primary Styling Method

- All styling must use **Tailwind className**.
- Avoid using `StyleSheet.create`.
- Avoid inline styles unless absolutely necessary:
  - Dynamic runtime values
  - Animations
  - Values not supported by Tailwind

**Good**

```tsx
<View className="flex-1 bg-white px-4 py-2">
  <Text className="text-lg font-semibold">Title</Text>
</View>
```

**Bad**

```tsx
<View style={{ flex: 1, backgroundColor: "white", padding: 16 }}>
```

---

#### 2. Prefer Utility Classes Over Custom Styles

- Always use existing Tailwind utilities before creating custom styles.
- Avoid custom style wrappers when Tailwind can solve it.

**Good**

```tsx
<View className="flex-row items-center gap-2">
```

**Bad**

```tsx
<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
```

---

#### 3. Consistent Spacing Scale

Use Tailwind spacing scale only:

- `p-1 p-2 p-3 p-4 p-6 p-8`
- `m-1 m-2 m-3 m-4 m-6 m-8`
- `gap-1 gap-2 gap-3 gap-4`

Avoid arbitrary values unless necessary.

**Good**

```tsx
<View className="p-4">
```

**Avoid**

```tsx
<View className="p-[13px]">
```

---

#### 4. Layout Rules

Use Flexbox utilities:

- `flex-1`
- `flex-row`
- `flex-col`
- `items-center`
- `justify-between`
- `justify-center`

**Example**

```tsx
<View className="flex-row items-center justify-between">
```

---

#### 5. Typography Rules

Use Tailwind typography utilities:

- `text-sm`
- `text-base`
- `text-lg`
- `text-xl`
- `font-medium`
- `font-semibold`
- `font-bold`

**Example**

```tsx
<Text className="text-base font-medium text-gray-800">
```

---

#### 6. Color Rules

Use Tailwind color palette only.

**Good**

```tsx
<View className="bg-blue-500">
```

Avoid hardcoded colors:

```tsx
<View style={{ backgroundColor: "#3498db" }}>
```

---

#### 7. Component Structure

Each component should:

- Use Tailwind classes for layout
- Avoid large className strings
- Extract reusable components

**Good**

```tsx
<Card>
  <CardHeader />
  <CardContent />
</Card>
```

---

#### 8. Conditional Styling

Use template strings or helpers.

**Good**

```tsx
<View className={`p-4 ${active ? "bg-blue-500" : "bg-gray-200"}`} />
```

---

#### 9. Performance Rules

- Avoid unnecessary re-renders caused by dynamic className generation.
- Keep className strings static when possible.

**Good**

```tsx
<View className="flex-1 bg-white">
```

**Avoid**

```tsx
<View className={`flex-1 bg-${color}-500`}>
```

---

#### 10. Responsive Rules (Expo)

Use device-safe layouts:

- `flex-1`
- `w-full`
- `h-full`

Avoid fixed sizes unless necessary.

**Good**

```tsx
<View className="flex-1 px-4">
```

**Avoid**

```tsx
<View className="w-[375px]">
```

---

#### 11. Naming Conventions

Reusable UI components:

- `Button.tsx`
- `Card.tsx`
- `Input.tsx`
- `Container.tsx`

Screens:

- `HomeScreen.tsx`
- `ProfileScreen.tsx`

---

#### 12. Forbidden Patterns

Do not use:

- Inline styles for layout
- StyleSheet for basic styling
- Hardcoded pixel values
- Mixed Tailwind + large inline styles

**Forbidden**

```tsx
<View style={{ padding: 16, flex: 1 }}>
```

---

#### 13. Exception Cases

Allowed:

```tsx
<View style={{ height: dynamicHeight }}>
```

Allowed for animations:

```tsx
<Animated.View style={animatedStyle}>
```

---

#### 14. Required Libraries

- `nativewind`
- `tailwindcss`
- `expo`

---

#### 15. File Requirements

Every component must:

- Use `className`
- Avoid unused styles
- Keep Tailwind classes readable

**Preferred format**

```tsx
<View
  className="
    flex-1
    bg-white
    px-4
    py-2
  "
>
```

### 16. Reusable Style Patterns

Create reusable UI components instead of repeating long Tailwind class strings.

**Good**

```tsx
// components/ui/Container.tsx
export function Container({ children }) {
  return <View className="flex-1 bg-white px-4">{children}</View>;
}
```

**Avoid**

```tsx
<View className="flex-1 bg-white px-4">
<View className="flex-1 bg-white px-4">
<View className="flex-1 bg-white px-4">
```

---

### 17. Class Order Convention

Keep className order consistent:

1. Layout
2. Flexbox
3. Spacing
4. Size
5. Border
6. Background
7. Typography
8. Effects

**Example**

```tsx
<View className="flex flex-row items-center justify-between px-4 py-2 w-full rounded-lg bg-white">
```

Avoid random order:

```tsx
<View className="bg-white px-4 flex py-2 rounded-lg w-full">
```

---

### 18. Screen Layout Rules

Every screen should use a root container with `flex-1`.

**Required**

```tsx
export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white">
      <Text>Home</Text>
    </View>
  );
}
```

Avoid:

```tsx
<View>
```

---

### 19. ScrollView Rules

ScrollView must include safe spacing.

**Required**

```tsx
<ScrollView
  className="flex-1 bg-white"
  contentContainerClassName="px-4 py-4"
>
```

Avoid:

```tsx
<ScrollView>
```

---

### 20. Pressable / Touchable Rules

Interactive elements must include spacing and alignment.

**Required**

```tsx
<Pressable className="items-center justify-center px-4 py-3 rounded-lg bg-blue-500">
  <Text className="text-white font-medium">Submit</Text>
</Pressable>
```

Avoid:

```tsx
<Pressable>
  <Text>Submit</Text>
</Pressable>
```

---

### 21. Dark Mode Rules

Use Tailwind dark mode utilities.

**Example**

```tsx
<View className="bg-white dark:bg-black">
<Text className="text-black dark:text-white">
```

Avoid manual theme checks:

```tsx
<View style={{ backgroundColor: isDark ? "black" : "white" }}>
```

---

### 22. Spacing Between Elements

Use `gap` instead of margin when possible.

**Good**

```tsx
<View className="gap-3">
  <Text />
  <Text />
</View>
```

Avoid:

```tsx
<Text className="mb-3" />
<Text />
```

---

### 23. Icon Alignment Rules

Icons must align using flex utilities.

**Good**

```tsx
<View className="flex-row items-center gap-2">
  <Icon />
  <Text>Profile</Text>
</View>
```

Avoid:

```tsx
<View>
  <Icon />
  <Text>Profile</Text>
</View>
```

---

### 24. Image Rules

Images must define dimensions.

**Required**

```tsx
<Image source={{ uri: image }} className="w-24 h-24 rounded-lg" />
```

Avoid:

```tsx
<Image source={{ uri: image }} />
```

---

### 25. Absolute Position Rules

Use Tailwind positioning utilities.

**Good**

```tsx
<View className="absolute bottom-4 right-4">
```

Avoid:

```tsx
<View style={{ position: "absolute", bottom: 16, right: 16 }}>
```

---

### 26. Border Rules

Use Tailwind borders.

**Good**

```tsx
<View className="border border-gray-200 rounded-lg">
```

Avoid:

```tsx
<View style={{ borderWidth: 1 }}>
```

---

### 27. Shadow Rules (Expo Safe)

Use Tailwind shadow utilities.

**Good**

```tsx
<View className="shadow-sm rounded-xl bg-white">
```

Avoid heavy shadows:

```tsx
<View style={{ shadowRadius: 20 }}>
```

---

### 28. Performance-Safe Class Usage

Avoid building Tailwind classes dynamically.

**Avoid**

```tsx
<View className={`p-${size}`}>
```

**Good**

```tsx
<View className={size === "lg" ? "p-6" : "p-4"}>
```

---

### 29. Safe Area Rules

Always respect safe area.

**Required**

```tsx
import { SafeAreaView } from "react-native-safe-area-context";

<SafeAreaView className="flex-1 bg-white">
```

Avoid:

```tsx
<View className="flex-1">
```

---

### 30. Maximum Class Length Rule

If className exceeds **8–10 utilities**, extract component.

**Avoid**

```tsx
<View className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
```

**Good**

```tsx
<CardRow />
```

---

### 31. File Structure Recommendation

```
/components
  /ui
    Button.tsx
    Card.tsx
    Input.tsx

/screens
  HomeScreen.tsx
  ProfileScreen.tsx

/constants
  theme.ts
```

---

### 32. Required Best Practices

Every screen must:

- Use `flex-1`
- Use Tailwind classes
- Avoid inline layout styles
- Use spacing scale
- Support dark mode

Every component must:

- Use className
- Be reusable if repeated ≥2 times
- Avoid hardcoded styles

---

### 33. NativeWind Best Practices

Prefer `className` over `style`.

**Good**

```tsx
<Text className="text-lg font-semibold">
```

Avoid:

```tsx
<Text style={{ fontSize: 18, fontWeight: "600" }}>
```
