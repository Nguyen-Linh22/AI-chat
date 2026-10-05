# Bảng Biến Môi Trường (Environment Variables)

Tài liệu này tổng hợp toàn bộ các biến môi trường được mã nguồn ứng dụng **AI Chat Clone** sử dụng, phân loại theo phạm vi, tính chất bắt buộc và mức độ bảo mật.

---

## 1. Biến môi trường Backend (`backend/.env`)

| Tên biến | Bắt buộc (Dev) | Bắt buộc (Prod) | Mục đích / Ý nghĩa | Mức độ nhạy cảm (Secret) | Giá trị mẫu / Mặc định |
| :--- | :---: | :---: | :--- | :---: | :--- |
| `PORT` | Không | Không | Cổng HTTP server lắng nghe (Render tự động cấp phát) | Không | `3000` |
| `NODE_ENV` | Không | Có | Chế độ môi trường (`development`, `production`, `test`) | Không | `production` |
| `TRUST_PROXY` | Không | Không | Cho phép tin cậy reverse proxy (Load balancer của Render/Cloudflare) | Không | `true` (prod), `false` (dev) |
| `DATABASE_URL` | Có | Có | Chuỗi kết nối PostgreSQL (Neon connection string với pgvector) | **BÍ MẬT CAO** | `postgresql://<user>:<pass>@<host>:5432/<database>?sslmode=require` |
| `JWT_SECRET` | Có | Có | Khóa bí mật dùng để ký và giải mã JWT authentication token | **BÍ MẬT CAO** | Chuỗi ngẫu nhiên tối thiểu 32 ký tự |
| `JWT_EXPIRES_IN`| Không | Không | Thời gian hết hạn của token | Không | `7d` |
| `BCRYPT_SALT_ROUNDS` | Không | Không | Số vòng salt mã hóa mật khẩu người dùng | Không | `10` |
| `FRONTEND_URL` | Không | Có | Tên miền frontend được phép gọi API (CORS & CSRF Origin whitelist) | Không | `https://ai-chat-plum-gamma.vercel.app` |
| `AI_PROVIDER` | Không | Có | Nhà cung cấp AI đang hoạt động (`gemini`, `openai`, `groq`, `ollama`) | Không | `gemini` (prod), `ollama` (dev fallback) |
| `GEMINI_MODEL` | Không | Có* | Model AI cho Gemini (*Bắt buộc khi `AI_PROVIDER=gemini`) | Không | `gemini-3.6-flash` |
| `GEMINI_API_KEY`| Không | Có* | API Key xác thực với Google Gemini (*Bắt buộc khi dùng Gemini) | **BÍ MẬT CAO** | `AIza...` |
| `AI_TIMEOUT_MS` | Không | Không | Thời gian timeout tối đa cho 1 request AI (mặc định: 120s) | Không | `120000` |
| `OPENAI_API_KEY`| Không | Không | API Key của OpenAI (chỉ cần khi `AI_PROVIDER=openai`) | **BÍ MẬT CAO** | `sk-...` |
| `GROQ_API_KEY` | Không | Không | API Key của Groq (chỉ cần khi `AI_PROVIDER=groq`) | **BÍ MẬT CAO** | `gsk_...` |
| `OLLAMA_BASE_URL`| Không | Không | Địa chỉ Ollama server cục bộ (khi `AI_PROVIDER=ollama`) | Không | `http://localhost:11434` |
| `CLOUDINARY_CLOUD_NAME` | Không | Có | Tên định danh cloud trên Cloudinary để lưu ảnh/file | Không | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Không | Có | API Key xác thực dịch vụ Cloudinary | **BÍ MẬT CAO** | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Không | Có | Khóa bí mật API Secret của Cloudinary | **BÍ MẬT CAO** | `your-api-secret` |

---

## 2. Biến môi trường Frontend (`frontend/.env`)

Trong Vite, chỉ các biến bắt đầu bằng tiền tố `VITE_` mới được nhúng vào client bundle.

| Tên biến | Bắt buộc (Dev) | Bắt buộc (Prod) | Mục đích / Ý nghĩa | Mức độ nhạy cảm (Secret) | Giá trị mẫu / Mặc định |
| :--- | :---: | :---: | :--- | :---: | :--- |
| `VITE_API_URL` | Không | Có | URL gốc của Backend API (không có dấu `/` ở cuối) | Không (Public) | `https://ai-chat-ua68.onrender.com` |

> **Cảnh báo bảo mật quan trọng:**
> - Tuyệt đối **KHÔNG ĐƯỢC** đưa bất kỳ khóa bí mật nào (`GEMINI_API_KEY`, `JWT_SECRET`, `CLOUDINARY_API_SECRET`, ...) vào thư mục `frontend/` hay đặt tên với tiền tố `VITE_`.
> - Toàn bộ các tương tác với AI và Cloudinary đều được thực hiện thông qua Backend proxy để đảm bảo bí mật không bao giờ bị lộ ra trình duyệt.

---

## 3. Cấu hình trên các nền tảng Triển khai (PaaS)

### Cấu hình trên Vercel (Frontend Project)
- **Environment Variables**:
  - `VITE_API_URL`: `https://ai-chat-ua68.onrender.com`

### Cấu hình trên Render (Backend Web Service)
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `FRONTEND_URL`: `https://ai-chat-plum-gamma.vercel.app`
  - `DATABASE_URL`: `[Giá trị bí mật từ Neon]`
  - `JWT_SECRET`: `[Giá trị bí mật độ dài tối thiểu 32 ký tự]`
  - `AI_PROVIDER`: `gemini`
  - `GEMINI_MODEL`: `gemini-3.6-flash`
  - `GEMINI_API_KEY`: `[Giá trị bí mật từ Google AI Studio]`
  - `CLOUDINARY_CLOUD_NAME`: `[Tên cloud từ Cloudinary]`
  - `CLOUDINARY_API_KEY`: `[Giá trị bí mật từ Cloudinary]`
  - `CLOUDINARY_API_SECRET`: `[Giá trị bí mật từ Cloudinary]`

*(Giá trị thực tế của các thông tin bí mật được quản trị riêng biệt và tuyệt đối không lưu trong tài liệu này)*.
