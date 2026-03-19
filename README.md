# SplitWiseVN - Ứng dụng Quản lý Chi tiêu Nhóm Thông minh

**SplitWiseVN** là giải pháp toàn diện giúp bạn và bạn bè dễ dàng quản lý chi tiêu, chia hóa đơn và theo dõi công nợ một cách minh bạch, hiện đại. Được tối ưu hóa cho người dùng Việt Nam với giao diện thân thiện và tích hợp các phương thức thanh toán phổ biến.

---

## 🚀 Công nghệ Sử dụng (Tech Stack)

Dự án được xây dựng với kiến trúc Full-stack hiện đại, đảm bảo hiệu năng cao và khả năng mở rộng.

### 📱 Frontend (Mobile App)
- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 54).
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing).
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native).
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) & [TanStack Query](https://tanstack.com/query/latest) (React Query).
- **Form Handling**: React Hook Form & Zod.
- **Real-time**: Socket.io-client.

### 🛠️ Backend (API Server)
- **Language**: [TypeScript](https://www.typescriptlang.org/).
- **Framework**: [Express.js](https://expressjs.com/).
- **Database**: [PostgreSQL](https://www.postgresql.org/) với [Prisma ORM](https://www.prisma.io/).
- **Background Jobs**: [BullMQ](https://docs.bullmq.io/) & [Redis](https://redis.io/).
- **Authentication**: JWT, Google OAuth 2.0.
- **Real-time**: [Socket.io](https://socket.io/).

### ☁️ Dịch vụ Tích hợp (Third-party Services)
- **Hình ảnh**: [Cloudinary](https://cloudinary.com/).
- **Email**: [Resend](https://resend.com/).
- **Thông báo**: Expo Server SDK (Push Notifications).
- **Báo cáo**: Carbone (Xuất file Excel/PDF).

---

## ✨ Các Chức năng Chính (Core Features)

### 👥 Quản lý Nhóm & Bạn bè
- Tạo nhóm chi tiêu (Du lịch, Ăn uống, Sinh hoạt gia đình...).
- Chế độ nhóm Công khai (Public) hoặc Riêng tư (Private) với **Mã mời (Invite Code)**.
- Phân quyền thành viên (Admin, Member).
- Kết bạn và quản lý danh sách bạn bè thân thiết.

### 💸 Ghi chép & Chia Chi tiêu (Expense Splitting)
- Thêm chi tiêu nhanh chóng với nhiều hình thức chia:
  - **Chia đều (Equal)**: Chia tự động cho mọi thành viên.
  - **Số tiền chính xác (Exact)**: Nhập số tiền cụ thể cho từng người.
  - **Phần trăm (%)**: Chia theo tỷ lệ phần trăm.
  - **Phần chia (Shares)**: Chia theo hệ số (ví dụ: người lớn 2 phần, trẻ em 1 phần).
- Hỗ trợ chụp ảnh hóa đơn (Receipt) và lưu trữ trên đám mây.
- Quản lý danh mục chi tiêu (Ăn uống, Di chuyển, Mua sắm...).

### 💳 Theo dõi Nợ & Tất toán (Settlements)
- Tóm tắt công nợ thông minh: Ai nợ ai, nợ bao nhiêu.
- Quy trình tất toán minh bạch:
  - Gửi yêu cầu thanh toán.
  - Xác nhận/Từ chối thanh toán.
  - Giải quyết tranh chấp (Dispute).
- Tích hợp thông tin chuyển khoản ngân hàng và các ví điện tử (MoMo, ZaloPay, VNPay).

### 🔔 Thông báo & Nhật ký
- Thông báo đẩy (Push Notifications) khi có chi tiêu mới hoặc có người nhắc nợ.
- Nhật ký hoạt động (Activity Logs) chi tiết từng thay đổi trong nhóm.
- Hệ thống bình luận ngay dưới mỗi chi tiêu.

### 🎨 Tùy chỉnh & Khác
- **Chế độ Sáng/Tối (Dark Mode)**: Tùy chỉnh giao diện theo sở thích.


---

## 📂 Cấu trúc Thư mục

```text
SplitWiseVN/
├── client/          # Ứng dụng di động (Expo/React Native)
│   ├── app/         # Routes & Screens (Expo Router)
│   ├── src/         # Components, Hooks, Stores, APIs
│   └── assets/      # Hình ảnh, Fonts
└── server/          # API Server (Node.js/Express)
    ├── routes/      # Định nghĩa các endpoint
    ├── controllers/ # Xử lý logic nghiệp vụ
    ├── services/    # Tương tác Database (Prisma)
    └── workers/     # Background tasks (Push notifications, Emails)
```

---

## 🛠️ Hướng dẫn Cài đặt

### Yêu cầu hệ thống
- Node.js >= 18
- Docker (để chạy PostgreSQL/Redis) hoặc Database Online.

### 1. Server
```bash
cd server
yarn install
cp .env.example .env # Cấu hình DATABASE_URL, JWT_SECRET...
npx prisma migrate dev
yarn dev
```

### 2. Client
```bash
cd client
yarn install
cp .env.example .env # Cấu hình API_URL
npx expo start
```

---

## 📜 Giấy phép (License)
Dự án được phát hành dưới giấy phép **ISC**.

---
*Phát triển bởi đội ngũ SplitWiseVN Team.*
