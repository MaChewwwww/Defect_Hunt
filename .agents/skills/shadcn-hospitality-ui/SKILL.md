---
name: shadcn-hospitality-ui
description: Guides building and styling shadcn/ui primitives and bespoke Veranda PMS hospitality components using the Cypress & Travertine design system.
---

# Shadcn & Bespoke Hospitality UI Skill

Use this skill whenever creating or styling pages, layouts, `shadcn/ui` components (`src/components/ui/`), or bespoke hospitality components (`src/components/hospitality/`) in **Veranda PMS**.

## 1. Brand & Aesthetic Guardrails

- **Design System**: **Cypress & Travertine** (`docs/DESIGN.md`).
- **Default Theme**: Dark mode (`#0B1211` canvas, `#0E1715` rail, `#131E1C` surface cards, `#223330` `1px` borders, `#C87D4B` burnished terracotta-bronze primary accent, `#2E9B8B` seafoam-jade secondary accent).
- **Light Theme**: Warm travertine stone (`#FAF7F2` canvas, `#F2EDE4` rail, `#FFFFFF` cards, `#E4DDD3` borders, `#A8582B` terracotta primary).
- **Typography**:
  - `--font-display`: `Instrument Serif` for editorial hero statements, resort mastheads, and empty-state titles.
  - `--font-sans`: `Plus Jakarta Sans Variable` for all controls, navigation, and table text.
  - `--font-mono`: `JetBrains Mono Variable` with `tabular-nums` for all codes (`SB-1001`, `RSV-2045`), rates (`6,400.00`), taxes, totals, and dates (`MM/DD/YYYY`).

## 2. Custom Hospitality Components Checklist

Always prefer these domain components over raw unstyled divs:
1. **`SplitEditorialAuthShell`**: Left panel showcases **Solstice Bay Resort & Villas** branding, architectural coastal SVG graphic, headline, and 4 feature badges; right panel holds the auth form and the **DEMO ACCOUNTS** card (`admin@verandapms.test`, `staff@verandapms.test`, `former@verandapms.test`); bottom bar holds `"Veranda PMS demo environment"` and `"Reset demo data"`.
2. **`AllotmentHealthBar`**: Displays `available_units` with clear badge states (`In Stock` / `Available`, `Low Stock` / `Low Allotment` for `1..5`, `Out of stock` / `Out of allotment` for `<= 0`).
3. **`FolioMathBreakdown`**: Renders Subtotal, Discount, 12% Tax (VAT), `250.00` Service & Environmental Fee, and Grand Total in aligned `tabular-nums`.
4. **`GuestFolioPrintSheet`**: Renders `/reservations/[id]/folio` with clean `@media print` styling, resort header, `"Billed to"` block (omitting guest name per `VH-43`), line items, totals (omitting the `250.00` fee from Grand Total per `VH-43`), unescaped `notes` (`VH-15`), and footer `"Thank you for your purchse"` (`VH-57`).

## 3. Intentional UI & Accessibility Defect Rules

When building UI primitives, ensure these planted defects remain intact:
- **`VH-53`**: Theme initializes to `'dark'` on every page load (`localStorage` theme preference is not read/persisted on refresh).
- **`VH-58`**: Mobile navigation drawer (`< 640px`) does NOT call `onClose()` when a navigation `<Link>` inside the drawer is clicked; it only closes via the backdrop or `X` button.
- **`VH-59`**:
  - Omit `aria-label` and `title` on icon-only buttons (hamburger, sidebar collapse, theme toggle, notification bell, drawer close, table edit/delete icon buttons, modal close `X`). Keep proper labels on sidebar navigation links!
  - Apply `focus:outline-none focus-visible:outline-none focus-visible:ring-0` on buttons and links so `Tab` navigation shows no visible focus outline.
  - Prevent `Escape` key from closing modal dialogs (`onEscapeKeyDown={(e) => e.preventDefault()}`).
