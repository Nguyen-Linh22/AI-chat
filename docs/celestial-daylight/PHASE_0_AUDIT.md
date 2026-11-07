# CELESTIAL DAYLIGHT — PHASE 0: CODEBASE AUDIT REPORT
**A brighter space to think, create and explore.**

- **Project Root**: `D:\ai-chat-clone-new`
- **Audit Date**: 2026-11-07
- **Target Feature**: Celestial Daylight (Light Theme Dedicated Background Experience)
- **Status**: Phase 0 Complete — Awaiting Approval for Phase 1

---

## EXECUTIVE SUMMARY

This audit evaluates the codebase architecture of AI Chat Clone in preparation for developing **Celestial Daylight**, a dedicated, cinematic daytime sky background for the **Light theme**.

Key architectural findings:
1. **Feasibility of Hybrid 2D (No Three.js)**: The visual direction (Cinematic Realism sun, balanced cloud density, bright blue sky, soft volumetric rays, slow cloud drift, subtle breathing) can be achieved with exceptional fidelity using a **Hybrid 2D approach** (CSS multi-stop atmospheric gradients + SVG sunburst corona & volumetric rays + transparent WebP cloud texture layers).
2. **Three.js Elimination**: There is **no compelling reason to use Three.js** for Celestial Daylight. Avoiding Three.js saves 567 kB in deferred bundle size for light-theme users, eliminates WebGL context contention, draws 0% continuous GPU frame rendering power, and bypasses all framebuffer resizing bottlenecks during Sidebar transitions.
3. **Safe Integration Point**: `ChatBackground.tsx` is already the unified background rendering layer for `ChatArea`. Integrating Celestial Daylight conditionally within `ChatBackground.tsx` when `theme === 'light' && isWorkspacePath()` provides 100% decoupling with zero disturbance to Zyricon or Dark themes.
4. **Zero Regressions**: Baseline tests verify 40/40 test files passing (621/621 unit tests), 0 linter errors, and 1.68s production build time.

---

## 1. CURRENT THEME ARCHITECTURE

