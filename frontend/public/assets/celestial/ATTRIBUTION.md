# CELESTIAL DAYLIGHT — ASSET ATTRIBUTION & PROVENANCE

**Project**: AI Chat Clone  
**Theme**: Light Theme (`Celestial Daylight`)  
**Directory**: `frontend/public/assets/celestial/`  
**License**: Creative Commons Zero 1.0 Universal (CC0 1.0 Public Domain Dedication)  
**Commercial Use**: Fully Permitted Worldwide (No royalties, no copyright restrictions)

---

## 1. PROVENANCE & AUTHORSHIP STATEMENT

All visual assets within the `celestial/` asset library were procedurally designed and authored specifically for the **Celestial Daylight** Light theme experience in the AI Chat Clone project.

- **Author / Organization**: Senior UI Engineer & Technical Artist, AI Chat Clone Team.
- **Copyright Status**: Dedicated unconditionally to the Public Domain under **CC0 1.0 Universal**.
- **Third-Party Copyrights**: None. Zero external copyrighted images, proprietary stock photos, or non-free assets were used in the generation or composition of these files.

---

## 2. GENERATION METHODOLOGY

### 2.1 Cloud Textures (`clouds/`)
- **Spectral Synthesis**: Cloud density fields were synthesized using 2D Inverse Fast Fourier Transforms ($\text{iFFT}$) of power-law anisotropic spectral distributions $P(k) \propto k^{-\gamma}$, ensuring natural fractal Rayleigh-turbulent formations.
- **Mathematical Toroidal Continuity**: Periodic boundary conditions on the frequency domain enforce that column $0$ and column $W-1$ connect continuously with $C^1$ smoothstep continuity, guaranteeing seamless $X$-axis looping across duplicated $200\%$ animation strips without seam tears or visible junctions.
- **Safe Corridor Masking**: Cloud masses are concentrated at peripheral flanks ($X \in [0, 22\%]$ and $X \in [78\%, 100\%]$) with a smooth cosine corridor in the center ($X \in [22\%, 78\%]$) to maintain high contrast and legibility for chat messages, cards, and input fields.
- **3D Atmospheric Shading**: Rims and crests are shaded with high-altitude sunlight highlights (`#FFFFFF`), while undersides feature soft ambient Rayleigh shadow scattering (`#D9E8F5`).
- **WebP Optimization**: Transparent pixels ($\alpha \le 3$) have RGB values zeroed out, eliminating invisible high-frequency entropy and preventing dark/white fringing artifacts during browser alpha compositing.

### 2.2 Solar Vectors (`sun/`)
- **Procedural SVG Vectors**: Authored with precision SVG geometry, scalable `viewBox` coordinates, and multi-stop linear/radial gradients.
- **Visual Staging**: Emulates real-world solar atmospheric optics:
  - 64px central Photosphere core (`#FFFFFF` to `#FFE8A3`).
  - 180px inner Chromosphere and Corona aura.
  - 560px diffuse atmospheric bloom designed for subtle 16s breathing animations.
  - Directional crepuscular volumetric rays (God rays) extending down-left at $-35^\circ$, $-44^\circ$, and $-54^\circ$, fading to $0\%$ opacity prior to text boundaries.

---

## 3. ASSET INVENTORY & LICENSES

| Asset File | Format | Dimensions | Purpose | Author | License |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `clouds/cirrus-high.webp` | WebP (Alpha) | $2560 \times 720$ | Layer 1 high-altitude wispy cirrus streaks | Senior UI Engineer | CC0 1.0 Universal |
| `clouds/cumulus-mid.webp` | WebP (Alpha) | $2560 \times 1080$ | Layer 2 midground billowing cumulus canopy | Senior UI Engineer | CC0 1.0 Universal |
| `clouds/stratus-low.webp` | WebP (Alpha) | $2560 \times 600$ | Layer 3 low horizon atmospheric haze | Senior UI Engineer | CC0 1.0 Universal |
| `sun/sun-corona.svg` | Scalable Vector | $560 \times 560$ (viewBox) | Concentric solar core, chromosphere & corona | Senior UI Engineer | CC0 1.0 Universal |
| `sun/volumetric-rays.svg` | Scalable Vector | $800 \times 600$ (viewBox) | Directional crepuscular sunbeam shafts | Senior UI Engineer | CC0 1.0 Universal |

---

## 4. CC0 1.0 UNIVERSAL LEGAL TEXT SUMMARY

To the extent possible under law, the authors have dedicated all copyright and related and neighboring rights to this software and asset collection to the public domain worldwide. This work is distributed without any warranty.

You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.

Official legal code: <https://creativecommons.org/publicdomain/zero/1.0/legalcode>

