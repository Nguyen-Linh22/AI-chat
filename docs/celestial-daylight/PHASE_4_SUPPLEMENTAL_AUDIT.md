# CELESTIAL DAYLIGHT — PHASE 4: SUPPLEMENTAL AUDIT REPORT
**Dự án:** AI Chat Clone  
**Ngày thực hiện:** 07/11/2026  
**Chế độ thực hiện:** EVIDENCE ONLY / READ-ONLY AUDIT  
**Mục tiêu:** Kiểm tra bổ sung độc lập toàn bộ bằng chứng thực nghiệm của Phase 4 trước khi chính thức nghiệm thu và chuyển sang Phase 5.

---

## 1. TỔNG QUAN VÀ ĐÁNH GIÁ ĐỘC LẬP (EXECUTIVE SUMMARY)

Đợt kiểm tra bổ sung này được thực hiện độc lập dựa trên việc đối chiếu trực tiếp giữa mã nguồn, file cấu hình, kịch bản kiểm thử Playwright (`e2e/celestial-sidebar-transition.spec.ts`), dữ liệu đo lường pixel quang học thực tế và trạng thái git repository.

### Tóm tắt phát hiện chính:
1. **Kiến trúc tích hợp cốt lõi hoạt động đúng cam kết:** `ChatBackground.tsx` và `background.css` điều phối chính xác giữa 3 chế độ (Celestial Daylight khi `theme === 'light'`, Starfield khi Dark, Three.js khi Zyricon).
2. **Tiêu chuẩn đo lường Black Flash tại ROI 1 đạt chuẩn tuyệt đối:** Toàn bộ 18 khung hình lấy mẫu rời rạc trong tiến trình đóng/mở thanh bên đều có $\text{BlackoutRatio} = 0.00\%$ và $L_{\text{mean}} \in [0.7393, 0.7442]$ (ngưỡng tối thiểu $\ge 0.4500$). Điểm tối nhất ghi nhận $L_{\text{min}} = 0.6720$, cách xa ngưỡng đen $0.0100$ tới $67.2$ lần.
3. **Phân định rõ ràng các kịch bản Playwright:** Trong 9 kịch bản tích hợp đặt ra trong kế hoạch:
   - **4 kịch bản ĐẠT (PASS):** Đã được kiểm chứng bằng test Playwright chuyên biệt chạy thành công với log chi tiết và ảnh chụp thực tế (Sidebar Collapse, Sidebar Expand, Cycle Zyricon $\to$ Light, Mobile Drawer Open/Close).
   - **2 kịch bản ĐẠT MỘT PHẦN (PARTIALLY VERIFIED):** Được kiểm chứng trong chuỗi liên hoàn (Light $\to$ Dark nằm trong cycle 3 bước; Cold initial load được xác minh tại $t=0$ nhưng chưa có test F5 reload riêng).
   - **3 kịch bản CHƯA XÁC MINH RIÊNG BIỆT (NOT VERIFIED):** Dark $\to$ Light độc lập, Light $\to$ Zyricon trực tiếp, và Rapid/Continuous window resize chưa được viết thành test case độc lập trong `celestial-sidebar-transition.spec.ts`.
4. **Không phát hiện bất kỳ lỗi hồi quy hay phá vỡ hệ thống nào:** Toàn bộ 41 file test unit frontend (632 tests) tiếp tục PASS 100%, bản build Vite/TypeScript sạch 0 lỗi, và cấu hình Playwright mới hoàn toàn độc lập, không gây ảnh hưởng đến luồng E2E mặc định.

---

## 2. BẢNG KẾT QUẢ XÁC MINH 9 KỊCH BẢN PLAYWRIGHT

Lệnh đã thực thi kiểm chứng thực tế:
```powershell
npx playwright test --config=playwright.celestial.config.ts
```
**Kết quả thực tế từ log chạy:** `4 passed (51.8s)`.

Đối chiếu chi tiết từng kịch bản trong 4 test case thực tế:

