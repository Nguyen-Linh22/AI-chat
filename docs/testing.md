# Kiểm Thử Phần Mềm (Testing Suite & Results)

Tài liệu này mô tả chi tiết cơ chế kiểm thử tự động, danh mục bài test và kết quả kiểm thử toàn diện đã được xác minh trong quá trình Audit Phase 16.

---

## 1. Công nghệ & Framework Kiểm Thử

- **Kiểm thử Đơn vị & Tích hợp (Unit & Integration Testing)**:
  - **Vitest 5**: Framework kiểm thử tốc độ cao chạy trên môi trường Node.js.
  - **React Testing Library & @testing-library/user-event**: Kiểm thử component và tương tác người dùng trên giao diện React.
  - **jsdom**: Giả lập môi trường DOM trình duyệt cho Frontend tests.
  - **Supertest**: Kiểm thử HTTP assertions cho Backend Express endpoints.
- **Kiểm thử E2E (End-to-End Testing)**:
  - **Playwright Test**: Framework kiểm thử trình duyệt tự động (dành cho môi trường local/staging).

---

## 2. Danh Mục Các Bộ Kiểm Thử (Test Categories)

### Frontend Tests (`frontend/src/`)
Bao gồm 20 file kiểm thử với 171 ca kiểm thử bao phủ toàn bộ chức năng UI và logic:
1. **Kiểm thử Luồng Trang (Page Flow Tests)**:
   - `LoginPage.test.tsx`: Form đăng nhập, validation, submit, xử lý lỗi API và điều hướng.
   - `RegisterPage.test.tsx`: Form đăng ký, kiểm tra trùng khớp mật khẩu, phản hồi từ server.
   - `userSwitchFlow.test.ts`: Luồng đăng xuất và chuyển đổi tài khoản người dùng sạch sẽ.
2. **Kiểm thử Thành phần Giao diện (Component Tests)**:
   - `Sidebar.test.tsx`: Hiển thị danh sách chat, đổi tên inline, xác nhận xóa chat, xử lý lỗi API.
   - `ChatArea.test.tsx`: Hiển thị lịch sử tin nhắn, phân trang tin nhắn cũ, nút Regenerate.
   - `ChatInput.test.tsx`: Gửi bằng Enter, xuống dòng bằng Shift+Enter, đính kèm file, mở modal mở rộng.
   - `MessageBubble.test.tsx`: Render Markdown, khối code cú pháp, tin nhắn người dùng và AI.
   - `AuthInitializer.test.tsx`: Kiểm tra phiên làm việc người dùng khi F5 ứng dụng.
3. **Kiểm thử Quản lý Trạng thái & Dịch vụ (Stores & Services)**:
   - `chatStore.test.ts`, `messageStore.test.ts`, `authStore.test.ts`, `aiStore.test.ts`.
   - `streamService.test.ts`: Phân tích SSE event stream, xử lý chunk, done và error.
   - `useTypewriterQueue.test.ts`: Hiệu ứng hiển thị chữ mượt mà khi nhận stream.

### Backend Tests (`backend/tests/`)
Bao gồm 18 file unit test an toàn với 117 ca kiểm thử bao phủ logic nghiệp vụ và bảo mật:
1. **Bảo mật & Middleware**:
   - `csrf.middleware.test.ts`: Kiểm tra từ chối malicious origins và các request thiếu header nguồn gốc.
   - `cookie.config.test.ts`: Đảm bảo cờ `SameSite=None` và `Secure` được áp dụng chuẩn xác trên production.
   - `general.ratelimit.test.ts`: Kiểm tra giới hạn 300 req/15 phút.
   - `concurrent.ai.limiter.test.ts`: Xác nhận người dùng thứ hai nhận 429 khi đang có 1 stream đang chạy.
   - `upload.ratelimit.test.ts`: Kiểm tra giới hạn tải tệp 10 req/15 phút.
2. **Kiểm tra File & Dọn dẹp Cloudinary**:
   - `file.util.test.ts`: Xóa file an toàn không gây sập ứng dụng.
   - `upload.config.test.ts`: Đảm bảo thư mục upload tự động được tạo và dọn rác tệp cũ hơn 1 giờ.
   - `cloudinary.cleanup.test.ts`: Kiểm tra dọn dẹp asset khi xóa message hoặc xóa chat, cơ chế rollback khi DB insert thất bại.
3. **AI & Điều phối Mô hình**:
   - `model.registry.test.ts`: Đảm bảo trên production chỉ xuất hiện `gemini-3.6-flash`.
   - `ai.config.test.ts`: Kiểm tra xác thực biến môi trường `AI_PROVIDER` và `GEMINI_MODEL`.
   - `ai-audit.util.test.ts`: Kiểm tra ghi nhận metrics không ghi đè prompt người dùng.
   - `stream.controller.test.ts`: Kiểm tra phát sinh sự kiện SSE và xử lý ngoại lệ an toàn.
4. **Validation**:
   - `validation.test.ts`: Kiểm tra tính hợp lệ của tham số UUID, phân trang và dữ liệu nhập.

---

## 3. Kết Quả Kiểm Thử Đã Xác Minh (Phase 16.13 Audit)

Trong vòng kiểm tra hồi quy cuối cùng (Phase 16.13), toàn bộ các bài test không can thiệp vào cơ sở dữ liệu production đã đạt **tỷ lệ thành công 100%**:

```text
================================================================================
KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 16.13 (PHASE 16.13 AUDIT RESULT)
================================================================================
- Frontend Test Suite:       20 passed / 20 test files (171 / 171 tests)
- Backend Non-Mutating Unit: 18 passed / 18 test files (117 / 117 tests)
--------------------------------------------------------------------------------
TỔNG CỘNG:                   38 passed / 38 test files (288 / 288 tests)
TỶ LỆ THÀNH CÔNG:            100% PASS
EXIT CODE:                   0
================================================================================
```

---

## 4. Nguyên Tắc An Toàn Dữ Liệu Kiểm Thử (Testing Safeguards)

> **Cảnh báo quan trọng**:
> - Các bài kiểm thử tích hợp ghi dữ liệu (`tests/integration/*`) kết nối với database thật **TUYỆT ĐỐI KHÔNG ĐƯỢC CHẠY** trực tiếp trên database của môi trường Production.
> - Khi cần chạy bộ test tích hợp toàn diện, hãy sử dụng tệp cấu hình riêng biệt `.env.e2e` trỏ tới cơ sở dữ liệu test cục bộ:
>   ```bash
>   cd backend
>   npm run test:e2e
>   ```
> - Kiểm thử production chỉ được thực hiện thông qua các cuộc gọi HTTP an toàn (kiểm tra health, public model registry, hoặc xác minh mã lỗi 401 khi không có cookie).
