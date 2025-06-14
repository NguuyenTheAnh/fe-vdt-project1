# Hệ Thống Quản Lý Khoản Vay - Frontend

Một hệ thống quản lý khoản vay toàn diện được xây dựng bằng Angular, được thiết kế để tối ưu hóa quy trình xử lý khoản vay, quản lý người vay và các hoạt động quản trị cho các tổ chức tài chính.

## Tổng quan

Ứng dụng frontend này cung cấp giao diện hoàn chỉnh cho các hoạt động quản lý khoản vay bao gồm cổng thông tin người vay, dashboard quản trị, quản lý sản phẩm vay, theo dõi giải ngân và khả năng báo cáo toàn diện.

## Tính năng

### Cổng Thông Tin Quản Trị
- **Dashboard Chính**: Tổng quan thống kê hệ thống và các chỉ số quan trọng
- **Quản Lý Đơn Vay**: Xem xét, phê duyệt và quản lý đơn vay với quy trình chi tiết
- **Quản Lý Sản Phẩm Vay**: Tạo và quản lý các loại sản phẩm vay với điều khoản tùy chỉnh
- **Quản Lý Người Dùng**: Quản trị người dùng toàn diện với kiểm soát truy cập theo vai trò
- **Quản Lý Giải Ngân**: Theo dõi và quản lý giải ngân khoản vay với hồ sơ tài chính chi tiết
- **Cấu Hình Hệ Thống**: Cấu hình các thiết lập toàn hệ thống bao gồm tài liệu yêu cầu và mẫu email
- **Quản Lý Vai Trò**: Định nghĩa và quản lý vai trò người dùng và quyền hạn
- **Dashboard Báo Cáo**: Tạo báo cáo chi tiết về hiệu suất khoản vay và thống kê hệ thống

### Cổng Thông Tin Người Vay
- **Khám Phá Sản Phẩm Vay**: Duyệt các sản phẩm vay có sẵn với điều khoản và điều kiện chi tiết
- **Quản Lý Đơn Xin Vay**: Nộp và theo dõi đơn vay qua quy trình phê duyệt
- **Quản Lý Tài Liệu**: Tải lên và quản lý tài liệu yêu cầu cho đơn vay
- **Theo Dõi Khoản Vay Đã Duyệt**: Giám sát khoản vay đã được phê duyệt và trạng thái giải ngân
- **Quản Lý Hồ Sơ Cá Nhân**: Duy trì thông tin cá nhân và tùy chọn
- **Hệ Thống Thông Báo**: Nhận cập nhật về trạng thái đơn và thông báo quan trọng

### Tính Năng Kỹ Thuật
- **Thiết Kế Responsive**: Tối ưu cho desktop, tablet và mobile
- **Cập Nhật Thời Gian Thực**: Cập nhật trạng thái và thông báo trực tiếp
- **Tìm Kiếm và Lọc Nâng Cao**: Khả năng tìm kiếm toàn diện trên tất cả modules
- **Tải Lên và Quản Lý Tài Liệu**: Xử lý file bảo mật với khả năng xem trước
- **Xuất Dữ Liệu**: Chức năng xuất cho báo cáo và dữ liệu đơn vay
- **Bảo Mật**: Kiểm soát truy cập theo vai trò với xác thực bảo mật

## Stack Công Nghệ

- **Framework**: Angular 15.2.0
- **UI Library**: ng-zorro-antd 15.1.1 (Ant Design cho Angular)
- **Styling**: Tailwind CSS 3.4.17 với custom styling
- **Ngôn Ngữ**: TypeScript 4.9.4
- **Build Tool**: Angular CLI 15.2.4
- **State Management**: RxJS cho reactive programming
- **HTTP Client**: Angular HttpClient với interceptors

## Cấu Trúc Dự Án