| # | Kịch bản chuyển đổi | Test name thực tế trong `celestial-sidebar-transition.spec.ts` | Kết quả | Bằng chứng thực nghiệm & Đánh giá chi tiết |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Light $\to$ Dark** | `TC-CELESTIAL-03: Theme Switching Cycle (Light -> Dark -> Zyricon -> Light) preservation` | **PASS (Trong chuỗi)** | Bước 1 của `TC-CELESTIAL-03`: Bấm `#theme-selector-btn` $\to$ `#theme-option-dark`. Assertions: `html` có class `dark`, `celestial-daylight-bg` unmounted, `.chat-stars-layer-1` mounted. Chạy thành công. |
| **2** | **Dark $\to$ Light** | *Không có test chuyển đổi trực tiếp Dark $\to$ Light trong E2E* | **NOT VERIFIED (E2E)** | Trong `TC-CELESTIAL-03`, luồng chạy đi từ Dark $\to$ Zyricon rồi mới từ Zyricon $\to$ Light. Unit test `ChatBackground.zyricon.test.tsx` có kiểm tra chuỗi, nhưng trong Playwright E2E không có bước chuyển trực tiếp từ Dark sang Light. |
| **3** | **Light $\to$ Zyricon** | *Không có test chuyển đổi trực tiếp Light $\to$ Zyricon trong E2E* | **NOT VERIFIED (E2E)** | Trong `TC-CELESTIAL-03`, luồng đi từ Light $\to$ Dark rồi Dark $\to$ Zyricon. Chưa có test kích hoạt trực tiếp từ Light sang Zyricon chỉ với 1 click trong E2E. |
| **4** | **Zyricon $\to$ Light** | `TC-CELESTIAL-03: Theme Switching Cycle (Light -> Dark -> Zyricon -> Light) preservation` | **PASS** | Bước 3 của `TC-CELESTIAL-03`: Bấm `#theme-selector-btn` $\to$ `#theme-option-light`. Assertions: `celestial-daylight-bg` remounted, `.chat-stars-layer-1` biến mất, WebGL container bị gỡ, 0 console errors. Chạy thành công. |
| **5** | **Sidebar expanded $\to$ collapsed** | `TC-CELESTIAL-01: ROI verification and Desktop Sidebar Collapse (Open -> Close) zero black flash` | **PASS** | Bấm `Thu gọn thanh bên` (200ms). Lấy mẫu tại 9 mốc ($t = 30, 60, \dots, 350\text{ms}$). Đo lường $L$ từng pixel tại ROI 1: $100\%$ frames đạt $\text{BlackoutRatio} = 0.00\%$, $L_{\text{mean}} \in [0.7393, 0.7414]$. Lưu 9 ảnh `collapse-frame-*.png`. |
| **6** | **Sidebar collapsed $\to$ expanded** | `TC-CELESTIAL-02: Desktop Sidebar Expand (Close -> Open) zero black flash` | **PASS** | Bấm `Mở rộng thanh bên` (240ms). Lấy mẫu tại 9 mốc ($t = 30, 60, \dots, 350\text{ms}$). Đo lường $L$ từng pixel tại ROI 1: $100\%$ frames đạt $\text{BlackoutRatio} = 0.00\%$, $L_{\text{mean}} \in [0.7430, 0.7442]$. Lưu 9 ảnh `expand-frame-*.png`. |
| **7** | **Rapid / continuous resize** | *Không có test tương ứng trong file spec này* | **NOT VERIFIED** | Trong `celestial-sidebar-transition.spec.ts` chỉ có kiểm tra kích thước tĩnh (1440, 1280, 768, 390, 360px), chưa có test mô phỏng kéo chuột resize liên tục hoặc ngắt quãng giữa chừng như trong test cũ của Zyricon. |
| **8** | **Mobile drawer open / close** | `TC-CELESTIAL-04: Responsive Viewport Matrix and Reduced Motion` | **PASS** | Viewport 390x844: Bấm `Mở menu danh sách đoạn chat` mở drawer, chụp `preview-390x844-drawer.png`, bấm `Đóng thanh bên`, kiểm tra không tràn ngang (`scrollWidth === clientWidth`). Chạy thành công. |
| **9** | **Cold reload trực tiếp ở Light Theme** | `TC-CELESTIAL-01` (khởi tạo ban đầu với `localStorage.theme = 'light'`) | **PARTIALLY VERIFIED** | `TC-01` khởi tạo `localStorage.setItem('theme', 'light')` trước khi `page.goto()`. Khung hình $t=0\text{ms}$ được đo ngay khi nạp trang đạt $L_{\text{mean}} = 0.7440$, không bị nháy đen. Tuy nhiên chưa có test case gọi lệnh `page.reload()` chuyên biệt. |

---

## 3. XÁC MINH CHẾ ĐỘ HẠN CHẾ CHUYỂN ĐỘNG (REDUCED MOTION VERIFICATION)

