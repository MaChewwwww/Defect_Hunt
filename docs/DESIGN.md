# Design System Specification

**Status:** Approved design baseline (Milestone M0).  
**Design System Name:** **Cypress & Travertine**  
**Brand Identity:** **Veranda PMS** for **Solstice Bay Resort & Villas**

---

## 1. Visual Direction & Anti-Trope Philosophy

**Visual Thesis:** **Cypress & Travertine** is a composed, architectural coastal hospitality workspace inspired by luxury Philippine boutique resorts (Amanpulo, Nay Palad, Four Seasons). It pairs deep coastal cypress-obsidian dark surfaces (`#0D1514` / `#131F1D`) and warm sunlit limestone light surfaces (`#FAF7F2`) with burnished terracotta-bronze (`#C87D4B`) and seafoam-jade (`#2A8C7E`) accents, crisp `1px` architectural stone hairlines, editorial serif focal headings (**Instrument Serif**), clean geometric UI copy (**Plus Jakarta Sans**), and tabular monospace numerals (**JetBrains Mono**).

### Explicit Differentiation from Co-Developer's *ShopSphere*
- **No Cyber-Violet or Neon-Blue Gradients**: *ShopSphere* uses a dark indigo/purple space-orbit aesthetic (`#4F46E5` -> `#06B6D4`). **Veranda PMS** uses organic coastal architecture tones: deep cypress pine, warm travertine stone, burnished bronze, and coastal jade.
- **Bespoke Hospitality Domain Surfaces**: Instead of generic e-commerce product cards and shopping carts, Veranda PMS features Room Allotment meters, Hospitality Folio breakdown sheets, Loyalty Tier badges (`Founders Club`, `Gold`, `Silver`, `Standard`), and Check-in/Check-out lifecycle indicators.

---

## 2. Color Tokens (`src/app/globals.css`)

Veranda PMS opens in **Dark Mode by default** (required for defect `VH-53`, where switching to Light Mode fails to persist across page refresh). Both themes are fully tokenized:

### 2.1 Dark Theme (Default — *Midnight Cypress & Burnished Brass*)

| Token | Hex / Value | Usage |
|---|---|---|
| `--bg-canvas` | `#0B1211` | Primary application background (deep coastal cypress-obsidian). |
| `--bg-rail` | `#0E1715` | Desktop sidebar navigation rail and login split architectural pane. |
| `--bg-surface` | `#131E1C` | Primary cards, data tables, modals, and form panels. |
| `--bg-subtle` | `#192724` | Table headers, hover rows, and secondary metric tiles. |
| `--bg-elevated` | `rgba(19, 30, 28, 0.88)` | Sticky topbar (`backdrop-filter: blur(12px)`). |
| `--ink-primary` | `#F3EFEA` | Primary headings, room names, and folio totals (`>= 14.5:1` contrast). |
| `--ink-secondary` | `#B8B2A8` | Table cell body copy and secondary descriptions (`>= 7.8:1` contrast). |
| `--ink-muted` | `#7E8884` | Field labels, helper text, and metadata captions (`>= 4.6:1` contrast). |
| `--accent-primary` | `#C87D4B` | Burnished terracotta-bronze primary buttons and active indicators. |
| `--accent-secondary` | `#2E9B8B` | Coastal seafoam-jade secondary accents and occupancy bars. |
| `--border-subtle` | `#223330` | `1px` uniform card, table, and layout hairlines. |
| `--border-strong` | `#354D48` | Form input, select, and checkbox borders. |
| `--status-success` | `#34D399` | `Confirmed` / `In Service` / positive allotment badges. |
| `--status-info` | `#38BDF8` | `Checked In` / active guest stay badges. |
| `--status-warn` | `#FBBF24` | `Pending` / `Low Allotment (<= 5)` warning badges. |
| `--status-danger` | `#F87171` | `Cancelled` / `Out of Allotment (0)` / destructive actions. |

### 2.2 Light Theme (*Sunlit Travertine & Deep Pine*)

