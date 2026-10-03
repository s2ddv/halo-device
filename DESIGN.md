# Design System: HALO Device — Vital Obsidian

## 1. Visual Theme & Atmosphere

Source: Stitch project `5467468568619301087`, refreshed on 2026-10-03.
Screens: Dashboard de Saúde (`aebf94367355482280e38145518cfe29`),
Relatórios de Saúde (`426d85e918974f128ea7e3a0d8d5599c`),
Atividades e Recordes (`2cc7076f8337421497ee6cc36e0c6bcd`),
Meu Perfil (`a97b21b243c24f9083d3e34c4253f207`).

Calm dark health dashboard, density 5, variance 3, motion 2. Preserve the
user's existing Stitch composition rather than generating a different theme.
The supplied design takes precedence over generic taste defaults: retain Inter,
metric-specific colors, centered rings, and the compact two-column report.
Use HALO branding and Portuguese throughout.

The expanded ten-screen inventory and route mapping are recorded in
`docs/stitch-implementation.md`. Detail pages add segmented day/week/month
controls, summary statistics, large metric readings, trend charts, distribution
rows and working demo exports. Stress includes a cancellable breathing timer.

## 2. Color Palette & Roles

- Obsidian #121414: canvas.
- Charcoal #1a1a1a: metric cards.
- Elevated charcoal #292a2a and #343535: controls and navigation.
- Soft white #e3e2e2: main text; #cfc4c5: supporting text.
- Silver #c6c6c6: primary actions.
- Heart #ff5449, sleep #0a84ff, activity #ff754f, sports #ffcc00,
  oxygen #5eddd5: metric identifiers, never evidence of clinical status.
- White at 10%: borders. Metric color at 8–15%: internal card atmosphere.

## 3. Typography Rules

Hanken Grotesk for headings (24px mobile / 32px desktop), Inter for body
(14–16px, 1.5 line-height), Geist for labels (12px) and tabular numbers
(36–48px). Text remains readable without external fonts. Body width at most
65ch. No oversized marketing headlines or decorative serif type.

## 4. Component Stylings

Cards use 24px radius for primary rings and 12–16px for compact data.
Rings have rounded caps, dim tracks, and visible textual values. Absent values
show an empty track and a clear explanation, never fabricated zero scores.
Buttons have 44px minimum targets, keyboard focus rings, pressed feedback,
and disabled states. Dialogs trap focus, close with Escape and restore focus.
Inputs have visible labels. Loading, error, empty, and demo states are explicit.
Charts include labels and textual values. Do not imply device compatibility,
verified accounts, paid subscriptions, or cloud sync from a visual mockup.

## 5. Layout Principles

Mobile: 20px page margins, 12–24px gaps, labeled four-tab bottom navigation.
Dashboard cards stack; the report retains the Stitch pair of compact metrics.
Desktop: centered 1120px shell, two-column metric grids, generous ring area.
Preserve safe areas, min-height 100dvh, and no document horizontal overflow.
Progression is reachable from dashboard, activities and profile; it is private.

## 6. Motion & Interaction

Restrained 150–200ms opacity/transform transitions; no perpetual movement on
health data. Respect prefers-reduced-motion. No animated layout dimensions.
Only animate an active task when it reflects real application state.

## 7. Anti-Patterns

No dead buttons, invented medical conclusions, sample data saved as BLE,
leaderboards, generic marketing copy, inaccessible icon-only controls,
clipped dialogs, fake synchronization, or nonfunctional external integrations.
Proprietary BLE experiments stay distinct from validated local history.
