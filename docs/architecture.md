# Kiến trúc Hệ thống (System Architecture)

Tài liệu này mô tả chi tiết kiến trúc tổng thể, cấu trúc phân tầng và luồng dữ liệu của ứng dụng **AI Chat Clone**.

---

## 1. Sơ đồ kiến trúc tổng quan

```text
+-----------------------------------------------------------------------------------+
|                                  TRÌNH DUYỆT (BROWSER)                           |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS
                                         v
+-----------------------------------------------------------------------------------+
|                        FRONTEND (Vercel Production)                               |
|  - React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand                      |
|  - SPA Routing với Vercel Rewrites (vercel.json)                                  |
|  - SSE EventSource / Fetch Streaming Reader                                       |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS (credentials: 'include')
                                         | CORS / CSRF Protection
                                         v
+-----------------------------------------------------------------------------------+
|                        BACKEND (Render Production)                                |
|  - Node.js + Express 5 + TypeScript + Prisma 7 ORM                               |
|  - Bảo mật: Helmet, JWT HttpOnly Cookie (SameSite=None, Secure), CORS whitelist    |
|  - Kiểm soát lưu lượng: General Limiter, Auth Limiter, AI Limiter, Concurrency    |
+-----------------------------------------------------------------------------------+
         |                                |                               |
         | Prisma Client                  | Google GenAI SDK              | Cloudinary SDK
         v                                v                               v
+-------------------+            +-------------------+           +-------------------+
|  POSTGRESQL (NEON)|            |   GOOGLE GEMINI   |           |    CLOUDINARY     |
| - Users           |            | - gemini-3.6-flash|           | - Lưu trữ ảnh &   |
| - ChatSessions    |            | - Streaming text  |           |   tệp đính kèm    |
| - Messages        |            | - RAG Embeddings  |           | - Tự động dọn rác |
| - Attachments     |            +-------------------+           +-------------------+
| - Documents (RAG) |
+-------------------+
```

---

## 2. Cấu trúc phân tầng (Layering)

### Frontend Layering (`frontend/src/`)
- **`pages/`**: Các trang điều hướng chính (`LoginPage`, `RegisterPage`, `ChatPage`).
- **`components/`**: Các thành phần giao diện tái sử dụng (`Sidebar`, `ChatArea`, `ChatInput`, `MessageBubble`, `FilePreview`, `AuthInitializer`).
- **`services/`**: Các dịch vụ giao tiếp HTTP / SSE với backend (`apiClient`, `authService`, `chatService`, `messageService`, `streamService`, `aiService`).
- **`stores/`**: Quản lý trạng thái toàn cục bằng Zustand (`authStore`, `chatStore`, `messageStore`, `aiStore`).
- **`hooks/`**: Custom hooks xử lý logic giao diện (`useTypewriterQueue`, `useAutoScroll`, ...).
- **`layouts/`**: Bố cục khung giao diện chính (`RootLayout`).
- **`types/`**: Định nghĩa kiểu dữ liệu TypeScript dùng chung cho toàn bộ frontend.
- **`utils/`**: Các tiện ích định dạng ngày tháng, xử lý văn bản, tạo ID tạm.

### Backend Layering (`backend/src/`)
- **`routes/`**: Định nghĩa routing cho từng phân hệ (`auth`, `chat`, `message`, `upload`, `ai`, `health`).
- **`controllers/`**: Tiếp nhận và điều phối HTTP request/response (`auth`, `chat`, `message`, `stream`, `upload`).
- **`services/`**: Logic nghiệp vụ lõi (`auth.service`, `chat.service`, `message.service`, `ai.service`, `cloudinary.service`).
- **`middlewares/`**: Các bộ lọc trung gian:
  - `auth.middleware.ts`: Xác thực JWT từ cookie HttpOnly.
  - `csrf.middleware.ts`: Kiểm tra Origin/Referer chống tấn công CSRF.
  - `rate-limit.middleware.ts`: Giới hạn tần suất request và giới hạn xử lý AI đồng thời.
  - `upload.middleware.ts`: Tiếp nhận file tạm thời qua Multer (giới hạn 10 MB).
  - `error.middleware.ts`: Xử lý ngoại lệ tập trung, chuẩn hóa response và ngăn rò rỉ stack trace.
  - `logger.middleware.ts`: Ghi nhận log request mà không lưu trữ thông tin nhạy cảm.
- **`validators/`**: Kiểm tra tính hợp lệ của tham số request, schema Zod, và xác thực file (`file.validator.ts` kiểm tra Extension, MIME, Magic Bytes).
- **`ai/`**: Bộ điều phối AI đa nhà cung cấp, Model Registry, và quản lý giới hạn tài nguyên.
- **`rag/`**: Module tìm kiếm ngữ nghĩa RAG thử nghiệm (`rag.service.ts` sử dụng `gemini-embedding-2` và pgvector).
- **`lib/`**: Khởi tạo kết nối hệ thống (`prisma.ts`).
- **`config/`**: Cấu hình hệ thống tập trung (`cookie`, `cors`, `upload`, `cloudinary`).

