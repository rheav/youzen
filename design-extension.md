# vtexSnitch — Browser Extension Design System

> High-fidelity design specification for the vtexSnitch Chrome side-panel UI.  
> Stack: React 18 + TailwindCSS v4 (`@theme`) + `lucide-react` + CSS variables for runtime theming + `Outfit` font.  
> Aesthetic code name: **Rose-Water** (light-default) and **Midnight Cherry** (dark). Same brand soul as the website, compressed for a ~400–480px side panel.

---

## 1. Design Philosophy — "Snappy, Airy, Never Heavy"

A side panel lives next to the DevTools inspector. It must feel **instant, glanceable, and gentle**. The panel is the developer's *second monitor*, not a pop-up they want to dismiss.

Non-negotiable principles:

- **Compact without being cramped.** Default padding is `px-4 pt-6 pb-12`, reducible to `px-2 pt-4 pb-10` via a Compact Mode toggle. Tiles are 2px gapped (`gap-2`). Nothing edges into another element.
- **Glass over paint.** Every content card is `bg-white/40` + `backdrop-blur-md`, sitting on a soft rose-water diagonal. Dark mode inverts the formula (translucent white over a near-black-blue atmosphere) — the classic iOS glass trick, not recolored-light-mode.
- **Hairline borders + low-alpha shadows.** Standard tile: `border border-silver-lining/30 shadow-sm shadow-silver-lining/20`. Hover: `border-azure-sky/50 shadow-azure-sky/20`. Never drop-shadows on white; always *tinted* shadows.
- **Motion is fast and short.** `animate-fade-in` is `350ms cubic-bezier(0.22, 1, 0.36, 1)` with a 4px lift. Copy-feedback is a 1200ms timeout. No long entrances — the panel must feel like it's *already there*.
- **One accent, one job.** Pink `#f71963` means "brand / active / action." Azure `#0366d6` means "value / data." Everything else is grey.
- **Zero scroll surprises.** Custom 7px pink-gradient scrollbars in both themes so the panel never flashes a native grey bar.

---

## 2. Color System — Dual-Theme Tokens

The extension runs **two complete palettes**, swapped by `data-theme="light" | "dark"` on the root. Both palettes use the *same variable names*, so components don't branch — CSS does.

### 2.1 Token map (authoritative)

```css
/* LIGHT — "Rose-Water" (default) */
@theme {
  --color-core-pink:            #f71963;
  --color-cherry-blossom:       #ffc4dd;
  --color-rose-water:           #ffe0ef;
  --color-rich-rose-water:      #ffb6cf;
  --color-midnight-blue:        #142032;  /* primary text */
  --color-azure-sky:            #0366d6;  /* value text / links */
  --color-storm-cloud-grey:     #5e6e84;  /* secondary text */
  --color-silver-lining:        #a1aab7;  /* borders / muted */
  --color-bright-silver-lining: #cfd4dc;
  --color-winter-mist:          #f8f7fc;  /* panel bg */
  --color-forest:               #16a34a;  /* success */
  --color-pebble:               #8591a3;
}

/* DARK — "Midnight Cherry" */
[data-theme='dark'] {
  --color-core-pink:            #ff3d7f;  /* lifted for legibility on dark */
  --color-cherry-blossom:       #5a2540;
  --color-rose-water:           #2a1520;
  --color-rich-rose-water:      #4a2038;
  --color-midnight-blue:        #e8ecf5;  /* text flips to light */
  --color-azure-sky:            #5aa9ff;
  --color-storm-cloud-grey:     #9aa6bc;
  --color-silver-lining:        #3a4357;
  --color-bright-silver-lining: #2a3142;
  --color-winter-mist:          #141928;
  --color-forest:               #4ade80;
  --color-pebble:               #8a94a8;
  color-scheme: dark;
}
```

### 2.2 Semantic component tokens (used by Button/Card/Toggle/Badge)

These live in a separate layer so components consume *roles*, not raw colors:

```css
:root {
  --radius:            6px;
  --radius-lg:         8px;
  --accent:            var(--color-core-pink);
  --accent-hover:      #d90d54;
  --accent-text:       #ffffff;
  --bg-secondary:      rgba(255,255,255,0.60);   /* card surface */
  --bg-tertiary:       rgba(255,255,255,0.80);   /* hover */
  --border:            rgba(161,170,183,0.30);
  --border-subtle:     rgba(161,170,183,0.18);
  --text-primary:      var(--color-midnight-blue);
  --text-secondary:    var(--color-storm-cloud-grey);
  --text-muted:        var(--color-pebble);
  --shadow:            0 1px 2px rgba(161,170,183,0.20);
  --shadow-hover:      0 4px 12px rgba(161,170,183,0.25);
  --transition-fast:   150ms cubic-bezier(0.22,1,0.36,1);
  --transition:        200ms cubic-bezier(0.22,1,0.36,1);
  --transition-slow:   350ms cubic-bezier(0.22,1,0.36,1);
  --success:           #16a34a;
  --success-subtle:    rgba(22,163,74,0.12);
  --error:             #ef4444;
  --error-subtle:      rgba(239,68,68,0.10);
  --warning:           #f59e0b;
  --warning-subtle:    rgba(245,158,11,0.12);
  --info:              var(--color-azure-sky);
  --info-subtle:       rgba(3,102,214,0.10);
}
```