### 1.1 Store Implementation & State Model
- **File**: [`frontend/src/stores/themeStore.ts`](file:///d:/ai-chat-clone-new/frontend/src/stores/themeStore.ts#L1-L92)
- **State Definition**:
  ```typescript
  export type Theme = 'dark' | 'light' | 'zyricon'

  interface ThemeState {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
    syncThemeForRoute: (pathname?: string) => void
  }
  ```
- **Persistence**:
  - Theme choice is saved in `localStorage.getItem('theme')` / `localStorage.setItem('theme', theme)`.
  - Fallback is strictly `'dark'` if `localStorage` is empty or holds an invalid string.
- **Route-Specific Fallback (`isWorkspacePath`)**:
  - Paths matching `/^\/chat(?:\/[^/]+)?\/?$/` or `/^\/c\/[^/]+\/?$/` are identified as workspace paths.
  - In `applyThemeToDocument(theme, pathname)`:
    ```typescript
    const effectiveTheme: Theme =
      theme === 'zyricon' && !isWorkspacePath(pathname) ? 'dark' : theme
    ```
  - Zyricon is restricted to the workspace. On `/login` and `/register`, Zyricon falls back to `dark`.
  - Conversely, `light` and `dark` are globally supported across both workspace and auth routes.

### 1.2 Document Class & Attribute Synchronization
- When `effectiveTheme === 'light'`:
  - `document.documentElement.classList.add('light')`
  - `document.documentElement.classList.remove('dark', 'zyricon')`
  - `document.documentElement.setAttribute('data-theme', 'light')`
- When `effectiveTheme === 'dark'`:
  - `document.documentElement.classList.add('dark')`
  - `document.documentElement.classList.remove('light', 'zyricon')`
  - `document.documentElement.setAttribute('data-theme', 'dark')`
- When `effectiveTheme === 'zyricon'`:
  - `document.documentElement.classList.add('dark', 'zyricon')`
  - `document.documentElement.classList.remove('light')`
  - `document.documentElement.setAttribute('data-theme', 'zyricon')`

### 1.3 UI Switch Mechanisms
1. **`ThemeSelector.tsx`** ([`frontend/src/components/ThemeSelector.tsx`](file:///d:/ai-chat-clone-new/frontend/src/components/ThemeSelector.tsx#L14-L36)):
   - Positioned in the main `ChatArea` top header.
   - Dropdown with 3 options: `light` (Mặt trời - Sun), `dark` (Mặt trăng - Moon), and `zyricon` (Vũ trụ - Cosmic).
   - Executes `executeThemeTransition(() => setTheme(theme), triggerRef.current)`.
2. **`ThemeToggle.tsx`** ([`frontend/src/components/ThemeToggle.tsx`](file:///d:/ai-chat-clone-new/frontend/src/components/ThemeToggle.tsx#L6-L25)):
   - Positioned in `AuthLayout.tsx` for `/login` and `/register`.
   - Two-way animated switch between `'light'` and `'dark'`.
3. **`themeTransition.ts`** ([`frontend/src/utils/themeTransition.ts`](file:///d:/ai-chat-clone-new/frontend/src/utils/themeTransition.ts#L1-L100)):
   - Wraps theme changes with the View Transitions API (`document.startViewTransition`).
   - Uses WAAPI circular `clipPath` reveal expanding from trigger coordinates (`--vt-x`, `--vt-y`, `--vt-r`).
   - Respects `prefers-reduced-motion` (instant fallback if enabled).

### 1.4 Theme-Specific CSS Variables & Design Tokens
- **File**: [`frontend/src/index.css`](file:///d:/ai-chat-clone-new/frontend/src/index.css#L6-L106)
- **Light Theme Tokens (`:root`)**:
  - Canvas background: `--workspace-canvas: #FAFBFD;`
  - Sidebar background: `--workspace-sidebar: #F0F3F7;`
  - Surface cards: `--workspace-surface: #FFFFFF;`
  - Surface hover: `--workspace-surface-hover: #E8ECF2;`
  - Borders: `--workspace-border: #E2E6EE;`, `--workspace-border-strong: #CBD3E1;`
  - Text primary: `--workspace-text-primary: #0F172A;`
  - Text secondary: `--workspace-text-secondary: #475569;`
  - Text muted: `--workspace-text-muted: #64748B;`
  - Brand amber primary: `--brand-primary: #F59E0B;`

---

## 2. CURRENT BACKGROUND RENDERING ARCHITECTURE

### 2.1 Component Structure
- **File**: [`frontend/src/components/chat/ChatBackground.tsx`](file:///d:/ai-chat-clone-new/frontend/src/components/chat/ChatBackground.tsx#L1-L44)
- **Hierarchy & Code**:
  ```tsx
  function ChatBackgroundComponent({ className = '' }: ChatBackgroundProps) {
    const theme = useThemeStore((state) => state.theme)
    const isWorkspace = isWorkspacePath()
    const isZyriconActive = theme === 'zyricon' && isWorkspace

    return (
      <div
        className={`chat-stars-bg absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`.trim()}
        aria-hidden="true"
        data-testid="chat-background"
      >
        {isZyriconActive ? (
          <Suspense fallback={<CosmicStaticFallback />}>
            <LazyZyriconCosmicCanvas />
          </Suspense>
        ) : (
          <>
            <div className="chat-stars-layer-1" />
            <div className="chat-stars-layer-2" />
            <div className="chat-stars-layer-3" />
          </>
        )}
      </div>
    )
  }
  export const ChatBackground = memo(ChatBackgroundComponent)
  ```

### 2.2 Placement & Stacking in `ChatArea`
- **File**: [`frontend/src/components/ChatArea.tsx`](file:///d:/ai-chat-clone-new/frontend/src/components/ChatArea.tsx#L484-L563)
- `<ChatArea>` is rendered as `<main className="relative flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden h-full bg-workspace-canvas">`.
- `<ChatBackground />` is mounted directly as the first child of `<main>`.
- Stacking order inside `ChatArea`:
  1. `<ChatBackground />`: `absolute inset-0 z-0 pointer-events-none`
  2. Main Chat Scroll Container: `relative z-10 flex-1 min-h-0 overflow-y-auto`
  3. Floating Composer (`ChatInput`): `relative shrink-0` (attachment popover has `z-30`)
  4. Docked Header: `relative z-40 flex h-14 shrink-0`
  5. Modals & Popovers: `fixed inset-0 z-50`

### 2.3 Existing CSS Styles
- **File**: [`frontend/src/assets/chat-background/background.css`](file:///d:/ai-chat-clone-new/frontend/src/assets/chat-background/background.css#L1-L60)
  - `html.dark .chat-stars-bg`: `radial-gradient(ellipse at bottom, #1b2735 0%, #0B0F17 100%)`.
  - `html.light .chat-stars-bg`: `radial-gradient(ellipse at top, #ffffff 0%, #f1f5f9 100%)`.
  - In light theme, the 3 CSS box-shadow star layers are inverted and faded (`filter: invert(1) ... opacity(0.08)`).
  - In Zyricon mode, `.chat-stars-bg` has `background: transparent !important;` and star layers have `display: none !important;`.

---

## 3. EXACT INTEGRATION POINT FOR CELESTIAL DAYLIGHT

### 3.1 Recommended Pattern: Conditional Subtree inside `ChatBackground.tsx`
`ChatBackground.tsx` is the single canonical source of truth for background rendering.

```tsx
const isZyriconActive = theme === 'zyricon' && isWorkspace
const isCelestialActive = theme === 'light' && isWorkspace

return (
  <div
    className={`chat-stars-bg absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`.trim()}
    aria-hidden="true"
    data-testid="chat-background"
  >
    {isZyriconActive ? (
      <Suspense fallback={<CosmicStaticFallback />}>
        <LazyZyriconCosmicCanvas />
      </Suspense>
    ) : isCelestialActive ? (
      <CelestialDaylightBackground />
    ) : (
      <>
        <div className="chat-stars-layer-1" />
        <div className="chat-stars-layer-2" />
        <div className="chat-stars-layer-3" />
      </>
    )}
  </div>
)
```

### 3.2 Why this is the safest approach:
1. **Zero Impact on `ChatArea.tsx`**: `ChatArea` remains completely untouched.
2. **Zero Impact on Zyricon**: Zyricon's 3D canvas lifecycle, engine disposal, and canvas container are completely quarantined.
3. **Zero Impact on Dark Theme**: Dark theme continues to render the established 3-layer CSS starfield.
4. **Clean Code-Splitting**: `CelestialDaylightBackground` can be modularized in `frontend/src/theme/celestial/` with its own isolated CSS and tests.
5. **Route Isolation**: On `/login` and `/register`, `isWorkspace` is `false`, maintaining a calm, static background for user credentials.

---

## 4. SIDEBAR TRANSITION AND BACKGROUND INTERACTION ANALYSIS

### 4.1 Layout Transition Ownership
- **Files**:
  - [`frontend/src/pages/ChatPage.tsx`](file:///d:/ai-chat-clone-new/frontend/src/pages/ChatPage.tsx#L12-L27)
  - [`frontend/src/components/ui/sidebar.tsx`](file:///d:/ai-chat-clone-new/frontend/src/components/ui/sidebar.tsx#L14-L31)
  - [`frontend/src/index.css`](file:///d:/ai-chat-clone-new/frontend/src/index.css#L1015-L1039)
- **Desktop Behavior (`md:static`)**:
  - The parent in `ChatPage.tsx` is a flex container: `<Sidebar />` + `<ChatArea />`.
  - The `<Sidebar>` element (`#app-sidebar.sidebar-motion`) **owns the transition**.
  - Its width transitions between `240px` $\leftrightarrow$ `64px` over `200ms` (collapsing) / `240ms` (expanding) with timing curve `cubic-bezier(0.2, 0, 0, 1)`.
  - `<ChatArea>` has `flex: 1 1 0%` (`flex-1`).
  - **ChatArea width changes directly in layout space**: As the sidebar collapses, ChatArea width expands from `(100vw - 240px)` to `(100vw - 64px)`. ChatArea does **not** use CSS `transform: translate(...)` on desktop.
- **Mobile Behavior (`< 768px`)**:
  - The Sidebar is `fixed inset-y-0 left-0 z-50` and slides via `transform: translateX(-100%)` $\leftrightarrow$ `translateX(0)`.
  - ChatArea width remains static at `100vw`.

### 4.2 Background Dimension Tracking & Remount Verification
- `ChatBackground` is positioned `absolute inset-0` inside `ChatArea`. Therefore, background bounding box **instantaneously mirrors ChatArea dimensions**.
- As verified by test `ChatBackground.zyricon.test.tsx` (line 126–139), **Sidebar transitions do NOT remount `ChatBackground`**. The DOM node identity is preserved throughout layout transitions.

### 4.3 Root Cause of Past Blackout Flashes & Lessons for Celestial Daylight
- In Zyricon, the black flash occurred because Three.js `renderer.setSize(width, height)` was invoked repeatedly during the CSS transition, causing WebGL to destroy and reallocate GPU framebuffers 15–20 times in 200ms.
- **For Celestial Daylight**:
  - Because Celestial Daylight is **Hybrid 2D**, it relies purely on CSS/DOM rendering.
  - The browser's GPU compositor hardware-scales and clips 2D DOM layers with zero buffer reallocation.
  - **Risk**: If Celestial Daylight relies on heavy full-screen CSS `backdrop-filter: blur(...)` or dynamic SVG filter recalculations during container width resizing, compositor thread stalls could still cause jank.
  - **Rule for Phase 1/3**: All blur glows, volumetric gradients, and cloud transparency must be pre-baked into SVG gradients and WebP alpha channels. Avoid continuous CSS filter recomputations on the root background wrapper.

---

## 5. CSS AND COMPONENT CONFLICTS TO AVOID

### 5.1 Component Foreground Contrast & Readability
| Component | Existing Styling in Light Mode | Celestial Daylight Requirement / Conflict Avoidance |
| :--- | :--- | :--- |
| **Chat Header** | `h-14`, `bg-transparent backdrop-blur-[1px]`, border `border-indigo-200/25` | Sky zenith (top 56px) must not be stark white; maintain medium/rich sky blue (#2A7AC8 to #4A9BE8) so breadcrumbs and titles (`text-slate-900`, `text-slate-700`) retain high contrast (>7:1). |
| **Welcome Screen** | Greeting `text-slate-900`, chips `bg-white/90 text-slate-700`, cards `bg-white/90 text-slate-900` | Center area will have clouds and sunlight. Cards use `bg-white/90 backdrop-blur-md` with `border-slate-200/90`. To prevent white card borders disappearing over white clouds, ensure cloud density is balanced and ambient sky blue tint filters through. |
| **User Message Bubble** | `bg-slate-900 text-white rounded-2xl` | Dark pill with white text has near 14:1 contrast against bright sky. Zero conflict. |
| **AI Message Bubble** | `bg-white text-slate-800 border-slate-200/90 shadow-xs` | Solid white container ensures text inside is 100% readable regardless of background. |
| **Code Blocks** | `bg-[#fafafa] border-slate-200 text-slate-600` | Opaque background with Prism syntax highlighting. Zero conflict. |
| **Composer (`ChatInput`)** | `bg-white/95 border-slate-200/90 shadow-lg backdrop-blur-xl` | Floating capsule at bottom of viewport. Bottom of sky must transition to soft horizon haze (#E2F1FD) so composer floating capsule clearly demarcates from the background. |
| **Modals & Popovers** | `fixed inset-0 z-50 bg-black/60 backdrop-blur-md` | Modals sit at `z-50` with dark backdrop blur. Complete isolation from background at `z-0`. |

### 5.2 Scrollbar & Stacking Conflicts
- The message scroll container is `relative z-10 overflow-y-auto`.
- `CelestialDaylightBackground` must strictly maintain:
  - `position: absolute; inset: 0;`
  - `pointer-events: none;` (must never intercept wheel scrolling or click events)
  - `user-select: none;`
  - `z-index: 0;`

---

## 6. RECOMMENDED ASSET STRATEGY

### 6.1 Format & Compression
- **Cloud Textures**: High-efficiency **WebP** with 8-bit alpha channel.
  - Lossless or high-quality lossy (Q=85–90) WebP achieves ~70% smaller file sizes than 32-bit PNG.
  - Seamless horizontal tiling or ultra-wide panorama (e.g. 2560x1080) to enable seamless infinite horizontal drift.
- **Sun & Lens Flare Elements**:
  - Primary Sun Disc & Corona: Scalable Vector Graphics (**SVG**) with multi-stage radial gradients. Eliminates raster pixelation at 4K/5K displays with virtually 0 kB file footprint.
  - Optional Volumetric Sun Streaks / Lens Flare: Soft SVG linear gradients using `mix-blend-mode: screen` or `overlay`.
- **Target Total Asset Budget**: **< 450 kB total** (compared to Zyricon's 1.4 MB planet textures + 567 kB Three.js bundle).

### 6.2 Recommended Public Folder Structure
```
frontend/public/assets/celestial/
├── ASSET_MANIFEST.md
├── ATTRIBUTION.md
├── clouds/
│   ├── cloud-layer-high-cirrus.webp   (~60 kB)
│   ├── cloud-layer-mid-cumulus.webp    (~180 kB)
│   └── cloud-layer-low-haze.webp       (~90 kB)
└── sun/
    └── sun-corona-cinematic.svg        (~5 kB)
```

---

## 7. RECOMMENDED ANIMATION STRATEGY

### 7.1 Multi-Layered Natural Motion
1. **High-Altitude Cirrus Drift (Layer 1)**:
   - Ultra-slow drift: `animation: celestial-drift 180s linear infinite;`
   - Opacity: ~30–40%
2. **Mid-Altitude Cumulus Drift (Layer 2)**:
   - Medium drift: `animation: celestial-drift 110s linear infinite;`
   - Opacity: ~55–70%
3. **Sunlight Breathing**:
   - Gentle pulsation of the sun's outer corona:
     ```css
     @keyframes sun-breathing {
       0%, 100% { transform: scale(1); opacity: 0.88; }
       50% { transform: scale(1.03); opacity: 1.0; }
     }
     animation: sun-breathing 14s ease-in-out infinite;
     ```
4. **Subtle Parallax (Desktop Only, Progressive Enhancement)**:
   - Window pointer movement translates cloud layers slightly ($\pm 4\text{px}$ to $\pm 12\text{px}$) via CSS custom properties `--mouse-px`, `--mouse-py` updated on RAF.
   - Throttled and fully bypassed on touch devices.

### 7.2 Accessibility & `prefers-reduced-motion`
- When `prefers-reduced-motion: reduce` is detected:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .celestial-cloud-layer,
    .celestial-sun-corona {
      animation: none !important;
      transform: none !important;
    }
  }
  ```
- Scene immediately freezes in a static, balanced daytime vista without jarring transitions.

---

## 8. PERFORMANCE RISKS & MITIGATIONS

| Risk Factor | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **GPU Texture VRAM Consumption** | Multiple uncompressed 4K bitmaps can consume >100 MB VRAM in browser memory. | Restrict textures to 2048px width max, use WebP, and utilize CSS tiling or duplicate looping segments. |
| **Compositor Jank during Sidebar Motion** | Recalculating filters or repainting during width transitions causes 15–30 FPS drops. | Strictly animate `transform: translate3d()` and `opacity`. Use `will-change: transform`. Do not use live CSS `blur()` on container elements during resize. |
| **CPU Main-Thread Load** | JS-driven animation loops keep CPU active, draining laptop battery. | Implement 100% of drift and breathing motions via CSS keyframes. CSS animations run off-main-thread on the compositor. |
| **Memory Leaks on Theme Switch** | Lingering timers or event listeners after switching to Dark/Zyricon. | Pure CSS animations have 0 lifecycle leakage. If mouse parallax hook is used, clean up pointer listener on unmount. |

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests (Vitest)
- Create `frontend/src/theme/celestial/CelestialDaylight.test.tsx`:
  - Verify renders container with `aria-hidden="true"` and `pointer-events-none`.
  - Verify mounts when `theme === 'light'` and in workspace path (`/chat`).
  - Verify does NOT mount when `theme === 'dark'` or `theme === 'zyricon'`.
  - Verify does NOT mount on auth path (`/login`).
  - Verify `prefers-reduced-motion` applies static styles.
- Update `frontend/src/components/chat/ChatBackground.zyricon.test.tsx`:
  - Update test at line 51 to assert Celestial Daylight is rendered in Light theme rather than legacy dark star layers.

### 9.2 End-to-End Tests (Playwright)
- Create `e2e/celestial-daylight-integration.spec.ts`:
  - **TC-01 (Mounting)**: Verify daytime sky renders upon loading `/chat` in Light theme.
  - **TC-02 (Theme Transitions)**: Verify switching `dark` $\rightarrow$ `light` $\rightarrow$ `zyricon` $\rightarrow$ `light` executes without visual flashes, errors, or orphaned elements.
  - **TC-03 (Sidebar Smoothness)**: Verify sidebar collapse and expand motion runs at 60 FPS in Light theme with zero layout breaks.
  - **TC-04 (Readability & Contrast)**: Measure contrast of WelcomeScreen headings, chips, AI message bubbles, and composer over the sky background.
  - **TC-05 (Auth Isolation)**: Verify `/login` and `/register` retain the clean authentication layout.

---

## 10. EXACT FILES LIKELY TO BE CREATED OR MODIFIED

### 10.1 Permitted in Phase 0 (Audit Only)
- `docs/celestial-daylight/PHASE_0_AUDIT.md` (This document)

### 10.2 Planned for Future Phases
- **Phase 1 (Technical & Visual Design)**:
  - `docs/celestial-daylight/PHASE_1_DESIGN.md`
- **Phase 2 (Asset Preparation)**:
  - `frontend/public/assets/celestial/ASSET_MANIFEST.md`
  - `frontend/public/assets/celestial/ATTRIBUTION.md`
  - `frontend/public/assets/celestial/clouds/*.webp`
  - `frontend/public/assets/celestial/sun/*.svg`
- **Phase 3 (Core Background Implementation)**:
  - `frontend/src/theme/celestial/CelestialDaylightBackground.tsx`
  - `frontend/src/theme/celestial/CelestialDaylightBackground.css`
  - `frontend/src/theme/celestial/CelestialDaylightBackground.test.tsx`
- **Phase 4 (UI Integration)**:
  - `frontend/src/components/chat/ChatBackground.tsx` (Mount `<CelestialDaylightBackground />` when `theme === 'light' && isWorkspace`)
  - `frontend/src/assets/chat-background/background.css` (Deactivate legacy light-mode starfield invert filter)
- **Phase 5 (Testing & Optimization)**:
  - `frontend/src/components/chat/ChatBackground.zyricon.test.tsx` (Update light theme assertion)
  - `e2e/celestial-daylight-integration.spec.ts`
  - `playwright.celestial.config.ts`

---

## 11. TECHNICAL DECISIONS THAT STILL NEED APPROVAL

1. **Theme Model Decision**:
   - **Recommendation**: Retain `theme: 'light'`. Celestial Daylight should be the dedicated workspace background for `theme === 'light'`.
   - *Rationale*: Avoids adding a 4th theme key (`celestial`), preserving existing database schemas, user preferences, and simple 3-way toggle in `ThemeSelector`.
2. **Three.js Elimination Approval**:
   - **Recommendation**: Formal confirmation that Three.js is not required and Hybrid 2D is the approved technical direction.
3. **Parallax Scope**:
   - **Recommendation**: Implement subtle 2D mouse parallax as progressive enhancement on desktop only, strictly disabled under `prefers-reduced-motion` and on mobile.
4. **Auth Routes (`/login`, `/register`)**:
   - **Recommendation**: Keep `/login` and `/register` on the existing clean `--workspace-canvas` background.

---

## 12. RECOMMENDED PHASE 1 TASKS

1. **Design System & Color Gradient Specification**:
   - Define exact CSS color stops for the daytime blue sky (Zenith: deep azure `#1B6CA8`, Mid-sky: cerulean `#4A9BE8`, Horizon: soft radiant sky `#CDE8F6`).
2. **Sun & Volumetric Ray Specifications**:
   - Define radial corona dimensions, coordinates, blend modes (`mix-blend-mode: screen`), and breathing keyframes.
3. **Cloud Layer Hierarchy & Drift Timing**:
   - Define 2 or 3 distinct cloud layer opacities, heights, drift speeds, and seamless tiling geometry.
4. **Contrast Matrix & Component Harmonization**:
   - Specify exact contrast ratios for Welcome Screen cards, headers, message bubbles, and composer over all areas of the daylight sky.
5. **Phase 1 Technical & Visual Design Document**:
   - Compile comprehensive `docs/celestial-daylight/PHASE_1_DESIGN.md`.

---

## 13. GIT BASELINE AND VERIFICATION SNAPSHOT

### Before Audit
- Branch: `fix/google-identity-services-button`
- HEAD: `69b42265dd32372fa4c36b1fa3d4c9d6792376ba`
- Tracked modified files: 25 files
- Untracked files/folders: 47 items

### After Audit
- Branch: `fix/google-identity-services-button`
- HEAD: `69b42265dd32372fa4c36b1fa3d4c9d6792376ba`
- Newly created file: `docs/celestial-daylight/PHASE_0_AUDIT.md` (ONLY permitted file)
- **Zero changes** to existing source code, styles, tests, assets, or configuration.

