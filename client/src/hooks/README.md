# Hooks

Thư mục này chứa các custom React hooks.

## Quy tắc

- Tên hook phải bắt đầu bằng `use`
- Mỗi hook nên có một mục đích rõ ràng
- Document các parameters và return values
- Sử dụng TypeScript

## Ví dụ

```tsx
// useToast.ts
import { useToastStore } from '../store/toastStore';

export const useToast = () => {
  const showToast = useToastStore((state) => state.showToast);
  
  return {
    success: (message: string, title?: string) => showToast('success', message, title),
    error: (message: string, title?: string) => showToast('error', message, title),
  };
};
```