### 2.3 The Vision Gradient — small-format use

Same gradient soul as the website, but used sparingly:

```css
.text-vision-gradient {
  background-image: linear-gradient(90deg, #f71963 15%, #b75098 50%, #75abfd 82%, #92bcfa);
  background-size: 300% 100%;
  animation: moveGradient 5s ease infinite;
  -webkit-background-clip: text;
  color: transparent;
}
```

Appears on: the wordmark `vtexSnitch` in the header, the active Tab chip, the theme-active button, the `LoadingSkeleton` fallback.

---

## 3. Atmosphere — Two Root Backdrops

The root container (`App.jsx`) swaps its entire background class based on theme — **no layering overrides**.

**Light** (`bg-gradient-to-br from-white from-50% via-rose-water/90 via-70% to-silver-lining/40 to-90%`): a subtle 135° fade white → rose-water → silver. The panel looks like paper held up to soft morning light.

**Dark** (`.bg-dark-app`): stacked radial gradients over `#0a0e1a`:

```css
background-image:
  radial-gradient(ellipse 140% 70% at 50% -10%, rgba(255,61,127,0.14) 0%, transparent 55%),
  radial-gradient(ellipse 90% 60% at 100% 100%, rgba(90,169,255,0.08) 0%, transparent 55%),
  radial-gradient(circle at 0% 40%, rgba(255,61,127,0.05) 0%, transparent 45%);
```

A pink halo at top-center, azure haze at bottom-right, faint pink at left-middle. Enough atmosphere to sell depth; not so much it competes with data.

**Outer frame** of the panel: `border border-rich-rose-water` (light) or `border border-white/5` (dark) + `overflow-hidden`. The entire panel is literally framed.

---

## 4. Layout & Constraints

- **Panel width:** variable, but components cap at `max-w-[480px]`. Assume 380–480px in practice.
- **Vertical structure:** `Header (fixed-position wordmark)` → `TabNav (horizontal scroll-snap)` → `Tab body (Suspense + ErrorBoundary)` → `Footer (absolutely positioned pill at bottom)`.
- **Spacing scale (tight):** `gap-1` (4px), `gap-2` (8px), `gap-3` (12px). Card padding: `p-2` (8px). Section vertical rhythm: `mb-2 / mb-4`. No `py-24` anywhere.
- **Typography scale (compressed):** labels `text-[10px]`, value labels `text-[11px]`, body `text-xs (12px)`, card values `text-xs`, eyebrow headings `text-[10px] uppercase tracking-wider font-light`. Wordmark: `text-[28px] font-extralight leading-none tracking-tight` with vision-gradient clip.
- **Compact Mode** toggle reduces root to `pt-4 pb-10 px-2` — the only mode switch that changes spacing tokens at runtime.

---

## 5. Component Architecture

### 5.1 `<Header>`

Logo (40px rounded-full with a *pink glow shadow* `shadow-lg shadow-core-pink/50`) + `vtexSnitch` wordmark in `.text-vision-gradient`, `font-extralight`. The logo glow is the only place a rendered shadow carries color — it sets the whole brand note. `mb-6` breathing room below.

### 5.2 `<TabNav>` — horizontal scroll-snap row

- Container: `flex w-full max-w-[480px] overflow-x-auto snap-x snap-mandatory scroll-smooth whitespace-nowrap .no-scrollbar`.
- Each tab: `<button>` labeled with code-brackets: `<{tabLabel} />` — typographic ornament that signals "developer tool."
- Base: `text-[10px] px-2 py-2 border border-silver-lining/30 shadow-sm bg-white snap-center shrink-0`.
- Rounded corners only on first (`rounded-l-md`) and last (`rounded-r-md`) — the row reads as one segmented control.
- **Active state:** text becomes the vision gradient via `bg-clip-text`, with `animate-[moveGradient_5s_ease_infinite]`, `border-azure-sky/30`, `shadow-xl shadow-azure-sky/10`. Inactive: `text-gray-500`.
- Auto-centers the active tab via `scrollIntoView({ inline:'center', behavior:'smooth' })`. Supports left/right **swipe** gestures on the tab body (50px threshold).

### 5.3 `<Card>`

The general-purpose content frame:

