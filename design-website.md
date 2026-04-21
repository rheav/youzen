# vtexSnitch — Website Design System

> High-fidelity design specification for the vtexSnitch landing site.  
> Stack context: Astro + TailwindCSS v4 (`@theme` tokens) + Lucide Astro icons + `Outfit` variable font.  
> Code name for the aesthetic: **Midnight Cherry** (dark-default) with a **Rose-Water** light mirror.

---

## 1. Design Philosophy — "Weight & Atmosphere"

The site has to feel **weightless, confident, and a little mischievous** — a developer tool that carries itself like a luxury product. The landing is dark-first, but every surface is translucent, every border is 1px hairline, and every shadow is a *glow*, never a drop.

Core rules the whole system obeys:

- **No heavy panels.** Cards never sit on opaque slabs. They sit on `bg-zinc-900/40` (~4% white on black) with a `border-white/10` hairline — depth comes from transparency, not from fill.
- **Air first, content second.** Section vertical padding is `py-24` → `py-32`. Hero is a full viewport (`min-h-screen`). Never cram — let every headline breathe.
- **Hairlines over boxes.** Borders are 1px, always with low-alpha white/black. Rings on hover (`hover:border-white/20`), never a 2px thickening.
- **Motion is a whisper.** Page-in: `fade-in-up 0.8s ease-out backwards`, staggered by `animation-delay: 0.1s..0.5s`. Hover lifts are `-translate-y-1`. No bouncy springs. Respect `prefers-reduced-motion` (all `@keyframes` shut off).
- **Typographic hierarchy is dramatic.** Hero at `text-6xl → text-8xl font-light`. Body copy at `text-xl md:text-2xl font-light`. Labels go `font-mono text-xs tracking-wide`. The weight contrast (100→600) is what gives the page its rhythm.
- **Pink is a spice, not a sauce.** Accent pink is reserved for: the one word that matters in each heading, CTA borders, and the gradient scrollbar. Never as a section fill (the one exception is the `RequestBand` quote-band, which owns its loudness on purpose).

---

## 2. Color System — "Standard Theme" Tokens

The palette is abstracted so it can be swapped for a future project by rewriting only the six `--color-accent-*` tokens. Shapes, spacing, and motion stay.

### 2.1 Token map (authoritative)

```css
:root, [data-theme='dark'] {
  /* Surfaces */
  --surface-base:        #08090f;   /* body background */
  --surface-app:         #0a0e1a;   /* primary app plane, sits above base */
  --surface-1:           rgba(255,255,255,0.04);  /* cards */
  --surface-2:           rgba(255,255,255,0.06);  /* hover cards / nav pill */
  --surface-inset:       rgba(0,0,0,0.30);        /* code rows inside cards */

  /* Borders (always hairline) */
  --border-subtle:       rgba(255,255,255,0.06);
  --border-default:      rgba(255,255,255,0.10);
  --border-strong:       rgba(255,255,255,0.20);  /* hover */

  /* Text */
  --text-primary:        #ffffff;
  --text-secondary:      #a1a1aa;   /* zinc-400 */
  --text-muted:          #71717a;   /* zinc-500 */
  --text-inverse:        #142032;   /* on pink */

  /* Accent spectrum — the "vision gradient" */
  --accent-pink:         #f71963;   /* core brand */
  --accent-pink-hot:     #ff3d7f;   /* highlight / hover */
  --accent-purple:       #b75098;
  --accent-azure:        #75abfd;
  --accent-azure-soft:   #92bcfa;

  /* Semantics */
  --semantic-success:    #4ade80;   /* emerald-400 */
  --semantic-success-bg: rgba(16,185,129,0.15);
}

html[data-theme='light'] {
  --surface-base:        #ffffff;
  --surface-app:         #ffffff;
  --surface-1:           rgba(20,32,50,0.04);
  --surface-2:           rgba(20,32,50,0.06);
  --surface-inset:       #ffffff;
  --border-subtle:       rgba(20,32,50,0.06);
  --border-default:      rgba(20,32,50,0.10);
  --border-strong:       rgba(20,32,50,0.16);
  --text-primary:        #142032;
  --text-secondary:      #5e6e84;
  --text-muted:          #8591a3;
}
```

