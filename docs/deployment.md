# Hướng Dẫn Triển Khai Production (Production Deployment)

Tài liệu này hướng dẫn chi tiết cách triển khai toàn bộ hệ thống **AI Chat Clone** lên các nền tảng đám mây Vercel, Render và Neon.

---

## 1. Kiến Trúc Triển Khai (Deployment Topology)

```text
GitHub Repo (Nguyen-Linh22/AI-chat)
       |
       +--- [Tự động triển khai khi push nhánh master]
       |
       +---> VERCEL (Frontend Production)
       |     URL: https://ai-chat-plum-gamma.vercel.app
       |     Build: npm run build (tsc -b && vite build)
       |     Output: dist/
       |     SPA Rewrites: vercel.json (/(.*) -> /)
       |
       +---> RENDER (Backend Production)
             URL: https://ai-chat-ua68.onrender.com
             Build: npm run build (prisma generate && tsc)
             Start: npm start (node dist/server.js)
             Root Directory: backend
                  |
                  +---> NEON POSTGRESQL (Serverless Database)
                  +---> GOOGLE GEMINI (AI Text Generation)
                  +---> CLOUDINARY (Media Storage)
```

---

## 2. Triển Khai Frontend Trên Vercel

### Cấu hình Dự án Vercel
1. Kết nối với GitHub repository: `Nguyen-Linh22/AI-chat`.
2. **Root Directory**: `frontend`.
3. **Framework Preset**: `Vite`.
4. **Build Command**: `npm run build` (hoặc `tsc -b && vite build`).
5. **Output Directory**: `dist`.
6. **Environment Variables**:
   - `VITE_API_URL`: `https://ai-chat-ua68.onrender.com`

### Cấu hình SPA Routing (`frontend/vercel.json`)
Để giải quyết triệt để lỗi `404 Not Found` khi người dùng F5 hoặc truy cập trực tiếp các đường dẫn con (`/login`, `/register`, `/c/:chatId`), tệp `frontend/vercel.json` trên nhánh `master` đã được định cấu hình:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

---

## 3. Triển Khai Backend Trên Render

### Cấu hình Web Service Render
1. Tạo một **Web Service** mới và liên kết với repo `Nguyen-Linh22/AI-chat`.
2. **Root Directory**: `backend`.
3. **Environment**: `Node`.
4. **Build Command**:
   ```bash
   npm run build
   ```
   *(Tương đương: `prisma generate && tsc` — tự động tạo Prisma Client và biên dịch TypeScript sang thư mục `dist/`)*.
5. **Start Command**:
   ```bash
   npm start
   ```
   *(Tương đương: `node dist/server.js`)*.
6. **Health Check Path**: `/api/health`.

### Cấu hình Biến môi trường trên Render
Tại mục **Environment Variables** của Render Dashboard, thêm các biến:
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render tự động cung cấp biến `PORT`, backend lắng nghe theo `process.env.PORT || 3000`)
- `TRUST_PROXY`: `true`
- `FRONTEND_URL`: `https://ai-chat-plum-gamma.vercel.app`
- `DATABASE_URL`: `postgresql://<username>:<password>@<neon_hostname>/<dbname>?sslmode=require`
- `JWT_SECRET`: `<chuỗi-ngẫu-nhiên-bảo-mật-tối-thiểu-32-ký-tự>`
- `AI_PROVIDER`: `gemini`
- `GEMINI_MODEL`: `gemini-3.6-flash`
- `GEMINI_API_KEY`: `<khóa-api-gemini>`
- `CLOUDINARY_CLOUD_NAME`: `<tên-cloud-cloudinary>`
- `CLOUDINARY_API_KEY`: `<khóa-api-cloudinary>`
- `CLOUDINARY_API_SECRET`: `<secret-cloudinary>`

---

## 4. Cơ Sở Dữ Liệu Neon (PostgreSQL)

1. Tạo một dự án trên [Neon Console](https://neon.tech).
2. Đảm bảo extension `pgvector` đã được bật sẵn:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Lấy chuỗi kết nối **Pooled Connection String** để tối ưu hóa việc quản lý kết nối từ Render.
4. Đặt chuỗi kết nối vào biến môi trường `DATABASE_URL` trên Render.

---

## 5. Quy Trình Kiểm Tra Sau Triển Khai (Post-Deployment Verification)

Sau khi deploy thành công, thực hiện smoke test nhanh theo các bước:
1. Truy cập `https://ai-chat-ua68.onrender.com/api/health` ➔ Phải trả về HTTP `200` kèm `status: "ok"`.
2. Truy cập `https://ai-chat-ua68.onrender.com/api/ai/models` ➔ Phải trả về HTTP `200` với model duy nhất `gemini-3.6-flash`.
3. Truy cập `https://ai-chat-plum-gamma.vercel.app/` ➔ Trang chủ tải mượt mà không có lỗi console.
4. Truy cập trực tiếp `https://ai-chat-plum-gamma.vercel.app/login` ➔ Hiển thị giao diện đăng nhập (xác nhận Vercel rewrite hoạt động).
