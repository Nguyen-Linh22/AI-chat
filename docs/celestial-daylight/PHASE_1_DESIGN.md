# CELESTIAL DAYLIGHT — PHASE 1: TECHNICAL & VISUAL DESIGN SPECIFICATION
**A brighter space to think, create and explore.**

- **Project Root**: `D:\ai-chat-clone-new`
- **Specification Version**: 1.2.0 (Phase 1 Final Technical Revision)
- **Document Status**: Ready for Review (Phase 1 Final Revision)
- **Theme Target**: Light Theme (`theme === 'light'` in workspace routes)
- **Architecture**: Hybrid 2D (CSS Gradients, SVG Vector Elements & Transparent WebP Cloud Canopies)
- **Three.js**: Excluded for Celestial Daylight (Eliminates custom background WebGL context, shader compilation, and Three.js-specific GPU framebuffer management. Does not imply browser itself ceases compositing DOM layers onto GPU surfaces).

---

## 1. FINAL VISUAL CONCEPT

### 1.1 Philosophy & Experience Goal
**Celestial Daylight** elevates the Light theme from a standard flat workspace into a serene, cinematic daytime sky. It embodies a calm morning-to-midday atmosphere:
- **Atmospheric Depth**: A natural vertical Rayleigh-scattering gradient transitioning from rich celestial azure at the zenith down to soft morning white-blue at the horizon.
- **Cinematic Realism Sun**: A high-luminance radiant sun disc placed in the upper-right quadrant of `ChatArea`, diffusing soft volumetric rays downwards without blinding the user or obscuring controls.
- **Balanced Cloud Canopy**: Multi-layered, soft-edged cumulus and cirrus clouds drifting at gentle, independent speeds across the peripheral flanks, keeping the central reading and typing zone clear.
- **Decorative Background Separation**: The background remains strictly decorative (`position: absolute; inset: 0; z-index: 0; pointer-events: none;`), never capturing user interactions or reducing the legibility of message bubbles, cards, or inputs.

```
+-------------------------------------------------------------------------------+
|  Header [AI Workspace › Breadcrumbs]              [ModelSelector] [ThemeToggle]|
|                                                          (Sun Core)           |
|                                                       /   :   \   (Corona)    |
|   (Layer 1 Cirrus Drift ->)                         /     :     \             |
|                                                    /  Volumetric \            |
|       +---------------------------------------+   /     Rays      \           |
|       |         Welcome Screen / Hero Cards   |  /                 \          |
|       +---------------------------------------+ /                   \         |
|                                                                               |
|   (Layer 2 Midground Cumulus ->)                                              |
|                                                                               |
|       +---------------------------------------+                               |
|       |  AI Message Bubble (bg-white)         |                               |
|       +---------------------------------------+                               |
|                                                                               |
|   (Layer 3 Horizon Mist & Low Haze ->)                                        |
|   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   |
|       +---------------------------------------------------------------+       |
|       |         Floating Composer / ChatInput (bg-white/95)           |       |
|       +---------------------------------------------------------------+       |
+-------------------------------------------------------------------------------+
```

---

## 2. COLOR PALETTE

The color system is derived from natural atmospheric physics (Rayleigh scattering of daylight):

| Token Name | Hex Code | Purpose | Calculated Relative Luminance ($L$) |
| :--- | :--- | :--- | :--- |
| `--sky-zenith` | `#84C2F5` | Upper atmosphere (top 0%) | $0.5008$ |
| `--sky-upper-mid` | `#A6D7FA` | Upper-middle transition (25%) | $0.6361$ |
| `--sky-mid` | `#C8E8FC` | Main daytime sky (55%) | $0.7702$ |
| `--sky-lower-wash` | `#E5F4FD` | Lower atmospheric haze (82%) | $0.8845$ |
| `--sky-horizon` | `#F4FAFF` | Horizon base boundary (100%) | $0.9482$ |
| `--sun-core` | `#FFFFFF` | Solar core disc | $1.0000$ |
| `--sun-corona-inner` | `#FFF8DB` | High-temperature corona | $0.9412$ |
| `--sun-corona-warm` | `#FFE394` | Radiant golden ring | $0.7985$ |
| `--sun-aura-diffuse` | `rgba(255, 242, 178, 0.35)` | Volumetric atmospheric bloom | N/A (Alpha) |
| `--cloud-highlight` | `#FFFFFF` | Cloud sunlit rim & crest | $1.0000$ |
| `--cloud-body` | `#F0F8FF` | Cloud body mass (Alice Blue) | $0.9288$ |
| `--cloud-shadow` | `#D9E8F5` | Cloud underside ambient shadow | $0.7812$ |

---

## 3. SKY GRADIENT SPECIFICATION

### 3.1 CSS Gradient Implementation
The sky background uses a multi-stop linear gradient combined with a subtle radial sunlight bloom. Color stops follow an eased distribution to minimize discrete stepping on standard 8-bit displays:

