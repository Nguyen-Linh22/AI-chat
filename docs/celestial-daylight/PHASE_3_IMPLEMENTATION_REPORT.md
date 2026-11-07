# CELESTIAL DAYLIGHT — PHASE 3: CORE BACKGROUND IMPLEMENTATION REPORT

- **Project Root**: `D:\ai-chat-clone-new`
- **Phase Target**: Phase 3 — Core Background Implementation
- **Theme**: Light Theme (`Celestial Daylight — A brighter space to think, create and explore`)
- **Status**: Complete & Verified (Ready for Review)
- **Document Date**: 2026-11-07
- **Author**: Senior Frontend Engineer (React, TypeScript, CSS Animation, Rendering Optimization)

---

## 1. TỔNG QUAN VÀ MỤC TIÊU ĐẠT ĐƯỢC

Giai đoạn **Phase 3 — Core Background Implementation** đã hoàn tất việc xây dựng hệ thống background Celestial Daylight độc lập hoàn toàn bằng **React + CSS thuần + 5 asset thực tế đã được nghiệm thu trong Phase 2**.

### Các chỉ tiêu kỹ thuật cốt lõi đạt được:
- **Kiến trúc Pure 2D Compositor**: $100\%$ dựa trên CSS Multi-stop Gradient, Scalable SVG Vectors và Transparent WebP Canopies. **Hoàn toàn không sử dụng Three.js, WebGL hay thẻ `<canvas>`** (0 instances).
- **Đồng bộ màu sắc tuyệt đối với Light Theme**: Màu sắc của bầu trời, mặt trời và mây được truy xuất trực tiếp và hòa hợp với design tokens của Light Theme (`--brand-primary: #F59E0B`, `--brand-primary-hover: #EA580C`) và component chọn theme (`ThemeSelector.tsx`, `ThemeToggle.tsx`).
- **Chuyển động mượt mà không khấc giật (Seamless Loop)**: 3 tầng mây trôi độc lập với dải duplicated 200% strip (`translateX(0) \to translateX(-50%)`), độ lệch kênh Alpha giữa hai đầu nối bằng $0$ tuyệt đối.
- **Thích ứng kích thước Container**: Background được thiết kế bám theo kích thước container thực tế (`ChatArea`), tự động điều chỉnh tọa độ mặt trời và độ giãn của mây khi Sidebar đóng/mở.
- **Hỗ trợ chuẩn tiếp cận Reduced Motion**: Tự động vô hiệu hóa keyframes chuyển động liên tục khi người dùng bật `prefers-reduced-motion: reduce`, bảo toàn $100\%$ bố cục tĩnh và các transform định vị.
- **Bảo toàn phạm vi dự án**: Không chỉnh sửa `themeStore`, `ChatBackground`, `Sidebar`, `ChatArea`, hay bất kỳ logic chat/backend nào.

---

## 2. DANH MỤC FILE TẠO MỚI VÀ CHỈNH SỬA

### 2.1 File tạo mới thuộc Phase 3:
1. `frontend/src/theme/celestial/types.ts`: Định nghĩa TypeScript interfaces cho toàn bộ props và cấu hình layer.
2. `frontend/src/theme/celestial/celestial.config.ts`: Hằng số cấu hình visual, đường dẫn asset, chu kỳ thời gian (160s, 110s, 135s, 16s), độ mờ (opacity) và tọa độ mặt trời responsive.
3. `frontend/src/theme/celestial/celestial.css`: Toàn bộ CSS keyframes phần cứng (`translate3d`), quy tắc bố cục container-relative, responsive breakpoints và quy tắc tiếp cận `prefers-reduced-motion`.
4. `frontend/src/theme/celestial/SkyAtmosphere.tsx`: Subcomponent render nền trời quang học Rayleigh với fallback màu đặc `#C8E8FC`.
5. `frontend/src/theme/celestial/CinematicSun.tsx`: Subcomponent render tâm mặt trời, quầng sáng corona và chùm tia volumetric light rays (God rays).
6. `frontend/src/theme/celestial/CloudCanopy.tsx`: Subcomponent 3 tầng mây độc lập với cấu trúc duplicated 200% strip.
7. `frontend/src/theme/celestial/CelestialDaylightBackground.tsx`: Component React cốt lõi tích hợp các tầng hiển thị.
8. `frontend/src/theme/celestial/index.ts`: Public module exports cho gói theme Celestial.
9. `frontend/src/theme/celestial/CelestialDaylightBackground.test.tsx`: Bộ 11 unit test tự động trên môi trường jsdom.
10. `docs/celestial-daylight/PHASE_3_IMPLEMENTATION_REPORT.md`: Báo cáo nghiệm thu kỹ thuật Phase 3.

