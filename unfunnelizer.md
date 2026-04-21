# Astro Landing Page UI System Guide

> **AI-Friendly Template** for recreating this design system in new projects.
> Copy this entire file into your AI assistant's context when building similar pages.
> All patterns are production-tested and copy-paste ready.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Design Philosophy](#design-philosophy)
3. [Visual Language](#visual-language)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Design Tokens](#design-tokens)
7. [CSS Architecture (Complete)](#css-architecture)
8. [Component Patterns](#component-patterns)
9. [Theme System](#theme-system)
10. [Typography](#typography)
11. [Spacing &amp; Layout](#spacing--layout)
12. [Interactive Elements](#interactive-elements)
13. [Signature Effects](#signature-effects)
14. [Animation System](#animation-system)
15. [Internationalization (i18n)](#internationalization-i18n)
16. [SEO &amp; Meta Configuration](#seo--meta-configuration)
17. [Copy-Paste Templates](#copy-paste-templates)
18. [Quick Reference Cheatsheet](#quick-reference-cheatsheet)

---

## Quick Start

### 1. Create New Project

```bash
npm create astro@latest my-landing
cd my-landing

npm install @tailwindcss/vite tailwindcss @lucide/astro @astrojs/sitemap
npm install -D prettier prettier-plugin-astro
```

### 2. Configure Astro

```javascript
// astro.config.mjs
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://your-domain.com",
  trailingSlash: "never",

  // Optional: i18n configuration
  i18n: {
    locales: ["en", "es", "pt-br"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },

  vite: { plugins: [tailwindcss()] },

  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/auth/") && !page.includes("/dashboard/"),
    }),
  ],
});
```

### 3. Create Folder Structure

```bash
mkdir -p src/{components/{sections,ui},layouts,pages/[lang],styles,i18n/translations}
mkdir -p public/{favicon,images,icons}
```

### 4. Copy Global CSS

Create `src/styles/global.css` with the **complete CSS** from the [CSS Architecture](#css-architecture) section.

### 5. Build Your Pages

1. Create `Layout.astro` in `src/layouts/`
2. Create sections in `src/components/sections/`
3. Assemble in `src/pages/index.astro`

---

## Design Philosophy

### Core Principles

This design system follows a **"Dark Tech Elegance"** aesthetic — professional yet edgy, minimal yet informative. The goal is to feel like premium developer tooling with a hint of hacker energy.

#### 1. Depth Through Subtlety

- **No harsh shadows** — Use soft glows and subtle color overlays
- **Layered backgrounds** — Cards sit on `bg-theme-card` which is slightly lighter than `bg-theme`
- **Gradient borders** — Cards use transparent borders with gradient backgrounds for a "holographic" effect
- **Blur effects** — Navbar uses `backdrop-blur-md` for depth without heavy shadows

#### 2. Breathing Room

- **Generous whitespace** — Sections have `py-24` (96px) vertical padding
- **Content doesn't touch edges** — Always `px-6` minimum horizontal padding
- **Visual hierarchy through space** — More important elements get more surrounding space
- **Section headers have `mb-16`** (64px) before content

#### 3. Progressive Disclosure

- **Hero captures attention** — Biggest text, most dramatic gradient
- **Features explain** — Grid of digestible cards
- **Details come later** — Technical specifics in lower sections
- **CTA reinforces** — Clear action at the bottom

#### 4. Dual Identity (Theme-Aware Accents)

- **Dark mode = Warm accents** — Red/yellow gradients feel dangerous, exciting
- **Light mode = Cool accents** — Blue/cyan gradients feel professional, reliable
- **Accent colors swap automatically** via CSS custom properties

---

## Visual Language

### The "Feel" of This Design

```
MOOD BOARD KEYWORDS:
- Midnight coding session
- Neon reflections on glass
- Premium SaaS dashboard
- Cyberpunk-lite aesthetic
- Clean but not sterile
- Technical but accessible
```

### Glow Effects

The signature visual element is **soft color glows** that create depth:

```html
<!-- Glow behind a hero image -->
<div
  class="absolute -inset-4 bg-gradient-to-r from-smart-blue/20 to-smart-cyan/20 blur-3xl -z-10 rounded-3xl"
></div>
```

**Glow recipe:** `absolute -inset-4` → gradient with `/20` opacity → `blur-3xl` → `-z-10`

### Gradient Borders (Signature Card Style)

Cards use a CSS trick to create gradient borders:

```css
.card-smart {
  background:
    linear-gradient(var(--color-bg-card), var(--color-bg-card)) padding-box,
    linear-gradient(135deg, var(--color-smart-blue), var(--color-smart-cyan))
      border-box;
  border: 2px solid transparent;
}
```

**How it works:**

1. First gradient fills the padding-box (content area) with solid color
2. Second gradient fills the border-box with gradient
3. `border: 2px solid transparent` reveals the gradient through the border

### The 60-30-10 Color Rule

```
60% — Background colors (bg-theme, bg-theme-card)
30% — Text colors (text-theme, text-theme-muted)
10% — Accent colors (gradients, borders, buttons)
```

### Visual Rhythm

```
HIGH    ████                              ████
        █  █                              █  █
MED     █  ████████        ████████████████  █
        █        █        █                  █
LOW     █        ██████████                  █
        │        │        │        │        │
        Hero   Features  Modes   Tools    CTA
```

### Border Radius Consistency

| Element        | Radius    | Class                |
| -------------- | --------- | -------------------- |
| Buttons        | Full pill | `rounded-full`       |
| Cards          | Large     | `rounded-2xl` (16px) |
| Inner elements | Medium    | `rounded-xl` (12px)  |
| Badges/pills   | Full      | `rounded-full`       |
| Input fields   | Medium    | `rounded-lg` (8px)   |

**Rule:** Buttons are always pills. Cards are always large radius. Never use sharp corners.

### Animation Philosophy

- **Entrances:** Scroll-triggered fade-ups + hero timed entrance
- **Hover:** Always. Every clickable thing responds.
- **State changes:** Smooth. Use `transition-all duration-300`.
- **Never:** Bouncing, shaking, attention-seeking animations.

The vibe is **confident stillness** — the page doesn't need to dance for attention.

---

## Tech Stack

```yaml
Framework: Astro 5.x (Static site generator)
Styling: Tailwind CSS 4.x (via Vite plugin)
Icons: Lucide (via @lucide/astro)
Language: TypeScript
Fonts: Outfit (Google Fonts, loaded via @font-face)
Build: Vite (built into Astro)
SEO: @astrojs/sitemap + JSON-LD schemas
```

### Package.json

```json
{
  "name": "@project/website",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.6.0",
    "@lucide/astro": "^0.556.0",
    "@tailwindcss/vite": "^4.1.17",
    "astro": "^5.16.4",
    "tailwindcss": "^4.1.17"
  },
  "devDependencies": {
    "prettier": "^3.7.4",
    "prettier-plugin-astro": "^0.14.1"
  }
}
```

---

## Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── sections/           # Page sections
│   │   │   ├── Hero.astro
│   │   │   ├── Features.astro
│   │   │   ├── Modes.astro
│   │   │   ├── WhatsNew.astro
│   │   │   └── CTA.astro
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── ThemeToggle.astro
│   │   │   ├── ChromeButton.astro
│   │   │   ├── LanguageSwitcher.astro
│   │   │   ├── DonateButton.astro
│   │   │   └── MacWindow.astro
│   │   ├── Navbar.astro
│   │   ├── Footer.astro
│   │   ├── GTM.astro           # Google Tag Manager (head)
│   │   └── GTMNoScript.astro   # Google Tag Manager (body)
│   │
│   ├── layouts/
│   │   └── Layout.astro
│   │
│   ├── pages/
│   │   ├── index.astro         # Homepage (default locale)
│   │   ├── pro.astro           # Pricing page
│   │   ├── privacy.astro
│   │   ├── terms.astro
│   │   └── [lang]/             # i18n localized pages
│   │       ├── index.astro
│   │       └── pro.astro
│   │
│   ├── i18n/
│   │   ├── ui.ts               # Translation utilities
│   │   └── translations/
│   │       ├── en.ts
│   │       ├── es.ts
│   │       └── pt-br.ts
│   │
│   └── styles/
│       └── global.css          # All design tokens + utilities
│
├── public/
│   ├── favicon/
│   ├── images/
│   └── icons/
│
├── astro.config.mjs
└── package.json
```

### Naming Conventions

| Type          | Convention              | Example                                |
| ------------- | ----------------------- | -------------------------------------- |
| Sections      | PascalCase, descriptive | `WhatsNew.astro`, `Features.astro`     |
| UI Components | PascalCase, functional  | `ThemeToggle.astro`, `MacWindow.astro` |
| Pages         | lowercase, kebab-case   | `forgot-password.astro`                |
| CSS Classes   | kebab-case              | `gradient-text-smart`, `feature-card`  |
| i18n Keys     | dot.notation            | `hero.title`, `nav.features`           |

---

## Design Tokens

### Color Palette

```css
/* Brand Colors — Always available */
--color-smart-blue: #3c7cfc; /* Primary blue */
--color-smart-cyan: #59c0e8; /* Secondary cyan */
--color-brute-red: #ff4d4d; /* Warm red */
--color-brute-yellow: #f9cb28; /* Accent yellow */

/* Dark Theme (default) */
--color-bg: #0f0f14; /* Page background */
--color-bg-card: #16161d; /* Card/elevated surfaces */
--color-border: #2a2a35; /* Borders */
--color-text: #e4e4e7; /* Primary text */
--color-text-muted: #9ca3af; /* Secondary text */
--color-accent-from: #ff4d4d; /* Accent gradient start (warm) */
--color-accent-to: #f9cb28; /* Accent gradient end (warm) */

/* Light Theme */
--color-bg: #f8fafc;
--color-bg-card: #ffffff;
--color-border: #e2e8f0;
--color-text: #1e293b;
--color-text-muted: #64748b;
--color-accent-from: #3c7cfc; /* Accent gradient start (cool) */
--color-accent-to: #59c0e8; /* Accent gradient end (cool) */
```

### Color Usage Rules

| Element         | Dark Mode                  | Light Mode                |
| --------------- | -------------------------- | ------------------------- |
| Page Background | `#0f0f14`                  | `#f8fafc`                 |
| Card Background | `#16161d`                  | `#ffffff`                 |
| Primary Text    | `#e4e4e7`                  | `#1e293b`                 |
| Muted Text      | `#9ca3af`                  | `#64748b`                 |
| Borders         | `#2a2a35`                  | `#e2e8f0`                 |
| CTA Buttons     | Warm gradient (red→yellow) | Cool gradient (blue→cyan) |
| Accent Text     | Warm gradient              | Cool gradient             |

---

## CSS Architecture

This is the **complete** `global.css`. Copy this entire block into `src/styles/global.css`.

```css
@import "tailwindcss";

/* ===== TAILWIND THEME EXTENSION ===== */
@theme {
  --color-smart-blue: #3c7cfc;
  --color-smart-cyan: #59c0e8;
  --color-brute-red: #ff4d4d;
  --color-brute-yellow: #f9cb28;
  --font-outfit: "Outfit", sans-serif;
}

/* ===== DARK THEME (default) ===== */
:root {
  --color-bg: #0f0f14;
  --color-bg-card: #16161d;
  --color-border: #2a2a35;
  --color-text: #e4e4e7;
  --color-text-muted: #9ca3af;
  --color-accent-from: #ff4d4d;
  --color-accent-to: #f9cb28;
}

/* ===== LIGHT THEME ===== */
:root.light {
  --color-bg: #f8fafc;
  --color-bg-card: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-accent-from: #3c7cfc;
  --color-accent-to: #59c0e8;
}

/* ===== FONT LOADING ===== */
@font-face {
  font-family: "Outfit";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1O4a0Ew.woff2")
    format("woff2");
}

/* ===== BASE STYLES ===== */
html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-outfit);
  background-color: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

button,
[role="button"],
input[type="submit"],
input[type="button"],
.btn {
  cursor: pointer;
}

/* ===== THEME-AWARE UTILITIES ===== */
.bg-theme {
  background-color: var(--color-bg);
}
.bg-theme-card {
  background-color: var(--color-bg-card);
}
.border-theme {
  border-color: var(--color-border);
}
.text-theme {
  color: var(--color-text);
}
.text-theme-muted {
  color: var(--color-text-muted);
}

/* Accent color utilities using color-mix() for opacity variants */
.border-accent-from {
  border-color: var(--color-accent-from);
}
.bg-accent-from\/10 {
  background-color: color-mix(
    in srgb,
    var(--color-accent-from) 10%,
    transparent
  );
}
.border-accent-from\/30 {
  border-color: color-mix(in srgb, var(--color-accent-from) 30%, transparent);
}

/* ===== GRADIENT TEXT ===== */
.gradient-text-smart {
  background: linear-gradient(
    135deg,
    var(--color-smart-blue),
    var(--color-smart-cyan)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-brute {
  background: linear-gradient(
    135deg,
    var(--color-brute-red),
    var(--color-brute-yellow)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-accent {
  background: linear-gradient(
    135deg,
    var(--color-accent-from),
    var(--color-accent-to)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== GRADIENT BACKGROUNDS ===== */
.bg-accent-gradient {
  background: linear-gradient(
    135deg,
    var(--color-accent-from),
    var(--color-accent-to)
  );
}

.border-accent {
  border-color: var(--color-accent-from);
}

/* ===== GRADIENT BORDER CARDS ===== */
.card-smart {
  background:
    linear-gradient(var(--color-bg-card), var(--color-bg-card)) padding-box,
    linear-gradient(135deg, var(--color-smart-blue), var(--color-smart-cyan))
      border-box;
  border: 2px solid transparent;
}

.card-brute {
  background:
    linear-gradient(var(--color-bg-card), var(--color-bg-card)) padding-box,
    linear-gradient(135deg, var(--color-brute-red), var(--color-brute-yellow))
      border-box;
  border: 2px solid transparent;
}

/* ===== FEATURE CARD (no hover glow, clean) ===== */
.feature-card {
  position: relative;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}

/* ===== GIF/DEMO PLACEHOLDER ===== */
.gif-placeholder {
  background: var(--color-bg-card);
  border: 2px dashed var(--color-border);
}

/* ===== EXPERIMENTAL/STATUS TAG ===== */
.experimental-tag {
  background: linear-gradient(
    135deg,
    var(--color-accent-from),
    var(--color-accent-to)
  );
  box-shadow: 0 2px 8px
    color-mix(in srgb, var(--color-accent-from) 40%, transparent);
}

/* ===== ANIMATED GRADIENT BORDER (Reusable Pattern) =====
 * Creates a thin animated gradient border with outer glow.
 * Uses ::before for the border and ::after for the glow shadow.
 * Apply to any element with position:relative and isolation:isolate.
 */
@keyframes gradient-move {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

/* --- Donate Button (animated gradient border + glow) --- */
.donate-button {
  position: relative;
  background: transparent;
  border: none;
  border-radius: 9999px;
  overflow: visible;
  isolation: isolate;
  transition: transform 0.3s ease;
  color: white;
  -webkit-text-fill-color: white;
}

.donate-button::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 9999px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    var(--color-accent-from),
    var(--color-accent-to),
    var(--color-accent-from),
    var(--color-accent-to)
  );
  background-size: 300% 100%;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  z-index: -1;
  animation: gradient-move 2s linear infinite;
}

.donate-button::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 9999px;
  background: linear-gradient(
    90deg,
    var(--color-accent-from),
    var(--color-accent-to),
    var(--color-accent-from),
    var(--color-accent-to)
  );
  background-size: 300% 100%;
  z-index: -2;
  filter: blur(8px);
  opacity: 0.8;
  animation: gradient-move 2s linear infinite;
}

.donate-button:hover {
  transform: scale(1.05);
}
.donate-button:hover::after {
  opacity: 0.85;
  filter: blur(10px);
  inset: -5px;
}

/* --- Animated Badge (gradient border + glow, for version badges etc.) --- */
.animated-badge {
  position: relative;
  background: var(--color-bg-card);
  color: white;
  font-weight: 700;
  z-index: 1;
}

.animated-badge::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 9999px;
  background: linear-gradient(
    90deg,
    var(--color-accent-from),
    var(--color-accent-to),
    var(--color-accent-from),
    var(--color-accent-to)
  );
  background-size: 300% 100%;
  z-index: -1;
  animation: gradient-move 2s linear infinite;
}

.animated-badge::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 9999px;
  background: linear-gradient(
    90deg,
    var(--color-accent-from),
    var(--color-accent-to),
    var(--color-accent-from),
    var(--color-accent-to)
  );
  background-size: 300% 100%;
  z-index: -2;
  filter: blur(6px);
  opacity: 0.6;
  animation: gradient-move 2s linear infinite;
}

/* ===== FLUID NAV HIGHLIGHT =====
 * A gradient background that slides between nav links on hover.
 * Requires JS to position the highlight element (see Navbar section).
 */
.nav-links-container {
  position: relative;
}

.nav-highlight {
  position: absolute;
  border-radius: 0.5rem;
  background: linear-gradient(
    135deg,
    var(--color-accent-from),
    var(--color-accent-to)
  );
  opacity: 0;
  pointer-events: none;
  transition:
    left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    opacity 0.2s ease;
}

/* Nav links — simple color transition on hover */
.nav-link {
  position: relative;
  color: var(--color-text-muted);
  transition: color 0.3s ease;
}
.nav-link:hover {
  color: white;
}

/* ===== AUTH LOADING STATE ===== */
body.auth-loading > *:not(script) {
  opacity: 0;
  pointer-events: none;
}
body.auth-loading::after {
  content: "";
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 9999;
}

/* ===== VIEW TRANSITIONS ===== */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 150ms;
  animation-timing-function: ease-out;
}

::view-transition-old(navbar),
::view-transition-new(navbar),
::view-transition-old(site-logo),
::view-transition-new(site-logo) {
  animation: none;
}

/* ===== REDUCED MOTION ===== */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
  .animate-on-scroll,
  .stagger-item {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }
}

/* ===== SCROLL-TRIGGERED ANIMATIONS ===== */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.animate-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.stagger-item.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.stagger-item:nth-child(1) {
  transition-delay: 0ms;
}
.stagger-item:nth-child(2) {
  transition-delay: 80ms;
}
.stagger-item:nth-child(3) {
  transition-delay: 160ms;
}
.stagger-item:nth-child(4) {
  transition-delay: 240ms;
}
.stagger-item:nth-child(5) {
  transition-delay: 320ms;
}
.stagger-item:nth-child(6) {
  transition-delay: 400ms;
}

.section-header-animate {
  opacity: 0;
}
.section-header-animate.is-visible {
  animation: section-header-enter 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.card-animate {
  opacity: 0;
}
.card-animate.is-visible {
  animation: card-enter 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.fade-in-up {
  opacity: 0;
  transform: translateY(20px);
}
.fade-in-up.is-visible {
  animation: fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.fade-in-scale {
  opacity: 0;
  transform: scale(0.95);
}
.fade-in-scale.is-visible {
  animation: fade-in-scale 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* ===== HERO ENTRANCE ANIMATIONS ===== */
@keyframes hero-badge-enter {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes hero-title-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
@keyframes hero-subtitle-enter {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes hero-cta-enter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes hero-demo-enter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.hero-badge-animate {
  animation: hero-badge-enter 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both;
}
.hero-title-animate {
  animation: hero-title-enter 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
}
.hero-subtitle-animate {
  animation: hero-subtitle-enter 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.35s both;
}
.hero-cta-animate {
  animation: hero-cta-enter 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.45s both;
}
.hero-demo-animate {
  animation: hero-demo-enter 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.55s both;
}

/* ===== SECTION/CARD KEYFRAMES ===== */
@keyframes section-header-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(25px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes fade-in-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fade-in-scale {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## Component Patterns

### Layout Component (Layout.astro)

```astro
---
import "../styles/global.css";
import { ViewTransitions } from "astro:transitions";

interface Props {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

const { title, description = "Default description", keywords, ogImage = "/og-image.webp" } = Astro.props;
const siteUrl = "https://your-domain.com";
const fullTitle = title.includes("YourProduct") ? title : `${title} | YourProduct`;
const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    {keywords && <meta name="keywords" content={keywords} />}
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href={Astro.url.href} />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={Astro.url.href} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={absoluteOgImage} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={absoluteOgImage} />

    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
    <meta name="theme-color" content="#0f0f14" />

    <ViewTransitions />
  </head>
  <body class="min-h-screen">
    <slot />

    <!-- Scroll Animation Observer -->
    <script>
      function initScrollAnimations() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('is-visible'));
          return;
        }
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
      }
      initScrollAnimations();
      document.addEventListener('astro:after-swap', initScrollAnimations);
      document.addEventListener('astro:page-load', initScrollAnimations);
    </script>
  </body>
</html>
```

### Section Component Pattern

```astro
---
const items = [
  { icon: "🔓", title: "Feature 1", description: "Description here" },
  { icon: "🔗", title: "Feature 2", description: "Description here" },
];
---

<section id="section-id" class="py-24 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16 section-header-animate" data-animate>
      <h2 class="text-3xl md:text-4xl font-bold mb-4">
        Section <span class="gradient-text-accent">Title</span>
      </h2>
      <p class="text-theme-muted max-w-xl mx-auto">Section description.</p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div class="stagger-item p-6 rounded-2xl bg-theme-card border border-theme hover:border-smart-blue/50 transition-colors group" data-animate>
          <span class="text-3xl mb-4 block group-hover:scale-110 transition-transform">{item.icon}</span>
          <h3 class="text-lg font-semibold mb-2">{item.title}</h3>
          <p class="text-theme-muted text-sm leading-relaxed">{item.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

### MacWindow Component (Browser Chrome Frame)

A reusable macOS-style browser window frame. Accepts either a video source or slot content.

```astro
---
// MacWindow.astro
interface Props {
  videoSrc?: string;
  class?: string;
}
const { videoSrc, class: className = "" } = Astro.props;
---

<div class={`mac-window ${className}`}>
  <div class="browser-chrome">
    <div class="chrome-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
    <div class="chrome-bar"></div>
  </div>
  <div class="mac-content">
    {videoSrc ? (
      <video autoplay loop muted playsinline class="mac-video">
        <source src={videoSrc} type="video/mp4" />
      </video>
    ) : (
      <slot />
    )}
  </div>
</div>

<style>
  .mac-window {
    background: var(--color-bg);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05);
  }
  .browser-chrome {
    background: var(--color-bg-card);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--color-border);
  }
  .chrome-dots { display: flex; gap: 6px; flex-shrink: 0; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-border); opacity: 0.6; }
  .chrome-bar {
    flex: 1; height: 24px;
    background: var(--color-bg);
    border-radius: 6px;
    border: 1px solid var(--color-border);
  }
  .mac-content { background: var(--color-bg); }
  .mac-video { width: 100%; display: block; }
</style>
```

**Usage:**

```astro
<!-- With video -->
<MacWindow videoSrc="/demo.mp4" class="max-w-3xl mx-auto" />

<!-- With custom content -->
<MacWindow>
  <img src="/screenshot.webp" alt="Demo" class="w-full" />
</MacWindow>
```

---

## Theme System

### Theme Toggle Component

```astro
---
// ThemeToggle.astro
import { Sun, Moon } from "@lucide/astro";
---

<button
  id="theme-toggle"
  class="p-2.5 rounded-full bg-theme-card border border-theme hover:border-accent-from transition-all"
  aria-label="Toggle theme"
>
  <Sun id="sun-icon" class="w-5 h-5 text-brute-yellow" />
  <Moon id="moon-icon" class="w-5 h-5 text-smart-blue hidden" />
</button>

<script>
  const toggle = document.getElementById("theme-toggle");
  const sun = document.getElementById("sun-icon");
  const moon = document.getElementById("moon-icon");

  const getTheme = () => localStorage.getItem("theme") || "dark";

  const setTheme = (theme: string) => {
    document.documentElement.classList.toggle("light", theme === "light");
    sun?.classList.toggle("hidden", theme === "light");
    moon?.classList.toggle("hidden", theme !== "light");
    localStorage.setItem("theme", theme);
  };

  setTheme(getTheme());
  toggle?.addEventListener("click", () => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  });
</script>
```

### Theme-Aware Class Usage

```html
<!-- ❌ Not theme-aware -->
<div class="bg-gray-900 text-white">
  <!-- ✅ Theme-aware -->
  <div class="bg-theme text-theme">
    <div class="bg-theme-card border border-theme">
      <p class="text-theme-muted">Secondary text</p>
    </div>
  </div>
</div>
```

---

## Typography

### Font Stack

```css
font-family:
  "Outfit",
  system-ui,
  -apple-system,
  sans-serif;
```

### Type Scale

| Element     | Classes                                                     | Size        |
| ----------- | ----------------------------------------------------------- | ----------- |
| Hero H1     | `text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight` | 48px → 72px |
| Section H2  | `text-3xl md:text-4xl font-bold`                            | 30px → 36px |
| Card H3     | `text-lg font-semibold`                                     | 18px        |
| Body        | Default                                                     | 16px        |
| Small/Muted | `text-sm text-theme-muted`                                  | 14px        |
| Extra Small | `text-xs text-theme-muted`                                  | 12px        |

### Gradient Text

```html
<span class="gradient-text-accent">Theme-aware accent</span>
<span class="gradient-text-smart">Blue/cyan (always)</span>
<span class="gradient-text-brute">Red/yellow (always)</span>
```

---

## Spacing & Layout

### Section Spacing

```html
<!-- Standard section -->
<section class="py-24 px-6">
  <div class="max-w-6xl mx-auto">
    <!-- Hero section (extra top for fixed navbar) -->
    <section class="pt-32 pb-20 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <!-- Alternate background section -->
        <section class="py-24 px-6 bg-theme-card/50"></section>
      </div>
    </section>
  </div>
</section>
```

### Container Widths

| Use Case            | Class                      | Width          |
| ------------------- | -------------------------- | -------------- |
| Default sections    | `max-w-6xl`                | 1152px         |
| Text-heavy sections | `max-w-4xl` or `max-w-5xl` | 896px / 1024px |
| CTA sections        | `max-w-3xl`                | 768px          |
| Paragraph text      | `max-w-xl` or `max-w-2xl`  | 576px / 672px  |

### Grid Patterns

```html
<!-- 3-column feature grid -->
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- 2-column comparison -->
<div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

<!-- Alternating layout -->
<div class={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-8`}>
```

---

## Interactive Elements

### Primary CTA Button

```html
<a
  href="#cta"
  class="px-8 py-4 rounded-full font-semibold bg-accent-gradient text-white hover:opacity-90 transition-all hover:scale-105"
>
  Primary Action
</a>
```

### Secondary/Outline Button

```html
<a
  href="#features"
  class="px-8 py-4 rounded-full font-semibold border border-theme text-theme hover:bg-theme-card transition-all"
>
  Secondary Action
</a>
```

### Small CTA Button (Navbar)

```html
<a
  href="#download"
  class="px-5 py-2 rounded-full text-sm font-medium bg-accent-gradient text-white hover:opacity-90 transition-opacity"
>
  Get Extension
</a>
```

### Interactive Card

```html
<div
  class="p-6 rounded-2xl bg-theme-card border border-theme hover:border-smart-blue/50 transition-colors group"
>
  <span class="text-3xl mb-4 block group-hover:scale-110 transition-transform"
    >🔓</span
  >
  <h3 class="text-lg font-semibold mb-2">Card Title</h3>
  <p class="text-theme-muted text-sm">Card description.</p>
</div>
```

### Gradient Border Card

```html
<div class="card-smart rounded-2xl p-8 hover:scale-[1.02] transition-transform">
  Content with blue/cyan gradient border
</div>
<div class="card-brute rounded-2xl p-8 hover:scale-[1.02] transition-transform">
  Content with red/yellow gradient border
</div>
```

### Badge/Pill

```html
<div
  class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-card border border-theme"
>
  <span class="text-xs font-medium text-smart-cyan">v3.0</span>
  <span class="text-xs text-theme-muted">New Feature</span>
</div>
```

### Micro-Interactions Reference

| Element          | Hover Effect                         | Purpose           |
| ---------------- | ------------------------------------ | ----------------- |
| Primary Button   | `hover:opacity-90 hover:scale-105`   | Feels "pressable" |
| Secondary Button | `hover:bg-theme-card`                | Subtle fill       |
| Card             | `hover:border-smart-blue/50`         | Highlights focus  |
| Nav Link         | `hover:text-white` (via `.nav-link`) | Color shift       |
| Icon in Card     | `group-hover:scale-110`              | Playful bounce    |
| Gradient Card    | `hover:scale-[1.02]`                 | Slight lift       |

**Transition timing:** Always `transition-all` or `transition-colors` with default 150ms.

---

## Signature Effects

### Animated Gradient Border

A reusable pattern for creating animated gradient borders with glow. Used for donation buttons, version badges, etc.

**Recipe:**

1. Element needs `position: relative` and `isolation: isolate`
2. `::before` creates the visible border using mask-composite trick
3. `::after` creates the outer glow using blur
4. Both use `background-size: 300% 100%` with `animation: gradient-move 2s linear infinite`

**Pre-built classes** (from global.css):

- `.donate-button` — Pill-shaped button with animated gradient border + glow
- `.animated-badge` — Pill badge with animated gradient border + glow

**Usage:**

```html
<!-- Animated border button -->
<a
  href="#"
  class="donate-button inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
>
  ☕️ Buy me a coffee!
</a>

<!-- Animated badge -->
<span
  class="animated-badge inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs"
>
  v5.4
</span>
```

**Custom implementation** (for any shape):

```css
.my-animated-border {
  position: relative;
  isolation: isolate;
}

.my-animated-border::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--color-accent-from),
    var(--color-accent-to),
    var(--color-accent-from),
    var(--color-accent-to)
  );
  background-size: 300% 100%;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 2px; /* border thickness */
  z-index: -1;
  animation: gradient-move 2s linear infinite;
}
```

### Fluid Nav Highlight

A gradient background that **slides between nav links** on hover, creating a fluid selection indicator.

**HTML structure:**

```html
<div class="nav-links-container hidden md:flex items-center gap-2 relative">
  <div class="nav-highlight"></div>
  <a
    href="#features"
    class="nav-link text-theme-muted text-sm px-3 py-2 rounded-lg relative z-10"
    >Features</a
  >
  <a
    href="#modes"
    class="nav-link text-theme-muted text-sm px-3 py-2 rounded-lg relative z-10"
    >Modes</a
  >
  <a
    href="#tools"
    class="nav-link text-theme-muted text-sm px-3 py-2 rounded-lg relative z-10"
    >Tools</a
  >
</div>
```

**JavaScript** (in `<script>` tag or component):

```javascript
function initFluidNav() {
  document.querySelectorAll(".nav-links-container").forEach((container) => {
    const highlight = container.querySelector(".nav-highlight");
    const links = container.querySelectorAll(".nav-link");
    if (!highlight) return;

    let isActive = false;

    links.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        const rect = link.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.left = `${rect.left - containerRect.left}px`;
        highlight.style.top = `${rect.top - containerRect.top}px`;

        if (!isActive) {
          highlight.style.opacity = "1";
          isActive = true;
        }
      });
    });

    container.addEventListener("mouseleave", () => {
      highlight.style.opacity = "0";
      isActive = false;
    });
  });
}

initFluidNav();
document.addEventListener("astro:after-swap", initFluidNav);
```

**CSS** (already in global.css):

```css
.nav-links-container {
  position: relative;
}
.nav-highlight {
  position: absolute;
  border-radius: 0.5rem;
  background: linear-gradient(
    135deg,
    var(--color-accent-from),
    var(--color-accent-to)
  );
  opacity: 0;
  pointer-events: none;
  transition:
    left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    opacity 0.2s ease;
}
```

### Frosted Glass Mobile Menu

A sliding mobile menu with backdrop blur and a subtle gradient tint.

```css
#mobile-menu {
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  backdrop-filter: blur(20px) saturate(180%);
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    max-height 0.35s ease-out,
    opacity 0.25s ease-out;
  /* Dark mode: dark base with warm-cool tint */
  background: linear-gradient(
    180deg,
    rgba(10, 10, 15, 0.85) 0%,
    rgba(255, 120, 50, 0.15) 50%,
    rgba(60, 124, 252, 0.2) 100%
  );
}

.light #mobile-menu {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 120, 50, 0.12) 50%,
    rgba(60, 124, 252, 0.15) 100%
  );
}

#mobile-menu.menu-open {
  max-height: 600px;
  opacity: 1;
}
```

---

## Animation System

### Animation Classes

| Class                    | Effect                           | Use Case               |
| ------------------------ | -------------------------------- | ---------------------- |
| `animate-on-scroll`      | Fade up 30px                     | Generic content blocks |
| `section-header-animate` | Fade up 20px                     | Section titles         |
| `card-animate`           | Fade up + scale from 97%         | Feature cards          |
| `stagger-item`           | Staggered fade (80ms delay each) | Grid items             |
| `fade-in-up`             | Simple fade up 20px              | General purpose        |
| `fade-in-scale`          | Fade + scale from 95%            | Modals, popups         |

**Usage:** Add `data-animate` attribute to trigger via IntersectionObserver.

```html
<div class="animate-on-scroll" data-animate>Content appears on scroll</div>
<div class="stagger-item" data-animate>Staggered item</div>
```

### Hero Entrance (Timed, No Scroll Trigger)

```html
<div class="hero-badge-animate">...</div>
<!-- 0.1s delay -->
<h1 class="hero-title-animate">...</h1>
<!-- 0.2s, blur effect -->
<p class="hero-subtitle-animate">...</p>
<!-- 0.35s delay -->
<div class="hero-cta-animate">...</div>
<!-- 0.45s delay -->
<div class="hero-demo-animate">...</div>
<!-- 0.55s delay -->
```

### View Transitions

```astro
---
import { ViewTransitions } from "astro:transitions";
---
<head>
  <ViewTransitions />
</head>
```

Exclude elements from transitions:

```html
<nav transition:name="navbar" transition:persist></nav>
```

---

## Internationalization (i18n)

### Translation File Structure

```typescript
// src/i18n/translations/en.ts
export const en = {
  "nav.features": "Features",
  "nav.pricing": "Pricing",
  "nav.docs": "Docs",
  "hero.badge.version": "v5.3",
  "hero.badge.text": "Now with AI Transcription",
  "hero.title.highlight": "Reverse-Engineer",
  "hero.title.rest": "Any Sales Funnel",
  "hero.subtitle": "The ultimate toolkit for funnel hackers...",
  "hero.cta.primary": "add to browser",
  "hero.cta.secondary": "Learn More",
  "common.before": "Before",
  "common.after": "After",
} as const;

export type TranslationKeys = keyof typeof en;
```

### Translation Utilities (src/i18n/ui.ts)

```typescript
import { en, type TranslationKeys } from "./translations/en";
import { es } from "./translations/es";
import { ptBr } from "./translations/pt-br";

export const languages = {
  en: "English",
  es: "Español",
  "pt-br": "Português (BR)",
} as const;

export const defaultLang = "en" as const;
export type Lang = keyof typeof languages;

export const ui: Record<Lang, Record<TranslationKeys, string>> = {
  en,
  es,
  "pt-br": ptBr,
};

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split("/");
  if (lang in languages) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKeys): string {
    return ui[lang]?.[key] || ui[defaultLang][key] || key;
  };
}

