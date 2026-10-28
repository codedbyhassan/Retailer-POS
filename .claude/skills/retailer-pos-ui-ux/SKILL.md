---
name: retailer-pos-ui-ux
description: Redesign and build the Retailer POS React application with production-minded UI/UX. Use for checkout, inventory, products, sales, reports, settings, and admin/cashier layouts.
---

# Retailer POS UI/UX Skill

## Mission
Build a distinctive, trustworthy, fast retail operations interface for codedbyhassan/Retailer-POS. Follow Taste Skill v2's app-screen workflow, adapted to the daily jobs of cashiers and shop managers. This is an operational point-of-sale product, not a marketing site. Prioritize transaction speed, legibility, stock clarity, keyboard and barcode workflows, safe error recovery, and usable touch targets.

## Project map and contracts
- Stack: React 19, Vite, JavaScript, React Router DOM, Tailwind CSS, Supabase.
- Route boundaries: src/app/AppRoutes.jsx and src/routes/AppRoutes.jsx.
- Shared layouts: src/layouts/AdminLayout.jsx, src/layouts/CashierLayout.jsx, src/layouts/AppShellLayout.jsx and src/components/layout/.
- Key screens: src/pages/sales/POSPage.jsx, src/pages/dashboard/AdminDashboard.jsx, src/pages/products/, src/pages/inventory/InventoryPage.jsx, src/pages/sales/, src/pages/analytics/AnalyticsPage.jsx, src/pages/reports/, src/pages/settings/, src/pages/login/LoginPage.jsx and src/pages/profile/ProfilePage.jsx.
- Reusable UI: src/components/ui/, src/components/forms/, src/components/tables/, src/components/products/, src/components/analytics/ and src/components/modals/.
- Preserve the theme presets, light/dark mode, admin/cashier permissions, currency/tax/receipt settings, route structure and existing Supabase/service contracts unless explicitly asked to change them.
- Never casually change RPC payloads, data models, role checks, invoice generation, tax calculations, stock adjustment logic, or sale settlement while working on presentation.

## Truthfulness constraint: online and sync states
Do not claim checkout or data entry works offline merely because navigator.onLine reports a disconnected browser. Current visible data services call Supabase directly and src/hooks/useSyncStatus.js contains placeholder sync values. Verify actual persistence, queueing and conflict-resolution code before designing any claim of offline operation. Connectivity and synchronization are different states. Do not show fake pending counts, pretend last-sync timestamps, fabricated metrics or unsupported “synced” indicators.

## Design process
1. Inventory the screen and its dependencies before styling. Read route usage, props, hooks, forms, service calls, data shape and database assumptions. Determine the real primary action, most important finding, and states: loading, empty, error, success, disabled, destructive and focus.
2. Use Taste Skill v2 references/app-screens.md for application screens rather than its marketing page workflow. Explore the app-screen direction picker and inspect rendered screenshots; do not copy reference screens pixel for pixel.
3. Define reusable tokens and component patterns before one-off fixes. Consolidate page gutters, border strength, radius, type hierarchy, input/button heights, table headers, focus rings and status colours.
4. Fix the highest-impact task and responsive failures first. Prefer clarity and low-friction operation over decoration.
5. Inspect in a real browser, not only by reading JSX or running a static lint. Repeat after fixing the top visual and interaction failures.

## Responsive requirement: mandatory for every change
Test all changes at these reference viewports:
- Desktop: 1440 × 900.
- Tablet: 768px wide, also inspect a landscape tablet if the layout breakpoint changes.
- Mobile: 390px wide, with a narrow 320–360px check when practical.

Do not just scale down the desktop view. Set a purposeful hierarchy for each viewport. Avoid body-level horizontal overflow, clipped menus, unreachable checkout actions, tiny tap targets, overlapping dialogs and tables that push the entire page wider than the screen. Use an explicit mobile interaction pattern if the desktop layout depends on two panes. Touch targets should generally be about 44px high, controls should retain visible focus, and horizontal scrolling should be local to a table or nav rather than the entire page.

## Screen goals

### POS / checkout
- Search and barcode input must be obvious, keyboard reachable and easy to refocus.
- Preserve Enter-based barcode handling, product selection, quantity edits, item removal, discount, payment method, checkout and receipt flows.
- Keep subtotal, discount, tax and total mathematically consistent and visually easy to scan.
- Prevent double-submit and clearly display processing, failure and success.
- Distinguish no matching results from no available stock, out-of-stock products, and an empty cart.
- Keep checkout action reachable on touch devices. On narrow screens, use a clear Products/Cart mode or similarly explicit pattern; do not compress the desktop two-column layout into unusable columns.
- Do not alter sale creation, RPC payloads, currency formatting, tax logic, stock constraints or cart calculations in a visual-only pass.

