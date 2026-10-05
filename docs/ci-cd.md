# Quy Trình CI/CD (Continuous Integration & Delivery)

Tài liệu này mô tả chi tiết quy trình tự động hóa kiểm thử và kiểm tra chất lượng mã nguồn thông qua **GitHub Actions**, các quy tắc bảo vệ nhánh và cơ chế kích hoạt triển khai tự động.

---

## 1. Sơ Đồ Quy Trình Tự Động Hóa

```text
[Nhà phát triển / PR]
       |
       | Push mã nguồn hoặc Tạo Pull Request tới nhánh 'master'
       v
+-----------------------------------------------------------------------------------+
|                           GITHUB ACTIONS CI WORKFLOW                              |
|                          (.github/workflows/ci.yml)                               |
+-----------------------------------------------------------------------------------+
                   |                                       |
                   v                                       v
     +---------------------------+           +---------------------------+
     |   Job: backend-ci         |           |   Job: frontend-ci        |
     | - Setup Node.js 22        |           | - Setup Node.js 22        |
     | - npm ci                  |           | - npm ci                  |
     | - npx prisma generate     |           | - npm run lint (oxlint)   |
     | - npx vitest run          |           | - npm test (vitest jsdom) |
     |   tests/unit (117 tests)  |           |   (171 tests)             |
     | - npm run build (tsc)     |           | - npm run build           |
     |                           |           |   (tsc -b && vite build)  |
     +---------------------------+           +---------------------------+
                   |                                       |
                   +-------------------+-------------------+
                                       |
                                       v Cả 2 jobs PASS
                             +-------------------+
                             |  MERGE VÀO MASTER |
                             +-------------------+
                                  /         \
                 Webhook Tự động /           \ Webhook Tự động
                                v             v
                         +------------+  +------------+
                         |   VERCEL   |  |   RENDER   |
                         | (Frontend) |  | (Backend)  |
                         +------------+  +------------+
```

---

## 2. Chi Tiết Cấu Hình Workflow (`.github/workflows/ci.yml`)

Workflow được kích hoạt tự động mỗi khi có:
- Lệnh `push` vào nhánh `master`.
- Lệnh tạo hoặc cập nhật `pull_request` nhắm tới nhánh `master`.

### Cơ chế Hủy tác vụ cũ (Concurrency Control):
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
Nếu có commit mới được đẩy lên cùng một PR, các tiến trình test đang chạy của commit trước sẽ được hủy ngay lập tức nhằm tiết kiệm tài nguyên GitHub Actions.

### Job 1: `backend-ci` (Ubuntu Latest, Node.js 22)
1. **Checkout repository**: Lấy mã nguồn mới nhất.
2. **Cài đặt dependencies**: Sử dụng `npm ci` kèm cache `package-lock.json`.
3. **Sinh Prisma Client**: `npx prisma generate` để đảm bảo code TypeScript biên dịch được mà không cần kết nối database thật.
4. **Chạy Unit & Safety Tests**: `npx vitest run tests/unit` (117 test cases kiểm tra rate limit, AI limit, CSRF, validation, cleanup).
5. **Biên dịch Backend**: `npm run build` (`prisma generate && tsc`) xác minh không có lỗi cú pháp hoặc thiếu type.

### Job 2: `frontend-ci` (Ubuntu Latest, Node.js 22)
1. **Checkout & Cài đặt**: `npm ci` kèm cache `frontend/package-lock.json`.
2. **Kiểm tra Linting**: `npm run lint` sử dụng `oxlint` tốc độ cao để bắt lỗi code style và cú pháp.
3. **Chạy Frontend Unit Tests**: `npm test` (`vitest run`) kiểm tra 171 bài test components, stores và services.
4. **Biên dịch Frontend**: `npm run build` (`tsc -b && vite build`) xác nhận việc đóng gói production bundle thành công.

---

## 3. Chính Sách Bảo Vệ Nhánh (Branch Protection Rules)

Để đảm bảo nhánh `master` luôn sẵn sàng cho Production:
- **Bắt buộc CI PASS**: Cả hai job `backend-ci` và `frontend-ci` phải đạt trạng thái `success` thì PR mới được phép merge.
- **Không bypass code**: Không cho phép push trực tiếp các commit không được kiểm thử vào `master`.

---

## 4. Cơ Chế Tự Động Triển Khai (CD Integration)

- **Vercel**: Tự động lắng nghe webhook của GitHub trên nhánh `master`. Khi có commit mới được merge thành công, Vercel tự động build và deploy bản mới nhất chỉ trong vòng 30 - 60 giây.
- **Render**: Tương tự, Render tự động bắt sự kiện commit mới trên `master`, chạy `npm run build` và khởi động lại tiến trình server không gián đoạn (zero-downtime deploy).
