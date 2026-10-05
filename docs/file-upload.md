# Quản Lý Tệp Đính Kèm & Cloudinary (File Upload & Cloudinary)

Tài liệu này mô tả chi tiết quy trình xử lý tệp đính kèm, các lớp kiểm tra tính hợp lệ và an toàn bảo mật, tích hợp lưu trữ đám mây Cloudinary và cơ chế dọn dẹp tài nguyên rác.

---

## 1. Định dạng Tệp được Hỗ trợ

Ứng dụng chỉ chấp nhận các định dạng tệp thông dụng, an toàn phục vụ phân tích tài liệu và hình ảnh:

| Định dạng | Phần mở rộng (Extension) | MIME Type | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **PDF** | `.pdf` | `application/pdf` | Phân tích tài liệu, trích xuất văn bản đưa vào ngữ cảnh AI |
| **Văn bản thuần** | `.txt` | `text/plain` | Phân tích ghi chú, mã nguồn, nội dung văn bản |
| **Hình ảnh PNG** | `.png` | `image/png` | Phân tích hình ảnh, sơ đồ |
| **Hình ảnh JPEG** | `.jpg`, `.jpeg` | `image/jpeg` | Phân tích hình ảnh, ảnh chụp |

---

## 2. Các Lớp Kiểm Tra Tính Hợp Lệ (3-Layer Validation)

Module `backend/src/validators/file.validator.ts` áp dụng bộ lọc 3 lớp nghiêm ngặt trước khi tệp được chấp thuận:

### Lớp 1: Kiểm tra Kích thước & Tên tệp
- **Kích thước tối đa**: **10 MB** (`10 * 1024 * 1024` bytes). Tệp rỗng (0 byte) hoặc vượt quá 10 MB lập tức bị từ chối với mã HTTP `400` hoặc `413`.
- **Tên tệp (Filename sanitization)**: Tối đa 255 ký tự.
- **Phòng chống tấn công Path Traversal**: Chặn triệt để tên file chứa `..`, `/`, `\`, hoặc ký tự null `\0`.

### Lớp 2: Kiểm tra Đồng bộ Extension ↔ MIME Type
- Phần mở rộng phải nằm trong whitelist (`.pdf`, `.txt`, `.png`, `.jpg`, `.jpeg`).
- MIME type phải nằm trong whitelist (`application/pdf`, `text/plain`, `image/png`, `image/jpeg`).
- **Đồng bộ hai chiều**: Extension và MIME type phải khớp nhau (ví dụ: file có đuôi `.png` nhưng khai báo MIME `application/pdf` sẽ bị từ chối ngay lập tức với mã `400`).

### Lớp 3: Kiểm tra Chữ ký Byte (Magic Bytes Signature)
Để phòng chống tấn công đổi đuôi file độc hại (ví dụ file `.exe` đổi tên thành `.png`):
- **PDF**: Bắt buộc 4 byte đầu tiên là `%PDF` (`0x25, 0x50, 0x44, 0x46`).
- **PNG**: Bắt buộc 8 byte đầu là `89 50 4E 47 0D 0A 1A 0A`.
- **JPEG**: Bắt buộc 3 byte đầu là `FF D8 FF`.
- **TXT**:
  - Không được chứa ký tự null `0x00`.
  - Không được bắt đầu bằng chữ ký file thực thi (`MZ` của PE/EXE, `7F ELF` của Linux binary, `PK` của Zip/Docx).

---

## 3. Quy trình Lưu trữ & Tích hợp Cloudinary

1. **Lưu trữ tạm thời**:
   - Khi request đến, Multer lưu tệp vào thư mục `backend/uploads/` với tên ngẫu nhiên duy nhất dựa trên timestamp và số ngẫu nhiên.
2. **Kiểm tra an toàn**:
   - Nếu bất kỳ bước kiểm tra nào thất bại, tệp tạm bị xóa ngay lập tức qua hàm `safeDeleteFile()`.
3. **Upload lên Cloudinary**:
   - Tệp được đẩy lên Cloudinary bằng SDK server-side (`cloudinary.uploader.upload`).
   - Kết quả trả về gồm URL an toàn (`secure_url`) và định danh `public_id`.
4. **Tạo bản ghi Database (`Attachment`)**:
   - Tạo bản ghi trong PostgreSQL liên kết với tin nhắn, lưu `fileUrl`, `fileType`, `sizeBytes`, và `cloudinaryPublicId`.
5. **Dọn dẹp file tạm**:
   - Tệp tạm trong thư mục `backend/uploads/` được xóa ngay sau khi hoàn tất upload Cloudinary.
6. **Cơ chế Rollback**:
   - Nếu xảy ra lỗi khi ghi dữ liệu vào database, backend tự động xóa tệp vừa tải lên khỏi Cloudinary (`cloudinary.uploader.destroy`), tránh tình trạng tích tụ asset rác không chủ trên cloud.

---

## 4. Dọn dẹp Tài nguyên Rác (Orphan Asset Cleanup)

Hệ thống cung cấp cơ chế dọn dẹp hai chiều toàn diện:

### Dọn dẹp Đĩa cục bộ (`cleanupTempUploads`)
- Khi server khởi động, module `backend/src/config/upload.config.ts` tự động quét thư mục `uploads/`.
- Các tệp tạm có thời gian chỉnh sửa cũ hơn 1 giờ (do sự cố sập server giữa chừng để lại) sẽ tự động được dọn dẹp an toàn.

### Dọn dẹp Cloudinary khi Xóa Dữ liệu
- **Khi xóa tin nhắn (`DELETE /api/messages/:id`)**: Hệ thống truy vấn toàn bộ attachment liên kết, gọi Cloudinary API để xóa tài nguyên trên cloud trước khi xóa bản ghi database.
- **Khi xóa toàn bộ phiên chat (`DELETE /api/chats/:id`)**: Hệ thống tìm toàn bộ attachment của tất cả tin nhắn trong phiên chat đó và giải phóng hoàn toàn trên Cloudinary.
- **Chịu lỗi (Fault-tolerant)**: Nếu Cloudinary gặp lỗi mạng (ví dụ HTTP 503), backend ghi log lỗi nhưng vẫn tiến hành xóa bản ghi DB để đảm bảo người dùng không bị kẹt tác vụ.
