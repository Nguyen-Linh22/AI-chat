# AI Chat Clone

Ứng dụng trò chuyện trí tuệ nhân tạo (Full-Stack AI Chatbot Application) hiện đại, bảo mật cao, hỗ trợ sinh phản hồi thời gian thực qua Server-Sent Events (SSE), đính kèm tệp đa định dạng và lưu trữ đám mây.

---

## Tính Năng Nổi Bật

- **Xác thực Bảo mật Cao**: Đăng ký, đăng nhập và quản lý phiên làm việc thông qua JWT lưu trong **HttpOnly Cookie** (`SameSite=None; Secure`), băm mật khẩu với bcrypt và hỗ trợ thu hồi token (`tokenVersion`).
- **Quản lý Phiên Hội Thoại (Chat Sessions)**: Tạo mới, đổi tên trực tiếp, xóa phiên chat, phân trang lịch sử tin nhắn và phòng chống truy cập trái phép (IDOR Protection).
- **Phản Hồi Thời Gian Thực (SSE Streaming)**: Truyền phát phản hồi từ mô hình AI theo từng từ (chunk) với hiệu ứng đánh máy mượt mà và khả năng hủy luồng tức thì (Abort Generation).
- **Đính Kèm Tệp Đa Định Dạng**: Hỗ trợ tải lên tệp PDF, TXT, PNG, JPEG với bộ lọc an toàn 3 lớp (Extension, MIME type, Magic Bytes signature), tối đa 10 MB và tự động lưu trữ trên Cloudinary.
- **Kiến Trúc AI Đa Nhà Cung Cấp**: Tích hợp chính thức với **Google Gemini** (`gemini-3.6-flash`) trên Production, đồng thời hỗ trợ Ollama, OpenAI và Groq trong môi trường phát triển.
- **Bảo Vệ Hạ Tầng Toàn Diện**: Tích hợp Helmet Security Headers, CORS Whitelist, CSRF Origin Protection tại tầng ứng dụng, Rate Limiting phân tầng và giới hạn tối đa 1 luồng xử lý AI đồng thời cho mỗi người dùng.
- **Thử Nghiệm RAG Ngữ Nghĩa (Retrieval-Augmented Generation)**: Hỗ trợ nhúng vector với `gemini-embedding-2` và tìm kiếm ngữ nghĩa cosine distance trên PostgreSQL với extension `pgvector`.

---

## Công Nghệ Sử Dụng (Tech Stack)

### Frontend
- **Framework**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Routing**: React Router DOM v7 (kèm Vercel SPA rewrites)
- **Markdown & Code Highlighting**: React Markdown, React Syntax Highlighter

### Backend
- **Runtime & Framework**: Node.js 22 LTS, Express 5, TypeScript
- **ORM & Data Layer**: Prisma 7 ORM (`@prisma/adapter-pg`)
- **Security & Utilities**: Helmet, Cookie Parser, Cors, Bcrypt, JsonWebToken, Express Rate Limit, Multer

### Cơ Sở Dữ Liệu & Hạ Tầng
- **Database**: PostgreSQL 16+ trên nền tảng Serverless **Neon** (kích hoạt `pgvector`)
- **Media Storage**: **Cloudinary** (quản lý asset và dọn dẹp rác tự động)
- **Hosting Frontend**: **Vercel**
- **Hosting Backend**: **Render**
- **CI/CD**: **GitHub Actions** (`.github/workflows/ci.yml`)

---

## Cấu Trúc Mã Nguồn (Repository Structure)