### 2.2 The Vision Gradient (the "soul" of the brand)

A linear, horizontally-moving 4-stop gradient. It exists in three forms:

```css
--vision-gradient: linear-gradient(90deg,
  var(--accent-pink)   15%,
  var(--accent-purple) 50%,
  var(--accent-azure)  82%,
  var(--accent-azure-soft)
);
```

- **On text** (`.text-vision-gradient`): `background-size: 300% 100%` + `animation: moveGradient 5s ease infinite` — the gradient *breathes* across the word.
- **On borders** (CTAs): a `conic-gradient` with a short pink arc (`8%–22%`) traces around a rounded shape via `mask-composite: exclude`, animated by `--gradient-angle` spinning `0→360deg`.
- **On CTA hover fill** (`.shiny-cta::after`): swaps to a moodier trio `linear-gradient(90deg, #142032, #b75098, #92bcfa)`, fades in over 350ms.

### 2.3 Heading-fade treatment

Big headlines use a vertical gradient clip — pure white at top fading to `rgba(255,255,255,0.4)` at the descender. Light-mode mirror: `#142032 → rgba(20,32,50,0.5)`.

```css
.heading-fade {
  background-image: linear-gradient(to bottom, #fff, rgba(255,255,255,0.4));
  -webkit-background-clip: text;
  color: transparent;
}
```

This is why the hero reads "luxury typography" rather than "hard white-on-black."

---

## 3. Global Atmosphere Layers

The background is not a color — it is a **stack of 5 fixed layers** rendered inside `BaseLayout.astro` and masked so the hero content floats above them. All layers are `pointer-events: none; fixed; inset-0; z-0`.

| Layer | Purpose | Formula |
|---|---|---|
| 1. App plane | Base color | `background-color: var(--surface-app)` |
| 2. Atmospheric glows | Depth | 3 radial-gradients: pink halo at `50% -10%`, azure haze at `100% 100%`, faint pink at `0% 40%` |
| 3. Grid overlay | Texture | 40px × 40px hairline grid `rgba(255,255,255,0.03)`, masked with a center-out radial to fade to edges |
| 4. Soft blur orb | Center anchor | 800×800 `#ff3d7f/5%` blob with `blur-[120px]`, centered |
| 5. Parallax stars | Life | Two `1px`/`2px` transparent divs with long `box-shadow` lists as pinpoints, `animStar` translates them `-2000px` over 50s/80s |

**Top nav gradient blur** (`.gradient-blur`): a 120px tall fixed band under the nav, `linear-gradient` from 80% black → transparent, plus `backdrop-filter: blur(8px)`, masked again so the fade itself fades. Lets content scroll *under* the nav cleanly.

**Light-mode swap:** the dark atmosphere is replaced with a `135deg` rose-water diagonal: `#ffe0ef 0% → #ffffff 45% → #e6f0ff 100%` + a pink halo. Stars hide entirely (`display: none` under `[data-theme='light']`).

---

## 4. Layout & Rhythm

### Page grid
- Max content width: `max-w-7xl` (1280px). Nav & footer: `max-w-5xl` (1024px). Final-CTA & Support copy: `max-w-3xl / max-w-4xl`.
- Horizontal gutter: `px-6` (24px) everywhere — never shrinks on mobile, because the page is already edge-to-edge atmospheric.
- Section vertical rhythm: `py-24` (Problem/Nav adjacent), `py-32` (Features, HowItWorks, FinalCTA, Support). No section is shorter than 96px top+bottom.

### Section sequence (landing)
1. `<Nav>` — fixed floating pill
2. `<Hero>` — full-viewport, centered
3. `<Problem>` — 3-up "behind the curtain" cards
4. `<FeaturesBento>` — 3×N bento grid
5. `<SidepanelPreview>` — product visual
6. `<RequestBand>` — the loud pink full-bleed quote band
7. `<HowItWorks>` — 3 steps
8. `<Support>` — gradient "support card" panel
9. `<FinalCTA>` — centered install button on `bg-zinc-950/40` dim
10. `<Footer>` — minimal, `bg-black`