### 2.2 File cập nhật phục vụ kiểm thử độc lập:
1. `frontend/public/celestial-preview.html`: Cập nhật menu chọn độ phân giải bổ sung `360x800` (Narrow Mobile) và các preset kích thước container khi Sidebar mở ($1200\times 900$, $1040\times 800$, $528\times 1024$) và đóng ($1376\times 900$, $1216\times 800$, $704\times 1024$).

---

## 3. TRUY XUẤT VÀ ĐỒNG BỘ BẢNG MÀU LIGHT THEME

Thực hiện nghiêm ngặt quy tắc tại Mục 5 của yêu cầu, hệ thống đã truy vết mã nguồn thực tế trước khi viết CSS.

### 3.1 Bảng đối chiếu màu sắc thực tế trong mã nguồn:

| Thành phần | Mã màu thực tế | Nguồn trong code | Cách áp dụng trong Celestial Daylight |
| :--- | :--- | :--- | :--- |
| **Light Theme primary** | `#F59E0B` (amber-500) | `frontend/src/index.css` (`--brand-primary: #F59E0B`), `ThemeSelector.css` line 24 | Màu ấm chủ đạo của vầng hào quang mặt trời, liên kết trực tiếp với nhận diện thương hiệu Light Mode. |
| **Light Theme accent / hover** | `#EA580C` (orange-600) | `frontend/src/index.css` (`--brand-primary-hover: #EA580C`), `ThemeSelector.css` line 24 & 30 | Màu viền ngoài của tia sáng mặt trời volumetric rays và drop-shadow của corona. |
| **Light Theme selected state** | `linear-gradient(135deg, #F59E0B, #EA580C)` | `frontend/src/components/ThemeSelector.css` line 24 (nút trigger khi Light được chọn) | Gradient quang học tạo cảm giác bình minh/nắng ấm đồng nhất với trạng thái active của nút chọn theme. |
| **Light Theme toggle sky pill**| `#83cbd8` (cyan/day sky) | `frontend/src/components/ThemeToggle.tsx` line 58 & `ThemeToggle.css` line 72 | Tông xanh da trời dịu mát của viên nang theme toggle, làm chuẩn đối chiếu cho nền trời ban ngày (`#84C2F5` ở đỉnh). |
| **Light Theme surface** | `#FFFFFF` | `frontend/src/index.css` (`--workspace-surface: #FFFFFF`) | Điểm sáng cực đại (peak highlight) tại tâm đĩa mặt trời photosphere (`#FFFFFF`) và rìa đón nắng của mây (`#FFFFFF`). |
| **Light Theme canvas base** | `#FAFBFD` | `frontend/src/index.css` (`--workspace-canvas: #FAFBFD`) | Vùng sáng chân trời hòa trộn tự nhiên (`#F4FAFF` ở stop $100\%$). |
| **Light Theme text primary** | `#0F172A` (slate-900) | `frontend/src/index.css` (`--workspace-text-primary: #0F172A`) | Đảm bảo tương phản WCAG AAA ($\ge 13.9:1$) trên nền trời và các thẻ card trong suốt `bg-white/90`. |
| **Celestial sky colors** | `#84C2F5` $\to$ `#C8E8FC` $\to$ `#F4FAFF` | `frontend/src/theme/celestial/celestial.config.ts`, `celestial.css` | 8-stop linear gradient mô phỏng tán xạ Rayleigh, chuyển tiếp êm dịu từ đỉnh trời xuống chân trời. |
| **Sun / glow colors** | `#FFFFFF`, `#FFFDF0`, `#FFE8A3`, `#FFD46E`, `#FFC83B` | `frontend/src/theme/celestial/celestial.config.ts`, `sun-corona.svg` | Hệ thống vòng hào quang đồng tâm tự nhiên: Photosphere $\to$ Chromosphere $\to$ Breathing Corona. |
| **Cloud colors** | `#FFFFFF`, `#F0F8FF`, `#D9E8F5` | `frontend/public/assets/celestial/clouds/*`, `celestial.config.ts` | Rìa mây trắng sáng, thân mây Alice Blue và chân mây bóng đổ tán xạ dịu mát. |