---

## 3. Luồng dữ liệu chi tiết (Request Flows)

### 3.1. Luồng Xác thực (Authentication Flow)
1. Người dùng nhập thông tin đăng nhập hoặc đăng ký tại Frontend.
2. Request gửi tới `POST /api/auth/login` (hoặc `register`).
3. Backend kiểm tra thông tin qua bcrypt, tạo JWT payload chứa `userId` và `tokenVersion`.
4. Token được đính kèm vào response dưới dạng **HttpOnly Cookie** (`ai_chat_token`):
   - Môi trường Production: `SameSite=None`, `Secure=true`, `HttpOnly=true`, thời hạn 7 ngày.
   - Môi trường Development: `SameSite=Lax`, `Secure=false`, `HttpOnly=true`.
5. Các request tiếp theo tự động mang theo cookie xác thực nhờ cấu hình `credentials: 'include'`.
6. Khi đăng xuất (`POST /api/auth/logout`), backend xóa cookie xác thực với đầy đủ thuộc tính tương ứng.

### 3.2. Luồng Quản lý Hội thoại (Chat Management Flow)
1. Client gọi `GET /api/chats` để tải danh sách phiên chat của người dùng hiện tại.
2. `authMiddleware` giải mã JWT từ cookie và gán `req.userId`.
3. Database truy vấn bảng `ChatSession` với điều kiện `userId = req.userId` (được đánh index để tối ưu hiệu năng).
4. Khi tạo chat (`POST /api/chats`), backend tạo bản ghi mới và trả về thông tin phiên chat.
5. Việc cập nhật tiêu đề (`PATCH /api/chats/:id`) hoặc xóa (`DELETE /api/chats/:id`) đều bắt buộc kiểm tra quyền sở hữu (`ownership check`), loại trừ nguy cơ IDOR.

### 3.3. Luồng Sinh phản hồi AI qua Streaming (AI SSE Stream Flow)
1. Người dùng gửi tin nhắn qua `POST /api/chats/:id/messages/stream`.
2. Request đi qua các lớp bảo vệ:
   - `csrfProtectionMiddleware`: Xác minh Origin hợp lệ.
   - `requireAuth`: Xác minh người dùng hợp lệ.
   - `aiRateLimiter`: Kiểm tra giới hạn 15 request/phút.
   - `concurrentAiLimiter`: Đảm bảo mỗi người dùng chỉ chạy **tối đa 1 stream AI đồng thời**.
   - `ownership`: Kiểm tra quyền sở hữu phiên chat.
3. Backend lưu tin nhắn của User vào PostgreSQL.
4. Thiết lập header SSE: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
5. Backend gọi Google Gemini (`gemini-3.6-flash`) với timeout 120 giây.
6. Mỗi đoạn văn bản (chunk) được stream trực tiếp về client dưới dạng SSE event: `data: {"type":"chunk","content":"..."}`.
7. Khi hoàn tất, backend lưu câu trả lời đầy đủ của AI vào DB, gửi event `data: {"type":"done","message":{...}}` và đóng kết nối.
8. Nếu client hủy stream (AbortSignal), kết nối đóng và tài nguyên đồng thời được giải phóng ngay lập tức.

### 3.4. Luồng Tải tệp đính kèm (File Upload Flow)
1. Client gửi tệp đính kèm (qua multipart/form-data) trong request stream hoặc `POST /api/uploads/:messageId`.
2. Multer lưu tệp vào thư mục tạm `backend/uploads/` với tên ngẫu nhiên duy nhất.
3. `validateUploadedFile` kiểm tra nghiêm ngặt:
   - Kích thước không vượt quá 10 MB.
   - Tên tệp hợp lệ, không chứa ký tự điều hướng thư mục (`..`, `/`, `\`, `\0`).
   - Phần mở rộng thuộc danh sách cho phép (`.pdf`, `.txt`, `.png`, `.jpg`, `.jpeg`).
   - MIME type khớp với phần mở rộng.
   - **Magic Bytes**: Kiểm tra chữ ký byte thực tế của file để chặn giả mạo đuôi file.
4. Nếu hợp lệ, tệp được upload lên Cloudinary qua Cloudinary SDK server-side.
5. Backend tạo bản ghi `Attachment` liên kết với `Message`, lưu trữ `fileUrl` và `cloudinaryPublicId`.
6. Tệp tạm trên đĩa cục bộ được xóa ngay lập tức (`safeDeleteFile`).
7. Nếu việc lưu vào DB thất bại, hệ thống tự động rollback bằng cách xóa tệp đã tải lên khỏi Cloudinary.
