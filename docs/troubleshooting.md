# Sổ Tay Xử Lý Sự Cố (Troubleshooting Guide)

Tài liệu này cung cấp hướng dẫn chẩn đoán và khắc phục nhanh các lỗi phổ biến trong quá trình phát triển và vận hành ứng dụng **AI Chat Clone**.

---

## 1. Lỗi Kết Nối Frontend ➔ Backend (CORS / Network Error)

### Hiện tượng:
Trình duyệt hiển thị thông báo lỗi `Network Error` hoặc console báo lỗi `CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource`.

### Nguyên nhân & Cách khắc phục:
1. **Sai cấu hình URL Frontend trên Backend**:
   - Kiểm tra biến môi trường `FRONTEND_URL` trên Render.
   - Giá trị đúng: `https://ai-chat-plum-gamma.vercel.app` (tuyệt đối không để dấu gạch chéo `/` ở cuối).
2. **Sai cấu hình API URL trên Frontend**:
   - Kiểm tra biến `VITE_API_URL` trên Vercel.
   - Giá trị đúng: `https://ai-chat-ua68.onrender.com` (không có dấu `/` ở cuối).
3. **Backend đang ngủ đông (Render Cold Start)**:
   - Truy cập trực tiếp `https://ai-chat-ua68.onrender.com/api/health` trên trình duyệt để đánh thức server, sau đó thử lại.

---

## 2. Lỗi 401 Unauthorized (Bạn Chưa Đăng Nhập)

### Hiện tượng:
Người dùng đã đăng nhập nhưng khi gọi API lấy danh sách chat hoặc gửi tin nhắn vẫn nhận được mã `401`.

### Nguyên nhân & Cách khắc phục:
1. **Trình duyệt chặn Cookie của bên thứ ba (Third-party Cookie)**:
   - Do Frontend (Vercel) và Backend (Render) nằm trên hai domain khác nhau, cookie xác thực bắt buộc phải có thuộc tính `SameSite=None; Secure`.
   - Đảm bảo bạn đang truy cập qua giao thức **HTTPS** trên cả hai trang. Trình duyệt hiện đại sẽ từ chối lưu cookie `SameSite=None` nếu không có HTTPS.
2. **Thiếu cấu hình `credentials: 'include'`**:
   - Mọi lệnh gọi `fetch` từ Frontend phải có thuộc tính `credentials: 'include'`. Mã nguồn tại `apiClient.ts` và `streamService.ts` đã được cấu hình mặc định sẵn.

---

## 3. Lỗi 403 Forbidden (CSRF Protection Blocked)

### Hiện tượng:
Gửi tin nhắn hoặc upload file bị từ chối với thông báo:
`{"message": "CSRF protection: Nguồn gốc yêu cầu không hợp lệ"}` hoặc
`{"message": "CSRF protection: Yêu cầu bị từ chối do thiếu header nguồn gốc"}`.

### Nguyên nhân & Cách khắc phục:
1. Yêu cầu gửi từ domain không nằm trong danh sách whitelist của `FRONTEND_URL`.
2. Kiểm tra xem trình duyệt hoặc proxy nội bộ có vô tình xóa header `Origin` hoặc `Referer` trong các request `POST` không.
3. Trong môi trường local development, đảm bảo `NODE_ENV` được đặt là `development` trong tệp `backend/.env`.

---

## 4. Mô Hình AI Không Khả Dụng (AI Model Unavailable)

### Hiện tượng:
Dropdown chọn mô hình AI bị trống hoặc request stream trả về lỗi từ nhà cung cấp.

### Nguyên nhân & Cách khắc phục:
1. Kiểm tra response của `GET https://ai-chat-ua68.onrender.com/api/ai/models`.
2. Đảm bảo biến môi trường `AI_PROVIDER=gemini` và `GEMINI_MODEL=gemini-3.6-flash` đã được thiết lập chính xác trên Render.
3. Kiểm tra hạn mức (Quota) của `GEMINI_API_KEY` trên Google AI Studio xem key có bị hết quota hoặc bị thu hồi không.

---

## 5. Lỗi Tải Tệp Đính Kèm (Upload Failed)

### Hiện tượng:
Tải file bị từ chối với mã lỗi `400`, `413`, hoặc `415`.

### Nguyên nhân & Cách khắc phục:
1. **Mã 413 (File quá lớn)**: File vượt quá giới hạn cho phép **10 MB**. Hãy nén file hoặc chọn file nhỏ hơn.
2. **Mã 415 (Định dạng không được hỗ trợ)**: Chỉ cho phép các định dạng `.pdf`, `.txt`, `.png`, `.jpg`, `.jpeg`.
3. **Mã 400 (Nội dung file không hợp lệ / Sai Magic Bytes)**: File bị đổi đuôi giả mạo (ví dụ file script đổi đuôi thành `.png`). Hệ thống đã phát hiện và chặn qua cơ chế kiểm tra chữ ký byte.
4. **Lỗi Cloudinary**: Kiểm tra các biến `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trên Render Dashboard.

---

## 6. Lỗi Kết Nối Cơ Sở Dữ Liệu (Prisma / Database Error)

### Hiện tượng:
Endpoint `/api/health` trả về `503 Database connection failed` hoặc server báo lỗi Prisma Client connection.

### Nguyên nhân & Cách khắc phục:
1. **Kiểm tra trạng thái dự án Neon**: Đăng nhập Neon Console xem database branch có bị suspend hoặc hết hạn ngạch không.
2. **Kiểm tra chuỗi kết nối `DATABASE_URL`**: Bắt buộc phải có tham số `?sslmode=require`. Khuyến nghị sử dụng connection string dạng pooled (kèm pgbouncer).
3. **Chưa sinh Prisma Client**: Chạy `npx prisma generate` trong thư mục `backend`.

> **CẢNH BÁO QUAN TRỌNG:**
> Tuyệt đối **KHÔNG ĐƯỢC CHẠY** lệnh `prisma migrate reset` để sửa lỗi database trên Production vì lệnh này sẽ xóa sạch toàn bộ dữ liệu người dùng!
