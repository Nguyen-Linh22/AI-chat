# Tích Hợp AI & Streaming (AI & Streaming Architecture)

Tài liệu này mô tả chi tiết kiến trúc điều phối AI, Model Registry, cơ chế SSE Streaming, quản lý tài nguyên đồng thời và hệ thống giám sát AI.

---

## 1. Kiến trúc Nhà cung cấp AI (Provider Architecture)

Mã nguồn hỗ trợ kiến trúc cắm rút đa nhà cung cấp thông qua adapter pattern:
- **Google Gemini**: Nhà cung cấp chính thức trên **Production**.
- **Ollama**: Nhà cung cấp mặc định cho môi trường phát triển cục bộ và kiểm thử offline.
- **OpenAI & Groq**: Được hỗ trợ trong adapter layer khi cấu hình API key tương ứng.

### Cấu hình Môi trường Production
Trong môi trường Production:
- `AI_PROVIDER=gemini`
- `GEMINI_MODEL=gemini-3.6-flash`
- `AI_TIMEOUT_MS=120000` (120 giây)

> **Quy tắc Nghiêm ngặt:**
> Hệ thống **KHÔNG BAO GIỜ** tự ý fallback âm thầm (silent fallback) về mock AI hoặc Ollama khi đang chạy ở chế độ Production. Nếu thiếu cấu hình hoặc Gemini gặp sự cố, hệ thống sẽ trả về lỗi tường minh có mã định danh thay vì trả về kết quả giả.

---

## 2. Model Registry & Chính sách Hiển thị

Mã nguồn tại `backend/src/ai/model.registry.ts` quản lý danh mục mô hình:

```typescript
export const AI_MODELS: AIModel[] = [
  { id: 'ollama-qwen3-1.7b', name: 'Qwen 3 1.7B', provider: 'ollama', model: 'qwen3:1.7b' },
  { id: 'openai-gpt-5-mini', name: 'GPT-5 Mini', provider: 'openai', model: 'gpt-5-mini' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'gemini', model: 'gemini-3.6-flash' },
  { id: 'groq-gpt-oss-20b', name: 'GPT OSS 20B (Groq)', provider: 'groq', model: 'openai/gpt-oss-20b' }
]
```

### Chính sách trong Production (`getVisibleAIModels`):
- Khi `NODE_ENV=production`, endpoint công khai `GET /api/ai/models` chỉ trả về danh sách mô hình thuộc nhà cung cấp đã được phê duyệt và cấu hình (`gemini-3.6-flash`).
- Toàn bộ các mô hình development/local (Ollama, OpenAI, Groq) được ẩn hoàn toàn để bảo vệ giao diện và hạn chế nhầm lẫn cho người dùng cuối.

---

## 3. Cơ chế Streaming SSE (Server-Sent Events)

Endpoint: `POST /api/chats/:id/messages/stream`

### Quy trình Truyền phát:
1. Client gửi request kèm nội dung tin nhắn, `modelId`, và tùy chọn tệp đính kèm.
2. Server phản hồi với header SSE chuẩn:
   ```http
   HTTP/1.1 200 OK
   Content-Type: text/event-stream; charset=utf-8
   Cache-Control: no-cache
   Connection: keep-alive
   X-Accel-Buffering: no
   ```
3. Mỗi khi nhận được token mới từ Gemini SDK:
   ```text
   data: {"type":"chunk","content":"Xin chào! "}

   data: {"type":"chunk","content":"Tôi có thể giúp "}
   ```
4. Khi quá trình sinh hoàn tất:
   ```text
   data: {"type":"done","message":{"id":"...","role":"ai","content":"..."}}
   ```
5. Nếu xảy ra lỗi:
   ```text
   data: {"type":"error","message":"Mô tả lỗi an toàn"}
   ```

### Xử lý Hủy yêu cầu (Client Abort):
- Client sử dụng `AbortController` gắn với `signal`.
- Khi người dùng nhấn nút dừng (Stop Generation) hoặc đóng tab trình duyệt, kết nối HTTP đóng lại.
- Backend lắng nghe sự kiện `res.on('close')`, ngay lập tức hủy luồng xử lý và giải phóng khóa tài nguyên đồng thời.

---

## 4. Quản lý Tài nguyên & Giới hạn Tần suất (Rate Limiting)

Nhằm bảo vệ quota của Gemini API và ngăn chặn quá tải server Render Free:

1. **Giới hạn yêu cầu AI (`aiRateLimiter`)**:
   - Tối đa **15 requests / 1 phút / người dùng**.
   - Nếu vượt quá, trả về `429 Too Many Requests`.
2. **Giới hạn xử lý đồng thời (`concurrentAiLimiter`)**:
   - Mỗi người dùng chỉ được phép có **tối đa 1 luồng sinh phản hồi AI đang hoạt động**.
   - Nếu người dùng mở nhiều tab hoặc gửi tin nhắn liên tiếp khi phản hồi trước chưa hoàn thành, server lập tức từ chối với mã `429` và thông báo:
     > *"Bạn đang có một yêu cầu AI đang xử lý. Vui lòng chờ phản hồi hiện tại hoàn thành trước khi gửi tiếp."*
3. **Timeout bảo vệ (`AI_TIMEOUT_MS`)**:
   - Giới hạn cứng **120 giây** cho một lần sinh phản hồi. Sau 120s, tiến trình tự động bị ngắt để tránh rò rỉ bộ nhớ.

---

## 5. Giám sát & Ghi nhận Log AI (AI Audit Logging)

Module `backend/src/utils/ai-audit.util.ts` quản lý việc ghi log phục vụ vận hành:
- **Quyền riêng tư tuyệt đối**: Tuyệt đối **KHÔNG BAO GIỜ** ghi nội dung prompt, tin nhắn của người dùng hoặc phản hồi của AI vào log console.
- **Dữ liệu được ghi nhận**:
  - `AI request started`: `userId`, `chatId`, `provider`, `model`.
  - `AI request completed`: `userId`, `chatId`, `provider`, `model`, `durationMs`.
  - `AI request timeout`: `provider`, `model`, `durationMs`.
  - `AI request failed`: `provider`, `model`, `errorName`, `durationMs`.
- **Thống kê nội bộ (In-memory Metrics)**: Đếm tổng số request, số lần thành công, số lần timeout, lỗi và số lần bị chặn bởi rate limit.