export function getLocalizedPath(lang: Lang, path: string): string {
  if (lang === defaultLang) return path.startsWith("/") ? path : `/${path}`;
  const [pathPart, hash] = path.split("#");
  const cleanPath = pathPart.startsWith("/") ? pathPart.slice(1) : pathPart;
  if (!cleanPath && hash) return `/${lang}#${hash}`;
  if (!cleanPath) return `/${lang}`;
  if (hash) return `/${lang}/${cleanPath}#${hash}`;
  return `/${lang}/${cleanPath}`;
}
```

### Usage in Components

```astro
---
import { getLangFromUrl, useTranslations } from "../i18n/ui";
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<h1>{t('hero.title.highlight')}</h1>
```

### Language Switcher

```astro
---
import { languages, getLangFromUrl, getLocalizedPath } from "../i18n/ui";
const currentLang = getLangFromUrl(Astro.url);
const currentPath = Astro.url.pathname;
---

<div class="flex gap-2">
  {Object.entries(languages).map(([code, name]) => (
    <a
      href={getLocalizedPath(code, currentPath.replace(/^\/(en|es|pt-br)/, ''))}
      class={`px-3 py-1 rounded-full text-sm ${
        code === currentLang
          ? 'bg-accent-gradient text-white'
          : 'bg-theme-card text-theme-muted hover:text-theme'
      }`}
    >
      {name}
    </a>
  ))}