| Token | Hex / Value | Usage |
|---|---|---|
| `--bg-canvas` | `#FAF7F2` | Warm travertine limestone workspace canvas. |
| `--bg-rail` | `#F2EDE4` | Warm sandstone inset navigation rail. |
| `--bg-surface` | `#FFFFFF` | Pure crisp surface cards, tables, and printable folio sheet. |
| `--bg-subtle` | `#F5F1EA` | Table headers and muted summary strips. |
| `--bg-elevated` | `rgba(250, 247, 242, 0.90)` | Frosted sticky topbar. |
| `--ink-primary` | `#141D1B` | Deep pine-espresso primary ink (`>= 15.2:1` contrast). |
| `--ink-secondary` | `#36423F` | Body copy and table cells (`>= 9.4:1` contrast). |
| `--ink-muted` | `#5C6865` | Muted labels and column headers (`>= 5.3:1` contrast). |
| `--accent-primary` | `#A8582B` | Deep terracotta primary action color (`>= 5.1:1` with white text). |
| `--accent-secondary` | `#176B5E` | Deep coastal jade accent (`>= 6.2:1` with white text). |
| `--border-subtle` | `#E4DDD3` | Warm stone `1px` card and table borders. |
| `--border-strong` | `#8C857B` | High-contrast input borders. |

---

## 3. Typography & Scannable Hierarchy

All fonts are self-hosted via `@fontsource` packages:
- **Display & Editorial Headings (`--font-display`)**: **Instrument Serif** (`400` regular & italic). Used on the Login split hero headline (*"Reservations, room inventory, and guest folios in one composed workspace."*), the Printable Guest Folio masthead, and page focal headers.
- **UI, Forms & Dense Tables (`--font-sans`)**: **Plus Jakarta Sans Variable** (`400`, `500`, `600`, `700`). Used for navigation, buttons, form controls, table cells, and badges.
- **Numeric, Codes & Folios (`--font-mono`)**: **JetBrains Mono Variable** (`400`, `500`, `600`) with `font-variant-numeric: tabular-nums`. Mandatory for Room Codes (`SB-1001`), Reservation Numbers (`RSV-2045`), PHP currency amounts (`1,370.00`), dates (`MM/DD/YYYY`), and allotment counts.

---

## 4. Responsive Workspace Shell & Navigation

```text
+-----------------------------------------------------------------------------------+
| [Veranda PMS | Solstice Bay]   Breadcrumb / Page Title    [Theme] [Bell(8)] [User]| <- 56px Sticky Topbar
+------------------+----------------------------------------------------------------+
|                  |                                                                |
|  - Dashboard     |   Page Header + Primary Action CTA                             |
|  - Rooms & Pkgs  |   +--------------------------------------------------------+   |
|  - Reservations  |   | KPI Strip / Filter Toolbar                             |   |
|  - Guests        |   +--------------------------------------------------------+   |
|  - Reports       |   | Primary Data Table / Interactive Chart / Form Surface  |   |
|  - Users (Admin) |   +--------------------------------------------------------+   |
|  - Settings      |                                                                |
|                  |                                                                |
| [Collapse Rail]  |   Footer: Veranda PMS Demo Environment  |  Reset demo data     |
+------------------+----------------------------------------------------------------+
   248px / 64px                        Fluid Workspace Canvas
```

- **Desktop (`>= 1024px`)**: Full 248px left sidebar rail collapsible to a 64px icon-only rail.
- **Tablet (`640px` to `1023px`)**: 64px icon rail + topbar with visible Theme toggle and Notification bell.
- **Mobile (`< 640px`)**: Topbar hamburger menu button opens a slide-over navigation drawer.
  - *Intentional Defect Boundary (`VH-58`)*: On viewports narrower than `640px`, tapping a navigation link inside the mobile drawer navigates the underlying page but intentionally leaves the drawer open until the user taps the backdrop or the close (`X`) button.

---

## 5. Custom Hospitality Components (Beyond Base `shadcn/ui`)