### Admin overview
- Show truthful, decision-useful metrics and surface important exceptions such as low stock.
- Choose responsive metric grids that avoid orphaned cards on common desktop sizes.
- Avoid decorative growth claims, invented sparklines and chart elements without real data behind them.
- Make the next useful action discoverable without overwhelming the overview.

### Inventory, product and sale lists
- Right-align numeric values and use tabular numerals for money, quantity and percentages.
- Maintain consistent row density, header contrast, status wording and action placement.
- Keep filters and date scope in predictable locations.
- For mobile, use a deliberate compact table, card list, or locally scrollable table with clear boundaries. Do not allow one wide table to cause page-wide horizontal overflow.
- Forms need explicit labels, inline validation, preserved user input after errors, clear save/cancel hierarchy and visible outcomes.

### Reports and settings
- Charts must answer a specific question, use honest scales and match source data.
- Empty states should explain what belongs on the page and offer a useful next action.
- Settings should show what is being changed, where appropriate indicate impact, and provide a clear saved/error state.
- Preserve theme presets and business-configurable settings.

### Navigation and shell
- Every destination available on desktop must also be reachable on mobile and tablet; include settings and user administration when permission allows.
- Mark the active route clearly, maintain stable shell spacing, and use a compact mobile nav pattern that does not rely on hidden horizontal overflow to expose core routes.
- Preserve route protection for admin and cashier roles.

## Visual system
- Use a small, intentional palette. Reserve brand colour for primary actions, selected navigation and key data; use semantic status colours consistently and never rely on colour alone.
- Prefer clean surfaces and subtle borders to stacked shadows, gradients and oversized rounded cards. Keep the existing brand character and theme presets.
- Use a consistent spacing scale, alignment and predictable control heights.
- Use sentence-case labels and precise retail language: Products, Sales, Stock movements, Transactions and Inventory value.
- Use real product thumbnails when they improve identification; do not force images into dense tables.
- Keep light and dark modes equally legible. Respect src/index.css, tailwind.config.js and the existing CSS variables.

## Preservation and verification
Before editing shared components, check where they are used. Keep route names, component contracts, form behaviour, service calls and permissions intact. Report discovered functional issues separately instead of hiding them with styling.

Run the repository's actual scripts where a working checkout is available. Use Taste Skill v2 inspection where installed:
- node .claude/skills/design-taste-frontend/scripts/lint.mjs --app src
- node .claude/skills/design-taste-frontend/scripts/inspect.mjs --app http://localhost:5173

Manually verify at desktop, tablet and mobile sizes:
- Role-specific routes and navigation.
- Product search, barcode input, adding/removing items and quantity limits.
- Discount, payment method, checkout success/failure and receipt/printing.
- Product create/edit/archive and inventory adjustment.
- Sales filters, transaction details, report date filters and empty states.
- Settings save, theme toggle and visual presets.
- Keyboard focus, Escape-to-close dialogs and narrow screens.

Never mark a workflow or viewport as verified unless it was actually exercised.

## Initial source-audit cues
Treat these as hypotheses to verify in the browser:
1. The dashboard starts with five stats in a three-column grid, producing an unbalanced final row at large widths.
2. Component styles vary across radii, border strengths, gradients and table headers.
3. POS product cards are tall and image-led; assess identification speed and catalogue density.
4. POS uses a fixed 24rem checkout column on large screens; verify tablet split and mobile cart reachability.
5. Mobile admin navigation has a horizontally scrolling list and omits some settings/user destinations.
6. Inventory and report reads need designed loading/error states.
7. Several lists are wide desktop tables; inspect overflow and action controls on phones.
8. The visible browser-online indicator is not proof of a functioning sync engine.

## Definition of done
- All routes render and role boundaries remain intact.
- Existing business workflows and data/service contracts still work.
- The UI has a coherent identity and clear information hierarchy.
- Loading, empty, error, success, disabled and focus states are handled.
- Desktop 1440px, tablet 768px and mobile 390px layouts were inspected.
- The highest-impact visual and interaction problems were fixed and re-inspected.
- Any known defect or unverified offline capability is documented honestly.