</div>
```

---

## SEO & Meta Configuration

### JSON-LD Schemas

```astro
---
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "YourProduct",
  "applicationCategory": "BrowserApplication",
  "operatingSystem": "Chrome",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "description": description,
};
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "YourProduct",
  "url": siteUrl,
  "logo": `${siteUrl}/logo.webp`,
};
---

<script type="application/ld+json" set:html={JSON.stringify([softwareSchema, organizationSchema])} />
```

### Favicon Checklist

Generate at [realfavicongenerator.net](https://realfavicongenerator.net):

- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)
- `site.webmanifest`

---

## Copy-Paste Templates

### Complete Navbar (with Fluid Highlight)

```astro
---
import { Menu, X } from "@lucide/astro";
import ThemeToggle from "./ui/ThemeToggle.astro";
import { getLangFromUrl, useTranslations, getLocalizedPath } from "../i18n/ui";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const l = (path: string) => getLocalizedPath(lang, path);
---

<nav transition:name="navbar" transition:persist
  class="fixed top-0 left-0 right-0 z-50 bg-theme/80 backdrop-blur-md border-b border-theme">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href={l('/')} class="flex items-center gap-2 group" transition:name="site-logo">
      <img src="/logo.webp" alt="Logo" class="w-8 h-8" width="32" height="32" />
      <span class="text-xl font-semibold tracking-tight gradient-text-accent">ProductName</span>
    </a>

    <div class="nav-links-container hidden md:flex items-center gap-2 relative">
      <div class="nav-highlight"></div>
      <a href={l('/#features')} class="nav-link text-theme-muted text-sm px-3 py-2 rounded-lg relative z-10">{t('nav.features')}</a>
      <a href={l('/#modes')} class="nav-link text-theme-muted text-sm px-3 py-2 rounded-lg relative z-10">{t('nav.modes')}</a>
      <a href={l('/docs')} class="nav-link text-theme-muted text-sm px-3 py-2 rounded-lg relative z-10">{t('nav.docs')}</a>
    </div>

    <div class="hidden md:flex items-center gap-3">
      <ThemeToggle />
      <a href="#cta" class="px-5 py-2 rounded-full text-sm font-medium bg-accent-gradient text-white hover:opacity-90 transition-opacity">
        {t('nav.addToBrowser')}
      </a>
    </div>

    <div class="md:hidden flex items-center gap-2">
      <ThemeToggle />
      <button id="mobile-menu-btn" class="flex items-center justify-center w-10 h-10 rounded-xl bg-theme-card border border-theme text-theme-muted hover:text-theme transition-colors" aria-label="Menu">
        <Menu id="menu-icon-open" class="w-5 h-5" />
        <X id="menu-icon-close" class="w-5 h-5 hidden" />
      </button>
    </div>
  </div>
