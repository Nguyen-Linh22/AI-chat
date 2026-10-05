# Giám Sát & Vận Hành (Monitoring & Operations)

Tài liệu này mô tả các công cụ giám sát sức khỏe hệ thống, quy chuẩn ghi nhận nhật ký (logging) bảo vệ quyền riêng tư, số liệu thống kê vận hành và các lưu ý đặc thù về hạ tầng.

---

## 1. Endpoint Kiểm Tra Sức Khỏe (`/api/health`)

- **Địa chỉ**: `GET https://ai-chat-ua68.onrender.com/api/health`
- **Mục đích**: Được sử dụng bởi Render Uptime Health Check, uptime bot và các quy trình smoke test tự động để xác nhận tính sẵn sàng của backend.
- **Cơ chế hoạt động**:
  - Thực hiện một truy vấn kiểm tra kết nối cơ sở dữ liệu (`prisma.$queryRaw\`SELECT 1\``).
  - Nếu kết nối database thông suốt: Trả về HTTP `200 OK` kèm `{"status":"ok","message":"Backend is healthy"}`.
  - Nếu kết nối database gặp sự cố: Trả về HTTP `503 Service Unavailable` kèm `{"status":"error","message":"Database connection failed"}` mà tuyệt đối **không tiết lộ thông tin chuỗi kết nối hay lỗi driver**.

---

## 2. Tiêu Chuẩn Ghi Nhật Ký (Production Logging Standards)

Nhằm tuân thủ các quy định về bảo vệ dữ liệu người dùng và ngăn ngừa rò rỉ bí mật trong nhật ký console:

### Những thông tin TUYỆT ĐỐI KHÔNG ghi vào log:
1. **Nội dung cuộc trò chuyện**: Không ghi prompt người dùng, nội dung tin nhắn, hay câu trả lời do AI sinh ra.
2. **Khóa bí mật**: Không bao giờ in `JWT_SECRET`, `GEMINI_API_KEY`, `DATABASE_URL` hay token phiên làm việc.
3. **Mật khẩu người dùng**: Tuyệt đối không log body của request `/api/auth/register` hay `/api/auth/login`.

### Những sự kiện ĐƯỢC PHÉP ghi vào log:
- **Yêu cầu AI bắt đầu**: `AI request started: userId=... chatId=... provider=gemini model=gemini-3.6-flash`.
- **Yêu cầu AI hoàn tất**: `AI request completed: userId=... chatId=... provider=gemini model=gemini-3.6-flash durationMs=1240`.
- **Yêu cầu AI timeout**: `AI request timeout: provider=gemini model=gemini-3.6-flash durationMs=120000`.
- **Yêu cầu AI thất bại**: `AI request failed: provider=gemini model=gemini-3.6-flash errorName=... durationMs=...`.
- **Vượt quá Rate Limit**: `Rate limit exceeded: route=/api/chats/... userId=... ip=...`.
- **Vi phạm CSRF**: `CSRF blocked: method=POST path=/api/chats origin=...`.

---

## 3. Thống Kê Vận Hành Nội Bộ (In-Memory Metrics)

Module `backend/src/utils/ai-audit.util.ts` duy trì một đối tượng metrics trong bộ nhớ tiến trình để phục vụ theo dõi nhanh:

```typescript
export interface AuditMetrics {
  totalAiRequests: number       // Tổng số yêu cầu AI được khởi tạo
  completedAiRequests: number   // Số yêu cầu AI hoàn tất thành công
  totalRateLimited: number      // Số yêu cầu bị chặn bởi rate limit
  totalAiTimeouts: number       // Số yêu cầu AI bị timeout (120s)
  totalAiErrors: number         // Số yêu cầu AI gặp lỗi từ provider
}
```

> **Đặc tính kỹ thuật cần lưu ý:**
> Bộ số liệu này được lưu trực tiếp trong RAM của Node.js process. Do đó, các giá trị này sẽ tự động reset về `0` mỗi khi server Render khởi động lại hoặc redeploy.

---

## 4. Quản Lý Nhật Ký Triển Khai (Platform Logs)

- **Render Dashboard Logs**: Cho phép theo dõi realtime output console của backend, theo dõi các cảnh báo CSRF blocked hoặc RateLimit.
- **Vercel Analytics & Logs**: Theo dõi tình trạng phân phối tài nguyên tĩnh (JS/CSS assets) và các truy vấn tới frontend.

---

## 5. Các Đặc Thù Hạ Tầng Cần Biết

1. **Gói Render Free Tier**:
   - Nếu không có truy cập trong 15 phút, tiến trình backend có thể rơi vào trạng thái "ngủ đông" (spin-down).
   - Lượt truy cập đầu tiên sau khi ngủ đông có thể mất khoảng 30 - 50 giây để khởi động lại máy chủ (Cold Start).
2. **Ẩn Metadata Commit của Provider**:
   - Nền tảng Render không công khai mã commit Git trong response header (chỉ hiển thị `x-render-origin-server: Render`). Việc xác minh tính nhất quán của code được đảm bảo thông qua kiểm thử hành vi thực tế (Behavioral Verification).
