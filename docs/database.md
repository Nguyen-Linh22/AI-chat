# Cơ Sở Dữ Liệu & Prisma (Database & Prisma)

Tài liệu này mô tả chi tiết cơ sở dữ liệu PostgreSQL (Neon Serverless), mô hình dữ liệu Prisma Schema, các index hiệu năng và quy trình migration an toàn.

---

## 1. Công nghệ Sử dụng

- **Hệ quản trị CSDL**: PostgreSQL 16+ (sử dụng Neon Serverless PostgreSQL trên môi trường Production).
- **Extension**: `pgvector` (hỗ trợ lưu trữ vector embedding và tìm kiếm cosine distance `<=>` cho tính năng RAG).
- **ORM**: Prisma 7 (`@prisma/client` kết hợp `@prisma/adapter-pg`).
- **Vị trí Schema**: `backend/prisma/schema.prisma`
- **Thư mục Migration**: `backend/prisma/migrations/`
- **Prisma Output**: `backend/src/generated/prisma/`

---

## 2. Mô hình Thực thể (Data Models)

### `User`
Lưu trữ thông tin tài khoản người dùng:
- `id` (UUID, Primary Key): Định danh duy nhất của người dùng.
- `email` (String, Unique): Địa chỉ email đăng ký.
- `passwordHash` (String): Mật khẩu được mã hóa an toàn bằng bcrypt.
- `tokenVersion` (Int, default: 0): Phiên bản token dùng để thu hồi session/cookie khi cần đổi mật khẩu hoặc đăng xuất toàn bộ thiết bị.
- `createdAt`, `updatedAt`: Thời điểm tạo và cập nhật.
- Quan hệ: `chatSessions` (1 - N với `ChatSession`, cascade delete).

### `ChatSession`
Lưu trữ phiên hội thoại giữa người dùng và AI:
- `id` (UUID, Primary Key): Định danh duy nhất của phiên chat.
- `userId` (UUID, Foreign Key ➔ `User.id`): Người dùng sở hữu đoạn chat.
- `title` (String, default: "Đoạn chat mới"): Tiêu đề cuộc trò chuyện.
- `createdAt`, `updatedAt`: Dấu thời gian.
- **Index**: `@@index([userId])` — Tối ưu hóa tốc độ tải danh sách chat theo người dùng.
- Quan hệ: `user` (N - 1 với `User`), `messages` (1 - N với `Message`, cascade delete).

### `Message`
Lưu trữ các tin nhắn trong phiên chat:
- `id` (UUID, Primary Key): Định danh duy nhất của tin nhắn.
- `sessionId` (UUID, Foreign Key ➔ `ChatSession.id`): Thuộc phiên chat nào.
- `role` (Enum `SenderRole`: `user`, `ai`, `system`): Vai trò người gửi.
- `content` (String): Nội dung tin nhắn (hỗ trợ Markdown).
- `createdAt`: Thời gian gửi tin nhắn.
- **Index**: `@@index([sessionId])` — Tối ưu hóa truy vấn lịch sử tin nhắn của đoạn chat.
- Quan hệ: `session` (N - 1 với `ChatSession`), `attachments` (1 - N với `Attachment`, cascade delete).

### `Attachment`
Lưu trữ metadata tệp đính kèm liên kết với tin nhắn:
- `id` (UUID, Primary Key): Định danh duy nhất của tệp đính kèm.
- `messageId` (UUID, Foreign Key ➔ `Message.id`): Liên kết tới tin nhắn chứa file.
- `fileName` (VarChar 255): Tên tệp gốc do người dùng tải lên.
- `fileUrl` (VarChar 2048): Đường dẫn truy cập công khai an toàn (Cloudinary URL).
- `fileType` (VarChar 100): MIME type của file (`application/pdf`, `image/png`, ...).
- `sizeBytes` (BigInt): Dung lượng file tính bằng byte (được chuẩn hóa sang String/Number khi trả về JSON).
- `extractedText` (Text, Nullable): Nội dung văn bản trích xuất từ tệp PDF/TXT để đưa vào ngữ cảnh AI.
- `cloudinaryPublicId` (VarChar 255, Nullable): Định danh tệp trên Cloudinary, dùng cho quy trình dọn dẹp rác khi xóa tin nhắn/phiên chat.
- `createdAt`: Thời gian tạo.
- **Index**: `@@index([messageId])` — Tối ưu truy vấn attachment theo tin nhắn.

### `Document` & `DocumentChunk` (RAG Module Thử nghiệm)
- `Document`: Lưu thông tin tài liệu nguồn đưa vào kho tri thức RAG.
- `DocumentChunk`: Lưu từng đoạn văn bản đã được cắt nhỏ kèm vector embedding `Unsupported("vector")?` kích thước 768 chiều.

---

## 3. Quy trình Migration An toàn

### Trong môi trường Phát triển (Development)
Khi thay đổi `schema.prisma`:
```bash
cd backend
# Tạo và áp dụng migration mới
npx prisma migrate dev --name <ten_thay_doi>

# Sinh lại Prisma Client
npx prisma generate
```

### Trong môi trường Triển khai Production (Production Deployment)
1. **Lệnh build production**:
   ```bash
   prisma generate && tsc
   ```
2. **Nguyên tắc an toàn Production Database**:
   - **TUYỆT ĐỐI KHÔNG** chạy các lệnh phá hủy như:
     - `npx prisma migrate reset` (sẽ xóa sạch toàn bộ bảng và dữ liệu!)
     - `npx prisma db push --force-reset`
   - Chỉ áp dụng migration đã qua kiểm thử thông qua lệnh:
     ```bash
     npx prisma migrate deploy
     ```
   - Lệnh `npm run build` trên Render chỉ thực hiện `prisma generate && tsc`, không tự ý can thiệp vào schema hay dữ liệu của production.