### 3.1 Quy trình và lệnh kiểm tra
- **Test thực thi:** `TC-CELESTIAL-04: Responsive Viewport Matrix and Reduced Motion` (dòng 578–599 của `e2e/celestial-sidebar-transition.spec.ts`).
- **Lệnh kích hoạt:** `await page.emulateMedia({ reducedMotion: 'reduce' });`
- **Thời điểm kiểm tra:** Sau khi nạp trang tại độ phân giải Desktop 1440x900.

### 3.2 Bằng chứng thực tế & Assertions

Trong quá trình chạy test, script trích xuất giá trị `window.getComputedStyle()` thực tế từ DOM:
```typescript
const animationInfo = await page.evaluate(() => {
  const strip = document.querySelector('.celestial-cloud-strip');
  const corona = document.querySelector('.celestial-sun-corona');
  return {
    stripAnimationName: strip ? window.getComputedStyle(strip).animationName : null,
    coronaAnimationName: corona ? window.getComputedStyle(corona).animationName : null,
  };
});
```

**Kết quả log kiểm thử:**
```
[Reduced Motion] Cloud strip animationName: none, Sun corona animationName: none
```

**Đối chiếu mã nguồn CSS (`frontend/src/theme/celestial/celestial.css`, dòng 181–192):**
```css
@media (prefers-reduced-motion: reduce) {
  .celestial-cloud-strip {
    animation: none !important;
    transform: translate3d(0, 0, 0) !important;
  }
  .celestial-sun-corona {
    animation: none !important;
    transform: scale(1) !important;
    opacity: 0.95 !important;
  }
}
```

### 3.3 Đánh giá
- **Vô hiệu hóa animation:** Cả dải mây (`.celestial-cloud-strip`) và quầng sáng mặt trời (`.celestial-sun-corona`) đều có `animationName === 'none'`. Chuyển động drift và hiệu ứng thở 16s dừng hoàn toàn.
- **Bảo toàn hình học tĩnh:** Thuộc tính `transform: translate3d(0, 0, 0) !important` và `transform: scale(1) !important` giữ cho các tầng mây và quầng sáng mặt trời cố định đúng tọa độ thiết kế ban ngày mà không bị lệch hay biến dạng.
- **Ảnh chụp bằng chứng:** `screenshots/celestial-preview/preview-reduced-motion-integrated.png` (556 KB) cho thấy nền trời, mặt trời và mây hiển thị đầy đủ, tĩnh, rõ nét.
- **Kết luận:** **PASS**.

---

## 4. XÁC MINH VÙNG ĐO ĐỘ SÁNG VÀ CHỐNG NHÁY ĐEN (ROI BLACKOUT VERIFICATION)

### 4.1 Bằng chứng trích xuất hình học và tạo ảnh
Kiểm tra đoạn mã tạo ảnh trong `e2e/celestial-sidebar-transition.spec.ts` (dòng 297–313):
```typescript
const mainBox = await page.locator('main').boundingBox();
const initialRoi: ROI = {
  x: mainBox.x + mainBox.width - 130,
  y: mainBox.y + 120,
  width: 100,
  height: 280,
};
await saveROIVerification(page, initialRoi, roiVerificationPath);
```

### 4.2 Kiểm tra thực tế kích thước và tọa độ
Tại viewport $1440 \times 900$, khi Sidebar mở ($240\text{px}$):
- `<main>` có `x = 240`, `width = 1200`, `height = 900`.
- Mép phải của `<main>`: $\text{mainBox.x} + \text{mainBox.width} = 1440\text{px}$.
- Tọa độ ROI được tính:
  - $X_{\text{start}} = 1440 - 130 = \mathbf{1310\text{px}}$.
  - $X_{\text{end}} = 1440 - 30 = \mathbf{1410\text{px}}$ (Chiều rộng: $100\text{px}$).
  - $Y_{\text{start}} = 0 + 120 = \mathbf{120\text{px}}$.
  - $Y_{\text{end}} = 120 + 280 = \mathbf{400\text{px}}$ (Chiều cao: $280\text{px}$).
- Tổng diện tích vùng đo: $100 \times 280 = \mathbf{28,000\text{ pixels}}$.

### 4.3 Xác minh trực quan và kiểm tra kênh pixel của ảnh ROI
Đã kiểm tra file ảnh:
`screenshots/celestial-preview/roi-verification.png` (Kích thước: 1,251,007 bytes).

