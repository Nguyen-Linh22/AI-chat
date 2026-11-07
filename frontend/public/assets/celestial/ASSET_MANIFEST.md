# CELESTIAL DAYLIGHT — ASSET MANIFEST

- **Specification Reference**: Phase 1 Technical Specification (`docs/celestial-daylight/PHASE_1_DESIGN.md`, Revision 1.2.0)
- **Asset Directory**: `frontend/public/assets/celestial/`
- **Creation Date**: 2026-11-07
- **Total Combined Size**: **261,038 bytes (254.92 KB)**
- **Operational Hard Ceiling**: **350.00 KB** (Savings / Headroom: **88.96 KB / 25.4% under ceiling**)
- **Target Estimate**: $\approx 289\text{ kB}$ (Actual is **34.08 KB under target estimate**)
- **License**: CC0 1.0 Universal (Public Domain Dedication)

---

## 1. COMPREHENSIVE ASSET REGISTRY TABLE

| Asset ID | Relative File Path | Format | Dimensions | File Size (Bytes) | File Size (KB) | Phase 1 Target | Hard Ceiling | Status | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cloud-cirrus-high` | `clouds/cirrus-high.webp` | WebP (Alpha) | $2560 \times 720$ | $69,208$ | $67.59\text{ kB}$ | $\approx 55\text{ kB}$ | $70\text{ kB}$ | **PASS** | `7d7649890966918311008c8792fbe0af769c463487d06285bb28c30e00c9d206` |
| `cloud-cumulus-mid` | `clouds/cumulus-mid.webp` | WebP (Alpha) | $2560 \times 1080$ | $146,020$ | $142.60\text{ kB}$ | $\approx 150\text{ kB}$ | $180\text{ kB}$ | **PASS** | `c6e03db49f41c09fb0e6327d9645fce2e50f7e8a624734ab22858a29842b4b2b` |
| `cloud-stratus-low` | `clouds/stratus-low.webp` | WebP (Alpha) | $2560 \times 600$ | $41,576$ | $40.60\text{ kB}$ | $\approx 75\text{ kB}$ | $90\text{ kB}$ | **PASS** | `6559087d04a16e1708db9f457882468fe663a4b02d6d99bc3b7b9313a0857310` |
| `sun-corona` | `sun/sun-corona.svg` | Scalable Vector | $560 \times 560$ (viewBox) | $2,314$ | $2.26\text{ kB}$ | $\approx 5\text{ kB}$ | $8\text{ kB}$ | **PASS** | `34bc4ffd393034a7abd9d933a9cc276b09685b9a82fb00402df9011cb6805c8f` |
| `volumetric-rays` | `sun/volumetric-rays.svg` | Scalable Vector | $800 \times 600$ (viewBox) | $1,920$ | $1.88\text{ kB}$ | $\approx 4\text{ kB}$ | $6\text{ kB}$ | **PASS** | `fd83bb462ae169f0d0783ded26a3a3a66e75dedb0e96f8855cafea8a1ddfe31f` |
| **TOTAL** | **5 Assets** | — | — | **261,038** | **254.92 kB** | **$\approx 289$ kB** | **$\le 350$ kB** | **PASS** | — |

---

## 2. DETAILED ASSET SPECIFICATIONS

### 2.1 Layer 1: High Cirrus Clouds (`clouds/cirrus-high.webp`)
- **Dimensions**: $2560 \times 720$ pixels.
- **Color Space**: sRGB 8-bit RGBA.
- **Visual Description**: Anisotropic wispy cirrus streaks elongated horizontally along high-altitude wind currents. Center of mass spans $Y \in [10\%, 40\%]$.
- **Alpha Channel**: Max opacity $38\%$ ($96/255$). Top and bottom boundaries fade smoothly to $\alpha = 0$.
- **Seamless Tiling Verification**: Leftmost column ($X=0$) and rightmost column ($X=2559$) match with channel delta = 0 across all 720 rows, ensuring zero seam jump when animated via duplicated 200% strip.

### 2.2 Layer 2: Midground Cumulus Canopy (`clouds/cumulus-mid.webp`)
- **Dimensions**: $2560 \times 1080$ pixels.
- **Color Space**: sRGB 8-bit RGBA.
- **Visual Description**: Soft-billowing peripheral cumulus formations with physical Rayleigh lighting: pure white crest highlights (`#FFFFFF`) and delicate cool ambient shadows (`#D9E8F5`) along lower edges.
- **Safe Corridor Mask**: Density is heavy at flanks ($X \in [0, 22\%]$ and $X \in [78\%, 100\%]$) and gracefully tapers to delicate wisps across the central reading zone ($X \in [22\%, 78\%]$).
- **Alpha Channel**: Max opacity $62\%$ ($158/255$). Top and bottom boundaries fade cleanly to $\alpha = 0$.
- **Seamless Tiling Verification**: Channel A delta = 0 across all 1080 vertical rows between $X=0$ and $X=2559$.

