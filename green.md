# Style

The style uses a high-contrast 'Forest and Sage' color story. Typography is a mix of heavy, condensed display faces (Anton) for impact and clean, tracked-out sans-serifs (Inter) for utility. Visuals are treated with a persistent SVG noise overlay (4% opacity) to add texture. Animations focus on vertical reveals using a custom cubic-bezier for a 'snappy yet smooth' high-end feel.

## Spec

Create a design system using an earthy, organic palette: Forest (#01472e), Sage (#ccd5ae), Olive (#e9edc9), Cream (#fefae0), and Moss (#a3b18a).

### Typography

- **Display/Headings**: Use 'Anton' (sans-serif/impactful). Hero size: 23vw, leading: 0.75, letter-spacing: -0.05em. Section titles: 15vw.
- **Body/Utility**: Use 'Inter'. Font weights: 400 (regular), 700 (bold). Use uppercase with letter-spacing 0.2em - 0.4em for all labels and buttons.

### Texture & Effects

- **Noise Overlay**: Apply a fixed SVG fractal noise overlay at 0.04 opacity across the entire viewport.
- **Corners**: Use extreme rounding: `border-radius: 5rem` for large sections, `border-radius: 2.5rem` for cards/images.
- **Shadows**: Soft, deep shadows for floating elements: `shadow-2xl` with a tint of the 'Forest' color (rgba(1, 71, 46, 0.2)).

### Animation

- **Reveal Logic**: Components should slide up from `translateY(100px)` with `opacity: 0` to `translateY(0)` with `opacity: 1` using `cubic-bezier(0.16, 1, 0.3, 1)` over 1.2s.
- **Floating Parallax**: Foreground images should have a subtle float animation (`@keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }`).
