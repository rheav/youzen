# youZen — website

Softly-themed landing page for the youZen Chrome extension.

## Stack

- [Astro 5](https://astro.build) — static site generator
- [Tailwind CSS 4](https://tailwindcss.com) — styling via the Vite plugin
- [Lucide Astro](https://lucide.dev) — icons
- [Outfit Variable](https://fonts.google.com/specimen/Outfit) + [Caveat Variable](https://fonts.google.com/specimen/Caveat) — type

## Run locally

```bash
cd website
npm install
npm run dev        # http://localhost:4321
```

```bash
npm run build      # outputs dist/
npm run preview    # preview the production build
```

## Structure

```
src/
├── components/
│   ├── Navbar.astro          # Floating pill nav, 70% white + 20px blur
│   ├── Hero.astro            # Blurred blobs + cursive accent + dual CTAs
│   ├── Scenarios.astro       # Horizontal-scroll shelf of 288x160 cards
│   ├── AppPreview.astro      # 3 stacked phone mockups + pulsing Breathe button
│   ├── Testimonials.astro    # Rotated diary entry cards with cursive signatures
│   ├── Waitlist.astro        # Dark icon + email form, scales on hover
│   ├── FAQ.astro             # Native <details>-backed accordion, 500ms ease-in-out
│   └── Footer.astro
├── layouts/
│   └── Layout.astro          # SEO meta + grain overlay + reveal-on-scroll init
├── pages/
│   └── index.astro
└── styles/
    └── global.css            # Palette tokens, grain SVG, animations, accordion
```

## Design reference

- Softly palette: see `src/styles/global.css` `@theme { … }` block
- Grain overlay: inline SVG fractal-noise data URI, `mix-blend-mode: overlay`, 0.35 opacity
- Reveal animations: `.reveal` + `.reveal-group` classes, driven by `IntersectionObserver`
- Reduced-motion: all entrances, blobs, and the Breathe pulse are disabled via `@media (prefers-reduced-motion: reduce)`