Sử dụng script Node.js trích xuất pixel trực tiếp:
- **Kích thước ảnh:** Chính xác $1440 \times 900\text{px}$.
- **Pixel góc trên bên trái khung viền $(1310, 120)$:** RGBA = `(239, 68, 68, 255)` (Màu đỏ viền `#EF4444`).
- **Pixel góc dưới bên phải khung viền $(1410, 400)$:** RGBA = `(239, 68, 68, 255)` (Màu đỏ viền `#EF4444`).
- **Pixel bên trong vùng ROI $(1360, 260)$:** RGBA = `(195, 228, 248, 255)` (Sắc xanh thiên thanh `#C3E4F8`, $L \approx 0.74$).
- **Vị trí quang học:** Nằm hoàn toàn trong khoảng đệm lề phải giữa container tin nhắn `max-w-4xl` ($896\text{px}$) và thanh cuộn, phía dưới header ($Y=56$) và phía trên composer ($Y=720$).
- **Xác nhận nội dung:** Vùng ROI **$100\%$ không chứa chữ, avatar, nút bấm hay thanh cuộn**.

### 4.4 Kết quả đo lường quang học Blackout
Tuân thủ công thức chuẩn WCAG 2.1 sRGB Relative Luminance:
- Tiêu chí: Pixel là Blackout $\iff L_{\text{pixel}} \le 0.0100$.
- Kết quả thực nghiệm:
  - Sidebar Collapse (9 frames): $\text{BlackoutRatio} = \mathbf{0.00\%}$, $L_{\text{mean}} = 0.7393 - 0.7414$, $L_{\text{min}} = \mathbf{0.6720}$.
  - Sidebar Expand (9 frames): $\text{BlackoutRatio} = \mathbf{0.00\%}$, $L_{\text{mean}} = 0.7430 - 0.7442$, $L_{\text{min}} = \mathbf{0.6785}$.
- **Ghi chú giới hạn kỹ thuật:** Kết quả đo quang học này chứng minh tính liên tục và không có nháy đen trên vùng đệm nền được lấy mẫu tại các mốc thời gian rời rạc ($0\text{ms} \to 350\text{ms}$). Nó không phải là một tuyên bố toán học bảo đảm loại trừ tuyệt đối mọi hiện tượng nhấp nháy trên toàn bộ màn hình hoặc ở mọi tần số quét phần cứng không được đo.
- **Kết luận:** **PASS**.

---

## 5. XÁC MINH TÍNH CÔ LẬP CỦA PLAYWRIGHT CONFIG (CONFIG NON-INTERFERENCE)

Kiểm tra sự tương tác giữa file cấu hình mới `playwright.celestial.config.ts` và toàn bộ hạ tầng E2E hiện có của dự án:

### 5.1 Kiểm tra file cấu hình mặc định (`playwright.config.ts`)
```powershell
npx playwright test --list
```
**Kết quả hiển thị từ hệ thống:**
```
Listing tests:
  [setup] › auth.setup.ts:5:1 › authenticate E2E user
  [chromium] › auth.spec.ts:3:1 › user can register successfully
  [chromium] › auth.spec.ts:22:1 › registered user can login and reach chat page
  [chromium] › auth.spec.ts:46:1 › visual and responsive verification for login and register
  [smoke] › smoke.spec.ts:3:1 › frontend loads successfully
  [chromium-authenticated] › chat.spec.ts:3:1 › authenticated user can create a new chat
  [chromium-authenticated] › chat.spec.ts:19:1 › user can select, rename, and delete a chat
  [chromium-authenticated] › chat.spec.ts:82:1 › authenticated user can send a message in a chat
  [chromium-authenticated] › chat.spec.ts:129:1 › AI response streams into the chat UI
  [chromium-authenticated] › chat.spec.ts:180:1 › user can regenerate the latest AI response
  [chromium-authenticated] › chat.spec.ts:258:1 › user can upload a text file and receive an AI response using its content
Total: 11 tests in 4 files
```

### 5.2 Đánh giá tính cô lập
1. **Không làm thay đổi config mặc định:** `playwright.config.ts` chỉ match `/.*(?:smoke|auth)\.spec\.ts/` và `/.*chat\.spec\.ts/`. Tổng số test mặc định giữ nguyên 11 tests trong 4 files.
2. **Không làm chạy chéo test:** Khi chạy `npx playwright test`, các test của Celestial (`celestial-sidebar-transition.spec.ts`) **hoàn toàn không bị nạp hay chạy nhầm**.
3. **Không thay đổi `package.json`:** Script `"test:e2e": "playwright test"` ở root `package.json` không bị sửa đổi, dependencies của dự án không bị thêm/bớt package nào.
4. **Cơ chế tương đồng với các module trước:** `playwright.celestial.config.ts` hoạt động độc lập tương tự như `playwright.phase3.config.ts`, `playwright.phase4.config.ts`, và `playwright.visual.config.ts`.
5. **Kết luận:** **PASS**.