```text
AI-chat/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow (Backend & Frontend tests + build)
├── backend/
│   ├── prisma/                  # Prisma schema và migrations
│   ├── src/
│   │   ├── ai/                  # AI Provider adapters, Model Registry, AI Config
│   │   ├── config/              # Cấu hình Cookie, CORS, Upload, Cloudinary
│   │   ├── controllers/         # HTTP Controllers điều phối nghiệp vụ
│   │   ├── middlewares/         # Auth, CSRF, Rate-limit, Upload, Error, Logger
│   │   ├── rag/                 # RAG semantic search service (pgvector)
│   │   ├── routes/              # Express API Routes
│   │   ├── services/            # Business Logic Services
│   │   ├── utils/               # Tiện ích file, AI audit metrics
│   │   └── validators/          # Validation schemas, File signature validation
│   └── tests/                   # Bộ unit và integration test của backend
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI Components
│   │   ├── hooks/               # Custom React hooks (Typewriter queue, ...)
│   │   ├── pages/               # Login, Register, Chat Pages
│   │   ├── services/            # API Client, Stream Service
│   │   └── stores/              # Zustand Stores (Auth, Chat, Message, AI)
│   └── vercel.json              # Cấu hình SPA routing rewrite trên Vercel
├── docs/                        # Toàn bộ tài liệu kỹ thuật chi tiết của dự án
└── README.md                    # Tài liệu tổng quan dự án
```

---

## Thông Tin Production (Production Status)

- **Trạng thái**: Đã triển khai và kiểm thử hoàn tất (Deployed & Fully Verified)
- **Frontend URL**: [https://ai-chat-plum-gamma.vercel.app](https://ai-chat-plum-gamma.vercel.app)
- **Backend API URL**: [https://ai-chat-ua68.onrender.com](https://ai-chat-ua68.onrender.com)
- **Health Check**: [https://ai-chat-ua68.onrender.com/api/health](https://ai-chat-ua68.onrender.com/api/health)
- **Production AI Provider**: Google Gemini
- **Production AI Model**: `gemini-3.6-flash`
- **Release Baseline Commit**: `119097c710862b4573885e9e36b26ea7d633c818`

---

## Khởi Chạy Nhanh (Quick Start)

### 1. Cài đặt Backend
```bash
cd backend
npm install
cp .env.example .env
# Chỉnh sửa thông tin kết nối DATABASE_URL, JWT_SECRET, GEMINI_API_KEY trong .env
npx prisma generate
npm run dev
```

### 2. Cài đặt Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# Đảm bảo VITE_API_URL=http://localhost:3000 trong frontend/.env
npm run dev
```

Truy cập giao diện tại `http://localhost:5173`.

### 3. Chạy Kiểm Thử Tự Động
```bash
# Kiểm thử Backend Unit Tests
cd backend && npm test

# Kiểm thử Frontend Unit Tests
cd ../frontend && npm test
```

---

## Danh Mục Tài Liệu Kỹ Thuật (Documentation Index)

Chi tiết về từng phần của hệ thống được lưu trữ trong thư mục [`docs/`](./docs/README.md):

- [**Kiến trúc Hệ thống (Architecture)**](./docs/architecture.md)
- [**Hướng dẫn Phát triển Cục bộ (Local Development)**](./docs/local-development.md)
- [**Bảng Biến Môi trường (Environment Variables)**](./docs/environment-variables.md)
- [**Cơ sở Dữ liệu & Prisma (Database)**](./docs/database.md)
- [**Tích hợp AI & Streaming (AI & SSE)**](./docs/ai.md)
- [**Quản lý Tệp Đính kèm (File Upload & Cloudinary)**](./docs/file-upload.md)
- [**Xác thực & Bảo mật (Authentication & Security)**](./docs/authentication-security.md)
- [**Kiểm thử Phần mềm (Testing)**](./docs/testing.md)
- [**Hướng dẫn Triển khai Production (Deployment)**](./docs/deployment.md)
- [**Quy trình CI/CD (CI/CD Pipeline)**](./docs/ci-cd.md)
- [**Giám sát & Vận hành (Monitoring & Operations)**](./docs/monitoring.md)
- [**Sổ tay Xử lý Sự cố (Troubleshooting)**](./docs/troubleshooting.md)
- [**Quy trình Phát hành & Rollback (Release & Rollback)**](./docs/release.md)
- [**Các Giới hạn Đã biết (Known Limitations)**](./docs/known-limitations.md)
