# CELESTIAL DAYLIGHT — SIDEBAR LIGHT THEME HARMONIZATION PLAN
## A Soft Sky Above Your Workspace — Master Technical Specification & Architecture

> **Document Status**: PLANNING ONLY — PENDING FINAL USER APPROVAL  
> **Document Revision**: 1.2.1  
> **Target Scope**: `D:\ai-chat-clone-new`  
> **Date**: 2026-11-07  
> **Authoring Lead**: Senior Frontend Architect & Accessibility Engineer  
> **Governing Standards**: WCAG 2.1 Level AA (SC 1.4.3, SC 1.4.11, SC 2.4.7), WCAG 2.2 SC 2.4.11 (Focus Not Obscured), Pure 2D CSS/SVG/WebP rendering (Browser compositing and GPU utilization are implementation-dependent), Zero-Regression Core Policy  

---

## 1. TỔNG QUAN VÀ TẦM NHÌN THIẾT KẾ (EXECUTIVE SUMMARY & VISION)

### 1.1 Triết lý Không gian: "Celestial Daylight Sidebar — A Soft Sky Above Your Workspace"
Trong các Phase 0 đến Phase 5, nền trời quang học **Celestial Daylight** đã được thiết lập thành công trên khu vực đàm thoại chính (`ChatArea`), tái hiện hiện tượng tán xạ Rayleigh chân thực, mặt trời điện ảnh ấm áp và các dải mây WebP chuyển động chậm.

Tuy nhiên, thanh bên (`Sidebar`) của Light Theme hiện vẫn đang sử dụng một nền xám phẳng nhạt (`--workspace-sidebar: #F0F3F7`), tạo cảm giác phân tách cơ học thay vì là một phần của cùng một không gian làm việc rộng mở. Đồng thời, một số thành phần phụ trợ (nút Send trong trình soạn thảo mở rộng `ExpandedEditorModal`, dropdown chọn giao diện `ThemeSelector`, và chỉ báo `Workspace Status Badge` trên Header) vẫn còn tồn đọng mã màu xanh lá cũ (`#1B8F3D`) hoặc mang hiệu ứng màu chàm/tím của Dark Theme.

**Tầm nhìn cốt lõi:**
> *"Sidebar và ChatArea thuộc về cùng một bầu trời ban ngày Celestial Daylight. Khi làm việc, người dùng cảm nhận một dải trời mềm mại, thanh thoát bao bọc lấy danh sách hội thoại; ánh nắng từ đỉnh trời phía đông tỏa nhẹ sang góc trên bên phải thanh bên, các dải mây trắng nhẹ nhàng trôi lơ lửng ở tầng cao, trong khi toàn bộ nội dung văn bản, danh sách chat và các nút thao tác luôn giữ được độ tương phản tối ưu, sắc nét và dễ đọc tuyệt đối."*