---

## 6. KIỂM TRA TRẠNG THÁI WORKING TREE VÀ VỆ SINH GIT (GIT HYGIENE)

Đã chạy đầy đủ 4 lệnh kiểm tra trạng thái chỉ đọc:

### 6.1 `git status --short`
```
 M frontend/index.html
 M frontend/package-lock.json
 M frontend/package.json
 M frontend/src/App.tsx
 M frontend/src/assets/chat-background/background.css
 M frontend/src/components/ChatArea.tsx
 M frontend/src/components/ChatInput.tsx
 M frontend/src/components/MessageBubble.tsx
 M frontend/src/components/ModelSelector.css
 M frontend/src/components/ModelSelector.tsx
 M frontend/src/components/Sidebar.tsx
 M frontend/src/components/ThemeToggle.tsx
 M frontend/src/components/chat/ChatActionMenu.tsx
 M frontend/src/components/chat/ChatBackground.tsx
 M frontend/src/components/chat/DeleteChatModal.tsx
 M frontend/src/components/chat/ExpandedEditorModal.tsx
 M frontend/src/components/chat/NewChatButton.tsx
 M frontend/src/components/chat/SearchChatButton.tsx
 M frontend/src/components/chat/SearchChatModal.tsx
 M frontend/src/components/chat/WelcomeScreen.test.tsx
 M frontend/src/components/chat/WelcomeScreen.tsx
 M frontend/src/components/ui/sidebar.tsx
 M frontend/src/index.css
 M frontend/src/pages/ChatPage.tsx
 M frontend/src/stores/themeStore.ts
?? .agents/
?? docs/celestial-daylight/
?? e2e/celestial-sidebar-transition.spec.ts
?? frontend/public/assets/celestial/
?? frontend/src/theme/celestial/
?? playwright.celestial.config.ts
?? screenshots/celestial-preview/
```

### 6.2 `git diff --stat`
Tổng cộng 25 tracked files đã được chỉnh sửa từ trước trong nhánh làm việc `fix/google-identity-services-button`.
Hai file duy nhất thuộc phạm vi Phase 4 được sửa đổi là:
- `frontend/src/assets/chat-background/background.css`: 19 thay đổi (+15, -4).
- `frontend/src/components/chat/ChatBackground.tsx`: 33 thay đổi (+26, -7).

### 6.3 `git diff -- frontend/src/components/chat/ChatBackground.tsx`
Diff thể hiện đúng việc bổ sung nhánh hiển thị `<CelestialDaylightBackground />` khi `theme === 'light'`, bảo tồn Suspense cho Zyricon 3D và 3 lớp sao cho Dark theme.

### 6.4 `git diff -- frontend/src/assets/chat-background/background.css`
Diff thể hiện đúng việc chuyển `background: transparent;` cho Light theme để loại bỏ radial gradient cũ, tránh xung đột màu với gradient Rayleigh ban ngày.

### 6.5 Xác nhận vệ sinh Git
- **Không thực hiện** bất kỳ thao tác `git add`, `git commit`, `git push`, `git reset`, `git checkout`, `git stash`, hay `git clean` nào.
- Toàn bộ 25 file modified trước đó trong working tree được bảo toàn nguyên trạng 100%.
- Không có file nào bị xóa hoặc mất mát.
- **Kết luận:** **PASS**.

---

## 7. DANH SÁCH TỔNG HỢP PASS, FAIL VÀ NOT VERIFIED