```css
.celestial-sky-atmosphere {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-color: #C8E8FC; /* Solid fallback prevents unpainted frame flashes */
  background-image: 
    radial-gradient(
      circle at 82% 14%,
      rgba(255, 255, 240, 0.45) 0%,
      rgba(200, 232, 252, 0.15) 38%,
      transparent 70%
    ),
    linear-gradient(
      180deg,
      #84C2F5 0%,
      #98CEF8 14%,
      #A6D7FA 26%,
      #B9E0FB 42%,
      #C8E8FC 58%,
      #D7EEFD 74%,
      #E5F4FD 86%,
      #F4FAFF 100%
    );
}
```

### 3.2 Gradient Banding Evaluation
- **Primary Strategy**: Multi-stop interpolation across 8 carefully spaced stops (0%, 14%, 26%, 42%, 58%, 74%, 86%, 100%) softens luminance deltas between adjacent bands.
- **Optional Dithering Note**: If banding remains visible during Phase 5 testing on specific monitors, a lightweight pre-rendered noise tile can be evaluated. Full-screen SVG `feTurbulence` filters should be avoided by default due to high rasterization overhead on mobile devices and integrated GPUs.

---

## 4. SUN COMPOSITION & EXACT POSITIONING

### 4.1 Container-Relative Coordinates & Dimensions
All coordinates are defined relative to the parent `ChatArea` container ($W \times H$), **not the global browser viewport**:

| Screen Size Class | Sun Center $(X, Y)$ | Solar Core $\varnothing$ | Inner Corona $\varnothing$ | Outer Aura $\varnothing$ | Max Ray Reach |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop ($\ge 1024\text{px}$)** | $(82\%, 14\%)$ | $64\text{px}$ | $180\text{px}$ | $560\text{px}$ | $680\text{px}$ ($42^\circ$ angle) |
| **Tablet ($768\text{px} - 1023\text{px}$)** | $(84\%, 12\%)$ | $56\text{px}$ | $150\text{px}$ | $460\text{px}$ | $540\text{px}$ ($40^\circ$ angle) |
| **Mobile ($< 768\text{px}$)** | $(78\%, 9\%)$ | $42\text{px}$ | $120\text{px}$ | $320\text{px}$ | $380\text{px}$ ($38^\circ$ angle) |

### 4.2 Sun Visual Hierarchy (Multi-Stage Layering)
The sun consists of 4 concentric SVG/CSS layers:
1. **Layer 1: Solar Core (Photosphere)**:
   - Diameter: $64\text{px}$ (Desktop).
   - Radial gradient: `#FFFFFF` (center) $\rightarrow$ `#FFFDF0` (edge, $r=85\%$) $\rightarrow$ `#FFE8A3` ($r=100\%$).
   - Specular drop shadow: `filter: drop-shadow(0 0 12px rgba(255, 240, 180, 0.95))`.
2. **Layer 2: Inner Chromosphere & Corona**:
   - Diameter: $180\text{px}$.
   - Radial gradient: `rgba(255, 255, 255, 0.85)` $\rightarrow$ `rgba(255, 227, 148, 0.5)` $\rightarrow$ `rgba(255, 210, 110, 0)`.
3. **Layer 3: Diffuse Atmospheric Halo (Breathing)**:
   - Diameter: $560\text{px}$.
   - Radial gradient: `rgba(255, 242, 178, 0.35)` $\rightarrow$ `rgba(200, 232, 252, 0.12)` $\rightarrow$ `transparent`.
   - Modulated by the 16s breathing cycle.
4. **Layer 4: Directional Volumetric Sun Rays (God Rays)**:
   - 3 angled translucent beam cones extending down-left towards the center:
     - Beam A: Angle $-35^\circ$, width $40\text{px}$, opacity $14\%$.
     - Beam B: Angle $-44^\circ$, width $75\text{px}$, opacity $18\%$.
     - Beam C: Angle $-54^\circ$, width $50\text{px}$, opacity $12\%$.
   - Blend mode: `mix-blend-mode: screen`.
   - Beams attenuate to $0\%$ opacity before intersecting the text-heavy left margin.

---

## 5. CLOUD DISTRIBUTION AND DEPTH

### 5.1 Three-Tier Depth Architecture
To prevent repetitive patterns, clouds are separated into 3 depth tiers with varying scale, drift velocities, and opacities:

```
+-------------------------------------------------------------------------------+
| Layer 1: High Cirrus (10%-40% Y)   | Opacity: 30%-40% | Drift: 160s           |
| Layer 2: Mid Cumulus (25%-75% Y)   | Opacity: 55%-65% | Drift: 110s           |
| Layer 3: Low Stratus/Haze (60%-100% Y)| Opacity: 35%-45% | Drift: 135s        |
+-------------------------------------------------------------------------------+
```