### 1.2 Nguyên tắc Bất biến: Visual Harmonization ≠ Full Sidebar Redesign
Kế hoạch này **KHÔNG PHẢI** là một cuộc đại tu thiết kế (redesign) toàn bộ Sidebar.
- Mục tiêu duy nhất là **đồng bộ trực quan (Visual Harmonization)** nền trời và palette màu sắc với Celestial Daylight.
- Toàn bộ bố cục (layout), cấu trúc DOM, kích thước card, khoảng cách (spacing), bo góc (border radius), logic danh sách chat (CRUD, scrollIntoView), phím tắt, và luồng tương tác hiện có của Sidebar phải được bảo toàn nguyên vẹn.
- Bất kỳ thành phần nào đã đọc rõ và đạt độ tương phản chuẩn WCAG thì **GIỮ NGUYÊN**, không thay đổi màu sắc chỉ vì lý do hình thức.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       UNIFIED CELESTIAL DAYLIGHT WORKSPACE                                       │
├─────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────┤
│          SIDEBAR (Celestial Sky Extension)      │                      CHAT AREA (Main Celestial Sky)            │
│  - Background: Airy Rayleigh vertical gradient  │  - Rayleigh Scattering Gradient (#84C2F5 -> #F4FAFF)           │
│    (#84C2F5 -> #C8E8FC -> #F4FAFF)              │  - Cinematic Sun Core, Corona & God Rays (at 82%, 14%)         │
│  - Directional Sun Glow radiating from top-right│  - 3-Tier Drifting Cloud Canopy (Cirrus, Cumulus, Stratus)     │
│  - Independent Slow Clouds (Cirrus, Stratus)    │  - Frosted Header Glass, Elevated Cards & Open Canvas Messages │
│  - Readability-Protected Chat Cards             │                                                                │
│  - Golden Amber Focus Rings & Active Indicator  │                                                                │
└─────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 2. HIỆN TRẠNG VÀ PHÂN TÍCH NGUYÊN NHÂN (CURRENT STATE AUDIT)

Qua quá trình rà soát trực tiếp mã nguồn trong `frontend/src/`, xác định 4 nhóm vấn đề kỹ thuật cần giải quyết đồng bộ:

### 2.1. Hạng mục A: Sidebar Light Theme — Nền phẳng & Chi tiết Legacy
- **Mã nguồn liên quan:**
  - `frontend/src/components/ui/sidebar.tsx` (dòng 14–29)
  - `frontend/src/components/Sidebar.tsx` (cấu trúc render và styling)
  - `frontend/src/index.css` (dòng 9: `--workspace-sidebar: #F0F3F7;`)
- **Hiện trạng:**
  - Sidebar hiện dùng class `bg-workspace-sidebar` với màu phẳng `#F0F3F7` (xám khói nhạt).
  - Lớp phủ gradient giả `before:from-amber-500/[0.04]` chỉ tạo một vệt mờ rất yếu ở đỉnh, không có độ chuyển sắc của bầu trời ban ngày.
  - Thiếu hoàn toàn các tầng mây và cảm giác chiều sâu không gian như `ChatArea`.
  - Một số nút trong Sidebar vẫn còn sót mã màu focus ring xanh lá cũ:
    - Nút đóng Mobile: `focus-visible:ring-[#1B8F3D]/50` (`Sidebar.tsx:391`).
    - Nút Cài đặt footer: `focus-visible:ring-[#1B8F3D]/50` (`Sidebar.tsx:751`).
    - Dải chỉ báo active bar trong JSX fallback: `bg-[#1B8F3D]` (`Sidebar.tsx:478, 520`).
    - *Lưu ý*: `NewChatButton.tsx:40, 86` và `SearchChatButton.tsx:34, 68` được phân loại là **Conditional Files** — chỉ can thiệp focus ring nếu audit chứng minh không đạt chuẩn tương phản.

### 2.2. Hạng mục B: Nút Send trong Trình soạn thảo Mở rộng (`ExpandedEditorModal.tsx`) Còn Màu Lục
- **Mã nguồn liên quan:**
  - `frontend/src/components/chat/ExpandedEditorModal.tsx` (dòng 774–783)
  - `frontend/src/components/ChatInput.tsx` (đối chiếu nút Send chính đã nghiệm thu)
- **Nguyên nhân cốt lõi:**
  - Trong Phase 5, nút Send của `ChatInput.tsx:987` đã được nâng cấp thành công lên gradient hổ phách `from-[#D97706] to-[#C2410C]` (Amber 600 $\to$ Orange 700), nút Stop đổi sang `bg-rose-600 hover:bg-rose-700`.
  - Tuy nhiên, trong `ExpandedEditorModal.tsx:781`, nút Send vẫn đang bị gán cứng mã màu xanh lục legacy:
    ```tsx
    : 'bg-[#1B8F3D] hover:bg-[#EA580C] dark:bg-gradient-to-r dark:from-[#4F46E5] ... focus-visible:ring-[#1B8F3D]/50'
    ```
  - Đồng thời nút Stop generation tại dòng 778 vẫn dùng màu đỏ cũ `bg-[#B91E2B]` thay vì `bg-rose-600`.
  - Các tab Preview/Write (dòng 400, 428) và nút Close (dòng 455) trong modal cũng còn sót `focus-visible:ring-[#1B8F3D]/50`.

### 2.3. Hạng mục C: Theme Selector — Pha trộn State & Thiếu Hover Riêng Cho Light Theme
- **Mã nguồn liên quan:**
  - `frontend/src/components/ThemeSelector.tsx` (dòng 488–497, 536–553)
  - `frontend/src/components/ThemeSelector.css` (dòng 146–154)
- **Nguyên nhân cốt lõi:**
  - Trong `ThemeSelector.tsx` (dòng 489–491), class áp dụng cho thẻ được chọn (`isSelected`) đang dùng dải gradient tím/indigo làm màu mặc định (Light Theme):
    ```tsx
    isSelected
      ? 'border-indigo-500/40 dark:border-indigo-400/40 zyricon:border-[#C27595]/50 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 ...'
      : '...'
    ```
  - Khi người dùng chọn **Light Theme**, thẻ "Light" hiển thị viền tím indigo (`border-indigo-500/40`) và nền tím nhạt (`from-indigo-50/80 to-purple-50/50`), lệch tone với biểu tượng mặt trời vàng rực rỡ bên trong.
  - Trong `ThemeSelector.css` (dòng 146–154), chỉ có rule scoped dành riêng cho Dark Theme (`:is(.dark:not(.zyricon)...) .theme-option-card:hover`), thiếu hoàn toàn hover styling ấm áp dành riêng cho Light Theme.
  - Cần tách biệt rõ ràng giữa **Hover state**, **Selected state**, và **Keyboard Focus state** cho từng theme riêng biệt, tránh ghi đè lẫn nhau.

### 2.4. Hạng mục D: Header — Dấu chấm Tròn `Workspace Status Badge` Bị Lệch Tông
- **Mã nguồn liên quan:**
  - `frontend/src/components/ChatArea.tsx` (dòng 526–530)
  - `frontend/src/components/Sidebar.tsx` (dòng 366, 381)
- **Phân tích ngữ nghĩa (Semantic Verification):**
  - Khảo sát mã nguồn tại `ChatArea.tsx:526-530`:
    ```tsx
    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/40 dark:bg-white/[0.06] ... border border-indigo-200/50 ...">
      <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#6e8efb] to-[#a777e3] ... shadow-[0_0_8px_rgba(167,119,227,0.7)]" aria-hidden="true" />
      <span>AI Workspace</span>
    </div>
    ```
  - **Xác nhận ngữ nghĩa**: Dấu chấm tròn có thuộc tính `aria-hidden="true"`, đứng cạnh nhãn tĩnh "AI Workspace". Đây là một **chi tiết trang trí thương hiệu (decorative brand accent)** định danh không gian làm việc, **KHÔNG PHẢI** là chỉ báo trạng thái kết nối mạng, streaming hay tình trạng sức khỏe hệ thống (connection status / system status).
  - Trong `Sidebar.tsx:366` và `381`, chi tiết tương đương đã dùng Amber (`bg-amber-500`) trong Light Theme. Do đó, việc chuyển dấu chấm trên Header sang gradient Amber/Orange trong Light Theme là hoàn toàn hợp lý về mặt nhận diện thương hiệu, đồng thời giữ nguyên 100% màu tím/chàm cho Dark Theme và Zyricon.

---

## 3. PHẠM VI KIỂM SOÁT & ĐẶC TẢ THIẾT KẾ (DESIGN PROPOSAL)

### 3.1. Phân định Phạm vi Rõ ràng (Scope Boundaries)

Nhằm tuân thủ nguyên tắc kiểm soát phạm vi và ngăn ngừa trượt phạm vi (scope creep):

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PHÂN ĐỊNH PHẠM VI DỰ ÁN                                       │
├─────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│  NHÓM A — IN SCOPE (Được phép triển khai)       │  NHÓM B — OUT OF SCOPE (Tuyệt đối không chạm)  │
├─────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 1. Nền trời Celestial Daylight cho Sidebar      │ 1. Không thay đổi bố cục (layout) Sidebar.     │
│ 2. Gradient bầu trời Rayleigh chuyên biệt       │ 2. Không thay đổi kích thước, padding các nút. │
│ 3. Ánh sáng mặt trời định hướng (directional)   │ 3. Không redesign New Chat Button (giữ form).  │
│ 4. Các dải mây WebP trôi chậm độc lập           │ 4. Không redesign Search Chat Button.          │
│ 5. Tích hợp background vào aside#app-sidebar     │ 5. Không redesign User Profile / Footer.       │
│ 6. Điều chỉnh màu nền thẻ chat để đảm bảo đọc   │ 6. Không thay đổi tính năng Chat History/CRUD. │
│ 7. Chuẩn hóa focus ring legacy #1B8F3D -> amber │ 7. Không thay đổi Dark Theme và Zyricon.       │
│ 8. Nút Send trong ExpandedEditorModal -> amber  │ 8. Không thay đổi Three.js / WebGL / Shaders.  │
│ 9. Scoped Hover/Selected trong ThemeSelector    │ 9. Không thay đổi themeStore.ts.               │
│ 10. Đồng bộ Workspace badge dot trên Header     │ 10. Không thêm nút bấm, menu, hay tính năng mới│
└─────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Quy tắc Kiểm soát Nút New Chat & Search Chat**:
> Không tự ý biến New Chat và Search Chat thành các nút gradient rực rỡ khi hover nếu thiết kế gốc không yêu cầu. Hai file `NewChatButton.tsx` và `SearchChatButton.tsx` được xếp vào **Conditional Files**. Chỉ được phép chỉnh sửa focus ring nếu audit chứng minh rằng focus ring hiện tại vi phạm độ tương phản hoặc không nhận diện được.

### 3.2. Kiến trúc Nền trời Thanh bên (`CelestialSidebarBackground`)

```
┌────────────────────────────────────────────────────────┐
│  SIDEBAR (w: 240px Desktop / 64px Collapsed, h: 100%)  │
│                                                        │
│  [Tier 1: Solid Fallback & Deep Rayleigh Sky Gradient] │
│   Fallback color: #C8E8FC                              │
│   Linear: 180deg, #84C2F5 (0%) -> #C8E8FC (50%) ->     │
│           #F4FAFF (100%)                               │
│                                                        │
│  [Tier 2: Soft Directional Sunlight & Solar Halo]      │
│   Radial: circle at 100% 0%,                           │
│           rgba(255, 255, 240, 0.45) 0%,                │
│           rgba(254, 240, 138, 0.18) 25%,               │
│           rgba(245, 158, 11, 0.06) 50%,                │
│           transparent 75%                              │
│                                                        │
│  [Tier 3: Ethereal Floating Cloud Layers]              │
│   - Layer 1 (High Cirrus): cirrus-high.webp (140s)     │
│     Opacity: 0.22, Top: 8%, Height: 24%                │
│   - Layer 2 (Soft Stratus): stratus-low.webp (180s)    │
│     Opacity: 0.28, Top: 60%, Height: 35%               │
│                                                        │
│  [Tier 4: Subtle Atmospheric Horizon Mist]             │
│   Linear: 180deg, transparent 0%,                      │
│           rgba(255, 255, 255, 0.30) 70%,               │
│           rgba(255, 255, 255, 0.60) 100%               │
└────────────────────────────────────────────────────────┘
```

#### A. Xác minh Kiến trúc Component `CelestialSidebarBackground`
1. **Có cần prop `isCollapsed` không?**
   - **Xác minh**: `<aside id="app-sidebar">` đã được thiết lập `overflow: hidden` và co giãn chiều rộng qua CSS class (`w-[240px]` $\leftrightarrow$ `w-[64px]`).
   - Khi đặt `CelestialSidebarBackground` vào trong `<aside>` với class `absolute inset-0 pointer-events-none overflow-hidden`, component nền sẽ **tự động co giãn theo kích thước của thẻ cha** thông qua CSS layout engine.
   - **Quyết định**: **KHÔNG cần prop `isCollapsed`**. Việc loại bỏ prop này ngăn chặn re-render không cần thiết khi người dùng toggle sidebar, giảm rủi ro gián đoạn animation.
2. **Tái sử dụng Cấu trúc Dải mây (Cloud Strip):**
   - Tái sử dụng trực tiếp các asset WebP đã có trong `frontend/public/assets/celestial/clouds/`:
     - `cirrus-high.webp` (69 kB) cho tầng cao.
     - `stratus-low.webp` (41 kB) cho tầng thấp.
   - Cấu trúc 200% width strip (`celestial-cloud-strip`) với 2 bản sao (Segment A & B) trôi tuyến tính lặp lại vô tận.
   - Tái sử dụng keyframes `celestial-drift` hiện có từ `celestial.css` thay vì tạo keyframes dư thừa.

#### B. Xác minh Tích hợp DOM Sidebar
- **Vị trí tích hợp**: Đặt `<CelestialSidebarBackground />` bên trong `<aside id="app-sidebar">` trong `frontend/src/components/ui/sidebar.tsx`.
- **Thứ tự Stacking Context & Z-Index**:
  - `CelestialSidebarBackground`: `absolute inset-0 z-0 pointer-events-none select-none`.
  - Nội dung Sidebar (Header, Content list, Footer): Đảm bảo nằm ở `relative z-10` để mọi thao tác click, cuộn, kéo thả không bị ảnh hưởng.

### 3.3. Không gian Bầu trời Khi Sidebar Thu gọn (Collapsed 64px Atmosphere)

Không giả định rằng thiết kế ở 240px sẽ tự động tối ưu ở 64px. Khi thu gọn còn 64px:
1. **Gradient & Tán xạ**: Giữ nguyên gradient Rayleigh `#84C2F5` $\to$ `#C8E8FC` $\to$ `#F4FAFF` để đảm bảo tính liên tục của bầu trời với `ChatArea`.
2. **Quầng sáng Mặt trời**: Ánh sáng hướng tâm tỏa từ góc trên phải ($100\% \times 0\%$) không được làm lóa biểu tượng logo đầu rồng thu gọn hoặc nút New Chat (+).
3. **Mây WebP ở 64px**:
   - Sử dụng CSS selector container trạng thái có sẵn: `aside[data-collapsed="true"] .celestial-sidebar-cloud-layer` để giảm nhẹ opacity mây ($0.15 - 0.20$).
   - Giúp khung hẹp 64px không bị rối mắt (visual clutter), đảm bảo các icon tròn (New chat, History, User avatar) nổi bật sắc nét.
   - Không thêm React state hay props mới để điều khiển mây khi thu gọn.
4. **Bắt buộc Kiểm chứng Bằng Ảnh Chụp Riêng Biệt**:
   - Screenshot 1: Sidebar Expanded ($240\text{px}$) — `sidebar-expanded-240px.png`.
   - Screenshot 2: Sidebar Collapsed ($64\text{px}$) — `sidebar-collapsed-64px.png`.
   - Screenshot 3: Mobile Drawer ($390\text{px}$) — `sidebar-mobile-drawer.png`.

### 3.4. Tách biệt Trạng thái trong `ThemeSelector`

Tách biệt hoàn toàn giữa **Selected state**, **Hover state**, và **Keyboard Focus state**, có CSS scoping nghiêm ngặt:

1. **Light Theme Option Card**:
   - **Selected (`isSelected === true`)**:
     - Viền: `border-amber-400/80`
     - Nền: `bg-gradient-to-r from-amber-50/95 via-orange-50/60 to-amber-50/30`
     - Checkmark: `bg-amber-500/15 text-amber-700`
   - **Hover (`:hover` khi `isSelected === false`)**:
     - Scoped selector: `:is(:root:not(.dark):not(.zyricon), [data-theme='light']) .theme-option-card:not([aria-selected="true"]):hover`
     - Viền: `border-amber-300/60`
     - Nền: `bg-amber-50/40`
   - **Hover trên Selected (`:hover` khi `isSelected === true`)**:
     - Giữ nguyên viền và nền selected, chỉ áp dụng hiệu ứng micro-interaction trên icon (`scale(1.1)`), không làm mờ hoặc mất nhận diện thẻ đang chọn.
2. **Dark Theme Option Card**:
   - Giữ nguyên selector hiện có tại `ThemeSelector.css:146–154` với tone `indigo/purple`.
3. **Zyricon Theme Option Card**:
   - Giữ nguyên tone tím hồng `#C27595` và gradient đặc thù.
4. **Keyboard Focus-Visible**:
   - Áp dụng `focus-visible:ring-2 focus-visible:ring-amber-500` riêng biệt, không dùng selector hover chung.

### 3.5. Chuẩn hóa Nút Send & Stop trong `ExpandedEditorModal.tsx`
- **Nút Send (Light Theme)**:
  - Đồng bộ với `ChatInput.tsx:987`: `bg-gradient-to-r from-[#D97706] to-[#C2410C] hover:from-[#B45309] hover:to-[#9A3412] text-white shadow-md shadow-amber-600/25` (Option A) hoặc bắt đầu từ `#B45309` (Option B, tùy thuộc lựa chọn của người dùng tại M2).
  - Focus ring: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-600`.
- **Nút Stop (Semantic Danger)**:
  - Thay thế màu đỏ không chuẩn `#B91E2B` bằng màu đỏ ngữ nghĩa chuẩn `bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500`.
  - Giữ nguyên 100% logic `onStop`, icon hình vuông dừng phát sóng, và thuộc tính trợ năng.
- **Bảo toàn chức năng**: Giữ nguyên logic xử lý Markdown preview, tabs Write/Preview, logic streaming, phím tắt Escape/Ctrl+Enter.

---

## 4. MA TRẬN MÀU SẮC NGỮ NGHĨA & TƯƠNG PHẢN (PALETTE & STATE MATRIX)

### 4.1. Hệ thống Tiêu chuẩn WCAG Áp dụng Chính xác (WCAG Standards Clarification — R1, R3)

Tài liệu tuân thủ chuẩn **WCAG 2.1 Level AA** (tiêu chuẩn cam kết chính thức của dự án), phân biệt chính xác 4 tiêu chí:

1. **WCAG 2.1 SC 1.4.3 — Contrast (Minimum) (Level AA)**:
   - Áp dụng riêng cho **Văn bản (Text)** và **Ảnh của văn bản (Images of Text)**.
   - Yêu cầu: Tối thiểu **$4.5:1$** cho văn bản thông thường ($< 18\text{pt}$ hoặc $< 14\text{pt}$ bold); tối thiểu **$3.0:1$** cho văn bản lớn ($\ge 18\text{pt}$ / $24\text{px}$ hoặc $\ge 14\text{pt}$ / $18.66\text{px}$ bold).
2. **WCAG 2.1 SC 1.4.11 — Non-text Contrast (Level AA)**:
   - Áp dụng cho **Thành phần giao diện người dùng (User Interface Components)** và **Đối tượng đồ họa (Graphical Objects)**.
   - Yêu cầu: Tối thiểu **$3.0:1$** giữa thành phần UI/icon/trạng thái trực quan cần thiết với màu nền kề cạnh.
3. **WCAG 2.1 SC 2.4.7 — Focus Visible (Level AA)**:
   - Yêu cầu nhị phân: Bất kỳ giao diện nào có thể vận hành bằng bàn phím thì phải có chế độ hoạt động hiển thị chỉ báo focus bàn phím rõ ràng.
4. **WCAG 2.2 SC 2.4.11 — Focus Not Obscured (Minimum) (Level AA — Tiêu chuẩn bổ sung WCAG 2.2)**:
   - Yêu cầu: Khi một thành phần nhận keyboard focus, chỉ báo focus không được bị che khuất hoàn toàn bởi nội dung do tác giả tạo ra (ví dụ sticky header, modal, drawer).
   - *Lưu ý kỹ thuật quan trọng*: SC 2.4.11 **KHÔNG PHẢI** là tiêu chuẩn đo tỷ lệ tương phản 3:1. Nếu dự án đặt tiêu chí chỉ báo focus phải đạt tương phản tối thiểu $3.0:1$, đây là **Tiêu chuẩn Nghiệm thu Nội bộ của Dự án (Project Acceptance Criterion)** dựa trên nguyên tắc mở rộng của SC 1.4.11 và khuyến nghị của WCAG 2.2 SC 2.4.13 (Focus Appearance - Level AAA). Tuyệt đối không diễn đạt sai thành yêu cầu trực tiếp của SC 2.4.7 hay SC 2.4.11.

### 4.2. Nguyên tắc Bảo vệ Màu sắc Ngữ nghĩa (Semantic Color Protection)

Tuyệt đối không thay thế hàng loạt màu xanh lục bằng màu hổ phách. Tuân thủ bảng phân định ngữ nghĩa:

| Phân loại Màu | Nguyên tắc Áp dụng | Hành động Cụ thể trong Kế hoạch này |
|---|---|---|
| **Brand Accent** | Có thể đồng bộ sang Amber/Orange trong Light Theme để hài hòa với Celestial Daylight. | Chuyển dải active bar, chấm tròn Header badge, và Send button sang Amber/Orange. |
| **Focus Ring** | Có thể chuyển sang Amber nếu đạt tương phản $\ge 3:1$ với nền kề cạnh. | Chuyển các focus rings legacy `#1B8F3D` sang `ring-amber-600`. |
| **Active Indicator** | Đại diện cho trạng thái giao diện được kích hoạt. | Vạch dọc active bar đổi sang gradient Amber/Orange. |
| **Success Indicator** | BẮT BUỘC giữ màu xanh lục mang ý nghĩa thành công. | **GIỮ NGUYÊN** mọi thông báo thành công, icon check hoàn thành (Green 600 / Emerald). |
| **Error / Danger** | BẮT BUỘC giữ màu đỏ mang ý nghĩa cảnh báo nguy hiểm / dừng tác vụ. | Nút Stop trong modal dùng `bg-rose-600`. Nút xóa đoạn chat giữ tone đỏ. |
| **Warning Indicator** | BẮT BUỘC giữ màu vàng/cam mang ý nghĩa cảnh báo thận trọng. | Giữ nguyên các cảnh báo hệ thống. |
| **Workspace Status** | Phải xác minh ý nghĩa trước khi thay đổi. | Đã xác minh là decorative brand accent (`aria-hidden="true"`); đồng bộ Amber trong Light. |

### 4.3. Bảng Palette Màu & Phân loại Số liệu Tương phản Chính xác (R1, R2)

> [!NOTE]
> **Quy định Phân loại Số liệu Tương phản**:
> - `Design target`: Ngưỡng tiêu chuẩn thiết kế hướng tới theo WCAG 2.1 AA.
> - `Calculated estimate`: Kết quả tính toán giải tích dựa trên mã màu hex đã biết và công thức linearized sRGB (làm tròn 4 chữ số thập phân).
> - `Measured result`: Kết quả đo đạc thực tế từ pixel ảnh render (sẽ được ghi nhận trong báo cáo Milestone M5).
> 
> *Công thức*: Độ chói tương đối $L$ tính từ linearized sRGB theo chuẩn WCAG 2.1. Màu có alpha phải được alpha composite lên nền trước khi tính. Không coi giá trị alpha $0.95$ là $L = 0.95$.

| Token Thiết kế | Giá trị Màu Hex / RGBA | Ngữ cảnh Ứng dụng | Phân loại Số liệu | Relative Luminance ($L$) & Contrast Tính toán | Trạng thái Nghiệm thu |
|---|---|---|---|---|:---:|
| **Sky Zenith** | `#84C2F5` | Nền đỉnh Sidebar (0%) | Calculated estimate | $L = 0.5008$ (chính xác: $0.500817$) | N/A (Màu nền) |
| **Sky Mid-Tone** | `#C8E8FC` | Nền giữa Sidebar (50%) | Calculated estimate | $L = 0.7702$ (chính xác: $0.770209$) | N/A (Màu nền) |
| **Sky Horizon Mist** | `#F4FAFF` | Nền đáy Sidebar (100%) | Calculated estimate | $L = 0.9482$ (chính xác: $0.948243$) | N/A (Màu nền) |
| **Primary Text** | `#0F172A` (Slate 900) | Tiêu đề chat, tên user | Calculated estimate | $L = 0.0088$ (chính xác: $0.008815$)<br>Contrast trên `#FFFFFF`: **$17.85:1$** *(Target: SC 1.4.3 $\ge 4.5:1$)* | `PENDING VERIFICATION` |
| **Secondary Text** | `#475569` (Slate 600) | Nhãn ngày, thời gian | Calculated estimate | $L = 0.0886$ (chính xác: $0.088565$)<br>Contrast trên `#FFFFFF`: **$7.58:1$** *(Target: SC 1.4.3 $\ge 4.5:1$)* | `PENDING VERIFICATION` |
| **Secondary on Sky** | `#334155` (Slate 700) | Nhãn ngày trên nền trời | Calculated estimate | $L = 0.0514$ (chính xác: $0.051403$)<br>Contrast trên `#C8E8FC`: **$8.09:1$** *(Target: SC 1.4.3 $\ge 4.5:1$)* | `PENDING VERIFICATION` |
| **Amber 600** | `#D97706` | Đầu gradient nút Send / Active | Calculated estimate | $L = 0.2796$ (chính xác: $0.279585$)<br>Contrast với `#FFFFFF`: **$3.19:1$** *(Icon SC 1.4.11 PASS)* | `PENDING VERIFICATION` |
| **Orange 700** | `#C2410C` | Đuôi gradient nút Send | Calculated estimate | $L = 0.1528$ (chính xác: $0.152765$)<br>Contrast với `#FFFFFF`: **$5.18:1$** *(Text SC 1.4.3 PASS)* | `PENDING VERIFICATION` |
| **Amber 700** | `#B45309` | Lựa chọn Option B nút Send | Calculated estimate | $L = 0.1591$ (chính xác: $0.159095$)<br>Contrast với `#FFFFFF`: **$5.02:1$** *(Text SC 1.4.3 PASS)* | `PENDING VERIFICATION` |

#### Đánh giá Chi tiết: Nút Send trong `ExpandedEditorModal.tsx` (R2)
1. **Phép tính Độ chói và Tương phản đối với Chữ Trắng (`#FFFFFF`):**
   - Tại `#D97706` (Amber 600): Contrast là **$3.19:1$** ($3.1858:1$).
   - Tại `#C2410C` (Orange 700): Contrast là **$5.18:1$** ($5.1784:1$).
   - Tại `#B45309` (Amber 700): Contrast là **$5.02:1$** ($5.0216:1$).
2. **Phân biệt Rạch ròi Tiêu chuẩn Text vs Non-text:**
   - **Văn bản thông thường ("Gửi", $12\text{px}$ font-semibold)**: Yêu cầu SC 1.4.3 là tối thiểu **$4.5:1$**. Trên nền `#D97706`, chữ trắng chỉ đạt $3.19:1$ nên **KHÔNG ĐẠT** chuẩn WCAG 2.1 Level AA cho text.
   - **Biểu tượng đồ họa (SVG icon mũi tên)**: Yêu cầu SC 1.4.11 là tối thiểu **$3.0:1$**. Trên nền `#D97706`, icon đạt $3.19:1 \ge 3.0:1$ nên **ĐẠT** chuẩn WCAG 2.1 Level AA cho non-text.
   - *Quy tắc bắt buộc*: Không được lấy kết quả đạt chuẩn của icon để tuyên bố thay cho text.
3. **Phân tích Gradient Đa điểm (Không chỉ đo hai đầu Endpoint):**
   - Dọc theo gradient `#D97706 \to #C2410C`, độ chói $L$ giảm dần từ $0.2796$ xuống $0.1528$. Tỷ lệ tương phản tăng dần từ $3.19:1$ lên $5.18:1$.
   - Vùng bất lợi nhất (worst-case zone) nằm ở điểm bắt đầu gradient (0% đến 40% chiều rộng nút), nơi tương phản $< 4.5:1$.
4. **Hai Phương án Thiết kế Giữ lại tại Approval Gate M2 (Không tự ý quyết định thay người dùng):**
   - **Option A (Ưu tiên Nhận diện Thương hiệu)**: Giữ gradient `from-[#D97706] to-[#C2410C]` đồng bộ 100% với `ChatInput.tsx:987` đã nghiệm thu. Ghi nhận rõ: Icon đạt SC 1.4.11 ($3.19:1 \ge 3:1$); text đạt $3.19:1 \to 5.18:1$ (đạt SC 1.4.3 ở nửa sau của nút).
   - **Option B (Ưu tiên Tuân thủ Text Contrast Tuyệt đối)**: Bắt đầu gradient từ `#B45309` (`from-[#B45309] to-[#C2410C]`). Khi đó cả hai đầu và toàn bộ gradient đều có contrast với chữ trắng $\ge 5.02:1$, đảm bảo $100\%$ diện tích văn bản đạt SC 1.4.3 Level AA.

#### Đánh giá Chi tiết: Focus Ring và Điều kiện Áp dụng `ring-offset-white` (R3)
- **Tương phản của `#D97706` trên các nền thực tế:**
  - Trên thẻ trắng (`#FFFFFF`): **$3.19:1 \ge 3.0:1$** (Đạt yêu cầu non-text).
  - Trên chân trời sáng (`#F4FAFF`): **$3.03:1 \ge 3.0:1$** (Đạt yêu cầu non-text).
  - Trên vùng trời giữa (`#C8E8FC`): **$2.49:1 < 3.0:1$** (Không đạt yêu cầu non-text).
  - Trên đỉnh trời xanh (`#84C2F5`): **$1.67:1 < 3.0:1$** (Không đạt yêu cầu non-text).
- **Điều kiện Xác minh Thực nghiệm Bắt buộc đối với `ring-offset-white`:**
  Đề xuất `focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white` chỉ được công nhận sau khi kiểm chứng đủ 7 điều kiện thực tế:
  1. *Xác nhận DOM/CSS Box Model*: Kiểm tra computed style xác nhận trình duyệt thực sự render lớp offset trắng (box-shadow đa tầng).
  2. *Độ rộng hiển thị*: Độ rộng offset tối thiểu đạt 2px rõ ràng bằng mắt thường.
  3. *Không bị Clipping*: Xác minh vòng ring-offset không bị cắt cụt (clipping) bởi các ancestor container có `overflow: hidden` (đặc biệt trong khung hẹp 64px của collapsed sidebar hoặc mép card).
  4. *Kiểm tra trên Nền Mây*: Kiểm tra vị trí nút bấm khi có dải mây WebP trôi ngang qua phía sau.
  5. *Đa bề mặt*: Kiểm tra focus trên nền trắng, nền sky gradient, và nền dialog.
  6. *Điều hướng Bàn phím Thực tế*: Kiểm tra bằng phím Tab liên tục trong trình duyệt thật.
  7. *Đo đạc Pixel Screenshot*: Đo lường trực tiếp trên ảnh chụp màn hình độ phân giải 1:1, không chỉ dựa vào CSS text.
  - *Phương án dự phòng*: Nếu một thành phần cụ thể bị clipping lớp offset trắng, áp dụng phương án thay thế: sử dụng màu focus ring đậm hơn (`#9A3412` — Orange 800, $L = 0.0818$, tương phản trên `#84C2F5` đạt $4.24:1 \ge 3:1$) mà không cần offset.

---

## 5. KIẾN TRÚC HIỆU NĂNG & ĐỘNG LỰC HỌC (PERFORMANCE & ANIMATION ARCHITECTURE — R5)

### 5.1. Các Nguyên tắc Kỹ thuật Khách quan (Pure 2D CSS/SVG/WebP Rendering)

> [!IMPORTANT]
> **Tuyên bố Kiến trúc Hiệu năng Chính xác**:
> Toàn bộ nền trời Celestial Sidebar sử dụng **Pure 2D CSS/SVG/WebP rendering. Browser compositing and GPU utilization are implementation-dependent.** Tuyệt đối không đưa ra các cam kết tuyệt đối chưa có cơ sở như "GPU-accelerated", "Hardware-accelerated compositing", hay "Guaranteed smooth 60 FPS/120 FPS".

1. **Về CSS Transform & Opacity:**
   - Thuộc tính `transform` và `opacity` được ưu tiên sử dụng cho animation trôi mây và quầng sáng vì chúng thường được trình duyệt đưa sang Compositor Thread để xử lý, hạn chế kích hoạt layout hay paint lại toàn trang.
   - Tuy nhiên, điều này phụ thuộc vào implementation của từng trình duyệt và cấu hình phần cứng cụ thể, không mặc nhiên đảm bảo 100% không ảnh hưởng main thread. Phải theo dõi CPU/GPU thực tế trong quá trình nghiệm thu.
2. **Về Vòng đời Component & `React.memo`:**
   - `React.memo` giúp ngăn re-render khi các props không đổi ở cùng vị trí cây DOM.
   - `React.memo` **không bảo đảm** component giữ nguyên instance hoặc không bị unmount/remount nếu container cha (`aside`) bị thay đổi cấu trúc hoặc re-mount. Bắt buộc có assertion kiểm tra lifecycle mount/unmount trong automated test.
3. **Về Bộ nhớ và Asset WebP:**
   - Việc trình duyệt lưu cache file ảnh WebP giúp giảm tải băng thông mạng (network request).
   - Tuy nhiên, việc giải mã ảnh (image decoding) và duy trì layer trong bộ nhớ đồ họa **vẫn tạo ra chi phí tài nguyên nhất định**. Giới hạn số lượng dải mây trong Sidebar ở mức 2 dải mây nhẹ (`cirrus-high.webp` và `stratus-low.webp`, tổng dung lượng $< 110\text{ kB}$).
4. **Về Layer Compositing Hacks:**
   - **Tuyệt đối không tự ý thêm** `will-change: transform`, `translateZ(0)` hoặc các GPU hacks trên các thành phần khi chưa có bằng chứng thực nghiệm chứng minh sự cần thiết, nhằm tránh lãng phí VRAM.
5. **Về Công nghệ Đồ họa:**
   - Sidebar sử dụng 100% 2D CSS background và WebP assets. Tuyệt đối không nhúng Three.js, WebGL hay custom canvas shader vào Sidebar.

### 5.2. Tuân thủ Trợ năng Chuyển động Giảm thiểu (`prefers-reduced-motion`)

```css
@media (prefers-reduced-motion: reduce) {
  .celestial-sidebar-cloud-strip {
    animation: none !important;
    transform: translate3d(0, 0, 0) !important;
  }
  .celestial-sidebar-sun-glow {
    animation: none !important;
  }
}
```
Khi người dùng bật chế độ giảm chuyển động trong hệ điều hành:
- Toàn bộ animation trôi mây và nhấp nháy ánh nắng dừng lại tức thì.
- Nền trời tĩnh vẫn giữ nguyên độ sâu chuyển sắc và vị trí mây hài hòa, không biến mất hay gây lỗi hiển thị.

---

## 6. KẾ HOẠCH TRIỂN KHAI THEO MILESTONES (IMPLEMENTATION MILESTONES)

Kế hoạch chia làm 5 milestones độc lập, tuần tự và có cổng kiểm soát (approval gate) ở từng bước:

```mermaid
flowchart TD
    M1["Milestone M1: Header Indicator & Theme Selector Polish"] --> Gate1{Review & Accept M1}
    Gate1 -->|Approved| M2["Milestone M2: Send Button in Expanded Modal & Conditional Focus Ring Cleanup"]
    Gate1 -->|Rejected| M1
    M2 --> Gate2{Review & Accept M2}
    Gate2 -->|Approved| M3["Milestone M3: Core CelestialSidebarBackground Component & CSS"]
    Gate2 -->|Rejected| M2
    M3 --> Gate3{Review & Accept M3}
    Gate3 -->|Approved| M4["Milestone M4: Sidebar Integration & Readability Polish"]
    Gate3 -->|Rejected| M3
    M4 --> Gate4{Review & Accept M4}
    Gate4 -->|Approved| M5["Milestone M5: Verification & Zero Regression Sign-off"]
    Gate4 -->|Rejected| M4
```

> [!IMPORTANT]
> **Quy tắc Kiểm soát Tiến độ Nghiêm ngặt**:
> - Mỗi milestone chỉ được bắt đầu sau khi người dùng phê duyệt riêng bằng văn bản.
> - Tuyệt đối không tự động chuyển sang milestone tiếp theo nếu milestone hiện tại chưa được nghiệm thu.
> - Tuyệt đối không triển khai dồn dập toàn bộ M1–M5 trong một lần chạy.

---

### Milestone M1: Header Indicator & Theme Selector Polish
- **Mục tiêu**: Đồng bộ dấu chấm tròn `AI Workspace` trên Header sang tone Amber và chuẩn hóa trạng thái hover/selected của `ThemeSelector` trong Light Theme mà không ảnh hưởng Dark/Zyricon.
- **Allowed Files**:
  - `frontend/src/components/ChatArea.tsx`
  - `frontend/src/components/ThemeSelector.tsx`
  - `frontend/src/components/ThemeSelector.css`
- **Out-of-Scope Files**: Toàn bộ files Sidebar, Composer, Backend, ThemeStore, Three.js.
- **Nội dung công việc**:
  1. `ChatArea.tsx:528`: Cập nhật dấu chấm tròn sang `from-[#F59E0B] to-[#EA580C]` và viền `border-amber-200/70` cho Light Theme. Giữ nguyên 100% Dark và Zyricon.
  2. `ThemeSelector.tsx`: Điều chỉnh thẻ "Light": khi `isSelected === true`, áp dụng viền `border-amber-400/80` và nền `bg-gradient-to-r from-amber-50/95 via-orange-50/60 to-amber-50/30`.
  3. `ThemeSelector.css`: Thêm rule CSS hover có scope nghiêm ngặt cho Light Theme option cards, tách biệt hoàn toàn với Dark và Zyricon.
- **Explicit PASS Criteria**:
  - Header badge dot hiển thị màu hổ phách trên Light mode, màu tím trên Dark/Zyricon.
  - Hover chuột trên thẻ Light trong ThemeSelector không làm mất nhận diện thẻ đang chọn, không dùng màu tím của Dark.
  - Test suite `ThemeSelector.test.tsx` pass 100%.
- **Explicit FAIL Criteria**:
  - Màu hổ phách rò rỉ sang Dark hoặc Zyricon.
  - Thẻ đang chọn bị mất viền hoặc mất nhận diện khi hover chuột qua.
- **Required Evidence**:
  - Screenshot ThemeSelector ở 5 trạng thái (Light selected, Light hover, Dark selected, Dark hover, keyboard focus).
  - Test runner output của `ThemeSelector.test.tsx`.
- **User Approval Gate**: Dừng lại, báo cáo bằng chứng M1 và chờ người dùng phê duyệt trước khi sang M2.

---

### Milestone M2: Send Button in Expanded Modal & Conditional Focus Ring Cleanup
- **Mục tiêu**: Loại bỏ triệt để màu xanh lục cũ `#1B8F3D` trên Send button khi mở rộng composer; audit và xử lý có điều kiện các focus rings legacy.
- **Allowed Files**:
  - *Required*: `frontend/src/components/chat/ExpandedEditorModal.tsx`
  - *Required*: `frontend/src/components/Sidebar.tsx` (chỉ sửa focus ring nút footer và mobile close)
  - *Conditional*: `frontend/src/components/chat/NewChatButton.tsx` (chỉ sửa focus ring nếu audit chứng minh cần thiết)
  - *Conditional*: `frontend/src/components/chat/SearchChatButton.tsx` (chỉ sửa focus ring nếu audit chứng minh cần thiết)
- **Out-of-Scope Files**: Bố cục Sidebar, logic chat, ChatInput chính, Backend.
- **Nội dung công việc**:
  1. `ExpandedEditorModal.tsx:781`: Đồng bộ nút Send trong Light Theme theo Option A (`from-[#D97706] to-[#C2410C]`) hoặc Option B (`from-[#B45309] to-[#C2410C]`) theo phê duyệt của người dùng tại cổng M2.
  2. `ExpandedEditorModal.tsx:778`: Đổi nút Stop trong modal sang màu đỏ ngữ nghĩa `bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500`.
  3. Dọn dẹp focus rings legacy `#1B8F3D` trên các tab và nút phụ trong `ExpandedEditorModal.tsx` và `Sidebar.tsx:391, 751`, chuyển sang `ring-amber-600`.
  4. **Conditional Audit**: Kiểm tra focus ring của `NewChatButton.tsx` và `SearchChatButton.tsx`. Chỉ sửa khi có bằng chứng thực nghiệm vi phạm SC 1.4.11 hoặc SC 2.4.7.
- **Explicit PASS Criteria**:
  - Nút Send trong modal mở rộng mang dải gradient Amber/Orange đã duyệt.
  - Nút Stop mang màu `bg-rose-600`.
  - Không còn mã màu `#1B8F3D` trong `ExpandedEditorModal.tsx`.
- **Explicit FAIL Criteria**:
  - Chức năng gửi tin nhắn, dừng streaming hoặc phím tắt trong modal bị lỗi.
  - Tự ý thay đổi kiểu dáng, kích thước nút New Chat/Search Chat.
- **Required Evidence**:
  - Screenshot modal mở rộng ở trạng thái bình thường và streaming.
  - DOM inspection xác nhận loại bỏ hoàn toàn `#1B8F3D`.
- **User Approval Gate**: Dừng lại, báo cáo bằng chứng M2 (kèm lựa chọn Option A hoặc B) và chờ người dùng phê duyệt trước khi sang M3.

---

### Milestone M3: Xây dựng Core Component `CelestialSidebarBackground`
- **Mục tiêu**: Tạo mới component nền trời chuyên biệt cho thanh bên, tích hợp dải màu Rayleigh, ánh dương hướng tâm và mây WebP trôi chậm.
- **Allowed Files**:
  - `frontend/src/theme/celestial/CelestialSidebarBackground.tsx` (Tạo mới)
  - `frontend/src/theme/celestial/CelestialSidebarBackground.test.tsx` (Tạo mới)
  - `frontend/src/theme/celestial/celestial.css` (Bổ sung scoped classes)
- **Out-of-Scope Files**: Toàn bộ files UI Sidebar hiện tại (chưa tích hợp ở M3), ChatBackground.tsx.
- **Nội dung công việc**:
  1. Xây dựng component `CelestialSidebarBackground` không nhận prop `isCollapsed`, tự co giãn theo container cha bằng CSS.
  2. Nền dự phòng `background-color: #C8E8FC` chống unpainted frame.
  3. Dải Rayleigh dọc (`#84C2F5` $\to$ `#C8E8FC` $\to$ `#F4FAFF`).
  4. Quầng sáng mặt trời radial tỏa từ góc trên bên phải ($100\% \times 0\%$).
  5. 2 dải mây WebP (`cirrus-high.webp` và `stratus-low.webp`) tái sử dụng keyframes `celestial-drift` hiện có.
  6. Xử lý tắt chuyển động sạch dưới `@media (prefers-reduced-motion: reduce)`.
- **Explicit PASS Criteria**:
  - Unit test `CelestialSidebarBackground.test.tsx` pass 100% (render đúng DOM, load đúng đường dẫn asset WebP, xử lý reduced motion đúng chuẩn).
  - 0 console error hoặc memory leak warning.
- **Explicit FAIL Criteria**:
  - Component lỗi cú pháp, thiếu file WebP, hoặc gây lag khi render độc lập.
- **Required Evidence**:
  - Test runner output của `CelestialSidebarBackground.test.tsx`.
- **User Approval Gate**: Dừng lại, báo cáo bằng chứng M3 và chờ người dùng phê duyệt trước khi sang M4.

---

### Milestone M4: Tích hợp Sidebar Background & Nâng cấp Khả năng Đọc
- **Mục tiêu**: Gắn `CelestialSidebarBackground` vào Sidebar và tinh chỉnh tối thiểu độ tương phản để nội dung dễ đọc; tuyệt đối không redesign Sidebar.
- **Allowed Files**:
  - *Required*: `frontend/src/components/ui/sidebar.tsx`
  - *Required*: `frontend/src/components/Sidebar.tsx`
  - *Conditional*: `frontend/src/index.css` (chỉ sửa nếu Tailwind tokens hiện có không đủ đảm bảo tương phản)
- **Out-of-Scope Files**: Bố cục DOM, spacing, kích thước nút, logic chat history, user profile.
- **Nội dung công việc**:
  1. `sidebar.tsx`: Gắn `<CelestialSidebarBackground />` vào bên trong `<aside id="app-sidebar">`, chỉ kích hoạt khi `theme === 'light'`.
  2. Đảm bảo z-index: background ở `z-0 pointer-events-none`, nội dung ở `relative z-10`.
  3. Thẻ chat đang chọn: nền trắng mờ `bg-white/95`, viền `border-amber-300`, vạch active bar `from-[#F59E0B] to-[#EA580C]`.
  4. Thẻ chat chưa chọn: giữ nguyên nếu đã đọc rõ; nếu cần, tinh chỉnh nhẹ sang `bg-white/40` (hover `bg-white/80`).
  5. Đảm bảo không gian bầu trời khi collapsed 64px (`data-collapsed="true"`) giảm opacity mây để không gây nhiễu icons.
- **Explicit PASS Criteria**:
  - Toàn bộ văn bản danh sách chat, nhãn ngày, tên user đạt tương phản $\ge 4.5:1$.
  - Background không che khuất hoặc chặn sự kiện click chuột (`pointer-events: none`).
  - Co giãn desktop 240px $\leftrightarrow$ 64px và mobile drawer hoạt động mượt mà.
- **Explicit FAIL Criteria**:
  - Thay đổi kích thước, padding hoặc layout của danh sách chat.
  - Chữ bị chìm vào nền mây hoặc ánh nắng.
- **Required Evidence (Before / After Evidence)**:
  - Screenshot Before & After cho từng thay đổi giao diện.
  - Kết quả đo contrast giải tích trên nền thực tế.
  - Xác nhận không có thoái lui về tương tác (click, scroll).
- **User Approval Gate**: Dừng lại, báo cáo bằng chứng M4 và chờ người dùng phê duyệt trước khi sang M5.

---

### Milestone M5: Kiểm thử Tự động, Đo kiểm Tương phản & Nghiệm thu Không Thoái lui
- **Mục tiêu**: Kiểm chứng toàn diện 14 tiêu chí nghiệm thu bằng automated Playwright tests, đo lường pixel black flash theo chuẩn Phase 4, chạy toàn bộ test suite động, và kiểm tra hồi quy tương tác.
- **Allowed Files**:
  - `e2e/celestial-sidebar-light.spec.ts` (Tạo mới)
  - `docs/celestial-daylight/SIDEBAR_LIGHT_THEME_IMPLEMENTATION_REPORT.md` (Tạo mới sau khi hoàn thành)
- **Out-of-Scope Files**: Mã nguồn ứng dụng (giai đoạn nghiệm thu chỉ viết test và tài liệu báo cáo).
- **Nội dung công việc**:
  1. Viết suite Playwright `celestial-sidebar-light.spec.ts` kiểm tra 14 kịch bản AC và 9 kịch bản tương tác.
  2. Chụp ảnh kiểm chứng tại 5 viewports tiêu chuẩn và 3 không gian Sidebar (Expanded 240px, Collapsed 64px, Mobile Drawer).
  3. Đo lường tỷ lệ Blackout Pixel theo chuẩn Phase 4 ($L \le 0.0100$) trên các khung hình lấy mẫu chuyển động thực tế. Tạo ảnh `roi-verification.png`.
  4. Đo lường tỷ lệ tương phản thực nghiệm từ screenshot rendered pixels.
  5. Chạy toàn bộ Vitest suite và Zyricon E2E tests hiện có; ghi nhận số lượng test Passed/Failed/Skipped thực tế.
  6. Kiểm tra `tsc -b && vite build`.
- **Explicit PASS Criteria**:
  - Toàn bộ 14 AC đạt `PASS` dựa trên bằng chứng kiểm thử thực tế.
  - $\text{BlackoutRatio} = 0.00\%$ trên toàn bộ các khung hình lấy mẫu chuyển động.
  - Toàn bộ test suite hiện có pass 100%, 0 test bị xóa hoặc làm yếu assertion.
  - 0 hồi quy trên Dark Theme và Zyricon.
- **Explicit FAIL Criteria**:
  - Xuất hiện Blackout Pixel ($L \le 0.0100$) trong vùng ROI Sidebar.
  - Bất kỳ test hồi quy nào thất bại.
- **Required Evidence**:
  - Báo cáo nghiệm thu hoàn chỉnh kèm ảnh chụp ROI, biểu đồ đo chói, và logs thực thi.
- **User Approval Gate**: Trình nộp báo cáo nghiệm thu cuối cùng để người dùng chính thức đóng giai đoạn.

---

## 7. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

> [!WARNING]
> **Quy tắc Quản lý Trạng thái Acceptance Criteria**:
> - `NOT STARTED`: Chưa triển khai (toàn bộ 14 AC tại bản Revision 1.2.1 này đều ở trạng thái này).
> - `PENDING VERIFICATION`: Đã viết code nhưng chưa có đầy đủ bằng chứng kiểm thử thực tế.
> - `PASS`: Chỉ được công nhận khi có đầy đủ bằng chứng kiểm thử thực tế (ảnh chụp screenshot, logs test runner, số liệu pixel đo đạc có thể tái lập).
> - `FAIL`: Khi kết quả kiểm thử không đáp ứng chỉ tiêu kỹ thuật.
> 
> Tuyệt đối không chuyển trạng thái sang `PASS` dựa trên kế hoạch thiết kế, code chưa chạy test, computed CSS đơn thuần, hoặc báo cáo tự nhận không có bằng chứng.

| Mã AC | Tiêu chí Nghiệm thu | Chỉ tiêu Kỹ thuật Cụ thể | Bằng chứng Thực nghiệm Bắt buộc Để Nghiệm thu | Trạng thái Hiện tại |
|---|---|---|---|:---:|
| **AC-01** | **Sidebar Sky Harmony** | Sidebar mang nền trời Rayleigh `#84C2F5` $\to$ `#C8E8FC` $\to$ `#F4FAFF`, hòa hợp quang học với ChatArea, loại bỏ nền xám phẳng `#F0F3F7`. | Screenshot so sánh cạnh nhau giữa Sidebar và ChatArea ở viewport $1440\times 900$; kiểm tra computed styles. | `NOT STARTED` |
| **AC-02** | **Multi-tier Cloud Drift** | Có 2 tầng mây WebP độc lập trôi chậm (140s và 180s), tạo chiều sâu không gian, không che khuất chữ. | Ảnh WebP load thành công (`naturalWidth > 0`); animation CSS active; video/screenshot ghi nhận vị trí trôi. | `NOT STARTED` |
| **AC-03** | **Directional Sunlight Glow** | Ánh dương tỏa nhẹ từ góc trên bên phải thanh bên ($100\% \times 0\%$), tạo sự liên tục với mặt trời điện ảnh ở ChatArea. | Computed radial-gradient góc $100\% \times 0\%$; screenshot pixel kiểm tra độ sáng. | `NOT STARTED` |
| **AC-04** | **Sidebar Content Contrast** | Tiêu đề chat, tên user đạt tương phản $\ge 4.5:1$ (SC 1.4.3); nhãn nhóm ngày đạt $\ge 4.5:1$ trên nền trời và nền thẻ. | Kết quả đo lường linearized sRGB luminance trên ảnh screenshot thực tế tại các điểm kiểm tra. | `NOT STARTED` |
| **AC-05** | **Expanded Send Button Harmony** | Nút Send trong `ExpandedEditorModal` mang gradient hổ phách đã duyệt (Option A hoặc B), không còn mã màu `#1B8F3D`. | DOM inspection thuộc tính class và computed background của nút Send trong modal mở rộng. | `NOT STARTED` |
| **AC-06** | **Stop Button Semantic Danger** | Nút Stop trong modal mở rộng mang màu đỏ ngữ nghĩa `bg-rose-600 hover:bg-rose-700`, bảo toàn trạng thái dừng streaming. | DOM inspection khi trạng thái streaming đang diễn ra trong modal mở rộng. | `NOT STARTED` |
| **AC-07** | **Theme Selector State Separation** | Thẻ Light khi chọn hiển thị viền/nền hổ phách; hover Light không dùng màu tím của Dark; hover không làm mất nhận diện selected state. | Playwright interaction test: kiểm tra DOM class và computed color ở cả 5 trạng thái (Light sel/unsel, Dark sel/unsel, focus). | `NOT STARTED` |
| **AC-08** | **Workspace Indicator Sync** | Dấu chấm tròn trên Header badge mang gradient hổ phách và viền `border-amber-200/70` trên Light mode; Dark/Zyricon giữ nguyên. | Computed gradient của indicator dot trên cả 3 themes (Light, Dark, Zyricon). | `NOT STARTED` |
| **AC-09** | **Desktop Collapse/Expand Stability** | Khi đóng/mở thanh bên ($240\text{px} \leftrightarrow 64\text{px}$), background co giãn ổn định, không unmount bất thường, tỷ lệ $\text{BlackoutRatio} = 0.00\%$ theo chuẩn Phase 4 ($L \le 0.0100$). | Phân tích pixel ROI trong các khung hình lấy mẫu chuyển động liên tục tại Playwright; lifecycle logging; file `roi-verification.png`. | `NOT STARTED` |
| **AC-10** | **Mobile Drawer Isolation** | Trên mobile ($390\text{px}$, $360\text{px}$), drawer mở trượt mượt mà, nền trời nằm trọn trong thanh bên, backdrop đen che ChatArea đúng chuẩn. | Screenshots tại viewports $390\times 844$ và $360\times 800$; click backdrop đóng drawer thành công. | `NOT STARTED` |
| **AC-11** | **Reduced Motion Compliance** | Khi bật `prefers-reduced-motion: reduce`, mây dừng trôi tĩnh tại, bố cục nền trời giữ nguyên 100%. | Playwright test giả lập media query; computed animation-name là `none`. | `NOT STARTED` |
| **AC-12** | **Dark Theme Non-Interference** | Dark Theme giữ nguyên 100% màu nền `#131923`, các ngôi sao CSS, gradient tím, và nút Send chàm/tím. | Full automated tests của Dark Theme; screenshot so sánh trước/sau khi tích hợp. | `NOT STARTED` |
| **AC-13** | **Zyricon 3D Non-Interference** | Zyricon giữ nguyên 100% Three.js canvas, shader vũ trụ, màu tím hồng `#C27595` và gradient đặc thù. | Chạy toàn bộ test suite Zyricon hiện có, ghi nhận 100% PASS. | `NOT STARTED` |
| **AC-14** | **Clean Build & Performance** | Toàn bộ Vitest suites hiện tại pass 100%, `tsc -b && vite build` hoàn thành với 0 lỗi, không có warning rò rỉ bộ nhớ. | Terminal log thực thi build và test runner sạch sẽ 0 lỗi; ghi rõ số lượng test thực tế. | `NOT STARTED` |

---

## 8. KẾ HOẠCH KIỂM THỬ TOÀN DIỆN & CHECKPOINTS (TEST PLAN)

### 8.1. Ma trận Kịch bản Kiểm thử Tự động (14 Kịch bản Cốt lõi)

1. **Kịch bản 1: Sidebar Light Theme Expanded ($1440\times 900$)**
   - Xác minh nền trời Rayleigh, ánh dương góc trên phải, mây trôi nhẹ sau danh sách chat.
   - Thẻ chat active hiển thị nền trắng `bg-white/95`, viền hổ phách, active bar vàng cam.
2. **Kịch bản 2: Sidebar Light Theme Collapsed ($1440\times 900$)**
   - Thu gọn thanh bên còn 64px. Xác minh logo, icon chat history hiển thị đúng vị trí.
   - Nền trời co lại theo chiều rộng 64px, mây giảm opacity phù hợp, không che icon hay focus ring.
3. **Kịch bản 3: Desktop Continuous Resize ($1920\text{px} \to 1280\text{px} \to 1024\text{px} \to 768\text{px}$)**
   - Co giãn cửa sổ trình duyệt liên tục. Đo lường tỷ lệ blackout pixel, đảm bảo background co giãn đàn hồi không nhấp nháy.
4. **Kịch bản 4: Mobile Drawer Open / Close ($390\times 844$)**
   - Nhấn nút hamburger mở thanh bên. Drawer trượt ra từ bên trái với đầy đủ mây trời; nhấn backdrop đóng thanh bên êm ái.
5. **Kịch bản 5: Reduced Motion Verification**
   - Giả lập `prefers-reduced-motion: reduce`. Khẳng định animation-name chuyển thành `none`, vị trí mây đứng yên, không lỗi hiển thị.
6. **Kịch bản 6: Chu trình chuyển Theme Light $\to$ Dark $\to$ Light**
   - Chuyển sang Dark Theme: Sidebar chuyển sang nền `#131923`, nền trời Celestial ẩn hoàn toàn.
   - Chuyển lại Light Theme: Bầu trời Celestial tái hiện nguyên vẹn, 0 console error.
7. **Kịch bản 7: Chu trình chuyển Theme Light $\to$ Zyricon $\to$ Light**
   - Chuyển sang Zyricon: Three.js WebGL canvas và tone tím hiển thị.
   - Chuyển lại Light: Nền trời Celestial trở lại mượt mà, WebGL được giải phóng sạch sẽ.
8. **Kịch bản 8: Send Button khi Composer Thu gọn & Mở rộng**
   - Trong `ChatInput`: Send button là gradient hổ phách.
   - Nhấn icon Expand mở `ExpandedEditorModal`: Send button trong modal là gradient hổ phách đã duyệt, không có mã màu `#1B8F3D`.
   - Nút Stop là `bg-rose-600`.
9. **Kịch bản 9: Theme Selector Popover Hover & Selected Matrix**
   - Mở dropdown ThemeSelector trên Light mode. Kiểm tra cả 5 trạng thái độc lập (Light sel/unsel, Dark sel/unsel, keyboard focus).
10. **Kịch bản 10: Workspace Indicator trên Header**
    - Kiểm tra dấu chấm tròn trên Header: mang gradient hổ phách `from-[#F59E0B] to-[#EA580C]` với viền `border-amber-200/70` trên Light mode; giữ màu tím trên Dark và Zyricon.
11. **Kịch bản 11: Kiểm thử Hồi quy Dark Theme**
    - Chạy toàn bộ các assertions giao diện Dark Theme để khẳng định không bị nhiễm bất kỳ màu hổ phách hay class light nào.
12. **Kịch bản 12: Kiểm thử Hồi quy Zyricon Theme**
    - Chạy toàn bộ test suite Zyricon hiện có, ghi nhận 100% PASS.
13. **Kịch bản 13: Đo kiểm Độ tương phản WCAG 2.1 AA Thực tế**
    - Đo độ tương phản chữ trên các thẻ chat, nhãn ngày, tiêu đề Sidebar từ screenshot thực tế: $100\%$ đạt $\ge 4.5:1$.
14. **Kịch bản 14: Đo lường Black Flash khi Đóng/Mở Sidebar**
    - Đo BlackoutRatio theo chuẩn Phase 4 ($L \le 0.0100$) trên các khung hình transition thực tế: $100\%$ đạt $0.00\%$.

### 8.2. Kịch bản Kiểm thử Hồi quy Tương tác Sidebar (Interaction Regression Suite)

Bổ sung 9 kịch bản kiểm thử hành vi tương tác thực tế để đảm bảo background không ảnh hưởng đến trải nghiệm người dùng:

1. **Click Chat Item trong khi Mây đang trôi**:
   - Chọn một cuộc hội thoại trong danh sách trong khi CSS animation mây đang chạy.
   - Assert: Sự kiện click kích hoạt tức thì, hội thoại được tải lên `ChatArea`, URL cập nhật đúng ID, không có hiện tượng trễ hoặc nuốt click.
2. **Cuộn Danh sách Hội thoại (Scroll Performance)**:
   - Cuộn danh sách chat có nhiều mục (overflow vertical scroll).
   - Assert: Danh sách cuộn mượt mà, thanh cuộn hoạt động bình thường, background mây ở layer sau giữ nguyên vị trí cố định không bị cuộn theo danh sách.
3. **Thao tác Nút New Chat**:
   - Click nút New Chat (cả ở chế độ Expanded và Collapsed).
   - Assert: Reset active chat và chuyển về Welcome Screen thành công.
4. **Thao tác Nút Search Chat**:
   - Click nút Search Chat.
   - Assert: Modal tìm kiếm mở ra đúng vị trí, input nhận focus ngay lập tức.
5. **Thao tác Các nút Chân trang (Footer Actions)**:
   - Click nút Cài đặt và Đăng xuất ở chân trang thanh bên.
   - Assert: Modal cài đặt mở ra hoặc trigger đăng xuất hoạt động đúng logic.
6. **Điều hướng Bàn phím Tuần tự (Keyboard Tab Navigation)**:
   - Nhấn phím `Tab` tuần tự qua toàn bộ Sidebar: Logo $\to$ New Chat $\to$ Search Chat $\to$ Chat list items $\to$ Footer.
   - Assert: Chỉ báo focus hiển thị rõ nét trên từng phần tử (SC 2.4.7), không bị che khuất bởi background hay container khác (WCAG 2.2 SC 2.4.11).
7. **Xác minh Pointer-Events Layer**:
   - Kiểm tra computed style của `CelestialSidebarBackground` container:
   - Assert: `pointer-events: none` tuyệt đối, mọi click/hover xuyên qua nền đến đúng phần tử bên dưới.
8. **Đóng/Mở Mobile Drawer bằng Backdrop**:
   - Trên mobile viewport, mở drawer rồi click vào lớp backdrop xám/đen bên ngoài.
   - Assert: Drawer đóng êm ái, focus trả lại nút mở menu trên header, không có rò rỉ sự kiện sang `ChatArea`.
9. **Kiểm tra Phân lớp Stacking Context**:
   - Assert: Background luôn ở `z-0`, nội dung tương tác ở `relative z-10`, header modal ở `z-50`.

### 8.3. Danh mục Checkpoints Bắt buộc Chụp ảnh

1. **5 Viewport Tiêu chuẩn**:
   - Desktop Standard: $1440\times 900$.
   - Laptop Compact: $1280\times 800$.
   - Tablet Portrait: $768\times 1024$.
   - Mobile Standard: $390\times 844$.
   - Mobile Small: $360\times 800$.
2. **3 Không gian Thanh bên**:
   - Sidebar Expanded ($240\text{px}$): `sidebar-expanded-240px.png`.
   - Sidebar Collapsed ($64\text{px}$): `sidebar-collapsed-64px.png`.
   - Mobile Drawer ($390\text{px}$): `sidebar-mobile-drawer.png`.
3. **Artifact Kiểm chứng Vùng ROI**:
   - `roi-verification.png` (ảnh chụp có khung viền ROI thể hiện rõ vị trí đo độ chói).

---

## 9. PHÂN TÍCH RỦI RO & CHIẾN LƯỢC PHÒNG NGỪA (RISKS & MITIGATIONS)

| # | Rủi ro Tiềm ẩn | Mức độ | Nguyên nhân Gốc rễ | Chiến lược Phòng ngừa & Kiểm soát Nghiêm ngặt |
|---|---|---|---|---|
| **1** | **Chữ trong Sidebar khó đọc do nền mây trời quá sáng hoặc rối mắt** | **Cao** | Mây WebP có chi tiết tương phản mạnh đè lên tiêu đề chat | Giữ opacity của dải mây trong Sidebar ở mức thấp ($0.22 - 0.28$ ở expanded, $0.15 - 0.20$ ở collapsed); bề mặt thẻ chat dùng `bg-white/95`; nhãn ngày dùng Slate 700 ($> 5.8:1$). |
| **2** | **Chớp đen (Black Flash) hoặc giật lag khi co giãn Sidebar** | **Trung bình** | Trình duyệt re-layout và vẽ lại mây khi kích thước container thay đổi đột ngột | Đặt `background-color: #C8E8FC` làm màu nền cứng; không dùng prop `isCollapsed` trong background component; đo kiểm thực tế bằng frame sampling theo chuẩn Phase 4. |
| **3** | **Rò rỉ màu hổ phách sang Dark Theme và Zyricon** | **Cao** | Sử dụng selector CSS toàn cục không có scope theme | Mọi class mới đều phải được bọc chặt chẽ trong scoped selectors: `:is(.light, [data-theme='light'])` hoặc điều kiện render React `theme === 'light'`. |
| **4** | **Phá vỡ Unit Tests hiện có của Sidebar và ThemeSelector** | **Trung bình** | Thay đổi cấu trúc thẻ HTML hoặc làm mất accessible name / role | Bảo toàn 100% các `aria-label`, `role="listbox"`, `role="option"`, `data-testid`, text accessibility hiện có. Chỉ bổ sung/sửa đổi class giao diện. |
| **5** | **Quá tải tài nguyên đồ họa do tạo quá nhiều layers** | **Thấp** | Tạo nhiều compositing layers bằng CSS hacks | Không lạm dụng `will-change: transform`; tái sử dụng 2 asset WebP đã cache sẵn; giới hạn mây ở 2 tầng mây nhẹ. |

---

## 10. PHẠM VI FILE DỰ KIẾN THAY ĐỔI (FILE CHANGE SCOPE)

Nhằm kiểm soát rủi ro và giới hạn tối đa tác động lên codebase, danh mục file được phân định thành 3 nhóm rõ rệt và nhất quán:

### 10.1. Nhóm 1: File Bắt buộc Thay đổi (Required Files — 11 Files)
1. `docs/celestial-daylight/SIDEBAR_LIGHT_THEME_HARMONIZATION_PLAN.md` — Tài liệu kế hoạch này (Revision 1.2.1).
2. `frontend/src/theme/celestial/CelestialSidebarBackground.tsx` — Component nền trời chuyên biệt cho thanh bên (Tạo mới ở M3).
3. `frontend/src/theme/celestial/CelestialSidebarBackground.test.tsx` — Unit test cho component nền trời mới (Tạo mới ở M3).
4. `frontend/src/theme/celestial/celestial.css` — Bổ sung CSS classes chuyên biệt cho Sidebar background (M3).
5. `frontend/src/components/ui/sidebar.tsx` — Gắn `<CelestialSidebarBackground />` vào `<aside id="app-sidebar">` (M4).
6. `frontend/src/components/Sidebar.tsx` — Cập nhật styling bề mặt thẻ chat, vạch active bar hổ phách, thay thế focus ring legacy `#1B8F3D` tại nút footer và mobile close (M2, M4).
7. `frontend/src/components/chat/ExpandedEditorModal.tsx` — Chuẩn hóa nút Send sang gradient hổ phách, nút Stop sang `bg-rose-600`, thay thế focus rings legacy (M2).
8. `frontend/src/components/ThemeSelector.tsx` — Tách biệt styling selected và hover cho Light Theme (M1).
9. `frontend/src/components/ThemeSelector.css` — Bổ sung CSS hover có scope cho Light Theme option cards (M1).
10. `frontend/src/components/ChatArea.tsx` — Đồng bộ dấu chấm tròn `AI Workspace` sang gradient hổ phách trong Light Theme (M1).
11. `e2e/celestial-sidebar-light.spec.ts` — Suite kiểm thử Playwright tự động cho 14 kịch bản nghiệm thu (Tạo mới ở M5).

### 10.2. Nhóm 2: File Thay đổi Có Điều kiện (Conditional Files — 3 Files)
> **Quy tắc Điều kiện Bắt buộc**:
> *Conditional file may only be modified after evidence demonstrates that the change is necessary to satisfy an approved acceptance criterion.*
1. `frontend/src/components/chat/NewChatButton.tsx` — Chỉ được sửa focus ring (`focus-visible:ring-amber-600`) nếu audit thực nghiệm chứng minh focus ring hiện tại không đạt tương phản hoặc không nhận diện được. Tuyệt đối không redesign nút.
2. `frontend/src/components/chat/SearchChatButton.tsx` — Chỉ được sửa focus ring (`focus-visible:ring-amber-600`) nếu audit thực nghiệm chứng minh cần thiết. Tuyệt đối không redesign nút.
3. `frontend/src/index.css` — Chỉ cập nhật biến CSS nếu các classes Tailwind hiện có không đủ để đảm bảo độ tương phản đọc.

### 10.3. Nhóm 3: File Tuyệt đối Không Thay đổi (Out-of-Scope Files)
1. `docs/celestial-daylight/SIDEBAR_LIGHT_THEME_PLAN.md` — Không chỉnh sửa file này.
2. `frontend/src/stores/themeStore.ts` — Đã ổn định, không thay đổi logic theme store.
3. `frontend/src/components/chat/ChatBackground.tsx` — Nền `ChatArea` đã hoàn thành và nghiệm thu ở Phase 4 & 5.
4. Toàn bộ các files Three.js, shaders, canvas, và tests của Zyricon Theme (`*zyricon*`).
5. Toàn bộ backend services, API routes, database, authentication logic.
6. `package.json` / `package-lock.json` — Không thêm bất kỳ thư viện bên thứ ba nào mới.

---

## 11. CHÍNH SÁCH KHÔNG XÂM PHẠM & BẢO TOÀN THEME (NON-INTERFERENCE POLICY)

1. **Dark Theme Non-Interference:**
   - Giữ nguyên 100% màu nền `#131923` của thanh bên Dark Theme.
   - Giữ nguyên các ngôi sao CSS, gradient chàm/tím của Dark Theme.
   - Giữ nguyên nút Send tím `from-[#4F46E5] to-[#7C3AED]`.
   - Giữ nguyên toàn bộ token màu tối hiện hữu.
2. **Zyricon Theme Non-Interference:**
   - Giữ nguyên 100% Three.js canvas, shader vũ trụ, màu tím hồng `#C27595`.
   - Giữ nguyên toàn bộ test suite Zyricon hiện có ở trạng thái PASS 100%.
3. **Core Celestial Daylight Non-Interference:**
   - Không sửa đổi cấu trúc cốt lõi của `CelestialDaylightBackground` trong `ChatArea`.
   - Không thay đổi vị trí mặt trời ($82\% \times 14\%$) hay tán xạ Rayleigh trong khu vực đàm thoại chính.

---

## 12. PHƯƠNG PHÁP XÁC MINH HIỆU NĂNG & TƯƠNG PHẢN (VERIFICATION PROTOCOLS)

### 12.1. Đo lường Độ tương phản WCAG 2.1 AA
- Áp dụng công thức giải tích sRGB chuyển đổi từ gamma sang linear:
  $$\begin{cases} C_{\text{linear}} = \frac{C_{\text{sRGB}}}{12.92} & \text{khi } C_{\text{sRGB}} \le 0.04045 \\ C_{\text{linear}} = \left(\frac{C_{\text{sRGB}} + 0.055}{1.055}\right)^{2.4} & \text{khi } C_{\text{sRGB}} > 0.04045 \end{cases}$$
- Relative Luminance $L = 0.2126 R_{\text{linear}} + 0.7152 G_{\text{linear}} + 0.0722 B_{\text{linear}}$.
- Contrast Ratio:
  $$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05} \quad (L_1 \ge L_2)$$
- Đo lường thực tế: Chụp ảnh màn hình ở trạng thái hoàn thiện, lấy mẫu pixel tại các vị trí bất lợi nhất (vùng chữ đè lên dải mây hoặc quầng sáng) để tính toán tỷ lệ tương phản thực nghiệm, đảm bảo $\ge 4.5:1$ cho văn bản thông thường (SC 1.4.3) và $\ge 3:1$ cho non-text UI / focus indicator (SC 1.4.11).

### 12.2. Đo lường Hiện tượng Chớp đen Theo Chuẩn Phase 4 (Restored Phase 4 Standard — R4)
Khôi phục nguyên vẹn tiêu chuẩn đo lường quang học đã được phê duyệt và nghiệm thu ở Phase 4:

1. **Định nghĩa Điểm đen Bất thường (Blackout Pixel)**:
   - Điểm ảnh là Blackout $\iff L_{\text{pixel}} \le 0.0100$ (với $L$ là WCAG relative luminance tính từ sRGB).
   - Tuyệt đối không sử dụng định nghĩa thay thế $R, G, B < 15$.
2. **Tỷ lệ Chớp đen (Blackout Ratio)**:
   $$\text{BlackoutRatio} = \frac{N_{\text{black\_pixels}}}{N_{\text{total\_roi\_pixels}}} \times 100\%$$
   - **Chỉ tiêu PASS**: $\text{BlackoutRatio} = 0.00\%$ trên toàn bộ các khung hình lấy mẫu.
3. **Quy tắc Xác định và Thẩm tra Vùng Đo (Sidebar-Specific ROI)**:
   - **Tọa độ đề xuất**: $X \in [8, 56]$, $Y \in [120, 400]$ (nằm trọn trong bề rộng thu gọn $64\text{px}$ của thanh bên).
   - **Yêu cầu thẩm tra trước khi sử dụng (Prerequisite Verification)**:
     - Phải xác minh bằng DOM bounding boxes và screenshot thực tế rằng vùng ROI:
       a) Nằm hoàn toàn $100\%$ trong ranh giới vật lý của Sidebar.
       b) Không đi qua bất kỳ icon, avatar, văn bản, nút bấm, thanh cuộn hay thành phần tương tác nào.
       c) Không chạm sang vùng `ChatArea`.
       d) Không bao gồm vùng backdrop xám/đen của mobile drawer.
       e) Không bị dịch chuyển tọa độ hay bị đè bởi các phần tử khác khi Sidebar chuyển đổi giữa Expanded và Collapsed.
     - *Quy tắc xử lý ngoại lệ*: Nếu ROI trên bị vướng phần tử trong một trạng thái cụ thể, implementation bắt buộc phải chọn một ROI sạch khác có thể so sánh được và ghi nhận rõ ràng tọa độ mới, kích thước và lý do kỹ thuật. Tuyệt đối không cố giữ tọa độ cũ nếu vùng đo không còn sạch.
   - Bắt buộc xuất file ảnh `roi-verification.png` hiển thị khung chữ nhật đánh dấu vùng ROI để người review kiểm tra trực quan.
