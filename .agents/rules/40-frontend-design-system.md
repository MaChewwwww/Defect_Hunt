# 40 — Frontend Design System

Follow [DESIGN.md](../../docs/DESIGN.md) and the `.agents/skills/shadcn-hospitality-ui/SKILL.md` guide.

## Visual Identity: Cypress & Travertine

- **Brand**: **Veranda PMS** for **Solstice Bay Resort & Villas**.
- **Palette**: Use the **Cypress & Travertine** tokens defined in [DESIGN.md](../../docs/DESIGN.md)—deep coastal cypress-obsidian (`#0B1211`, `#131E1C`) in Dark Mode (default) and warm sunlit travertine limestone (`#FAF7F2`, `#FFFFFF`) in Light Mode, paired with burnished terracotta-bronze (`#C87D4B` / `#A8582B`) and seafoam-jade (`#2E9B8B` / `#176B5E`) accents.
- **No Generic AI/ShopSphere Tropes**: Never use ShopSphere's purple-indigo/cyan gradients (`#4F46E5`), neon glowing orbs, or `border-left: 3px solid` colored card stripes. Use crisp `1px` architectural hairlines (`--border-subtle`) and refined coastal hospitality aesthetics.
- **Typography**: Locally bundled **Instrument Serif** (`--font-display`) for hero/folio headers, **Plus Jakarta Sans Variable** (`--font-sans`) for UI/tables/forms, and **JetBrains Mono Variable** (`--font-mono`, `tabular-nums`) for all Room Codes (`SB-XXXX`), Reservation Numbers (`RSV-20XX`), PHP currency figures, and dates.

## Shell & Component Standards

- **Login Screen (`/login`)**: Asymmetric split coastal hospitality layout (`SplitEditorialAuthShell`) with the **Solstice Bay Resort & Villas** crest, headline, 4 capability pills, Sign In card, **DEMO ACCOUNTS** reference card (`admin@verandapms.test`, `staff@verandapms.test`, `former@verandapms.test`), and footer bar with `"Veranda PMS demo environment"` and `"Reset demo data"`.
- **Workspace Shell**:
  - 56px sticky topbar with breadcrumb/title, Theme toggle button (`>= 640px`), Notification Bell with numeric badge (`8` low-allotment items by default), and User profile chip (initials + full name).
  - 248px desktop sidebar collapsible to a 64px icon rail (`>= 640px`), and a slide-over mobile drawer below `640px`.
- **Custom Hospitality Components**: Build and use `AllotmentHealthBar`, `FolioMathBreakdown`, `ReservationLifecycleStepper`, `RevenueOccupancyChart`, and `GuestFolioPrintSheet` on top of customized `shadcn/ui` primitives.
- **Print Styling (`@media print`)**: `/reservations/[id]/folio` renders a clean white-paper hospitality folio statement with navigation chrome hidden when printing.

## Preserving Intentional UI & Accessibility Defects

Do not "fix" the intentional UI/Accessibility defects specified in [DESIGN.md](../../docs/DESIGN.md):
- `VH-24` (horizontal overflow on `SB-1009` in `/reservations/new`)
- `VH-53` (dark mode default; light mode toggle does not persist across page refresh)
- `VH-56` (infinite skeleton on unknown `/rooms/[id]` and `/reservations/[id]`)
- `VH-57` (the 5 exact low-traffic spelling mistakes)
- `VH-58` (`< 640px` mobile drawer stays open when tapping a nav item)
- `VH-59` (missing `aria-label`/tooltips on icon-only buttons, suppressed focus ring on buttons/links, and disabled `Escape` close on modals).