</nav>

<script>
  // Fluid nav + mobile menu JS (see Signature Effects section)
</script>
```

### Complete Hero Section

```astro
<section class="pt-32 pb-20 px-6">
  <div class="max-w-4xl mx-auto text-center">
    <div class="hero-badge-animate inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-card border border-theme mb-8">
      <span class="text-xs font-medium text-smart-cyan">NEW</span>
      <span class="text-xs text-theme-muted">Version 2.0 Released</span>
    </div>

    <h1 class="hero-title-animate text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
      <span class="gradient-text-accent">Amazing</span><br />Product Tagline
    </h1>

    <p class="hero-subtitle-animate text-lg md:text-xl text-theme-muted max-w-2xl mx-auto mb-10 leading-relaxed">
      A compelling description of your product.
    </p>

    <div class="hero-cta-animate flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
      <a href="#cta" class="px-8 py-4 rounded-full font-semibold bg-accent-gradient text-white hover:opacity-90 transition-all hover:scale-105">
        Primary Action
      </a>
      <a href="#features" class="px-8 py-4 rounded-full font-semibold border border-theme text-theme hover:bg-theme-card transition-all">
        Learn More
      </a>
    </div>

    <div class="hero-demo-animate relative max-w-3xl mx-auto">
      <div class="gif-placeholder rounded-2xl aspect-video flex items-center justify-center overflow-hidden">
        <div class="text-center p-8">
          <span class="text-4xl mb-4 block">🎬</span>
          <p class="text-theme-muted text-sm">Demo GIF</p>
        </div>
      </div>
      <div class="absolute -inset-4 bg-gradient-to-r from-smart-blue/20 to-smart-cyan/20 blur-3xl -z-10 rounded-3xl"></div>
    </div>
  </div>