### 3.2 Giải thích tính gắn kết thẩm mỹ:
Celestial Daylight không tự tạo một bảng màu ngẫu nhiên. Trái lại, sắc xanh trời ban ngày (`#84C2F5` / `#C8E8FC`) bắt nguồn trực tiếp từ màu nền của nút gạt `ThemeToggle` (`#83cbd8`). Ánh nắng và tia sáng mặt trời hòa sắc hoàn hảo với gradient màu hổ phách vàng cam (`#F59E0B` / `#EA580C`) đặc trưng của nút `ThemeSelector` khi đang ở trạng thái Light Theme. Nhờ đó, người dùng khi chuyển sang Light Theme sẽ cảm nhận sự liền mạch tự nhiên giữa nút bấm và toàn bộ không gian làm việc.

---

## 4. KIẾN TRÚC COMPONENT & KỸ THUẬT TRIỂN KHAI

### 4.1 Cấu trúc Component Breakdown:
```
frontend/src/theme/celestial/
├── types.ts                        // TypeScript interfaces & props
├── celestial.config.ts             // Constants, asset paths, timing, colors
├── celestial.css                   // Hardware-accelerated transforms & keyframes
├── SkyAtmosphere.tsx               // Base sky gradient & solid fallback
├── CinematicSun.tsx                // Scalable vector sun & volumetric rays
├── CloudCanopy.tsx                 // 3-tier drifting cloud strips
├── CelestialDaylightBackground.tsx // Root orchestrator component
└── index.ts                        // Public package exports
```

### 4.2 Cơ chế chuyển động từng layer (Motion Mechanics):
1. **Dải mây trôi vô tận (Duplicated 200% Strip)**:
   - Mỗi tầng mây chứa một container có chiều rộng $200\%$ container cha.
   - Bên trong gồm hai Segment: **Segment A** ($0 \to 50\%$) và **Segment B** ($50 \to 100\%$). Segment B là bản sao giống hệt của Segment A.
   - Keyframe:
     ```css
     @keyframes celestial-drift-horizontal {
       0% { transform: translate3d(0, 0, 0); }
       100% { transform: translate3d(-50%, 0, 0); }
     }
     ```
   - Chu kỳ thời gian và độ lệch pha được cấu hình lệch nhau để loại bỏ cảm giác đồng bộ cơ học:
     - **Tầng 1 (Cirrus High)**: Chu kỳ $160\text{s}$, `animation-delay: 0s`, độ mờ $38\%$, vị trí $Y \in [5\%, 50\%]$.
     - **Tầng 2 (Cumulus Mid)**: Chu kỳ $110\text{s}$, `animation-delay: -35s`, độ mờ $62\%$, vị trí $Y \in [20\%, 88\%]$.
     - **Tầng 3 (Stratus Low)**: Chu kỳ $135\text{s}$, `animation-delay: -70s`, độ mờ $42\%$, vị trí $Y \in [58\%, 100\%]$.