4. **Quy trình Lấy mẫu Rời rạc Thực tế (Sampling Protocol)**:
   - Đo thời lượng transition thực tế từ CSS computed style (ví dụ Collapse $200\text{ms}$, Expand $240\text{ms}$).
   - Lấy mẫu trong khi transition đang diễn ra (in-flight), không chỉ lấy mẫu sau khi transition đã kết thúc.
   - Chụp đủ cả hai chiều: Expanded $\to$ Collapsed và Collapsed $\to$ Expanded.
   - Ghi nhận timestamp thực tế chính xác cho từng khung hình lấy mẫu.
   - Bao gồm cả khung hình ổn định sau khi transition kết thúc hoàn toàn ($t \ge 300\text{ms}$).
   - Nếu transition kết thúc sớm hơn dự kiến, không được gắn nhãn khung hình đó là đang trong quá trình transition.
   - Lưu trữ đầy đủ bảng kết quả: `BlackoutRatio`, `L_mean`, `L_min`, và `timestamp` cho từng khung hình.
   - *Lưu ý*: Lịch lấy mẫu $t \in \{30, 60, 90, 120, 160, 200, 240, 280, 350\text{ms}\}$ là lịch dự kiến và sẽ được điều chỉnh linh hoạt theo thời lượng transition thực tế đo được.

