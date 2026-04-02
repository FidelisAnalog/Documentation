# Theming Reference

This document catalogs all colors used across the site's tools, components, and overlays. The goal is to migrate all hard-coded colors to CSS custom properties defined in the color scheme file (`_sass/color_schemes/myhifi-dark.scss`), enabling future light theme support.

## Status

**Not yet implemented.** This is a reference for planning the migration.

## Current Color Inventory

### Backgrounds

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `#0b0e14` | Tool container background (motor calc, RIAA EQ) | `--tool-bg` |
| `#0f1319` | Input panels, output panels, table wrappers | `--tool-panel-bg` |
| `#1a1a1a` | PDF page placeholder before render | `--tool-placeholder-bg` |
| `rgba(0,0,0,0.92)` | Lightbox overlay | `--lightbox-overlay-bg` |
| `rgba(255,255,255,0.04)` | Button/input default background | `--tool-input-bg` |
| `rgba(255,255,255,0.08)` | Button/input hover background | `--tool-input-bg-hover` |
| `rgba(0,229,255,0.08)` | Input focus background | `--tool-input-bg-focus` |
| `rgba(0,229,255,0.15)` | Active toggle button background | `--tool-toggle-active-bg` |

### Text

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `#fff` | Titles, headings, panel titles | `--tool-text-bright` |
| `rgba(255,255,255,0.9)` | Values, emphasis text, table data | `--tool-text-emphasis` |
| `rgba(255,255,255,0.8)` | Table body text | `--tool-text-data` |
| `rgba(255,255,255,0.7)` | Body text, default font color | `--tool-text` |
| `rgba(255,255,255,0.5)` | Labels, secondary text, table headers | `--tool-text-dim` |
| `rgba(255,255,255,0.35)` | Very dim text (JS `C.dim` constant) | `--tool-text-faint` |
| `rgba(255,255,255,0.3)` | Chevrons, muted UI elements | `--tool-text-muted` |

### Borders and Dividers

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `rgba(255,255,255,0.2)` | Input field borders, zeroline | `--tool-border-input` |
| `rgba(255,255,255,0.1)` | Table header borders, axis lines | `--tool-border-medium` |
| `rgba(255,255,255,0.08)` | Panel/container borders | `--tool-border` |
| `rgba(255,255,255,0.05)` | Panel header dividers | `--tool-border-light` |
| `rgba(255,255,255,0.03)` | Row dividers (frequency rows, table cells) | `--tool-border-subtle` |
| `rgba(0,229,255,0.5)` | Active toggle button border | `--tool-toggle-active-border` |
| `rgba(255,255,255,0.3)` | Input hover border | `--tool-border-hover` |

### Accent

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `#00e5ff` | Primary accent: slider thumb, active toggle text, ref row highlight, CSV/download links | `--tool-accent` |
| `rgba(0,229,255,0.3)` | Reference curve dotted line (plot) | `--tool-accent-dim` |

### Chart / Plot Colors

These are used in both the motor frequency calculator and the RIAA EQ tool. They appear in JS (Plotly trace configs, React color constants) and need to be readable via `getComputedStyle()`.

| Current Value | Usage (Motor Calc) | Usage (RIAA EQ) | Proposed Variable |
|---|---|---|---|
| `#00e5ff` (cyan) | Torque ripple | Full RIAA curve, reference lines | `--chart-cyan` |
| `#ff2d7b` (pink) | Cogging frequency | — | `--chart-pink` |
| `#ffc400` (gold) | Slot/coil harmonics | Turnover curve | `--chart-gold` |
| `#a855f7` (purple) | Pole harmonics | Shelf curve | `--chart-purple` |
| `#22c55e` (green) | Electrical harmonics | — | `--chart-green` |
| `#f97316` (orange) | Mechanical harmonics | — | `--chart-orange` |

### Plotly Layout Colors