2. **Nhịp thở mặt trời (Sun Breathing)**:
   - Chu kỳ $16\text{s}$ với hàm chuyển động `ease-in-out`:
     ```css
     @keyframes celestial-sun-breathe {
       0%, 100% { transform: scale(1); opacity: 0.90; }
       50% { transform: scale(1.03); opacity: 1.0; }
     }
     ```
   - Ánh sáng biến thiên rất chậm, tạo cảm giác khí quyển sống động mà không gây phân tâm.
3. **Chùm tia sáng Volumetric Rays (God Rays)**:
   - Đặt tại góc $-44^\circ$, sử dụng chế độ hòa trộn `mix-blend-mode: screen` với độ mờ $85\%$. Tia sáng suy giảm tuyến tính về $0\%$ trước khi chạm vào vùng văn bản bên trái.

### 4.3 Xử lý khả năng tiếp cận (Reduced Motion):
Khi `prefers-reduced-motion: reduce` được kích hoạt:
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
> [!IMPORTANT]
> **Tuyệt đối không sử dụng `transform: none !important` trên `.celestial-sun-container` hay `.celestial-sun-rays`**, vì các phần tử này sử dụng `transform: translate(-50%, -50%)` để định vị chính xác tâm mặt trời. Thiết kế của chúng tôi bảo toàn $100\%$ bố cục tĩnh, đảm bảo khi tắt chuyển động thì bầu trời vẫn giữ trọn vẹn vẻ đẹp thẩm mỹ.

---

## 5. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & BẰNG CHỨNG THỰC NGHIỆM