Each section begins with a centered eyebrow + light-weight headline + muted sub-copy block using `.animate-fade-up` — this is the landing's "heartbeat."

---

## 5. Component Architecture

### 5.1 Floating nav pill

```
shape:   rounded-full (full pill)
width:   mx-auto max-w-5xl
surface: bg-black/40, border-white/15, backdrop-blur-2xl + backdrop-saturate-150
shadow:  shadow-2xl (diffuse dark halo)
padding: px-6 py-3
position: fixed top-0, offset by pt-6 wrapper
```

**Nav links** (`.nav-link`): invisible sliding underline — a `1.5px` pink-to-azure gradient bar, `transform-origin: left`, `scaleX(0) → scaleX(1)` over 400ms `cubic-bezier(0.22, 1, 0.36, 1)`. Never underline with text-decoration.

**Theme toggle**: 32px circular pill, two lucide icons (Sun/Moon), one hidden via CSS-only `html[data-theme='light']` scope (no JS state swap on the icons).

### 5.2 `.shiny-cta` / `.shiny-cta-sm` — the signature button

The button's personality is the *animated conic-gradient ring* + the *gradient-fill hover*. It's the visual that sells the product.

- **Shape:** `rounded-[14px]` (lg), `rounded-[10px]` (sm). Inline-flex, centered.
- **Base fill:** pure `#000` (dark) or `#fff` (light). High-contrast canvas for the pink ring.
- **Ring:** 2px padding pseudo-element with `conic-gradient(from var(--gradient-angle), transparent 0%, #f71963 8%, #ff3d7f 22%, transparent 40%)`, clipped by `mask-composite: exclude` to draw only the border. `--gradient-angle` spins `0→360deg` every 2.5s linear.
- **Hover fill:** a second `::after` pseudo with the moody `#142032 → #b75098 → #92bcfa` linear gradient, `opacity: 0 → 1` over 350ms. Text forces to white on hover.
- **Icons inside:** chrome/edge/brave logos `-space-x-2` overlapping, each rotating `360deg` on group hover with staggered `delay-75 / delay-150`. ArrowRight nudges `translate-x-1`.

### 5.3 Feature card (bento cell)

```
rounded-xl
border border-white/10
bg-zinc-900/40
p-6
transition-all duration-300
hover:-translate-y-1
hover:border-white/20
```

Inside structure: `[icon-chip] → [title md:lg font-semibold] → [desc zinc-400 text-sm]`.

**The icon chip** is the per-card accent anchor:
- `inline-flex rounded-lg border border-white/10 bg-white/5 p-2.5`
- `color: ${accent}` (per feature) — icon takes that color; chip stays neutral.

