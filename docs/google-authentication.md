# Hướng Dẫn Cấu Hình & Tích Hợp Google Authentication

Tài liệu này cung cấp hướng dẫn đầy đủ về cách thiết lập, cấu hình biến môi trường và vận hành tính năng đăng nhập/đăng ký bằng Google (Google Identity Services - GIS) cho ứng dụng **AI Chat Clone** trên môi trường Local, Vercel và Render.

---

## 1. Kiến Trúc & Luồng Hoạt Động (Architecture Flow)

Hệ thống sử dụng cơ chế **Google Identity Services (GIS) ID Token**:

```text
[Trình duyệt / Frontend]                     [Google OAuth Server]              [Backend Server (Express)]
          |                                            |                                    |
          |--- Người dùng bấm nút Google ------------->|                                    |
          |<-- Trả về GIS Credential (ID Token JWT) ---|                                    |
          |                                                                                 |
          |--- POST /api/auth/google (Body: { credential }, credentials: 'include') ------->|
          |                                                                                 | (verifyIdToken)
          |                                                                                 | Xác thực chữ ký, iss,
          |                                                                                 | exp, aud == GOOGLE_CLIENT_ID,
          |                                                                                 | email_verified, sub
          |                                                                                 |
          |                                                                                 | Tìm hoặc tạo User:
          |                                                                                 | - Idempotent theo googleId
          |                                                                                 | - Chặn silent-linking (409)
          |                                                                                 |
          |<-- 200/201 (Set-Cookie: token; HttpOnly; SameSite; Secure) ---------------------|
          |                                                                                 |
          |--- GET /api/auth/me (Cookie: token) ------------------------------------------->|
          |<-- 200 Profile & khởi tạo phiên chat -------------------------------------------|
```

### Điểm nổi bật về bảo mật:
- **Xác thực token phía máy chủ**: Backend xác thực toàn bộ chữ ký mật mã, thời hạn và audience bằng thư viện chính thức `google-auth-library`. Tuyệt đối không tin cậy claims từ client gửi lên.
- **Không Silent Linking**: Nếu người dùng đã có tài khoản mật khẩu cùng email nhưng chưa từng liên kết Google, backend trả về `409 Conflict` kèm thông báo bảo mật rõ ràng yêu cầu đăng nhập bằng mật khẩu hiện tại (tính năng liên kết tài khoản hiện chưa khả dụng), từ chối tự động ghi đè hoặc gộp tài khoản.
- **Tài khoản Google-only an toàn**: Cột `passwordHash` được đặt `null` cho tài khoản tạo bằng Google (không dùng mật khẩu mặc định/đoán trước được). Endpoint đăng nhập mật khẩu thông thường áp dụng bcrypt so sánh giả (`dummy hash`) để ngăn chặn tấn công timing side-channel.
- **Bảo toàn cơ chế Cookie HttpOnly**: Sau khi xác thực thành công, backend cấp cookie session `token` với các cờ `HttpOnly`, `Secure`, `SameSite` đồng nhất với luồng đăng nhập truyền thống, đi qua đầy đủ kiểm tra CORS và CSRF.

---

## 2. Thiết Lập Trên Google Cloud Console

Để kích hoạt đăng nhập Google, quản trị viên cần khởi tạo OAuth 2.0 Web Client ID:

### Bước 2.1: Tạo hoặc chọn Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn hoặc tạo một Project mới (ví dụ: `ai-chat-clone`).

### Bước 2.2: Cấu hình Màn hình đồng ý OAuth (OAuth Consent Screen)
1. Điều hướng đến **APIs & Services** > **OAuth consent screen**.
2. **User Type**: Chọn **External** > Bấm **Create**.
3. Điền thông tin ứng dụng:
   - **App name**: `AI Chat Clone`
   - **User support email**: Email quản trị viên.
   - **Developer contact information**: Email quản trị viên.
4. **Scopes**: Nhấn **Save and Continue** (các scopes mặc định `email`, `profile`, `openid` là đủ).
5. **Test users** (Quan trọng khi app ở chế độ *Testing*):
   - Thêm các địa chỉ Gmail sẽ dùng để kiểm thử (ví dụ email cá nhân của lập trình viên / QA).
   - *Lưu ý*: Chỉ các tài khoản nằm trong danh sách Test Users mới có thể đăng nhập khi ứng dụng chưa publish công khai ra Production.
6. Bấm **Save and Continue** để hoàn tất.

### Bước 2.3: Tạo Web Application OAuth Client ID
1. Điều hướng đến **APIs & Services** > **Credentials**.
2. Bấm **+ CREATE CREDENTIALS** > Chọn **OAuth client ID**.
3. **Application type**: Chọn **Web application**.
4. **Name**: `AI Chat Web Client`.
5. **Authorized JavaScript origins** (Bắt buộc cấu hình chính xác, không có dấu gạch chéo cuối `/`):
   - **Môi trường Local**:
     - `http://localhost:5173`
   - **Môi trường Production**:
     - `https://ai-chat-plum-gamma.vercel.app`
6. **Authorized redirect URIs**:
   - Google Identity Services (One Tap / Sign In button with credential callback) không yêu cầu redirect URI. Có thể để trống.