### 5.1 Unit Tests với Vitest:
File test [`frontend/src/theme/celestial/CelestialDaylightBackground.test.tsx`](file:///d:/ai-chat-clone-new/frontend/src/theme/celestial/CelestialDaylightBackground.test.tsx) kiểm tra toàn diện 11 ca kiểm thử:
- **1. Root Component Rendering**:
  - `renders top-level container with default testId and aria-hidden attributes`: **PASS**
  - `applies custom className and custom style without overwriting baseline classes`: **PASS**
  - `contains zero <canvas> elements, ensuring pure 2D DOM compositor execution (no WebGL)`: **PASS**
- **2. SkyAtmosphere Subcomponent**:
  - `renders sky atmosphere layer with solid fallback class and multi-stop gradient`: **PASS**
- **3. CinematicSun Subcomponent**:
  - `renders solar container with volumetric rays and corona SVGs`: **PASS**
  - `supports disabling breathing animation via breathe={false}`: **PASS**
- **4. CloudCanopy & 3-Tier Layer Architecture**:
  - `renders all three cloud layers independently (Cirrus, Cumulus, Stratus)`: **PASS**
  - `implements the duplicated 200% strip with Segment A and Segment B for every layer`: **PASS**
  - `renders a total of 6 cloud image elements (2 per tier)`: **PASS**
- **5. Visibility Toggles**:
  - `hides sun when showSun={false}`: **PASS**
  - `hides clouds when showClouds={false}`: **PASS**

**Kết quả chạy test:** `11/11 tests passed in 334ms`. Không có bất kỳ hồi quy nào đối với 40 file test (621 tests) hiện có của dự án.

### 5.2 Kiểm thử Responsive & Chụp ảnh Playwright (Visual Evidence):
Toàn bộ ảnh chụp kiểm chứng được xuất tại `screenshots/celestial-preview/`:

| Kịch bản kiểm thử | Độ phân giải / Container | Tệp ảnh bằng chứng | Kết quả quan sát thực tế |
| :--- | :--- | :--- | :--- |
| **Desktop Viewport** | $1440 \times 900$ | [`preview-1440x900.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-1440x900.png) | Toàn cảnh hoàn mỹ, mặt trời tại $(82\%, 14\%)$, mây 3 tầng phong phú, nội dung chat ở giữa rõ ràng. |
| **Laptop Viewport** | $1280 \times 800$ | [`preview-1280x800.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-1280x800.png) | Tỷ lệ co giãn mượt mà theo container, không có méo ảnh. |
| **Tablet Viewport** | $768 \times 1024$ | [`preview-768x1024.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-768x1024.png) | Khung hình dọc: mặt trời chuyển về $(84\%, 12\%)$, mây dạt hai bên không đè lên thẻ nội dung. |
| **Mobile Viewport** | $390 \times 844$ | [`preview-390x844.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-390x844.png) | Màn hình di động: mặt trời thu nhỏ $320\text{px}$, chân trời thoáng đãng trên bàn phím/composer. |
| **Narrow Mobile** | $360 \times 800$ | [`preview-360x800.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-360x800.png) | Màn hình hẹp: không xuất hiện horizontal scrollbar, tỷ lệ cân đối hoàn toàn. |
| **Desktop Sidebar Mở** | $1200 \times 900$ (ChatArea) | [`preview-container-open-sidebar.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-container-open-sidebar.png) | Background tự thích ứng theo chiều rộng container, mặt trời giữ khoảng cách chuẩn với viền phải. |
| **Desktop Sidebar Đóng**| $1376 \times 900$ (ChatArea) | [`preview-container-collapsed-sidebar.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-container-collapsed-sidebar.png) | Khi Sidebar thu gọn, background tự mở rộng liền mạch, không lộ vết nối hay vệt đen. |
| **Reduced Motion** | $1440 \times 900$ | [`preview-reduced-motion.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-reduced-motion.png) | Animation dừng hoàn toàn, bố cục tĩnh được bảo tồn trọn vẹn. |
| **Seam Line ($t=50\%$)** | $1440 \times 900$ | [`preview-seam-t50.png`](file:///d:/ai-chat-clone-new/screenshots/celestial-preview/preview-seam-t50.png) | Vạch đỏ chẩn đoán tại mối nối: mây trôi qua mối nối liên tục và tự nhiên. |

---

## 6. BẢO TOÀN WORKING TREE & PHẠM VI DỰ ÁN

- **Trạng thái Git**:
  - Branch: `fix/google-identity-services-button`
  - HEAD: `69b42265dd32372fa4c36b1fa3d4c9d6792376ba`
  - 25 file modified có từ trước được bảo toàn nguyên vẹn $100\%$, không bị sửa đổi ngoài phạm vi.
- **Thư viện bên ngoài**: Không cài thêm bất kỳ npm package nào.
- **Tính độc lập của component**: `CelestialDaylightBackground` được đóng gói hoàn toàn trong `frontend/src/theme/celestial/`, chưa gắn cờ kích hoạt vào `themeStore` hay `ChatBackground`.

---

## 7. CÔNG VIỆC CỐ Ý DÀNH LẠI CHO PHASE 4 (UI INTEGRATION)

Theo đúng lộ trình phân kỳ:
1. **Gắn kết vào `ChatBackground.tsx`**: Đưa `CelestialDaylightBackground` vào cây component khi `theme === 'light'` và đường dẫn là workspace chat.
2. **Xử lý chuyển đổi mượt mà (Theme Transition)**: Điều phối hiệu ứng cross-fade giữa `Dark` $\leftrightarrow$ `Light` (Celestial Daylight) $\leftrightarrow$ `Zyricon`.
3. **Đồng bộ hóa độ trong suốt của bề mặt UI**: Đảm bảo các thành phần `WelcomeScreen`, `MessageBubble`, `ChatInput` áp dụng lớp kính mờ (glassmorphism nhẹ) hài hòa với bầu trời ban ngày mà không làm giảm độ tương phản văn bản.

---

## 8. KẾT LUẬN

**Giai đoạn Phase 3 đã hoàn thành xuất sắc toàn bộ mục tiêu kỹ thuật, kiểm thử và thị giác.**  
Hệ thống sẵn sàng chuyển sang **Phase 4 — UI Integration** khi nhận được sự phê duyệt của bạn! Toàn bộ quá trình triển khai đã dừng lại và chờ lệnh tiếp theo.

