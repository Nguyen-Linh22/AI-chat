# Các Giới Hạn Đã Biết (Known Limitations)

Tài liệu này ghi nhận trung thực các giới hạn kỹ thuật và đặc thù môi trường hiện tại của dự án **AI Chat Clone** được phát hiện và đúc kết qua các đợt kiểm thử thực tế tại Phase 16.

---

## 1. Kiểm Thử Trực Tiếp Trên Production (Testing Scope Limitations)

- **Chưa có Tài khoản Kiểm thử Riêng biệt trên Production**:
  - Nhằm bảo vệ tính toàn vẹn của cơ sở dữ liệu production và tuân thủ nguyên tắc không tạo rác dữ liệu, các vòng kiểm thử Phase 16 chỉ thực hiện kiểm tra ranh giới bảo mật không xác thực (unauthenticated security boundary) và kiểm tra tích hợp công khai.
  - Các tác vụ như tạo đoạn chat thật, upload file thật vào Cloudinary, hoặc gọi Gemini sinh văn bản trực tiếp trên tài khoản đăng nhập production chưa được chạy tự động end-to-end trên môi trường live mà được bảo đảm qua 288 bài unit test cục bộ.
- **Kiểm tra Tích hợp Cơ sở Dữ liệu Cục bộ**:
  - Các bài kiểm thử tích hợp ghi dữ liệu (`tests/integration/*`) được thiết kế cho database kiểm thử riêng biệt (`.env.e2e`) và không chạy trực tiếp vào connection string của production.

---

## 2. Đặc Thù Nền Tảng Triển Khai (Infrastructure Limitations)

- **Render Public Metadata**:
  - Nền tảng Render không cung cấp mã hash commit Git trong các header phản hồi HTTP công khai (chỉ hiển thị `x-render-origin-server: Render` và `rndr-id`). Việc xác thực phiên bản chạy trên Render được thực hiện gián tiếp thông qua kiểm thử hành vi thực tế của API.
- **Render Free Tier Spin-Down**:
  - Do chạy trên gói miễn phí của Render, máy chủ backend có thể rơi vào trạng thái ngủ đông sau 15 phút không có hoạt động mạng. Lần gửi yêu cầu đầu tiên có thể gặp độ trễ khoảng 30 - 50 giây (Cold Start).
- **Trình duyệt Tự động (Playwright Browser Automation)**:
  - Công cụ trình duyệt tự động (Playwright subagent) trên một số môi trường agentic sandbox có thể gặp hạn chế do lỗi tải driver từ CDN công khai của Azure. Các bài kiểm tra frontend đã được xác minh toàn diện thông qua HTTP probe và bộ test React Testing Library.

---

## 3. Kiến Trúc Ứng Dụng (Application Architecture Limitations)

- **Số liệu Thống kê Lưu trong Bộ nhớ (In-Memory Audit Metrics)**:
  - Đối tượng thống kê `AuditMetrics` (`totalAiRequests`, `completedAiRequests`, `totalRateLimited`, ...) được lưu trữ trong RAM của tiến trình Node.js backend. Khi server Render khởi động lại hoặc redeploy, các số liệu này sẽ bắt đầu lại từ `0`. Để lưu trữ lâu dài, hệ thống có thể nâng cấp thêm bảng database chuyên dụng trong các phiên bản sau.
- **Module RAG (Retrieval-Augmented Generation)**:
  - Tính năng RAG hiện đang ở trạng thái MVP thử nghiệm, sử dụng model `gemini-embedding-2` kết hợp extension `pgvector` trên PostgreSQL. Hiện chưa tích hợp giao diện quản lý tài liệu nâng cao cho người dùng cuối trên frontend.
- **Số lượng Luồng AI Đồng thời Mỗi Người dùng**:
  - Hệ thống áp dụng giới hạn cứng: Mỗi người dùng chỉ được xử lý tối đa 1 luồng sinh phản hồi AI tại một thời điểm (`MAX_CONCURRENT_AI_REQUESTS = 1`) để bảo vệ tài nguyên máy chủ.
