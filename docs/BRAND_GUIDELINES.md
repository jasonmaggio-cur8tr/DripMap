# DripMap Brand Guidelines

> **Primary Rule:** Always use the official assets provided in `public/logos/`. Do not recreate or alter the logos.

## Core Brand Assets

Location: `public/logos/`

| Filename | Description | Usage Context |
|----------|-------------|---------------|
| `logo.jpg` | Primary Logo (Lime Icon + Dark Text) | Light backgrounds, primary application header |
| `logo-dark.jpg` | Dark Mode Logo (Lime Icon + Light Text) | Dark backgrounds, footer |
| `logo-volt.jpg` | Volt/Lime Brand Color Variation | High-impact marketing assets |
| `icon-lime.png` | Simplified Icon (Lime on Dark) | App icon, favicon, social profile |
| `icon-dark.png` | Simplified Icon (Dark on Lime) | Alternative app icon, stickers |

## Color Palette

- **Drip Like** (Volt Green): `#a3e635` (approximate - refer to logo source)
- **Coffee Dark**: `#2C1810` (approximate - refer to logo source)
- **Cream/Off-White**: Backgrounds

## Typography

- **Header Font**: (Refer to existing CSS) - Likely a bold, rounded serif/display font (Cooper Black style).
- **Body Font**: Sans-serif (Inter/system-ui).

## Usage Rules

1.  **Do NOT** stretch or distort the logo.
2.  **Do NOT** change the colors. Use the provided files.
3.  **Ensure** sufficient contrast. Use the dark logo on light backgrounds and vice versa.
4.  **Whitespace**: Maintain clear space around the logo equal to the height of the "D".

## Implementation

When displaying the logo in the application:

```tsx
// Example Component
<img 
  src="/logos/logo.jpg" 
  alt="DripMap Logo" 
  className="h-10 w-auto" 
/>
```
