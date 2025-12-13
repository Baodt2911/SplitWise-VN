# Features

Thư mục này chứa các features chính của ứng dụng SplitWise VN.

## Cấu trúc

Mỗi feature có cấu trúc như sau:

```
feature-name/
  ├── components/     # Feature-specific components
  ├── screens/        # Screen components cho feature này
  ├── hooks/          # Custom hooks cho feature này
  └── types.ts        # TypeScript types cho feature này
```

## Features

- **groups/** - Quản lý nhóm chi tiêu
- **expenses/** - Quản lý các khoản chi tiêu
- **friends/** - Quản lý danh sách bạn bè
- **profile/** - Hồ sơ người dùng
- **settlements/** - Thanh toán và quyết toán

## Quy tắc

- Giữ feature code độc lập và tái sử dụng được
- Shared components nên đặt trong `src/components`
- Shared hooks nên đặt trong `src/hooks`
