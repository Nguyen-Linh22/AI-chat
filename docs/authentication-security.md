# Xác Thực & Bảo Mật (Authentication & Security)

Tài liệu này mô tả chi tiết cơ chế xác thực phiên người dùng, kiến trúc bảo mật nhiều lớp, kiểm soát nguồn gốc và các biện pháp bảo vệ dữ liệu trong ứng dụng **AI Chat Clone**.

---

## 1. Cơ Chế Xác Thực (Authentication Flow)

Ứng dụng sử dụng mô hình xác thực dựa trên **JSON Web Token (JWT)** được lưu trữ trong **HttpOnly Cookie**:

```text
[Trình duyệt]                                                 [Backend Server]
      |                                                              |
      |--- POST /api/auth/register (email, password) --------------->|
      |<-- 201 Created (Set-Cookie: ai_chat_token; HttpOnly) --------|
      |                                                              |
      |--- POST /api/auth/login (email, password) ------------------>|
      |<-- 200 OK (Set-Cookie: ai_chat_token; HttpOnly) -------------|
      |                                                              |
      |--- GET /api/auth/me (Cookie: ai_chat_token) ---------------->|
      |<-- 200 OK (user profile) ------------------------------------|
      |                                                              |
      |--- POST /api/auth/logout ----------------------------------->|
      |<-- 200 OK (Set-Cookie: ai_chat_token=; Max-Age=0) -----------|
```

### Chi tiết Cấu hình Cookie (`cookie.config.ts`):
- **Tên Cookie**: `ai_chat_token`
- **Môi trường Production (Cross-Site giữa Vercel và Render)**:
  - `httpOnly: true` — Trình duyệt và JavaScript phía client (kể cả mã XSS) không thể đọc cookie.
  - `secure: true` — Chỉ truyền tải qua giao thức mã hóa HTTPS.
  - `sameSite: 'none'` — Bắt buộc phải có để trình duyệt gửi cookie trong các request cross-domain (từ Vercel sang Render).
  - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 ngày).
- **Môi trường Development**:
  - `httpOnly: true`, `secure: false`, `sameSite: 'lax'`.

### Quản lý Mật khẩu & Thu hồi Phiên (Token Revocation):
- Mật khẩu người dùng được băm an toàn bằng thư viện `bcrypt` với hệ số salt mặc định là 10 vòng.
- Mô hình `User` có trường `tokenVersion`. Mỗi JWT phát ra chứa `tokenVersion` tại thời điểm tạo.
- Khi người dùng đổi mật khẩu hoặc yêu cầu đăng xuất khỏi mọi thiết bị, hệ thống chỉ cần tăng `tokenVersion` trong cơ sở dữ liệu. Toàn bộ các token cũ lập tức bị vô hiệu hóa khi đi qua middleware xác thực.

---

## 2. Bảo Vệ Nguồn Gốc (CORS & CSRF Defense)

Vì ứng dụng hoạt động theo mô hình Cross-Origin giữa Frontend (`ai-chat-plum-gamma.vercel.app`) và Backend (`ai-chat-ua68.onrender.com`), hệ thống triển khai bảo vệ kép:

### Kiểm soát Nguồn gốc CORS (`cors.config.ts`)
- Chỉ cho phép duy nhất tên miền được khai báo trong biến môi trường `FRONTEND_URL`.
- Cấu hình `credentials: true` để cho phép trình duyệt gửi kèm cookie.
- Các yêu cầu từ domain lạ không được nhận header `Access-Control-Allow-Origin` và bị trình duyệt chặn ở bước preflight.

### Lớp Bảo vệ Chống Tấn công CSRF (`csrf.middleware.ts`)
- Áp dụng kiểm tra nguồn gốc tại tầng ứng dụng cho toàn bộ các phương thức thay đổi trạng thái (`POST`, `PATCH`, `DELETE`, `PUT`).
- **Xác thực Origin/Referer**:
  - Nếu request mang header `Origin` hoặc `Referer`, giá trị này bắt buộc phải nằm trong danh sách whitelist cho phép. Nếu không, trả về `403 Forbidden` (`CSRF protection: Nguồn gốc yêu cầu không hợp lệ`).
  - Trong môi trường **Production**, nếu request hoàn toàn thiếu cả `Origin` và `Referer`, hệ thống lập tức từ chối với mã `433 Forbidden` (`CSRF protection: Yêu cầu bị từ chối do thiếu header nguồn gốc`).

---

## 3. Tiêu Chuẩn Bảo Mật HTTP Headers (Helmet)

Backend tích hợp thư viện `helmet` nhằm thiết lập đầy đủ các HTTP security header hiện đại:

- **HSTS (HTTP Strict Transport Security)**: `max-age=31536000; includeSubDomains` — Bắt buộc trình duyệt luôn sử dụng HTTPS.
- **Content-Security-Policy (CSP)**:
  - `default-src 'self'`
  - `frame-ancestors 'none'` (Chống Clickjacking).
  - `img-src 'self' data: https://res.cloudinary.com` (Chỉ cho phép tải ảnh từ nội bộ và Cloudinary).
  - `upgrade-insecure-requests`
- **X-Frame-Options**: `DENY` — Cấm nhúng ứng dụng vào `<iframe>`.
- **X-Content-Type-Options**: `nosniff` — Ngăn trình duyệt tự đoán MIME type.
- **Referrer-Policy**: `no-referrer` — Không gửi thông tin trang giới thiệu.
- **Permissions-Policy**: `camera=(), microphone=(), geolocation=()` — Vô hiệu hóa quyền truy cập camera, micro và định vị.
- **Ẩn X-Powered-By**: Loại bỏ hoàn toàn header lộ thông tin công nghệ Express.

---

## 4. Kiểm Soát Phân Quyền (IDOR Protection)

Toàn bộ các tác vụ liên quan đến tài nguyên người dùng (đoạn chat, tin nhắn, tệp đính kèm) đều được bảo vệ nghiêm ngặt:
- Người dùng chỉ có thể xem, sửa, xóa hoặc stream tin nhắn trên các phiên chat mà `userId` trong DB trùng khớp với `req.userId` lấy từ JWT.
- Khi người dùng cố gắng thao tác trên ID của người dùng khác, hệ thống lập tức trả về `403 Forbidden` hoặc `404 Not Found`, triệt tiêu hoàn toàn lỗ hổng IDOR.

---

## 5. Chuẩn Hóa Lỗi & Ngăn Rò Rỉ Thông Tin (Error Sanitization)

Module `backend/src/middlewares/error.middleware.ts` xử lý ngoại lệ tập trung:
- Trong môi trường Production, **TUYỆT ĐỐI KHÔNG** trả về stack trace, đường dẫn tệp vật lý, câu lệnh SQL nội bộ hay thông tin cấu hình cho người dùng.
- Mọi lỗi đều được chuyển hóa thành JSON chuẩn với thông điệp an toàn, thân thiện:
  ```json
  {
    "message": "Không tìm thấy tài nguyên yêu cầu"
  }
  ```

---

## 6. Ghi Chú về Kiểm Thử Production (Audit Limitation)

> **Lưu ý**: Trong toàn bộ quá trình audit Phase 16, các kiểm thử đã xác minh thành công ranh giới bảo mật unauthenticated (toàn bộ protected routes trả về 401). Kiểm thử E2E ở trạng thái authenticated thật trên Production đã được đánh dấu an toàn là **BLOCKED** do không tạo tài khoản thử nghiệm trên database chính thức để bảo vệ dữ liệu người dùng.