</section>
```

### Complete Footer

```astro
---
import { getLangFromUrl, useTranslations } from "../i18n/ui";
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<footer class="py-12 px-6 border-t border-theme">
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-2">
        <img src="/logo.webp" alt="Logo" class="w-6 h-6" />
        <span class="font-semibold gradient-text-accent">ProductName</span>
      </div>
      <div class="flex items-center gap-6 text-sm text-theme-muted">
        <a href="#features" class="nav-link">{t('nav.features')}</a>
        <a href="/privacy" class="nav-link">Privacy</a>
        <a href="/terms" class="nav-link">Terms</a>
      </div>
      <p class="text-xs text-theme-muted">
        © {new Date().getFullYear()} ProductName. All rights reserved.
      </p>
    </div>
  </div>
</footer>
```

---

## Quick Reference Cheatsheet

```
BACKGROUNDS
bg-theme              → Page background
bg-theme-card         → Card/elevated surfaces
bg-theme-card/50      → Semi-transparent (alternating sections)
bg-accent-gradient    → Theme-aware gradient button/fill

TEXT
text-theme            → Primary text
text-theme-muted      → Secondary/muted text
gradient-text-accent  → Theme-aware gradient text
gradient-text-smart   → Blue/cyan gradient text (always)
gradient-text-brute   → Red/yellow gradient text (always)