### 2.3 Layer 3: Low Stratus Horizon Mist (`clouds/stratus-low.webp`)
- **Dimensions**: $2560 \times 600$ pixels.
- **Color Space**: sRGB 8-bit RGBA.
- **Visual Description**: Diffuse horizontal morning atmospheric haze and mist settling above the horizon ($Y \in [60\%, 100\%]$).
- **Alpha Channel**: Max opacity $42\%$ ($107/255$). Top and bottom rows both fade to $\alpha = 0$.
- **Seamless Tiling Verification**: Channel A delta = 0 across all 600 vertical rows.

### 2.4 Sun Corona (`sun/sun-corona.svg`)
- **Dimensions**: Scalable vector, `viewBox="0 0 560 560"`.
- **Center**: $(280, 280)$.
- **Structure**:
  - Photosphere core: $64\text{px}$ diameter with high-luminance radial gradient (`#FFFFFF` to `#FFE8A3`) and Gaussian blur radiance filter.
  - Chromosphere & Corona: $180\text{px}$ diameter with warm solar transition (`#FFFFFF` to `#FFC83B` at $0\%$ alpha).
  - Atmospheric Halo: $560\text{px}$ diameter with soft diffuse bloom (`#FFF2B2` to `#C8E8FC`).
- **Animation Target**: Scaled $1.00 \leftrightarrow 1.03$ over a 16s breathing cycle.

### 2.5 Directional Volumetric Rays (`sun/volumetric-rays.svg`)
- **Dimensions**: Scalable vector, `viewBox="0 0 800 600"`.
- **Structure**:
  - 3 angled crepuscular shafts casting down-left:
    - Shaft A: $-35^\circ$ angle, width $\approx 40\text{px}$, peak opacity $14\%$.
    - Shaft B (Central): $-44^\circ$ angle, width $\approx 75\text{px}$, peak opacity $18\%$.
    - Shaft C: $-54^\circ$ angle, width $\approx 50\text{px}$, peak opacity $12\%$.
  - Linear gradients attenuate each beam to $0\%$ opacity before reaching text-heavy margins.
  - Blend mode: Designed for CSS `mix-blend-mode: screen`.

---

## 3. ASSET INTEGRITY AND QUALITY ASSURANCE

1. **Alpha Channel & Zero Fringing**:
   - Every transparent pixel has RGB values zeroed out (`[0, 0, 0, 0]`), eliminating fringe halos when blended over dark, light, or colored backgrounds.
2. **Loop Continuity**:
   - Each cloud asset is mathematically continuous across the $X$-axis. In a 200% width duplicated strip drifting with `transform: translate3d(-50%, 0, 0)`, the transition between Segment A and Segment B has zero pixel jump.
3. **Payload Budget Compliance**:
   - Combined size of 254.92 KB is comfortably below the 350 KB operational ceiling and below the 289 KB target estimate.

