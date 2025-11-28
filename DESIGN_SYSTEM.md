# Resolve Visual Identity System

## Design Philosophy

**Core Values**: Clarity, Simplicity, Visual Calm  
**Target Audience**: Professionals seeking focused productivity tools  
**Differentiation**: Mature, muted aesthetic distinct from consumer productivity apps

---

## Color Palette

### Light Mode
- **Background**: Warm off-white `30 10% 97%` - Creates a soft, paper-like canvas
- **Foreground**: Dark slate `210 12% 16%` - Readable without harshness
- **Primary**: Muted sage `165 35% 42%` - Calm, focused action color
- **Accent**: Soft terracotta `15 45% 58%` - Warm highlights and attention
- **Secondary**: Warm gray `30 8% 90%` - Subtle backgrounds
- **Muted**: Barely-there gray `30 12% 94%` - Unobtrusive surfaces
- **Border**: `30 12% 88%` - Gentle separation, never harsh

### Dark Mode
- **Background**: Deep warm dark `210 18% 11%` - Comfortable for extended use
- **Foreground**: Warm off-white `30 10% 92%` - Clear contrast
- **Primary**: Brighter sage `165 40% 55%` - Maintains visibility
- **Accent**: Warm terracotta `15 50% 62%` - Prominent in darkness
- **Border**: `210 14% 22%` - Subtle structure

### Design Rationale
The color palette avoids bright, saturated colors common in consumer apps. The sage primary creates a natural, calming presence. Warm neutrals (using slight orange/brown tints) create comfort and reduce eye strain. Terracotta accents add personality without overwhelming.

---

## Typography

**Primary Font**: DM Sans  
**Weights Used**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)

### Why DM Sans?
- Clean, geometric letterforms create modern professionalism
- Excellent readability at all sizes
- Low x-height prevents visual crowding
- Distinctive but not trendy
- Superior at small sizes for data-dense interfaces

### Font Hierarchy
```css
h1: 2rem (32px), font-weight: 700
h2: 1.5rem (24px), font-weight: 600
h3: 1.25rem (20px), font-weight: 600
body: 0.875rem (14px), font-weight: 400
small: 0.75rem (12px), font-weight: 400
```

---

## Spacing & Layout

### Unified Border Radius
**Standard**: `0.75rem` (12px) - Applied universally to all interactive elements

This creates visual consistency and a calm, approachable feel. Larger than minimal (4-8px) but not as playful as extreme rounding (16px+).

### Spacing Scale
Based on 4px increments:
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px

### Grid System
- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns
- Large Desktop (xl): 4 columns

Cards automatically resize to maintain consistent gaps (16px).

---

## Shadows

### Elevation System
Shadows use warm tints (rgba with slight orange) instead of pure black:

- **sm**: `0 1px 2px 0 rgba(30, 20, 10, 0.04)` - Barely visible lift
- **md**: `0 3px 8px -2px rgba(30, 20, 10, 0.08)` - Cards at rest
- **lg**: `0 8px 16px -4px rgba(30, 20, 10, 0.12)` - Hover states
- **xl**: `0 16px 32px -8px rgba(30, 20, 10, 0.16)` - Modals, overlays

Shadows are subtle to maintain the calm aesthetic. They suggest depth without drama.

---

## Motion & Animation

### Timing
**Fast**: 100ms - Micro-interactions (checkboxes, switches)  
**Normal**: 150ms - Standard transitions (buttons, cards)  

### Easing
**Primary**: `ease-out` - Natural deceleration

### Animation Principles
1. **Subtle**: Motion should never distract
2. **Purposeful**: Every animation communicates state change
3. **Consistent**: Same duration for similar interactions
4. **Minimal distance**: Small transforms (scale 0.96-1.0, translate 8px max)

### Standard Animations
```css
fade-in: 120ms ease-out
scale-in: 120ms ease-out (0.96 → 1.0)
slide-up: 150ms ease-out (translateY 8px)
accordion: 150ms ease-out
```

---

## Component Standards

### Cards
- Background: `--card`
- Border: `1px solid --border`
- Border radius: `--radius` (12px)
- Padding: 16-24px
- Shadow: `sm` at rest, `md` on hover
- Transition: 150ms

### Buttons
- Height: 40px (default), 36px (sm), 44px (lg)
- Padding: 12-16px horizontal
- Border radius: `--radius`
- Transition: 150ms
- Shadow: `sm` at rest, `md` on hover

### Inputs
- Height: 40px
- Border: `1px solid --input`
- Border radius: `--radius`
- Focus ring: 2px `--ring`
- Transition: 150ms

### Dialogs/Modals
- Max width: 600px (standard), 800px (large)
- Border radius: `--radius`
- Shadow: `xl`
- Backdrop: `rgba(0, 0, 0, 0.5)`
- Animation: 150ms fade + scale

---

## Iconography

**Library**: Lucide React  
**Size**: 16px (default), 20px (large), 24px (hero)  
**Stroke Width**: 2px  
**Style**: Consistent line icons, never mixed with filled icons

### Usage Guidelines
- Always pair icons with text labels in primary actions
- Use icons alone only for universally recognized actions (close, menu, search)
- Maintain 8px gap between icon and text
- Icons inherit text color

---

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Interactive elements meet WCAG AAA where possible (7:1)
- Focus indicators always visible and high contrast

### Interactive Elements
- Minimum touch target: 44x44px
- Keyboard navigation fully supported
- Focus states clearly visible
- ARIA labels on all interactive elements

### Motion
- Respects `prefers-reduced-motion`
- No auto-playing animations
- All animations can be paused/stopped

---

## Application Examples

### Notes Workspace
- Cards use muted backgrounds from preset colors
- Pinned notes distinguished by subtle badge, not dramatic styling
- Checklist items use primary color when checked
- Tags use `--primary` with 10% opacity background

### Schedule Timeline
- Time blocks use accent color variations
- Current time indicator uses `--destructive` (red)
- Grid lines use `--border` at 30% opacity
- Hover states increase shadow from `sm` to `md`

### Global Elements
- Sidebar uses slightly darker `--sidebar-background`
- Active navigation items use `--primary` with `--sidebar-accent` background
- All cards share unified `--radius`
- Consistent `--shadow-sm` throughout

---

## Future Considerations

### Extensibility
The color system uses HSL for easy theme variations. Future themes could adjust:
- Hue rotation for different primary colors
- Saturation adjustment for more/less vibrant modes
- Lightness tweaks for extreme low-light modes

### Brand Consistency
All marketing materials, documentation, and external communications should reflect:
- Muted, sophisticated color palette
- DM Sans typography
- Calm, professional tone
- Minimal, purposeful motion

---

## Quick Reference

```css
/* Primary Actions */
background: hsl(var(--primary));
color: hsl(var(--primary-foreground));
border-radius: var(--radius);
transition: all 150ms ease-out;
shadow: var(--shadow-sm);

/* Cards */
background: hsl(var(--card));
border: 1px solid hsl(var(--border));
border-radius: var(--radius);
box-shadow: var(--shadow-sm);

/* Typography */
font-family: 'DM Sans', sans-serif;
font-size: 0.875rem;
font-weight: 400;
color: hsl(var(--foreground));

/* Spacing */
padding: 1rem; /* 16px */
gap: 1rem;
```

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Maintained by**: Resolve Design Team