### 5.2 Safe Corridor & Clearance
- **Central Reading Corridor**: The horizontal region between $X = 22\%$ and $X = 78\%$ has an intentionally reduced cloud density.
- Cloud assets are structured as **peripheral formations** (heavier mass at edges, tapering to delicate wisps toward the center).
- This ensures that Welcome cards, code blocks, and chat bubbles always rest over clean, legible blue sky rather than dense white cloud patches.

---

## 6. SUNLIGHT & ATMOSPHERIC EFFECTS

### 6.1 Natural Sunlight vs Artificial Gimmicks
- **Strictly Avoided**:
  - Sci-fi lens flares with chromatic aberration circles or hexagonal aperture artifacts.
  - Saturated neon yellow/orange cartoon halos.
  - Live CSS blur filters spanning the entire viewport (`filter: blur(...)`).
- **Adopted Cinematic Features**:
  - Natural light attenuation: Sunlight naturally scatters through the air, creating a slight warm wash over the upper-right clouds.
  - Soft light wrap: Clouds passing near the sun receive an intensified rim light (`--cloud-highlight`).

---

## 7. MOTION DESIGN SPECIFICATION

### 7.1 Keyframe Animations (Composited CSS Transforms)
Animated decorative movement should prioritize composited CSS properties (`transform: translate3d(...)` and `opacity`) to avoid triggering layout reflow or repaint cycles.

> [!NOTE]
> While CSS transforms are intended to run on the browser compositor thread, actual rendering execution depends on browser engine heuristics, GPU compositing decisions, and device capabilities. Performance must be empirically profiled rather than assumed.

```css
/* Seamless looping cloud drift across a duplicated 200% width strip */
@keyframes celestial-drift-horizontal {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

/* Subtle atmospheric sunlight breathing */
@keyframes sun-corona-breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.88;
  }
  50% {
    transform: scale(1.03);
    opacity: 1.0;
  }
}
```

### 7.2 Seamless Cloud Looping Specification
The horizontal drift animation requires a dedicated duplicated-strip layout to ensure continuity:
1. **Strip Geometry**:
   - The parent container has a width of `100%` of `ChatArea` with `overflow: hidden`.
   - The animated strip element has a width of `200%` of the parent container.
   - The strip is composed of two adjacent segments of equal size: Segment $A$ ($0\%$ to $50\%$ of strip width, spanning exactly $100\%$ of parent width) and Segment $B$ ($50\%$ to $100\%$ of strip width, spanning exactly $100\%$ of parent width).
2. **Visual Content & Nature of Segments**:
   - Segment $B$ must be an **identical visual copy (clone)** of Segment $A$, or both segments must be authored as continuously tiling texture repeats.
   - Translation mechanics: Since the strip width is $200\%$ of the parent container, `translateX(-50%)` shifts the strip leftward by exactly $50\% \times 200\% = 100\%$ of the parent container's width.
   - At the end of the keyframe ($t = 100\%$, translation = $-50\%$), Segment $B$ occupies the exact screen position where Segment $A$ started at $t = 0\%$.
   - When the animation restarts at $0\%$, Segment $A$ instantly takes the place of Segment $B$. Because the segments are visually identical, no visual jump occurs.
3. **Texture Seam Continuity Requirement**:
   - The visual content must connect seamlessly across the internal boundary between Segment $A$ and Segment $B$ ($X = 50\%$).
   - The rightmost edge of Segment $B$ must also wrap continuously back to the leftmost edge of Segment $A$.
   - Alpha feathering alone is not sufficient; the cloud texture geometry and density must be authored to wrap seamlessly without visual discontinuity.
4. **Empirical Seam Verification Protocol (Phase 3/5)**:
   - **Do not assume the loop is seamless prior to testing with real assets.**
   - In Phase 3 and Phase 5, verification must inspect:
     1. The internal seam between Segment $A$ and $B$ by freezing the animation and inspecting the right-hand boundary.
     2. The loop restart instant by recording frame-by-frame captures at the transition point (comparing frame at $t = 99.9\%$ with frame at $t = 0.0\%$).
     3. Verify zero pixel jump, transparent seams, or fractional pixel rounding artifacts on high-DPI displays.

### 7.3 Independent Layer Timing Parameters

| Layer | Keyframe Rule | Duration | Timing Function | Initial Offset (`animation-delay`) | Transform Distance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Layer 1 (High Cirrus)** | `celestial-drift-horizontal` | $160\text{s}$ | `linear` | `0s` | $0 \rightarrow -50\%$ strip width |
| **Layer 2 (Mid Cumulus)** | `celestial-drift-horizontal` | $110\text{s}$ | `linear` | `-35s` | $0 \rightarrow -50\%$ strip width |
| **Layer 3 (Low Haze)** | `celestial-drift-horizontal` | $135\text{s}$ | `linear` | `-70s` | $0 \rightarrow -50\%$ strip width |
| **Sun Atmospheric Aura** | `sun-corona-breathe` | $16\text{s}$ | `ease-in-out` | `0s` | Scale $1.00 \leftrightarrow 1.03$ |
| **Sun Core Disc** | *Static* | $\infty$ | None | None | None (Anchor) |