### Danh sách ĐẠT (PASS)
1. **[PASS] Core Background Integration:** `ChatBackground.tsx` render chính xác theo 3 trạng thái theme.
2. **[PASS] CSS Gradient Isolation:** `.chat-stars-bg` trong suốt ở Light mode, gradient Celestial hiển thị sắc nét.
3. **[PASS] Unit Test Suite:** `ChatBackground.zyricon.test.tsx` đạt 7/7 tests PASS.
4. **[PASS] Full Frontend Non-Regression:** 41/41 test files, 632/632 tests PASS.
5. **[PASS] TypeScript & Vite Production Build:** 0 lỗi compile, hoàn tất trong 1.34s.
6. **[PASS] Zero Black Flash on Sidebar Collapse:** $\text{BlackoutRatio} = 0.00\%$, $L_{\text{mean}} \in [0.7393, 0.7414]$.
7. **[PASS] Zero Black Flash on Sidebar Expand:** $\text{BlackoutRatio} = 0.00\%$, $L_{\text{mean}} \in [0.7430, 0.7442]$.
8. **[PASS] Zyricon $\to$ Light Switch:** Chuyển đổi mượt mà, giải phóng WebGL sạch sẽ, 0 console errors.
9. **[PASS] Mobile Drawer Open/Close:** Đóng mở drawer trượt tự nhiên trên nền trời, không tràn pixel ngang.
10. **[PASS] Reduced Motion:** `animationName: none`, dừng chuyển động và bảo toàn tọa độ tĩnh.
11. **[PASS] ROI 1 Geometry & Proof Image:** Tọa độ $(1310, 120, 100, 280)$ xác minh bằng pixel đỏ trên ảnh `roi-verification.png`.
12. **[PASS] Playwright Config Isolation:** Config mới không ảnh hưởng 11 E2E tests mặc định.
13. **[PASS] Git Hygiene:** Bảo toàn 100% working tree, zero git mutations.

### Danh sách CHƯA XÁC MINH ĐẦY ĐỦ / ĐỘC LẬP (NOT VERIFIED)
1. **[NOT VERIFIED - E2E] Kịch bản 2: Dark $\to$ Light độc lập:** Trong E2E chỉ chạy chuỗi liên hoàn (Light $\to$ Dark $\to$ Zyricon $\to$ Light), chưa có test Playwright riêng biệt cho bước Dark $\to$ Light trực tiếp (chỉ mới được xác minh ở cấp độ unit test).
2. **[NOT VERIFIED - E2E] Kịch bản 3: Light $\to$ Zyricon trực tiếp:** Trong E2E chỉ chạy Dark $\to$ Zyricon, chưa có test Playwright bấm chuyển thẳng 1 chạm từ Light sang Zyricon.
3. **[NOT VERIFIED - E2E] Kịch bản 7: Rapid / continuous resize:** Chưa có test mô phỏng thay đổi kích thước cửa sổ trình duyệt liên tục trong khi animation đang chạy.
4. **[NOT VERIFIED - E2E] Kịch bản 9: F5 Cold reload độc lập:** Đã xác minh khung hình $t=0$ khi nạp trang lần đầu không có FOUC/nháy đen, nhưng chưa có test gọi lệnh `page.reload()` chuyên biệt.

### Danh sách THẤT BẠI (FAIL)
- **Không có bất kỳ tiêu chí hay kịch bản nào bị FAIL.**

---

## 8. KẾT LUẬN VÀ KIẾN NGHỊ NGHIỆM THU

### Kiến nghị: **ACCEPT WITH NOTES (Chấp nhận nghiệm thu có ghi chú)**

### Lý do kiến nghị:
1. **Không có bất kỳ lỗi kỹ thuật nào:** Các chức năng cốt lõi nhất của Phase 4 — bao gồm tích hợp background, bảo toàn Dark Theme và Zyricon, loại trừ nháy đen khi co giãn thanh bên, tương thích responsive đa thiết bị, và kiểm soát chuyển động reduced motion — đều đã được chứng minh bằng dữ liệu thực nghiệm khách quan và đạt $100\%$ chỉ tiêu.
2. **Ghi chú bảo lưu (Notes):** 
   - Ba tình huống chuyển đổi phụ (Dark $\to$ Light trực tiếp, Light $\to$ Zyricon trực tiếp, và Rapid continuous resize) chưa được bao phủ thành test case Playwright độc lập trong file E2E hiện tại.
   - Các kịch bản này không ảnh hưởng đến kiến trúc nền tảng vì logic dispatch trong `ChatBackground.tsx` là conditional rendering tức thời dựa trên Zustand store (`theme === 'light'`).
   - Có thể bổ sung các kịch bản kiểm thử này vào suite E2E nếu cần thiết trong các đợt củng cố tiếp theo.

### Trạng thái tiếp theo:
Hệ thống đã dừng lại hoàn toàn theo đúng quy tắc AUDIT ONLY. Không có dòng code nào bị thay đổi trong đợt kiểm tra này.  
Chờ ý kiến chỉ đạo và xem xét của bạn trước khi quyết định đóng Phase 4 và bước sang Phase 5.