BORDERS
border border-theme   → Standard border
border-accent-from    → Accent-colored border
border-accent-from/30 → 30% opacity accent border

CARDS
card-smart            → Blue/cyan gradient border card
card-brute            → Red/yellow gradient border card
feature-card          → Simple card with border (no hover glow)

SECTIONS
py-24 px-6            → Standard section padding
pt-32 pb-20 px-6      → Hero section (fixed navbar offset)
max-w-6xl mx-auto     → Standard container

BUTTONS (copy-paste)
Primary:   px-8 py-4 rounded-full font-semibold bg-accent-gradient text-white hover:opacity-90 transition-all hover:scale-105
Secondary: px-8 py-4 rounded-full font-semibold border border-theme text-theme hover:bg-theme-card transition-all
Small CTA: px-5 py-2 rounded-full text-sm font-medium bg-accent-gradient text-white hover:opacity-90 transition-opacity

INTERACTIVE
hover:border-smart-blue/50 transition-colors  → Card hover
hover:scale-[1.02] transition-transform       → Card scale hover
group / group-hover:scale-110                 → Icon hover in card

ANIMATIONS
data-animate + animate-on-scroll    → Scroll-triggered fade up
data-animate + stagger-item         → Staggered grid items
hero-badge-animate                  → Hero entrance (0.1s)
hero-title-animate                  → Hero entrance (0.2s, blur)

