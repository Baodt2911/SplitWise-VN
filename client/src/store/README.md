# Store

Thư mục này chứa Zustand stores cho state management.

## Quy tắc

- Mỗi store nên quản lý một domain cụ thể
- Sử dụng TypeScript cho type safety
- Tách actions và state clearly
- Persist state khi cần thiết (với AsyncStorage)

## Ví dụ

```tsx
// preferencesStore.ts
import { create } from 'zustand';

interface PreferencesState {
  theme: 'light' | 'dark';
  language: 'vi' | 'en';
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'vi' | 'en') => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: 'light',
  language: 'vi',
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
}));
```