### 7.4 Pointer Parallax (Optional Progressive Enhancement)
- **Classification**: Optional progressive enhancement, **not a core requirement**. The default background relies purely on CSS keyframes without continuous JavaScript RAF loops.
- **Constraints if implemented**:
  - Bound coordinates tightly (clamp within $\pm 6\text{px}$ maximum delta).
  - Use passive pointer event listeners and cancel any pending RAF updates on unmount.
  - Disable on touch devices (`@media (hover: none) or (pointer: coarse)`).
  - Disable completely under `prefers-reduced-motion: reduce`.
  - Phase 5 must measure the CPU/GPU delta with parallax enabled versus disabled before deciding on its default active state.

### 7.5 Accessibility: Reduced Motion
When `prefers-reduced-motion: reduce` is detected, animations must be halted without disrupting static transforms, positioning, scale, or rotation angles:

> [!CAUTION]
> Do NOT use `transform: none !important;` globally. Elements like volumetric sun rays and centered sun layers rely on static transforms (such as `rotate(-35deg)` or centering offsets). Resetting `transform` to `none` would break the visual composition.

```css
@media (prefers-reduced-motion: reduce) {
  /* Pause cloud drift animation; preserves static layout and initial position */
  .celestial-cloud-strip {
    animation: none !important;
  }

  /* Halt sun corona breathing; corona rests statically at scale(1) and opacity: 0.92 */
  .celestial-sun-aura {
    animation: none !important;
  }

  /* Halt volumetric ray shimmer; maintains static cone rotations (-35deg, -44deg, -54deg) */
  .celestial-volumetric-rays {
    animation: none !important;
  }
}
```

**Behavioral Breakdown under Reduced Motion**:
1. **Cloud Drift**: Animated strip translation stops. Clouds remain frozen in their natural, pre-offset static horizontal distribution across the scene without visual jumps or reset.
2. **Sun Breathing**: Corona breathing halts at baseline scale ($1.00$) and baseline opacity ($0.92$), maintaining its anchor behind the core.
3. **Volumetric Rays**: Retain their static downward projection angles ($-35^\circ$, $-44^\circ$, $-54^\circ$) without opacity shimmer.
4. **Scene Completeness**: The static composition remains 100% intact, luminous, and aesthetically balanced. Zero visual elements are deleted or shifted out of alignment.

---

## 8. RESPONSIVE COORDINATE SYSTEM

### 8.1 Viewport Dimensions vs. ChatArea Dimensions
A strict technical distinction must be maintained between the browser window and the background container:
- **Viewport Dimensions**: The total window dimensions (`window.innerWidth` $\times$ `window.innerHeight`).
- **ChatArea Dimensions**: The actual rendered bounding box of `ChatArea` (`offsetWidth` $\times$ `offsetHeight`), calculated dynamically after subtracting layout elements:
  - On desktop with Sidebar open: $\text{Width}_{\text{ChatArea}} = \text{Width}_{\text{Viewport}} - 240\text{px}$.
  - On desktop with Sidebar collapsed: $\text{Width}_{\text{ChatArea}} = \text{Width}_{\text{Viewport}} - 64\text{px}$.
  - On mobile: $\text{Width}_{\text{ChatArea}} = \text{Width}_{\text{Viewport}}$ (Sidebar is an overlay drawer).
- **Rule**: All percentage coordinates (such as Sun Center at $X: 82\%, Y: 14\%$) are computed against **ChatArea dimensions**, not Viewport dimensions. When the Sidebar collapses or expands, the background adjusts cleanly within `ChatArea`, avoiding drift behind the Sidebar.

### 8.2 Responsive Reference Table

| Target Viewport Test | Approx. ChatArea Dimensions (Expanded / Collapsed Sidebar) | Sun Placement (relative to ChatArea) | Cloud Treatment | Adaptations |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop ($1440 \times 900$)** | $1200 \times 900\text{px}$ (Open) / $1376 \times 900\text{px}$ (Collapsed) | $X: 82\%, Y: 14\%$ | Full 3 layers | Maximum visual richness |
| **Laptop ($1280 \times 800$)** | $1040 \times 800\text{px}$ (Open) / $1216 \times 800\text{px}$ (Collapsed) | $X: 82\%, Y: 14\%$ | Full 3 layers | Proportionally scaled to container |
| **Tablet ($768 \times 1024$)** | $528 \times 1024\text{px}$ (Open) / $704 \times 1024\text{px}$ (Collapsed) | $X: 84\%, Y: 12\%$ | Layer 2 density -20% | Clears central tablet card column |
| **Mobile ($390 \times 844$)** | $390 \times 844\text{px}$ (Overlay Sidebar) | $X: 78\%, Y: 9\%$ | Layer 3 condensed | Sun core reduced to $42\text{px}$ |
| **Narrow Mobile ($360 \times 800$)** | $360 \times 800\text{px}$ (Overlay Sidebar) | $X: 76\%, Y: 8\%$ | Layer 3 condensed | Sun core reduced to $40\text{px}$ |