7. Bấm **CREATE**.
8. Google sẽ hiển thị popup chứa **Your Client ID** (có dạng `xxxxxxx-xxxxxxxx.apps.googleusercontent.com`). Lưu lại giá trị này (không cần Client Secret cho luồng GIS client-side token verification).

---

## 3. Cấu Hình Biến Môi Trường (Environment Variables)

### 3.1. Frontend (`frontend/.env` hoặc Vercel Dashboard)
Khai báo Client ID để thư viện Google Identity Services trên trình duyệt tải và hiển thị prompt đăng nhập:

```env
VITE_GOOGLE_CLIENT_ID=xxxxxxx-xxxxxxxx.apps.googleusercontent.com
```

- **Local**: Thêm vào tệp `frontend/.env`.
- **Production (Vercel)**:
  1. Truy cập Vercel Dashboard > Chọn dự án `ai-chat` > **Settings** > **Environment Variables**.
  2. Thêm biến `VITE_GOOGLE_CLIENT_ID` với giá trị Client ID ở trên.
  3. Chọn các môi trường áp dụng: **Production**, **Preview**, **Development**.
  4. Redeploy lại dự án để Vite build nhúng biến môi trường mới vào bundle.

### 3.2. Backend (`backend/.env` hoặc Render Dashboard)
Khai báo Client ID để máy chủ Node.js xác thực trường `aud` (Audience) của ID token:

```env
GOOGLE_CLIENT_ID=xxxxxxx-xxxxxxxx.apps.googleusercontent.com
```

- **Local**: Thêm vào tệp `backend/.env`.
- **Production (Render)**:
  1. Truy cập Render Dashboard > Chọn Web Service `backend` (`ai-chat-ua68`).
  2. Vào mục **Environment** > Thêm biến môi trường mới:
     - Key: `GOOGLE_CLIENT_ID`
     - Value: `xxxxxxx-xxxxxxxx.apps.googleusercontent.com`
  3. Lưu thay đổi (Render sẽ tự động redeploy dịch vụ).

---

## 4. Áp Dụng Migration Cơ Sở Dữ Liệu (Production Release)

Tệp migration định nghĩa sẵn thay đổi schema để hỗ trợ tài khoản Google:
- Đường dẫn: `backend/prisma/migrations/20261029170000_add_google_auth_support/migration.sql`
- Nội dung thay đổi:
  - Cho phép `passwordHash` nhận giá trị `NULL`.
  - Bổ sung cột `googleId TEXT NULL UNIQUE`.

Khi tiến hành triển khai lên Production (Render / Neon DB):
```bash
# Thực thi tại thư mục backend hoặc thông qua Render build/release command:
npx prisma migrate deploy
```
*Lưu ý: Migration này hoàn toàn an toàn (additive), giữ nguyên vẹn toàn bộ dữ liệu người dùng và các quan hệ khóa ngoại hiện có.*

---

## 5. Quy Trình Kiểm Thử Thủ Công (Manual Verification Checklist)

### 5.1. Kiểm thử trên máy cục bộ (Local Development)
1. Đảm bảo đã điền `GOOGLE_CLIENT_ID` trong `backend/.env` và `VITE_GOOGLE_CLIENT_ID` trong `frontend/.env`.
2. Khởi chạy Backend (`npm --prefix backend run dev`) và Frontend (`npm --prefix frontend run dev`).
3. Mở trình duyệt tại `http://localhost:5173/login`:
   - Kiểm tra nút "Google" hiển thị đúng giao diện.
   - Bấm vào nút "Google" -> Cửa sổ Google One Tap hoặc popup tài khoản Google xuất hiện.
   - Chọn tài khoản Google (thuộc danh sách Test Users).
   - Kiểm tra đăng nhập thành công: URL chuyển hướng sang `/chat`, cookie `token` được ghi vào trình duyệt.
   - F5 tải lại trang `/chat`: phiên người dùng vẫn được duy trì (`GET /api/auth/me`).
4. Kiểm thử luồng Đăng ký (`http://localhost:5173/register`):
   - Bấm nút "Google", đăng ký tài khoản thành công và chuyển hướng vào `/chat`.
5. Kiểm thử xung đột tài khoản (Account Conflict / Security):
   - Đăng ký một tài khoản bằng Email & Mật khẩu (ví dụ: `myemail@gmail.com`).
   - Thử đăng nhập bằng Google với tài khoản có cùng email đó (`myemail@gmail.com`).
   - Kết quả mong muốn: Giao diện hiển thị thông báo lỗi rõ ràng (`Email này đã được đăng ký bằng mật khẩu...`), không tự động ghi đè mật khẩu hoặc liên kết ngầm.

### 5.2. Kiểm thử trên Production (Vercel & Render)
1. Kiểm tra biến môi trường đã được lưu trên Vercel (`VITE_GOOGLE_CLIENT_ID`) và Render (`GOOGLE_CLIENT_ID`).
2. Chạy `npx prisma migrate deploy` trên database Neon để áp dụng schema mới.
3. Truy cập `https://ai-chat-plum-gamma.vercel.app/login` và thực hiện đăng nhập bằng Google.
4. Kiểm tra cookie cross-site (`SameSite=None`, `Secure=true`) gửi từ `ai-chat-plum-gamma.vercel.app` sang `ai-chat-ua68.onrender.com` thành công.
