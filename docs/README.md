# AI Chat Clone — Documentation Index

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật của dự án **AI Chat Clone**. Bộ tài liệu này cung cấp hướng dẫn đầy đủ từ kiến trúc hệ thống, cài đặt phát triển cục bộ, quản lý biến môi trường, bảo mật, kiểm thử cho đến quy trình triển khai và vận hành trên môi trường Production.

---

## Danh mục tài liệu

| Tài liệu | Mô tả |
| :--- | :--- |
| [**Kiến trúc hệ thống (Architecture)**](./architecture.md) | Sơ đồ kiến trúc tổng thể, luồng dữ liệu (Auth, Chat, SSE Streaming, File Upload), cấu trúc phân tầng Frontend và Backend. |
| [**Phát triển cục bộ (Local Development)**](./local-development.md) | Yêu cầu hệ thống, các bước clone, cài đặt dependencies, cấu hình môi trường phát triển và chạy ứng dụng cục bộ. |
| [**Biến môi trường (Environment Variables)**](./environment-variables.md) | Bảng tra cứu toàn bộ biến môi trường của Backend và Frontend, phân loại biến bắt buộc, mức độ bảo mật và cấu hình Production. |
| [**Cơ sở dữ liệu & Prisma (Database)**](./database.md) | PostgreSQL, Neon, mô hình thực thể (User, ChatSession, Message, Attachment, Document, DocumentChunk), quy trình migration an toàn. |
| [**Tích hợp AI & Streaming (AI & SSE)**](./ai.md) | Kiến trúc đa nhà cung cấp, cấu hình Gemini (`gemini-3.6-flash`), Model Registry, giới hạn đồng thời, timeout và SSE streaming. |
| [**Quản lý tệp đính kèm (File Upload & Cloudinary)**](./file-upload.md) | Cơ chế upload an toàn, bộ lọc 3 lớp (Extension, MIME, Magic Bytes), giới hạn 10 MB, lưu trữ Cloudinary và cơ chế dọn dẹp rác. |
| [**Xác thực & Bảo mật (Authentication & Security)**](./authentication-security.md) | JWT HttpOnly Cookie, bcrypt, CORS, CSRF Origin Protection, Helmet headers, Rate Limiting và phòng chống rò rỉ dữ liệu. |
| [**Kiểm thử phần mềm (Testing)**](./testing.md) | Bộ kiểm thử tự động của Frontend và Backend, kết quả kiểm thử Phase 16.13 (288 tests pass), nguyên tắc an toàn dữ liệu. |
| [**Triển khai Production (Deployment)**](./deployment.md) | Hướng dẫn triển khai Frontend lên Vercel, Backend lên Render, kết nối Neon và Cloudinary, SPA routing rules. |
| [**Quy trình CI/CD (CI/CD Pipeline)**](./ci-cd.md) | Cấu hình GitHub Actions (`.github/workflows/ci.yml`), các luồng kiểm tra tự động và quy tắc merge vào `master`. |
| [**Giám sát & Vận hành (Monitoring & Operations)**](./monitoring.md) | Endpoint kiểm tra sức khỏe `/api/health`, hệ thống audit log bảo vệ quyền riêng tư, số liệu thống kê in-memory. |
| [**Xử lý sự cố (Troubleshooting)**](./troubleshooting.md) | Sổ tay khắc phục các lỗi thường gặp (CORS, 401 Unauthorized, 403 CSRF, AI timeout, lỗi kết nối DB, upload fail). |
| [**Quy trình Phát hành & Rollback (Release & Rollback)**](./release.md) | Checklist trước phát hành, quy trình rollback an toàn khi phát hiện lỗi trên production. |
| [**Giới hạn đã biết (Known Limitations)**](./known-limitations.md) | Các giới hạn kỹ thuật được ghi nhận trong quá trình kiểm thử và kế hoạch mở rộng trong tương lai. |

---

## Thông tin Production hiện tại

- **Frontend URL**: `https://ai-chat-plum-gamma.vercel.app`
- **Backend URL**: `https://ai-chat-ua68.onrender.com`
- **Production AI Provider**: Google Gemini
- **Production AI Model**: `gemini-3.6-flash`
- **Release Baseline Commit**: `119097c710862b4573885e9e36b26ea7d633c818`