```
bg: var(--bg-secondary)           (translucent white)
border: 1px solid var(--border)
border-radius: var(--radius-lg)   (8px)
shadow: var(--shadow) → var(--shadow-hover) on hover
transform: translateY(0) → translateY(-1px) on hover
transition: box-shadow + transform 200ms
overflow: hidden
```

Optional header row with title (`13px, font-weight:600, letter-spacing:-0.01em`), optional subtitle (`11px, muted`), optional `<Badge>`, optional collapsible chevron (rotates `-90deg` when collapsed; body uses `max-height` transition 350ms for reveal/collapse).

### 5.4 `<GlassTile>` — the information atom

The signature element of the Store tab — 3-up grid (`grid-cols-3 gap-2`) of clickable data chips:

```
bg: bg-white bg-opacity-40 backdrop-blur-md
border: border-silver-lining/30
shadow: shadow-sm shadow-silver-lining/20
rounded-md
p-2
hover (if copyable): bg-opacity-70, border-azure-sky/50, shadow-azure-sky/20
```

Content: `[icon 14px pink stroke-1.25] [label 11px midnight-blue]` row, then `[value 12px azure-sky font-medium]` centered. A `Copy` icon in the top-right is `opacity-0 group-hover:opacity-60`, swaps to a green `Check` for 1200ms after click. **This is the panel's most reusable pattern.**

### 5.5 `<Button>` (inline-styled)

Four variants, three sizes, all CSS-variable driven:

| Variant   | Background       | Color                | Border                 | Hover                 |
|-----------|------------------|----------------------|------------------------|-----------------------|
| primary   | `--accent`       | `--accent-text`      | none                   | `--accent-hover`      |
| secondary | `--bg-secondary` | `--text-primary`     | `1px --border`         | `--bg-tertiary`       |
| ghost     | transparent      | `--text-secondary`   | none                   | `--bg-tertiary`       |
| danger    | `--error`        | `#fff`               | none                   | `#dc2626`             |

Sizes: `sm` (28h, 12fs, 10px-pad), `md` (34h, 13fs, 14px-pad), `lg` (40h, 14fs, 20px-pad). Border-radius: `var(--radius)` (6px). Letter-spacing: `0.01em`. Loading state: inline `Loader2` spinner replaces any icon. Disabled: `opacity: 0.5, cursor: not-allowed`. Hover is a direct JS background swap — no pseudo-elements, cheap repaint.

### 5.6 `<Toggle>`

