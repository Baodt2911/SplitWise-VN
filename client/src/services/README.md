# Services

Thư mục này chứa các services để tương tác với external systems.

## Cấu trúc

- **api/** - API client và endpoint definitions
- **storage/** - AsyncStorage helpers và wrappers
- **notifications/** - Push notification services
- **socket/** - Socket.io client và real-time communication

## Quy tắc

- Tách biệt business logic khỏi UI components
- Sử dụng async/await cho asynchronous operations
- Handle errors properly
- Export functions dưới dạng named exports

## Ví dụ

```tsx
// api/group.api.ts
import axios from 'axios';

export const getGroups = async () => {
  const response = await axios.get('/groups');
  return response.data;
};
```