### 12.3. Chiến lược Kiểm thử Động (Dynamic Test Strategy)
- Không gán cứng số lượng test tĩnh (như 635+ hay 72) vào tiêu chuẩn nghiệm thu vì repository liên tục phát triển.
- Tiêu chuẩn nghiệm thu động:
  1. Chạy toàn bộ Vitest suite hiện có tại thời điểm chạy: `npm --prefix frontend test -- --run`.
  2. Chạy toàn bộ suite Playwright liên quan: `npx playwright test`.
  3. Chạy toàn bộ regression test của Dark Theme.
  4. Chạy toàn bộ regression test Zyricon hiện có: `npm --prefix frontend test -- zyricon --run`.
  5. Ghi nhận số lượng test thực tế: Tổng số test, số Passed, số Failed, số Skipped.
  6. **Quy tắc nghiêm ngặt**: Tuyệt đối không được xóa, vô hiệu hóa hoặc làm yếu bất kỳ assertion hiện có nào để đạt PASS. Bất kỳ lỗi test nào phát sinh đều phải được báo cáo trung thực kèm phân tích nguyên nhân gốc rễ.

---

## 13. CAM KẾT PLANNING ONLY & CỔNG PHÊ DUYỆT (APPROVAL GATE)

- **Trạng thái hiện tại:** Tài liệu này được lập hoàn toàn ở chế độ **PLANNING ONLY — NO IMPLEMENTATION**.
- **Bảo toàn Mã nguồn:** Tuyệt đối không có bất kỳ file mã nguồn (`.ts`, `.tsx`, `.css`) hoặc test hiện có nào bị thay đổi.
- **Bảo toàn Git:** Tuyệt đối không thực thi bất kỳ lệnh git mutation nào (`git add`, `git commit`, `git push`, `git reset`, `git checkout`, `git stash`, `git clean`, `git restore`).
- **Cổng Phê duyệt:** Dừng lại tại đây. Chờ người dùng review và cấp quyền chính thức trước khi bắt đầu thực hiện **Milestone M1**.
