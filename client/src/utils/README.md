# Utils

Thư mục này chứa các utility functions và helpers.

## Cấu trúc

- **helpers/** - Helper functions (formatting, calculations, etc.)
- **constants/** - Constants, enums, và configuration values
- **validators/** - Validation functions và Zod schemas

## Quy tắc

- Functions nên pure và stateless
- Mỗi file nên focus vào một domain cụ thể
- Export functions dưới dạng named exports
- Document các parameters và return values

## Ví dụ

```tsx
// helpers/currency.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};
```