SIGNATURE EFFECTS
donate-button         → Animated gradient border button
animated-badge        → Animated gradient border badge
nav-highlight         → Fluid nav sliding highlight (needs JS)
```

---

## AI Instructions

When asked to create a page using this system:

1. **Start with `Layout.astro`** — Copy the base HTML structure with ViewTransitions
2. **Create `global.css`** — Copy the complete CSS Architecture section
3. **Build sections** — Use the section pattern, put in `components/sections/`
4. **Add UI components** — Reusable pieces in `components/ui/`
5. **Assemble in `index.astro`** — Import and arrange all components
6. **Add interactivity** — Use `<script>` tags for JS (fluid nav, mobile menu, etc.)

**Always use:**

- Theme-aware classes (`bg-theme`, `text-theme-muted`, etc.)
- CSS custom properties for colors (never hardcode hex in templates)
- Established spacing scale (`py-24`, `gap-6`, `mb-16`, etc.)
- Consistent radius (`rounded-2xl` for cards, `rounded-full` for buttons)
- Hover/transition effects on all interactive elements
- `data-animate` attribute for scroll-triggered animations

**Never:**

- Hardcode light/dark colors in HTML classes
- Use sharp corners on cards or buttons
- Add bouncy or attention-seeking animations
- Skip hover states on clickable elements

---

_Last updated: February 2026_
_Design system version: 3.0_
