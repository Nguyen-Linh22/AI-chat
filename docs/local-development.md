# Hướng dẫn Phát triển Cục bộ (Local Development)

Tài liệu này hướng dẫn chi tiết cách thiết lập, cấu hình và khởi chạy ứng dụng **AI Chat Clone** trên môi trường máy tính cục bộ.

---

## 1. Yêu cầu Hệ thống (Prerequisites)

- **Node.js**: Phiên bản 22.x LTS trở lên (khuyến nghị Node 22).
- **npm**: Phiên bản 10.x trở lên.
- **Git**: Đã cài đặt trên máy.
- **Cơ sở dữ liệu PostgreSQL**:
  - Có thể sử dụng PostgreSQL cục bộ (cần kích hoạt extension `pgvector` nếu muốn chạy thử nghiệm RAG).
  - Hoặc sử dụng cơ sở dữ liệu cloud miễn phí như Neon Serverless PostgreSQL.
- **Tài khoản nhà cung cấp AI (Tùy chọn)**:
  - Google Gemini API Key (khuyến nghị cho môi trường dev).
  - Hoặc Ollama cài đặt cục bộ (nếu muốn chạy hoàn toàn offline không cần internet).

---

## 2. Tải mã nguồn (Clone Repository)

```bash
git clone https://github.com/Nguyen-Linh22/AI-chat.git
cd AI-chat
```

---

## 3. Cài đặt Dependencies

Dự án chia thành 2 thư mục độc lập `backend` và `frontend`.

### Cài đặt Backend
```bash
cd backend
npm install
```

### Cài đặt Frontend
```bash
cd ../frontend
npm install
```

---

## 4. Cấu hình Biến môi trường Cục bộ

### Cấu hình Backend (`backend/.env`)
Tạo tệp `backend/.env` bằng cách sao chép từ mẫu:
```bash
cd ../backend
cp .env.example .env
```

Chỉnh sửa nội dung `backend/.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/ai_chat_db?schema=public"
JWT_SECRET=local-development-secret-key-at-least-32-chars
FRONTEND_URL=http://localhost:5173

# Cấu hình AI: Chọn 1 trong các tùy chọn
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=<your-gemini-api-key>

# Hoặc nếu dùng Ollama cục bộ:
# AI_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434

# Cấu hình Cloudinary (Tùy chọn nếu cần test upload file)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

> **Lưu ý**: Tuyệt đối không commit tệp `.env` chứa secret lên Git.

### Cấu hình Frontend (`frontend/.env`)
Tạo tệp `frontend/.env`:
```bash
cd ../frontend
cp .env.example .env
```

Chỉnh sửa nội dung `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

---

## 5. Khởi tạo Cơ sở Dữ liệu & Prisma

Trước khi chạy backend, cần sinh Prisma Client và áp dụng cấu trúc database:

```bash
cd ../backend

# Sinh Prisma Client
npx prisma generate

# Áp dụng migration vào cơ sở dữ liệu development
npx prisma migrate dev
```

---

## 6. Khởi chạy Ứng dụng Cục bộ

Cần mở 2 cửa sổ terminal riêng biệt:

### Terminal 1: Chạy Backend Server
```bash
cd backend
npm run dev
```
Backend sẽ khởi chạy tại: `http://localhost:3000`
Kiểm tra sức khỏe: `http://localhost:3000/api/health`

### Terminal 2: Chạy Frontend Dev Server
```bash
cd frontend
npm run dev
```
Vite sẽ khởi chạy tại: `http://localhost:5173`
Mở trình duyệt truy cập: `http://localhost:5173` để bắt đầu trải nghiệm ứng dụng.

---

## 7. Các lệnh Build & Test hữu ích

### Backend
```bash
cd backend
# Chạy bộ unit test
npm test

# Chạy TypeScript build kiểm tra tính hợp lệ của code
npm run build
```

### Frontend
```bash
cd frontend
# Chạy bộ test giao diện
npm test

# Chạy kiểm tra linting
npm run lint

# Chạy production build
npm run build
```

---

## 8. Các vấn đề thường gặp trong quá trình Dev (Common Gotchas)

1. **Lỗi `Cannot find module '@prisma/client'`**:
   - Khắc phục: Chạy `npx prisma generate` trong thư mục `backend`.
2. **Lỗi kết nối CORS**:
   - Kiểm tra `FRONTEND_URL` trong `backend/.env` phải đúng định dạng `http://localhost:5173` (không có dấu gạch chéo `/` ở cuối).
3. **Cookie không được lưu trên trình duyệt**:
   - Đảm bảo trong `development`, `cookie.config.ts` sử dụng `secure: false` và `sameSite: 'lax'`.
4. **Xung đột cổng (Port conflict)**:
   - Nếu cổng 3000 hoặc 5173 đang bị chiếm dụng, hãy kiểm tra các tiến trình ngầm bằng lệnh `netstat` hoặc đổi cổng trong `.env` và `vite.config.ts`.