---

## 9. TECHNICAL COMPONENT ARCHITECTURE

### 9.1 Container Strategy and Containment Rules
Avoid prescribing aggressive containment (`contain: strict`) or blanket layer promotion (`will-change: contents`, `transform: translateZ(0)`) as defaults:
- `contain: strict` clips sizing and can cause unexpected layout anomalies if children calculate positions dynamically.
- `will-change: contents` does not promote GPU layers and can hinder browser paint caching.
- `transform: translateZ(0)` creates new stacking contexts and composite layers that increase VRAM usage if applied indiscriminately across large full-screen elements.

**Recommended Baseline Container**:
```css
.celestial-background-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
```
Layer promotion (`will-change: transform`) should only be applied to specific animated cloud sub-strips if DevTools profiling demonstrates a measurable reduction in paint times.

### 9.2 Proposed Module Breakdown (Future Phase 3)
```
frontend/src/theme/celestial/
├── CelestialDaylightBackground.tsx  // Top-level background wrapper
├── SkyAtmosphere.tsx                // Multi-stop CSS gradient fallback
├── CinematicSun.tsx                 // SVG core, corona, and volumetric beams
├── CloudCanopy.tsx                  // 3-tier drifting cloud layers
├── celestial.css                    // Hardware keyframes & compositor classes
└── celestial.config.ts              // Visual constants and timings
```

### 9.3 Mount Tree in `ChatBackground.tsx` (Future Phase 4)
```tsx
function ChatBackgroundComponent({ className = '' }: ChatBackgroundProps) {
  const theme = useThemeStore((state) => state.theme)
  const isWorkspace = isWorkspacePath()
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
}
```

---

## 10. SIDEBAR TRANSITION STABILITY STRATEGY

### 10.1 Sidebar Blackout Analysis & Technical Reality
- In the Zyricon theme, profiling suggested that WebGL framebuffer destruction and reallocation during intermediate CSS transition frames was a significant contributing factor to animation stutter and backbuffer flashes.
- **For Celestial Daylight**:
  - Removing WebGL eliminates WebGL context loss, shader compilation pauses, and Three.js framebuffer resizing overhead.
  - **However, removing WebGL does not automatically guarantee that Sidebar transitions will be free from black flashes or glitches.**
  - Non-WebGL risks that could cause momentary background flashes or blanking include:
    1. Unintentional component unmounting/remounting due to key changes or layout tree re-evaluations.
    2. Transient CSS layout invalidation or collapsing container dimensions (`width: 0` or clipping during flex resizing).
    3. Stacking context or paint order anomalies where an underlying dark background (e.g., `#0B0F17` in `.dark` or unstyled canvas) is momentarily exposed before the DOM paints.
    4. Heavy layout reflow or synchronous style recalculation stalling the browser main thread during CSS width transition.

### 10.2 Architectural Safeguards & React Lifecycle Verification:
1. **Solid Color Base Fallback**: The lowest element (`SkyAtmosphere`) sets a solid background color (`background-color: #C8E8FC;`) beneath the gradient image, preventing unpainted backbuffer exposure.
2. **Stable Component Identity (Lifecycle Verification)**:
   - **Do not rely on `React.memo` as a guarantee against unmounting.** `React.memo` only optimizes re-renders when props are shallowly equal; it does not govern unmount/remount cycles.
   - Component unmounting is governed by stable identity and position in the React render tree.
   - In `ChatPage.tsx`, `ChatArea` is rendered unconditionally without dynamic keys. In `ChatArea.tsx`, `ChatBackground` is rendered unconditionally at the top of `<main>`.
   - Acceptance in Phase 5 must verify via lifecycle instrumentation (such as mount/cleanup logging in unit/E2E tests) that `ChatBackground` does **not** unmount during Sidebar collapse or expand.
3. **Container-Relative Coordinates**: Background elements follow `ChatArea` container dimensions directly without viewport-relative offset calculations.
4. **Phase 5 Verification**: Phase 5 must experimentally test and verify Sidebar open and close behavior with recorded video and frame evidence.

---

## 11. COLOR CONTRAST & READABILITY VERIFICATION

All relative luminance ($L$) and contrast ratios are calculated using the official WCAG 2.1 formula:
$$L = 0.2126 R_{lin} + 0.7152 G_{lin} + 0.0722 B_{lin}$$
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05} \quad (L_1 \ge L_2)$$

### 11.1 Category 1: Text on Dedicated Opaque UI Surfaces
UI components in the chat workspace sit on dedicated opaque or high-opacity backgrounds, providing controlled, stable contrast:

