# Visual Identity Document (VID)

## 1. Design Soul & Narrative

- **Vibe:** "Modern High-Utility Productivity." High-density data grid balanced by a breezy, minimalist aesthetic. It employs a "Highlighter" strategy—using a single vibrant neon accent to draw focus to active states against a neutral background.
- **Mix Coherence:** Future components must utilize "pill-shaped" geometry for interactive elements and soft, low-contrast `0.0625rem` borders for layout containers.

## 2. Design Tokens (YAML)

```yaml
system:
  name: Redify Design System
  base_unit: 0.25rem # (4px)
  scaling_factor: 0.85 # Mobile scaling multiplier

colors:
  primary:
    DEFAULT: "#e2f337" # Neon Lime / Highlighter
    foreground: "#000000"
    hover: "#d4e62e"
  background:
    canvas: "#ffffff"
    subtle: "#f9fafb"
  neutral:
    50: "#f9fafb"
    100: "#f3f4f6"
    200: "#e5e7eb" # Main border color
    400: "#9ca3af" # Secondary text
    900: "#111827" # Primary text
  functional:
    success: "#dcfce7" # Approved Leave BG
    success_text: "#166534"
    error: "#fee2e2"   # Pending/Holiday BG
    error_text: "#991b1b"
    info: "#eff6ff"    # Current Day Highlight / Today
    info_border: "#3b82f6"

typography:
  family: "Inter, system-ui, sans-serif"
  scale:
    xs: ["0.75rem", "1rem"]        # (12px, 16px)
    sm: ["0.875rem", "1.25rem"]    # (14px, 20px)
    base: ["1rem", "1.5rem"]       # (16px, 24px)
    lg: ["1.125rem", "1.75rem"]    # (18px, 28px)
    xl: ["1.5rem", "2rem"]         # (24px, 32px)
  weights:
    normal: 400
    medium: 500
    semibold: 600
    bold: 700

shapes:
  radius:
    none: "0rem"
    sm: "0.25rem"    # (4px)
    base: "0.5rem"   # (8px)
    lg: "0.75rem"    # (12px) Main Grid Container
    full: "9999rem"  # Pill buttons/tags
  surfaces:
    card:
      bg: "white"
      border: "0.0625rem solid #e5e7eb" # (1px)
      shadow: "none"

spacing:
  container_max_width: "90rem" # (1440px)
  section_padding: "1.5rem"    # (24px)
  grid_gutter: "0.0625rem"     # (1px) Internal lines

motion:
  standard: "200ms ease-in-out"
  micro: "100ms linear"
```

## 3. Iconography & Visual Assets

- **Grammar:** Minimalist line art. Consistent `0.09375rem` (1.5px) stroke width. Round caps and corners.
- **Library:** Lucide React or Phosphor Icons.
- **Config:**
    - Size: `1.125rem` (18px) standard, `1.25rem` (20px) large.
    - Color: `neutral-400` for inactive UI, `neutral-900` for active.

## 4. Component Synthesis

### A. The Timeline/Grid (Master Structure)

- **Header:** Sticky top. Dates centered. Today (Mo 14) uses a `functional.info` background column highlight.
- **Row Logic:** High vertical padding (`0.75rem` to `1rem`). Name/Avatar column is fixed left.
- **Status Pills:** Rectangular with minimal rounding (`0.125rem`), utilizing the functional color palette. Icons (red flags) centered within.

### B. Control Bar

- **Filter Tags:** Background `primary`. Fully rounded (`radius.full`).
- **Action Buttons:** Primary actions use `primary` (Neon Lime). Nav arrows use outline circles with `0.0625rem` borders.

## 5. Library Mapping & Compatibility

- **UI Kit:** shadcn/ui (Tailwind CSS).
- **Customization:**
    - **Button:** Force `rounded-full` for all buttons.
    - **Input:** Set border width to exactly `0.0625rem` using `neutral-200`.
    - **Avatar:** Set to `rounded-full` with `info` background for placeholders.

## 6. Responsive & Mobile Strategy

- **Timeline:** Implement horizontal scrolling for the grid while keeping the Name column `sticky left`.
- **Navigation:** Collapse top menu into a slide-out drawer.
- **Touch Targets:** Increase row height from `3rem` (48px) to `3.75rem` (60px) for better tap accuracy.

## 7. Invariant Constraints (The Golden Rules)

1. **The Radius Rule:** Interactive elements (buttons, inputs, tags) MUST be `rounded-full`. Layout containers use `rounded-lg` (`0.75rem`).
2. **No Pure Black:** Use `neutral-900` for primary text.
3. **Highlighter Restraint:** Neon Lime is reserved for primary actions and active filter states only.
4. **Thin Borders Only:** All UI borders must be `0.0625rem`. Avoid shadows.
5. **Color Semantic:** Green = Approved; Red/Pink = Holiday/Pending; Blue = Current Context.