These are set in JS layout objects and need to be read from CSS variables.

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `#0b0e14` | `paper_bgcolor` | `--tool-bg` (reuse) |
| `#0f1319` | `plot_bgcolor` | `--tool-panel-bg` (reuse) |
| `rgba(255,255,255,0.06)` | Grid lines | `--tool-grid` |
| `rgba(255,255,255,0.1)` | Axis lines | `--tool-border-medium` (reuse) |
| `rgba(255,255,255,0.2)` | Zero line | `--tool-border-input` (reuse) |
| `rgba(255,255,255,0.7)` | Axis/legend font color | `--tool-text` (reuse) |

### Data Table Colors

The RIAA EQ and motor calculator tables use inline styles and CSS classes. These need theming:

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `#0f1319` | Table wrapper background | `--tool-panel-bg` (reuse) |
| `rgba(255,255,255,0.08)` | Table wrapper border | `--tool-border` (reuse) |
| `rgba(255,255,255,0.1)` | Table header border-bottom | `--tool-border-medium` (reuse) |
| `rgba(255,255,255,0.03)` | Table row borders | `--tool-border-subtle` (reuse) |
| `rgba(255,255,255,0.5)` | Table header text, frequency column | `--tool-text-dim` (reuse) |
| `rgba(255,255,255,0.8)` | Table data text | `--tool-text-data` |
| `#00e5ff` | Reference row (1 kHz) highlight | `--tool-accent` (reuse) |

### Lightbox

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `rgba(0,0,0,0.92)` | Overlay background | `--lightbox-overlay-bg` |
| `rgba(255,255,255,0.6)` | Close button | `--tool-text-dim` (reuse) |
| `rgba(255,255,255,0.5)` | Nav arrows, counter text | `--tool-text-dim` (reuse) |
| `#fff` | Close/nav hover | `--tool-text-bright` (reuse) |

### PDF Embed

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `#1a1a1a` | Canvas placeholder background | `--tool-placeholder-bg` |
| `#00e5ff` | Download link color | `--tool-accent` (reuse) |
| `#ff4444` | Error message text | `--tool-error` |
| `rgba(255,255,255,0.5)` | Loading text | `--tool-text-dim` (reuse) |

### Slider (Motor Calc)

| Current Value | Usage | Proposed Variable |
|---|---|---|
| `rgba(255,255,255,0.1)` | Track background | `--tool-border-medium` (reuse) |
| `#00e5ff` | Thumb color | `--tool-accent` (reuse) |
| `rgba(0,0,0,0.3)` | Thumb shadow | `--tool-shadow` |

## Files That Need Changes

### CSS Files
- `assets/tools/motor-frequency-calculator.css` — all hard-coded colors to variables
- `assets/tools/riaa-eq.css` — all hard-coded colors to variables
- `assets/css/lightbox.css` — overlay, text, and hover colors to variables

### JS Files (colors set programmatically)
- `assets/tools/motor-frequency-calculator.js` — `C` color constant object, read from CSS variables at init
- `assets/tools/riaa-eq.js` — Plotly layout colors and trace colors, read from CSS variables
- `assets/js/pdf-embed.js` — placeholder background, download link, error text colors
- `assets/js/lightbox.js` — close button, nav arrow inline styles

### Scheme File
- `_sass/color_schemes/myhifi-dark.scss` — define all `--tool-*` and `--chart-*` variables in `:root`

## Implementation Notes

- CSS files can reference variables directly: `background: var(--tool-bg)`
- JS files need to read variables at render time: `getComputedStyle(document.documentElement).getPropertyValue('--tool-bg').trim()`
- Chart colors (cyan, pink, gold, etc.) may stay the same in light and dark — they're semantic, chosen for meaning and contrast. Test before deciding.
- Lightbox overlay may need a lighter semi-transparent background in light mode
- Plotly grid/axis colors will definitely need to flip (white-on-dark vs dark-on-light)