**Two hover layers** (both pointer-events-none absolute):
1. `radial-gradient(circle at 30% 0%, ${accent}26, transparent 60%)` fade-in over 500ms — a colored "sunrise" in the corner.
2. `.feature-card-border` — a conic accent ring tracing the rounded shape (same mask trick as the CTA, but with the card's per-instance `--accent`), appears on hover.

This is how the grid stays calm at rest but lights up precisely where the cursor lands.

### 5.4 "Problem-row" micro-card

Code-row inside a Problem card: `rounded border-white/5 bg-black/30 px-2.5 py-1.5`, `font-mono text-xs`, muted label + bright value pattern. Each Problem card gets a **1px top accent line** via `absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-${accent} to-transparent` — hairline that fades at the edges, the subtlest possible colored signature.

### 5.5 Support card

A gradient glass panel, the only card that breaks the uniform bento look:

```
rounded-2xl
border border-white/10
bg-gradient-to-br from-[#f71963]/10 via-zinc-900/40 to-[#75abfd]/10
p-10 md:p-14
backdrop-filter: blur(16px) saturate(140%)
```

Pattern: eyebrow chip → headline with one vision-gradient word → body copy → trailing outline button. Signals "warm handoff to human."

### 5.6 RequestBand — the only loud section

Full-bleed `bg-[#f71963]` (pure accent). Inner: 5 eye icons (cute, brand-signature), a black terminal panel (`bg-black/90 rounded-lg font-mono text-sm`) showing a faux `POST → 200 ·142ms` exchange, then a black heavy headline `text-5xl font-bold`. The section earns its loudness by being the *product screenshot in prose form*.

### 5.7 Footer

Minimal, `bg-black border-t border-zinc-900`. Left: logo + copyright. Right: `uppercase tracking-widest text-xs text-zinc-500` link list that goes white on hover. No columns, no newsletter, no nonsense.

---

## 6. Typography

- **Font:** `Outfit` variable (weights 100–900), self-hosted via `@fontsource-variable/outfit`. `font-display`, `font-body`, `font-sans` all map to Outfit — one family, many weights. Mono: `ui-monospace, 'SF Mono', Menlo`.
- **Headline recipe:** `font-display font-light tracking-tight leading-[1.2]` — the *lightness* of `font-weight: 300` against `text-6xl/8xl` is what gives the brand its feel. Never `font-bold` in a headline except RequestBand.
- **One-word emphasis:** each major headline has exactly ONE word in `.text-vision-gradient` and often a hand-drawn-looking `<svg>` squiggle underline at `-bottom-2` in `#f71963 opacity-60`. Feels handwritten next to the precise type.
- **Eyebrows:** `text-xs font-semibold uppercase tracking-widest`, often inside a pill chip.
- **Body:** `text-lg/xl font-light text-zinc-400 leading-relaxed`. Mono helper text at the bottom of the hero is `text-xs tracking-wide text-zinc-500`.

---

## 7. Motion Library

```css
@keyframes fade-in-up   { from { opacity:0; transform:translateY(20px) } }
@keyframes border-spin  { from { --gradient-angle:0deg } to { --gradient-angle:360deg } }
@keyframes moveGradient { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
@keyframes animStar     { to { transform:translateY(-2000px) } }
@keyframes pulse-pink   { /* expanding 0→8px pink ring, fades out */ }
@keyframes request-scroll { to { transform:translateY(-50%) } } /* for marquees */
```

Durations: entrances 0.8s ease-out, hover transforms 300ms ease-out, gradient swaps 350ms, ring spins 2.5–3s linear, stars 50–80s linear.

All motion is disabled under `@media (prefers-reduced-motion: reduce)` — this is non-negotiable.

---

## 8. Theme Switching Logic

- Dark is the default. A tiny inline `<script>` in `<head>` reads `localStorage['snitch-theme']` and sets `data-theme` before paint — **no FOUC**.
- The toggle button just flips `data-theme` between `'dark' | 'light'` on `<html>`. All theme-aware styles are scoped via `html[data-theme='light'] .foo { … }` overrides.
- Light mode is a **mirror, not a recolor**: the dark atmospheric radial-gradient plane is replaced by a rose-water diagonal + soft pink halo; stars hide; `bg-zinc-*` surfaces remap to warm greys/whites; borders remap to `rgba(20,32,50,α)`. Contrast ratios are preserved by design, not by luck.

---

## 9. Recreation Checklist (for an AI regenerating this)

1. Set `data-theme="dark"` on `<html>`. Inject inline theme-restore script before first paint.
2. Build the 5-layer fixed background stack.
3. Lay out a floating nav pill with backdrop-blur + sliding gradient underlines.
4. Hero: full-viewport, centered column, 5 cascading `.animate-fade-up` children with stepped `animation-delay`.
5. Every CTA is a `.shiny-cta` — conic ring outside + gradient fill on hover.
6. Every content section is a center-eyebrow / light-headline / muted-subcopy block, then a grid of `.bg-zinc-900/40 border-white/10 rounded-xl` cards.
7. Exactly ONE word per major headline uses `.text-vision-gradient`.
8. ONE full-bleed pink band per page (RequestBand) — no second one.
9. Footer is minimal, `bg-black`, one row.
10. Verify the reduced-motion media query disables every animation listed in §7.