| UI Component | Foreground Text ($L$) | Surface Background ($L$) | Exact Contrast Ratio | WCAG 2.1 Level | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AI Message Bubble** | `#1E293B` ($L = 0.0218$) | `#FFFFFF` ($L = 1.0000$) | **$14.63:1$** | Level AAA ($\ge 7.0:1$) | **PASS** |
| **User Message Bubble** | `#FFFFFF` ($L = 1.0000$) | `#0F172A` ($L = 0.0088$) | **$17.85:1$** | Level AAA ($\ge 7.0:1$) | **PASS** |
| **Welcome Cards Title** | `#0F172A` ($L = 0.0088$) | Composite `bg-white/90` over Mid-Sky ($L \approx 0.9779$) | **$17.48:1$** | Level AAA ($\ge 7.0:1$) | **PASS** |
| **Card Subtitle (Primary)** | `#475569` ($L = 0.0886$) | `#FFFFFF` ($L = 1.0000$) | **$7.58:1$** | Level AAA ($\ge 7.0:1$) | **PASS** (Đạt AAA trên mọi vùng compositing) |
| **Card Subtitle (Muted)** | `#64748B` ($L = 0.1706$) | `#FFFFFF` ($L = 1.0000$) | **$4.76:1$** | Level AA ($\ge 4.5:1$) | **PASS điều kiện** (Chỉ đạt trên `#FFFFFF` 100%; xem 11.3 trường hợp compositing) |
| **Composer Input Text** | `#1E293B` ($L = 0.0218$) | `#FFFFFF` ($L = 1.0000$) | **$14.63:1$** | Level AAA ($\ge 7.0:1$) | **PASS** |

### 11.2 Category 2: Text Directly Over Static Atmospheric Gradient
Text placed directly over the background without an opaque container must be verified against the local sky luminance:

| Text Element | Text Color ($L$) | Sky Region ($L$) | Exact Contrast Ratio | WCAG 2.1 Level | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Header Breadcrumb** | `#0F172A` ($L = 0.0088$) | Upper Zenith (`#84C2F5`, $L = 0.5008$) | **$9.37:1$** | Level AAA ($\ge 7.0:1$) | **PASS** |
| **Header Breadcrumb** | `#0F172A` ($L = 0.0088$) | Upper-Mid (`#A6D7FA`, $L = 0.6361$) | **$11.67:1$** | Level AAA ($\ge 7.0:1$) | **PASS** |
| **Header Secondary** | `#334155` ($L = 0.0514$) | Upper Zenith (`#84C2F5`, $L = 0.5008$) | **$5.43:1$** | Level AA ($\ge 4.5:1$) | **PASS** |
| **Header Secondary** | `#334155` ($L = 0.0514$) | Upper-Mid (`#A6D7FA`, $L = 0.6361$) | **$6.77:1$** | Level AA ($\ge 4.5:1$) | **PASS** |
| **Welcome Heading** | `#0F172A` ($L = 0.0088$) | Mid-Sky (`#C8E8FC`, $L = 0.7702$) | **$13.95:1$** | Level AAA ($\ge 7.0:1$) | **PASS** |

### 11.3 Category 3: Alpha Compositing & Dynamic Visual Interference Analysis

1. **Alpha Compositing trên bề mặt bán trong suốt (`bg-white/90`)**:
   - Độ chói của một bề mặt bán trong suốt là **giá trị ước tính phụ thuộc trực tiếp vào màu nền bên dưới**, không phải là một hằng số độc lập.
   - Công thức pha trộn màu (Alpha Compositing):
     $$C_{comp} = \alpha C_{surface} + (1 - \alpha) C_{background}$$
   - **Trường hợp 1 — Trên vùng trời giữa Mid-Sky (`#C8E8FC`, $L = 0.7702$)**:
     - Màu tổng hợp: $R = 0.90(255) + 0.10(200) = 250$, $G = 0.90(255) + 0.10(232) = 253$, $B = 0.90(255) + 0.10(252) = 255$ $\rightarrow$ RGB `[250, 253, 255]`.
     - Độ chói tương đối: $L \approx 0.9779$.
     - Chữ chính `#0F172A`: Tỉ lệ tương phản **$17.48:1$** — **ĐẠT WCAG AAA** ($\ge 7.0:1$).
     - Chữ phụ `#475569`: Tỉ lệ tương phản **$7.42:1$** — **ĐẠT WCAG AAA** ($\ge 7.0:1$).
     - Chữ phụ nhạt `#64748B`: Tỉ lệ tương phản **$4.66:1$** — **ĐẠT WCAG AA** ($\ge 4.5:1$).
   - **Trường hợp 2 — Trên vùng đỉnh trời Zenith (`#84C2F5`, $L = 0.5008$)**:
     - Màu tổng hợp: $R = 0.90(255) + 0.10(132) = 243$, $G = 0.90(255) + 0.10(194) = 249$, $B = 0.90(255) + 0.10(245) = 254$ $\rightarrow$ RGB `[243, 249, 254]`.
     - Độ chói tương đối: $L \approx 0.9396$.
     - Chữ chính `#0F172A`: Tỉ lệ tương phản **$16.83:1$** — **ĐẠT WCAG AAA** ($\ge 7.0:1$).
     - Chữ phụ nhạt `#64748B`: Tỉ lệ tương phản **$4.49:1$** — **KHÔNG ĐẠT WCAG AA (FAIL)**.
       > [!WARNING]
       > Tiêu chuẩn WCAG 2.1 Level AA cho cỡ chữ thông thường (< 18.5px bold hoặc < 24px regular) đòi hỏi tỉ lệ tương phản tối thiểu là **4.50:1**. Tỉ lệ **4.49:1** thấp hơn ngưỡng tối thiểu này và **tuyệt đối không được làm tròn hoặc diễn giải thành đạt**.

