# Components

Thư mục này chứa các React components được sử dụng trong ứng dụng.

## Cấu trúc

- **common/** - Các component dùng chung trong toàn bộ app (Button, Input, Card, Modal, etc.)
- **layout/** - Các component layout (Header, Footer, Container, Screen, etc.)
- **ui/** - Các component UI cơ bản và primitive components

## Quy tắc

- Mỗi component nên có file riêng
- Sử dụng TypeScript cho type safety
- Export component dưới dạng named export
- Tạo file `index.ts` để re-export các components

## Ví dụ

```tsx
// common/Button.tsx
import { TouchableOpacity, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export const Button = ({ title, onPress }: ButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};
```