1. **`SplitEditorialAuthShell` (`src/components/hospitality/SplitEditorialAuthShell.tsx`)**:
   - Left pane: Architectural coastal resort illustration (sunlit archways & sea horizon SVG), **Solstice Bay Resort & Villas** crest, headline *"Room inventory, guest reservations, and folio billing in one composed workspace."*, 4 feature pills (`Live room allotments`, `Folio billing & VAT`, `Occupancy analytics`, `Role-based concierge access`), and fictional disclaimer.
   - Right pane: Auth card (`Sign in`, `Create account`, or `Forgot password`) + interactive **GROUP ACCOUNTS (ISOLATED DATA PER GROUP)** card showing Groups 1–5, each with its own Admin (`admin.groupN@verandapms.test / Admin@123`), Staff (`staff.groupN@verandapms.test / Staff@123`), and Staff deactivated (`former.groupN@verandapms.test / Former@123`).
   - Footer bar: `"Veranda PMS demo environment"` on the left/center and `"Reset demo data"` action button on the right.
2. **`AllotmentHealthBar` (`src/components/hospitality/AllotmentHealthBar.tsx`)**:
   - Visual indicator on Room & Package rows and detail pages showing current `available_units` with semantic status badges (`In Service`, `Low Allotment` when `1..5`, `Out of Allotment` when `<= 0`).
3. **`FolioMathBreakdown` (`src/components/hospitality/FolioMathBreakdown.tsx`)**:
   - Real-time hospitality billing summary card displaying `Gross Subtotal`, `Promo Discount (%)`, `12% VAT`, `Resort Service & Environmental Fee (PHP 250.00)`, and `Grand Total` in tabular monospace numerals.
4. **`GuestFolioPrintSheet` (`src/components/hospitality/GuestFolioPrintSheet.tsx`)**:
   - Dedicated printable statement at `/reservations/[id]/folio` styled like an authentic luxury hotel folio with Solstice Bay crest, Folio No., Placed Date, Billed To guest block, itemized table, tax/fee breakdown, footer note (`"Thank you for your purchse"` — intentional typo `VH-57`), and `@media print` stylesheet.
5. **`RevenueOccupancyChart` (`src/components/hospitality/RevenueOccupancyChart.tsx`)**:
   - Interactive 6-month bar chart on `/dashboard` showing monthly revenue and reservation count on hover.

---

## 6. Intentional UI, Text, and Accessibility Defect Boundaries

To ensure the 60 planted defects in [DEFECT_CATALOG.md](DEFECT_CATALOG.md) work as designed, the following specific exceptions are enforced in the UI layer:

| Defect ID | UI / Design Exception |
|---|---|
| `VH-24` | On `/reservations/new` (Create Reservation), selecting `SB-1009` (*"Solstice Bay Presidential Sanctuary..."*) renders the line item row without text truncation/wrapping (`whitespace-nowrap`), pushing Unit Rate, Quantity, and Line Total horizontally off-card so horizontal scrolling is required. |
| `VH-53` | The app opens in Dark Mode by default. Toggling Light Mode (via topbar toggle or `Settings > Appearance`) updates the active DOM theme for the current view, but does not persist/hydrate on page refresh (reverts to Dark Mode). |
| `VH-56` | Navigating to an unknown dynamic ID `/rooms/does-not-exist` or `/reservations/does-not-exist` renders an infinite loading skeleton, whereas unknown top-level routes (`/nope`) render the proper custom 404 screen. |
| `VH-57` | Exactly five intentional spelling mistakes exist in low-traffic strings: (1) Guests empty search: `"No custmers match your search"`, (2) Folio print footer: `"Thank you for your purchse"`, (3) Edit room toast: `"Room succesfully updated."`, (4) Allotment adjustment toast: `"Stock adjusment recorded."`, (5) Reservation status toast: `"Reservation status udpated."` |
| `VH-58` | Mobile navigation drawer (`< 640px`) does not auto-close when a navigation link is clicked. |
| `VH-59` | (a) Icon-only buttons (hamburger, sidebar collapse toggle, theme toggle, notification bell, drawer close, table row edit/delete icons, modal close `X`) omit `aria-label` and `title` tooltips (while sidebar navigation links keep proper labels). (b) Interactive buttons and links suppress visible `:focus-visible` outlines (`outline-none ring-0`). (c) Modal dialogs ignore `Escape` key dismissal. |