2. **Quy tắc về tính khái quát hóa độ tương phản (No Blanket Pass Claims)**:
   - **Tuyệt đối không tuyên bố một màu chữ hoặc surface đạt chuẩn WCAG trên mọi vùng nền nếu chưa kiểm tra đầy đủ các trường hợp compositing cụ thể.**
   - Một bề mặt bán trong suốt (như `bg-white/90`) có thể đạt chuẩn khi đặt trên nền trời sáng, nhưng lại không đạt khi nằm trên vùng gradient sẫm hơn hoặc vùng bóng mây bên dưới. Mỗi vùng giao diện phải được đánh giá dựa trên kịch bản nền thực tế tại tọa độ tương ứng.

3. **Đề xuất kỹ thuật đạt tối thiểu 5:1 cho chữ phụ trên toàn bộ các vùng nền**:
   - *Giới hạn của `#64748B`*: Ngay cả trên bề mặt trắng tinh khiết tuyệt đối 100% (`#FFFFFF`, $L = 1.0$), màu `#64748B` ($L = 0.1706$) chỉ đạt tối đa $\frac{1.00 + 0.05}{0.1706 + 0.05} = \mathbf{4.76:1}$. Do đó, **việc chỉ tăng opacity của surface mà vẫn giữ màu `#64748B` không bao giờ có thể đạt được mục tiêu 5:1**.
   - *Giải pháp bắt buộc — Sử dụng màu chữ phụ tối hơn*:
     - **Giải pháp khuyến nghị (Recommended)**: Sử dụng `#475569` (slate-600, $L = 0.0886$):
       - Trên `bg-white/90` + Zenith (`#84C2F5`): Tương phản đạt **$7.14:1$** (Vượt xa mục tiêu 5:1, đạt cả **WCAG AAA** $\ge 7.0:1$).
       - Trên `bg-white/90` + Mid-Sky (`#C8E8FC`): Tương phản đạt **$7.42:1$** (Đạt **WCAG AAA**).
       - Trên nền trắng đặc (`#FFFFFF` 100%): Tương phản đạt **$7.58:1$** (Đạt **WCAG AAA**).
     - **Lựa chọn thay thế 1**: `#52525B` (zinc-600, $L = 0.0911$): Tương phản trên `bg-white/90` + Zenith đạt **$7.01:1$** ($\ge 5:1$, đạt AAA).
     - **Lựa chọn thay thế 2**: `#4B5563` (gray-600, $L = 0.0950$): Tương phản trên `bg-white/90` + Zenith đạt **$6.82:1$** ($\ge 5:1$, đạt AA+).

4. **Nền động & Yêu cầu đo đạc thực tế tại Phase 5**:
   - Khi mây trôi và ánh sáng mặt trời thở (breathing), độ chói cục bộ của nền thay đổi liên tục theo thời gian.
   - Chữ thứ cấp/muted **tuyệt đối không được thả nổi trực tiếp trên nền trời động** mà không có card bảo vệ; trên nền trời giữa Mid-Sky (`#C8E8FC`), chữ `#64748B` trôi nổi tự do chỉ đạt tương phản **$3.72:1$** (vi phạm nghiêm trọng chuẩn tiếp cận).
   - **Yêu cầu bắt buộc cho Phase 5**: Phase 5 phải thực hiện kiểm thử độ tương phản tự động trên giao diện thực tế đã render đầy đủ (rendered DOM screenshot audit), bao gồm toàn bộ các trạng thái: nền trời tĩnh, khi có dải mây lướt qua phía sau card, vùng có tia sáng mặt trời chiếu tới và các frame chuyển động trung gian.

---

## 12. PHASE 2 ASSET MANIFEST SPECIFICATION

> [!IMPORTANT]
> The target asset budget represents the combined size of the 5 background visual assets, not the entire web page or application network cost. Target sizes represent estimated goals; Phase 2 must maintain an operational ceiling of $\le 350\text{ kB}$ to provide realistic compression headroom.

