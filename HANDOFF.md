# Session Handoff — Tonearm Calculator & Site Work

## Worktree

Branch: `claude/eloquent-shamir`
Worktree: `.claude/worktrees/eloquent-shamir`

## What's Done and Deployed to Main

### Motor Frequency Calculator
- Added hysteresis and reluctance motor types
- Reluctance torque ripple follows phase-dependent pattern (2-phase: 2k, 3-phase: 6k)
- Single-phase removed from reluctance (needs at least 2 phases)
- Toggle buttons wrap on mobile

### RIAA EQ Tool (replaced Google Sheets embed)
- Native React + Plotly tool computing exact RIAA from time constants
- Two independent toggles: RIAA (Playback/Recording) × Curve (Full/Turnover/Shelf)
- Turnover and shelf each normalized to 0 dB at 1 kHz (Wurcer-style)
- Their dB sum equals the full RIAA at every frequency
- 91 specific frequency values in the table (user's custom list, not IEC standard)
- Collapsible table with CSV download
- Plot axes locked, legend position adapts for recording mode
- All formulas verified against the Wurcer biquad optimizer (`riaa_biquad_optimizer.py`)

### PDF Embed System
- `assets/js/pdf-embed.js` — renders PDFs to canvas via pdf.js (ES module)
- `_layouts/pdf.html` — Jekyll layout, just needs `pdf:` and optional `pdf_mixed_sizes: true` in frontmatter
- All 16 PDF pages (brochures, manuals, test records) converted from Adobe SDK
- Retina-aware rendering, `#page=N` deep linking, responsive via CSS aspect-ratio
- Default: uniform page sizing. `pdf_mixed_sizes: true` for EPA-100 and SP-20

### Lightbox for Imagery
- `assets/js/lightbox.js` + `assets/css/lightbox.css`
- `_layouts/imagery.html` — adds lightbox to imagery pages
- Navigation: keyboard arrows, mouse click arrows, touch swipe, trackpad horizontal scroll
- Trackpad momentum locked to one image per gesture
- All 7 imagery pages use the imagery layout

### Site Structure
- All content moved from `docs/` to root for cleaner URLs
- `jekyll-redirect-from` plugin with redirects from all old `/docs/` paths
- "View on GitHub" link removed from header
- `theme-color` meta tag added (dark, for link previews — doesn't affect iMessage though)
- `THEMING.md` — complete color inventory for future CSS variable migration

### Wurcer Biquad Optimizer (separate repo: WnF-Filters)
- Validation upgraded from 11 test points to 500 log-spaced points up to Nyquist/4
- Per-band error reporting (low/mid/high)
- Plots extended to Nyquist/4
- Was running in background — check if it completed

## What's on the Branch but NOT on Main

### Tonearm LF Mechanics Calculator
- `assets/tools/tonearm-calculator.js` — React app
- `assets/tools/tonearm-calculator.css` — styling
- `assets/tools/tonearm-calculator-test.html` — standalone test file (open in browser, no Jekyll needed)
- NOT yet wired into a Jekyll page or published

#### What Works
- All input parameters match the Luckydog spreadsheet (`loafer_unprotected.xls`)
- Cartridge damping from static/dynamic compliance ratio — exact match
- Log decrement damping measurement — exact match
- Resonant frequency formula `(1 + (1/(2*Q))^2) * sqrt(k/m) / (2*pi)` — exact match (9.1422 Hz)
- All intermediate values verified: wn, k, m, cc, Tc, cartQ, calcArmDamping, overallDamping, overallQ, T
- Frequency response plot (transmissibility from Sheet3 formula) — verified at 9 Hz: 8.038 dB matches
- Transient decay plot (damped cosine from Sheet3 G column)
- Min VTF required: 1.7301 gf (spreadsheet: 1.7291 gf)
- Velocity rms: 8.3970 cm/s — exact match
- RIAA level — exact match

#### What Doesn't Work / Needs Attention
- **VTF vs frequency plot was removed** — multiple attempts produced incorrect results. The physics of computing required VTF across frequency at constant groove velocity needs proper derivation. Key issue: the spreadsheet only computes VTF at ONE frequency via full time-domain simulation (Sheet2). Extrapolating to a frequency sweep requires understanding the force at the stylus-groove contact point, which involves both spring and damping forces through the cantilever, with the damping coefficient from Sheet2 B1 (`zetaS2 = 0.001 + cart_damping_coeff`). The `/0.01` scaling in the VTF formula is the gf conversion. The force transmissibility approach was wrong — it gives force on the arm mass, not at the contact point.
- **iMessage link preview color** — `theme-color` meta tag doesn't control iMessage card backgrounds. iOS 18+ extracts color from `og:image`. Need to provide an `og:image` with dark background to fix this.
- **Imagery pages** — could benefit from frontmatter-driven image lists (like the PDF layout) instead of repetitive HTML divs. The layout infrastructure exists but the conversion wasn't done.

#### Key Spreadsheet Formulas (extracted via Spire.XLS)
All formulas are in the JS file comments, but the critical ones:
- Cartridge damping (O4): `IF(dcomp=0, 0.05, IF(dfreq>10000, 0.2, (k*sqrt((Z/k)^2-1))/(2*pi*dfreq))/cc)`
- Resonant freq (N7): `(1+(1/(2*Q))^2)*sqrt(k/m)/(2*pi)`
- Calc arm damping (H13): `1/sqrt(1+(2*pi/LN(A/B))^2) - Tc`
- Frequency response (Sheet3 D): `20*LOG(sqrt((r^4+(2*Ta*r)^2)/((1-r^2)^2+(2*(Ta+Tc)*r)^2)))` where r=w/wn
- Transient (Sheet3 G): `EXP(-overallDamping*t)*COS(sqrt(1-overallDamping^2)*t)`
- Named ranges: vtf=H3, compliance=H4, dcomp=H5, dfreq=H6, k=J18, m=J17, wn=C18, cc=M17, AE=P17, Z=P18, T=M19, Tc=Sheet3!B2, Ta=Sheet3!D2

#### Source Spreadsheet
- Original: `/Users/jjones/Documents/ClaudeCowork/Excels/loafer.xls` (encrypted with VelvetSweatshop)
- Unprotected: `/Users/jjones/Documents/ClaudeCowork/Excels/loafer_unprotected.xls`
- Formulas readable via `spire.xls` Python library (xlrd can't read formulas from .xls)

## User Preferences (Critical)
- **Always confirm plan before coding.** Do not make changes without explicit approval.
- **"Merge to main" means: push branch → `gh pr create` → wait for CI → `gh pr merge --merge`.** Never push directly to main.
- **Do not merge or push unless explicitly told to.**
- **Fix things properly, not patches.** Diagnose root causes. Use browser tools for CSS issues.
- **Check your work before publishing.** Compute values and verify they match before pushing.
- **Don't guess at physics.** If you're not confident, say so and research or ask.
- **Consider the complete picture.** Renaming something means renaming it everywhere.
- **Keep code clean.** Internal variables should match their labels. No stale references.