iOS-style: 36×20 pill, 16×16 white thumb with `0 1px 3px rgba(0,0,0,0.15)`. Background `--border` (off) → `--accent` (on). Thumb slides left 2px → 18px with `transition: left 200ms cubic-bezier(0.34, 1.56, 0.64, 1)` — a gentle overshoot, the only springy motion in the whole extension (and it's on purpose, because toggles feel better that way).

### 5.7 `<Badge>`

Pill (`border-radius: 100`) at `10–12px font-weight:600 letter-spacing:0.02em`. 5 variants (`default / success / warning / error / info`), each with a matching subtle background tint + color. Optional `dot` prop renders a 5–6px filled circle with `animate-pulse-dot`. Used for live counters, status badges, and micro-labels.

### 5.8 `<SettingsMenu>` — fixed-position gear with popover

- Trigger: 32px circular button, `fixed top-3 right-3`, `bg-white/80 backdrop-blur-md border-silver-lining/40 shadow-md`. Gear icon rotates `180deg` on hover over 700ms `cubic-bezier(0.34,1.56,0.64,1)` — subtle delight.
- Popover: `w-64 rounded-md bg-white/90 backdrop-blur-lg border shadow-xl animate-fade-in`. Header: `gradient-to-r from-rose-water/60 to-white/40` with uppercase eyebrow.
- Sections: Visible Tabs (checkboxes with `accent-core-pink`), Default Tab (select), Theme (Sun/Moon pair where active uses the vision gradient fill), Region country (3-char uppercase input), Toggles (remember tab / auto-refresh / compact mode), Reset (dashed-outline button).
- Close on outside click + Escape.

### 5.9 `<Footer>`

`fixed bottom-2 left-1/2 -translate-x-1/2 z-20`. Pill `bg-midnight-blue/10 backdrop-blur-md bg-opacity-70 border-silver-lining/30 shadow-md`. `text-xs text-storm-cloud-grey/80 px-4 py-0.5`. Just: `vtexSnitch · v8.0.2j`. Glass floats above content without blocking scroll at edges.

### 5.10 Informational strip (per-tab intro)

Each tab opens with a `bg-white/40 backdrop-blur-md border border-silver-lining/30 rounded-md text-xs p-2` info strip. A vivid variant overlays the vision gradient at low alpha for instruction callouts: `bg-gradient-to-r from-[#f71963]/50 via-[#b75098]/50 to-[#92bcfa]/80 text-white text-[11px]`.

---

## 6. Micro-interaction Catalog

| Interaction            | Duration / Curve                                      | Notes                                           |
|------------------------|-------------------------------------------------------|-------------------------------------------------|
| Panel/tab mount        | `fade-in 350ms cubic-bezier(0.22,1,0.36,1) backwards` | `opacity 0→1` + `translateY(4px)→0`             |
| Card hover lift        | 200ms                                                 | `translateY(-1px)` + shadow grow                |
| GlassTile hover        | 200ms                                                 | opacity 40→70, border azure, shadow azure tint  |
| Copy success flash     | 1200ms timeout                                        | Copy icon → Check icon → Copy icon              |
| Tab swipe/change       | Browser smooth scroll + 350ms max-height              | 50px swipe threshold                            |
| Settings gear hover    | 700ms `cubic-bezier(0.34,1.56,0.64,1)` rotate-180     | The only "playful" rotation                     |
| Toggle thumb           | 200ms `cubic-bezier(0.34,1.56,0.64,1)`                | Gentle overshoot                                |
| Active tab gradient    | `moveGradient 5s ease infinite`                       | Text-clip, 300% background-size                 |
| Status dot pulse       | `pulseLiveGRN / pulseLiveYLW 2s infinite`             | 0 → 8px expanding box-shadow, fades             |
| Pink-gradient scrollbar| static                                                | 7px track+thumb, both themes                    |

Every keyframe has a dark-mode variant where relevant (scrollbar track uses `#0a0e1a → rgba(90,37,64,0.4)` instead of rose-water).

---

## 7. Dark Mode — "A Committed Direction, Not a Recolor"

Rules that keep dark mode from feeling like inverted-light:

1. **Atmosphere is re-authored**, not re-colored (radial halo stack vs. rose-water diagonal).
2. **Surfaces flip the glass formula**: `.bg-white/N` is rewritten to `rgba(255,255,255, 0.04–0.12)` over the dark plane — translucent *white* over dark reads as real glass; translucent dark over dark reads as mud.
3. **`.bg-white` (solid)** becomes `#1a2032` — a plate, not a void.
4. **Form controls** get lifted to `#1c2338` so inputs read as "raised paper."
5. **`--color-white` is intentionally NOT overridden**, because pink-gradient CTAs use `text-white` and must stay actually white.
6. **Selection** becomes `bg:#5a2540 color:#ffc4dd` — a plum/rose pairing that matches the atmosphere.

---

## 8. Extension-Specific Constraints

- **No external CDN fonts at runtime** — but the extension *does* still `@import` Outfit from Google Fonts in `global.css`. If the panel must run offline, self-host via `@fontsource-variable/outfit` as the website does.
- **Assets via `chrome.runtime.getURL('icons/…')`** — never hardcode `/icons/` paths, they break under MV3 packaging.
- **Theme persistence** via `chrome.storage.local` key `appTheme`, with a `chrome.storage.onChanged` listener so the sidepanel stays in sync with the popup/options page in real time. System preference is the fallback.
- **Every tab is `React.lazy` + `<Suspense fallback={LoadingSkeleton}>`** — keeps first paint under ~100ms. The fallback itself is a single `.text-vision-gradient` animated `"loading"` word.
- **ErrorBoundary keyed by `activeTab`** — switching tabs resets error state so one broken tab never poisons the session.

---

## 9. Recreation Checklist (for an AI regenerating this)

1. Two complete palettes in `@theme` under `:root` and `[data-theme='dark']`, same variable names.
2. Root container wraps everything in one of two backdrops: rose-water diagonal (light) or radial-halo `.bg-dark-app` (dark). Frame the panel with a 1px themed border and `overflow-hidden`.
3. Header: 40px glowing logo + `font-extralight` wordmark in `.text-vision-gradient`.
4. TabNav: horizontal snap-scroll segmented control; active tab uses vision-gradient text clip; inactive is grey; auto-center on change; swipe gestures move between tabs.
5. Every content card is a translucent glass tile with hairline border + tinted shadow; hover adds azure accent + 1px lift.
6. Copy-anywhere pattern: data chips (`<GlassTile>`) reveal a Copy icon on hover, flash Check for 1200ms on success.
7. Settings live in a fixed top-right gear that opens a 256px glass popover; no routing, no modals.
8. Footer is a fixed bottom-center glass pill; it never blocks content.
9. All motion uses `cubic-bezier(0.22, 1, 0.36, 1)` for decel, `(0.34, 1.56, 0.64, 1)` only for toggles and the gear. Durations 150–350ms. No long entrances.
10. Scrollbar is 7px with the pink gradient (both themes).
11. Pink means "brand / action." Azure means "data." Grey carries everything else. One accent per role — never mix.