| Asset File | Target Path | Resolution | Format | Target Size | Hard Ceiling | Visual Purpose | Provenance & License Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cirrus High** | `frontend/public/assets/celestial/clouds/cirrus-high.webp` | $2560 \times 720$ | WebP (Alpha) | $\approx 55\text{ kB}$ | $70\text{ kB}$ | Layer 1 wispy high-altitude clouds | Verified CC0 / Public Domain / Self-authored |
| **Cumulus Mid** | `frontend/public/assets/celestial/clouds/cumulus-mid.webp` | $2560 \times 1080$ | WebP (Alpha) | $\approx 150\text{ kB}$ | $180\text{ kB}$ | Layer 2 soft-billowing peripheral cumulus | Verified CC0 / Public Domain / Self-authored |
| **Stratus Haze** | `frontend/public/assets/celestial/clouds/stratus-low.webp` | $2560 \times 600$ | WebP (Alpha) | $\approx 75\text{ kB}$ | $90\text{ kB}$ | Layer 3 horizon atmospheric mist | Verified CC0 / Public Domain / Self-authored |
| **Sun Corona** | `frontend/public/assets/celestial/sun/sun-corona.svg` | Vector (Scalable) | SVG | $\approx 5\text{ kB}$ | $8\text{ kB}$ | Concentric sun core, corona & aura | Procedural Vector (Documented provenance) |
| **Volumetric Rays** | `frontend/public/assets/celestial/sun/volumetric-rays.svg` | Vector (Scalable) | SVG | $\approx 4\text{ kB}$ | $6\text{ kB}$ | Angled crepuscular light beams | Procedural Vector (Documented provenance) |
| **Combined Budget** | — | — | — | **$\approx 289\text{ kB}$** | **$\le 350\text{ kB}$** | High-efficiency visual assets | Full documentation in `ATTRIBUTION.md` |

### Phase 2 Documentation Requirements:
For every prepared asset, Phase 2 must record in `frontend/public/assets/celestial/ATTRIBUTION.md`:
1. Exact source URL or creation methodology.
2. Author, publisher, or original organization.
3. Verified license string (e.g., CC0 1.0 Universal, Public Domain Mark, or explicit open commercial license).
4. Required attribution notices.
5. Actual downloaded and optimized byte sizes.
6. Validation that transparent alpha channels have clean edges with zero white fringing.

---

## 13. ACCEPTANCE CRITERIA FOR FUTURE PHASES

- **Phase 2 (Asset Preparation)**:
  - All 5 assets created or acquired with verified licenses and documented provenance.
  - Transparent alpha channels verified with zero fringing or clipping artifacts.
  - Combined asset size meets the operational ceiling ($\le 350\text{ kB}$).
- **Phase 3 (Core Background Implementation)**:
  - Standalone preview of `CelestialDaylightBackground` displays accurate gradient, sun, and cloud drift.
  - Zero Three.js imports or canvas element dependencies.
  - `prefers-reduced-motion` cleanly freezes all movement into a static daytime composition without displacing static transforms or rotations.
- **Phase 4 (UI Integration)**:
  - Mounts in `ChatBackground.tsx` exclusively for Light theme in workspace routes.
  - Theme switching `Dark` $\leftrightarrow$ `Light` $\leftrightarrow$ `Zyricon` operates smoothly without visual glitches or DOM leaks.
- **Phase 5 (Testing & Optimization — Measurable Criteria)**:
  - **Sidebar Transition Stability**: No observable black flash, visual gap, or background disappearance during tested Sidebar expand and collapse transitions. Video recording and frame-by-frame screenshot captures in Playwright verify continuous background visibility.
  - **Performance Profiling**: DevTools performance profiling measures and records CPU main-thread utilization and rendering frame times, confirming that background animations do not cause dropped frames or continuous main-thread layout thrashing during idle chat.
  - **Test Baseline**: Zero test regressions in Vitest across all existing unit test files (40 files, 621 tests).
  - **Responsive Verification**: Visual layout verified across all agreed dimensions ($1440\times 900$, $1280\times 800$, $768\times 1024$, $390\times 844$, $360\times 800$).
  - **Accessibility Verification**: Reduced-motion behavior verified to halt motion while preserving the complete static visual composition. Contrast ratios verified with empirical visual evidence at brightest and darkest zones on rendered UI.

---

## 14. UNRESOLVED DECISIONS AND RISKS

1. **Pointer Parallax Inclusion**:
   - *Status*: Recommended as an optional, desktop-only progressive enhancement. Default active state to be decided based on empirical Phase 5 performance measurements.
2. **Auth Page Background**:
   - *Status*: Confirmed — auth pages (`/login`, `/register`) remain on clean `--workspace-canvas` to preserve maximum focus on form inputs.
3. **Asset Sourcing & Texture Seam Continuity**:
   - *Status*: Transparent cloud textures will be sourced exclusively from verified CC0/Public Domain repositories (e.g., NASA, Wikimedia Commons, or generated via procedurally masked high-res photography). Seam continuity must be empirically validated once textures are prepared.
