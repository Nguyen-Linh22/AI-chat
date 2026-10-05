# Quy Trình Phát Hành & Rollback (Release & Rollback Guide)

Tài liệu này mô tả danh mục kiểm tra tiêu chuẩn trước khi phát hành phiên bản mới (Release Checklist) và quy trình quay lui (Rollback) an toàn khi phát hiện sự cố nghiêm trọng trên môi trường Production.

---

## 1. Danh Mục Kiểm Tra Phát Hành (Release Checklist)

Trước khi tiến hành phát hành phiên bản chính thức (hoặc tạo Git Tag Release), bắt buộc phải tích chọn và vượt qua toàn bộ các tiêu chí dưới đây:

- [ ] **Trạng thái Git sạch sẽ**: Nhánh `master` không có thay đổi dở dang, không có tệp debug rác hoặc scratch files được commit nhầm.
- [ ] **Commit Baseline đã xác minh**: Khớp với commit release mong muốn (Baseline hiện tại: `119097c710862b4573885e9e36b26ea7d633c818`).
- [ ] **Kiểm thử tự động PASS 100%**:
  - Frontend Test Suite: 171/171 tests pass.
  - Backend Unit & Safety Suite: 117/117 tests pass.
- [ ] **Build Production thành công**:
  - `npm run build` trên `backend` kết thúc với exit code `0`.
  - `npm run build` trên `frontend` kết thúc với exit code `0`.
- [ ] **GitHub Actions CI Hoàn tất**: Workflow `CI` trên GitHub Actions đạt trạng thái `success`.
- [ ] **Kiểm tra Sức khỏe Production**:
  - `GET https://ai-chat-ua68.onrender.com/api/health` trả về `200 OK`.
- [ ] **Kiểm tra Model Registry**:
  - `GET https://ai-chat-ua68.onrender.com/api/ai/models` chỉ xuất hiện `gemini-3.6-flash`.
- [ ] **Kiểm tra Bảo mật & Ranh giới Xác thực**:
  - Toàn bộ protected endpoints trả về `401 Unauthorized` khi không có cookie.
  - Tấn công CSRF và CORS từ domain độc hại bị từ chối với mã `403`.
- [ ] **Kiểm tra Điều hướng Frontend SPA**:
  - Các đường dẫn `/`, `/login`, `/register`, `/c/:id` đều tải mượt mà không gặp lỗi 404.
- [ ] **Kiểm tra Rò rỉ Bí mật (Secret Scan)**: Không có API key, mật khẩu, JWT secret hoặc connection string nào bị nhúng vào tài liệu hay frontend bundle.
- [ ] **Tài liệu Kỹ thuật Đầy đủ**: Bộ tài liệu trong thư mục `docs/` đã được cập nhật đồng bộ với phiên bản phát hành.

---

## 2. Quy Trình Rollback An Toàn Khi Phát Hiện Sự Cố

Trong trường hợp bản phát hành mới gặp lỗi nghiêm trọng (Critical Production Defect) như sập server, rò rỉ bảo mật, hoặc mất kết nối AI:

### Bước 1: Xác định Commit Lỗi
Xác định commit vừa được merge gây ra lỗi và tìm commit an toàn gần nhất đã được kiểm thử thành công (ví dụ: `119097c710862b4573885e9e36b26ea7d633c818`).

### Bước 2: Thực hiện Revert trên Nhánh Bảo Vệ
Không sử dụng lệnh force push (`git push -f`). Thực hiện quy trình revert thông qua Pull Request chuẩn:
```bash
# Tạo nhánh sửa lỗi khẩn cấp
git checkout -b fix/revert-bad-release

# Revert commit gây lỗi
git revert <commit-sha-gay-loi>

# Push nhánh lên GitHub và tạo Pull Request
git push origin fix/revert-bad-release
```

### Bước 3: Xác minh CI và Merge
- Chờ GitHub Actions CI chạy hoàn tất kiểm tra tự động trên PR revert.
- Merge PR vào nhánh `master`.

### Bước 4: Tự Động Triển Khai Lại (Auto Redeploy)
- Vercel và Render sẽ tự động kích hoạt tiến trình build lại từ commit vừa được revert trên `master`.
- Nếu cần xử lý ngay lập tức trong vài giây mà không chờ build Git:
  - Trên **Vercel Dashboard**: Vào mục *Deployments* ➔ Chọn bản deploy ổn định trước đó ➔ Nhấn **Promote to Production** (Instant Rollback).
  - Trên **Render Dashboard**: Vào mục *Events* / *Deploys* ➔ Chọn bản build ổn định trước đó ➔ Nhấn **Rollback to this deploy**.

### Bước 5: Thực Hiện Smoke Test Hồi Quy
Chạy lại quy trình Smoke Test nhanh trên cả Frontend và Backend để xác nhận hệ thống đã khôi phục trạng thái ổn định 100%.