```
src/
├── app/
│   ├── admin/                 # Các module quản trị
│   │   ├── main-dashboard/    # Dashboard chính admin
│   │   ├── loan-application-list-dashboard/  # Quản lý đơn vay
│   │   ├── loan-product-list-dashboard/      # Quản lý sản phẩm vay
│   │   ├── user-list-dashboard/              # Quản lý người dùng
│   │   ├── disbursement-dashboard/           # Theo dõi giải ngân
│   │   ├── report-dashboard/                 # Báo cáo và phân tích
│   │   ├── system-config-dashboard/          # Cấu hình hệ thống
│   │   └── role-dashboard/                   # Quản lý vai trò
│   ├── borrower-portal/       # Các module cho người vay
│   │   ├── home-page/         # Trang chủ
│   │   ├── loan-product-list/ # Sản phẩm vay có sẵn
│   │   ├── loan-application-form/  # Nộp đơn vay
│   │   ├── application-list/  # Theo dõi đơn vay
│   │   ├── approved-loan-detail/   # Quản lý khoản vay đã duyệt
│   │   ├── user-profile/      # Quản lý hồ sơ
│   │   └── notification-list/ # Thông báo
│   ├── layout/                # Shared layout components
│   │   ├── header/            # Navigation chính
│   │   ├── footer/            # Footer component
│   │   ├── admin-header/      # Navigation admin
│   │   ├── admin-sidebar/     # Sidebar admin
│   │   └── modal-container/   # Modal wrapper
│   ├── services/              # Application services
│   │   ├── auth.service.ts    # Xác thực
│   │   ├── api.service.ts     # Giao tiếp API
│   │   ├── application.service.ts  # Đơn vay
│   │   ├── loan.service.ts    # Sản phẩm vay
│   │   ├── user.service.ts    # Quản lý người dùng
│   │   ├── disbursement.service.ts  # Giải ngân
│   │   └── notification.service.ts  # Thông báo
│   ├── guards/                # Route guards
│   │   ├── auth.guard.ts      # Authentication guard
│   │   └── admin.guard.ts     # Admin access guard
│   ├── login-page/            # Xác thực
│   ├── register-page/         # Đăng ký người dùng
│   └── page-not-found/        # Trang lỗi 404
├── environments/              # Cấu hình môi trường
├── assets/                    # Static assets
└── styles/                    # Global styles
```

## Bắt Đầu

### Yêu Cầu Hệ Thống

- Node.js (phiên bản 16 trở lên)
- npm (phiên bản 8 trở lên)
- Angular CLI (phiên bản 15.2.4)

### Cài Đặt

1. Clone repository:
```bash
git clone <repository-url>
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình môi trường:
   - Cập nhật `src/environments/environment.ts` cho development
   - Cập nhật `src/environments/environment.prod.ts` cho production

### Development Server

Chạy development server:
```bash
npm run dev
```

Ứng dụng sẽ có sẵn tại `http://localhost:4200`

### Lệnh Build

- **Development build với watch mode**:
```bash
npm run watch
```

- **Production build với watch mode**:
```bash
npm run watch:prod
```

- **Production build**:
```bash
npm run build
```

Build artifacts sẽ được lưu trong thư mục `dist/`.

### Testing

Chạy unit tests:
```bash
npm run test
```

## Cấu Hình Môi Trường

Ứng dụng hỗ trợ nhiều môi trường:

- **Development**: Sử dụng localhost API endpoints cho phát triển local
- **Production**: Được cấu hình cho production API endpoints

Các tùy chọn cấu hình chính:
- `apiUrl`: Backend API base URL
- `production`: Production mode flag

## Triển Khai Tính Năng Chính

### Xác Thực & Ủy Quyền
- Xác thực dựa trên JWT
- Kiểm soát truy cập theo vai trò (Admin, User)
- Route guards cho các khu vực được bảo vệ
- Quản lý session tự động

### Quy Trình Đơn Vay
- Quy trình đăng ký nhiều bước
- Tải lên và xác minh tài liệu
- Theo dõi trạng thái với thông báo email
- Quy trình xem xét và phê duyệt quản trị

### Quản Lý Dữ Liệu
- Bảng dữ liệu phân trang với sắp xếp và lọc
- Cập nhật trạng thái thời gian thực
- Chức năng tìm kiếm toàn diện
- Khả năng xuất dữ liệu

### Trải Nghiệm Người Dùng
- Thiết kế responsive cho mọi kích thước màn hình
- Loading states và xử lý lỗi
- Toast notifications cho phản hồi người dùng
- Modal dialogs cho các thao tác chi tiết

## Tích Hợp API

Frontend tích hợp với RESTful backend API cung cấp:
- Xác thực và quản lý người dùng
- Xử lý đơn vay
- Quản lý tài liệu
- Dịch vụ thông báo
- Báo cáo và phân tích

## Tính Năng Bảo Mật

- Routes được bảo vệ với authentication guards
- Hiển thị component theo vai trò
- Xử lý tải file bảo mật
- Bảo vệ XSS và validation input
- Ép buộc HTTPS trong production