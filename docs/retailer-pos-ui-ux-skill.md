---
name: retailer-pos-ui-ux
description: Redesign and build the Retailer POS React application with distinctive, production-minded UI/UX. Use when auditing, redesigning, implementing, or polishing checkout, inventory, products, sales, reports, settings, and the admin/cashier shells.
---

# Retailer POS UI/UX Skill

## Mission
Create a distinctive, trustworthy and fast retail operations interface for codedbyhassan/Retailer-POS. Use the Taste Skill v2 app-screen workflow as the design method, but adapt every choice to the real cashier and shop-manager jobs. This is an operational POS, not a marketing site. Prioritize transaction speed, legibility, inventory clarity, keyboard/barcode workflows and usable touch targets.

## Project facts to preserve
- Stack: React 19, Vite, JavaScript, React Router DOM, Tailwind CSS and Supabase.
- Route map: src/app/AppRoutes.jsx. Role protection: src/routes/AppRoutes.jsx.
- Shells: src/layouts/AdminLayout.jsx, src/layouts/CashierLayout.jsx, src/layouts/AppShellLayout.jsx and src/components/layout/.
- Main screens: src/pages/sales/POSPage.jsx, src/pages/dashboard/AdminDashboard.jsx, src/pages/products/, src/pages/inventory/InventoryPage.jsx, src/pages/sales/, src/pages/analytics/AnalyticsPage.jsx, src/pages/reports/, src/pages/settings/, src/pages/login/LoginPage.jsx, src/pages/profile/ProfilePage.jsx.
- Shared components: src/components/ui/, src/components/forms/, src/components/tables/, src/components/products/, src/components/analytics/ and src/components/modals/.
- Preserve brand presets, light/dark mode, configured currency/tax, receipt settings, business name and low-stock preferences.
- Keep admin/cashier route boundaries and permissions unchanged.

## Truthfulness and data integrity
Do not promise offline checkout because navigator.onLine reports offline. Current data services call Supabase directly and src/hooks/useSyncStatus.js exposes placeholder sync values. Treat offline checkout, queued sync and conflict resolution as unverified until the code and tests prove them. Never invent dashboard values, status indicators, sample products or growth metrics. Keep visual work separate from business logic, schemas, roles and RPC payloads.

## Design workflow
1. Read the route map, screen, shared component, styles/tokens, data service and relevant hooks before editing. Record the screen's job, primary action, actual data source, loading/empty/error/success/disabled states, keyboard/touch use and functionality that must be preserved.
2. Use Taste Skill v2's references/app-screens.md and the app-screen direction picker. Adapt it to long operational sessions, dense retail data, quick cashier actions and existing theme presets. Do not copy a reference screen pixel for pixel.
3. Use a small intentional palette; reserve brand colour for primary actions and selected states. Use consistent spacing, control heights, labels, borders and type hierarchy. Use tabular numerals for currency, quantities and percentages; right-align numeric columns. Prefer restrained surfaces and borders over excessive gradients, shadows and decorative cards. Keep light/dark mode equally legible and keep status meanings consistent.
4. Improve shared components when this creates consistent gains. Avoid arbitrary one-off overrides. Use sentence-case labels and plain retail language.

## Responsive requirements: desktop, tablet and mobile
Every changed screen must be checked at 1440 x 900 (desktop), 768px wide (tablet) and 390px wide (phone). Do not simply shrink the desktop layout.
- Desktop: use available width well, maintain readable table density, keep checkout totals/action visible and avoid orphaned cards.
- Tablet: reconsider sidebar/content proportions, avoid squeezed split panes and keep navigation reachable. Use local horizontal scrolling for genuinely wide tables rather than page-level overflow.
- Mobile: keep primary actions within reach, make targets comfortably touchable, avoid horizontal page overflow, provide deliberate card/list treatments for tabular data, respect safe-area insets and preserve dialog/keyboard behavior.
- Check long labels, currency values, empty states, filters, forms, dialogs, loading indicators and errors at each width.
- Keep focus visible, inputs explicitly labelled and actions keyboard-accessible. Respect prefers-reduced-motion.

## POS checkout
POS job: add the right products quickly, review items, take payment, complete the sale and issue a receipt.
- Keep search/barcode input easy to reach and preserve focus where useful. Confirm Enter-based barcode scan, product selection, quantity changes, remove item, discount, payment choice, checkout and receipt behavior.
- Make cart, subtotal, discount, tax and total easy to scan and mathematically consistent.
- Prevent duplicate checkout; show processing, failure and success feedback.
- Make empty cart, no search results and out-of-stock states clear.
- On phone/tablet, offer a deliberate cart drawer or equivalent accessible flow; do not place checkout far below a long product list. Keep the total and cart action reachable without horizontal scrolling.
- Do not change sale creation, RPC payloads, tax calculations or cart semantics during a visual-only redesign.

## Dashboard, lists and forms
- Dashboard cards must fit the grid cleanly. Put key trading signals and actionable exceptions first. Do not add made-up stats, sparklines or percentage changes.
- Keep low-stock exceptions visible and link to the appropriate action.
- Use consistent table columns, readable rows and useful empty/loading/error states. For phones, switch to readable cards or a deliberate compact view; do not let tables overflow the whole page.
- Keep filters together and date scope explicit. Keep charts only when they answer a real question and use trustworthy scales.
- Group forms by task, use explicit labels, preserve values after validation errors and show save outcomes.
- Destructive actions need clear labels and intentional confirmation.

## Verification
Use the existing package scripts and run a production build. Verify all changed screens at 1440x900, 768px and 390px in a real browser; inspect screenshots rather than relying on code alone. Taste Skill v2 offers app lint/inspection scripts. Do not claim the rendered UI or checkout workflow was verified unless actually exercised.
Manually test:
- Admin and cashier route boundaries.
- Product search/barcode, cart add/remove/quantity and low-stock behavior.
- Discount/tax/payment totals, checkout success/failure, receipt and printing.
- Product create/edit/archive, stock adjustments and movement history.
- Sales filters/details, reports/date range, settings save, theme and presets.
- Empty/loading/error/success states, Escape-to-close dialogs, keyboard focus and responsive overflow.
Document any unverified offline functionality or known functional issue.

## Initial codebase audit cues
- POS was rendered as a product pane plus fixed 24rem cart. Verify the desktop split and design a different cart presentation for tablet/phone.
- POS product cards are tall and image-led; balance recognition and catalogue density.
- Mobile admin navigation was a horizontally scrollable row and did not include all admin destinations.
- Dashboard uses five stat cards with a three-column desktop grid, leaving an uneven last row.
- Some tables are too wide for phones, and some initial data loads can appear blank.
- Existing conventions vary between rounded-xl, rounded-2xl and rounded-3xl, border strengths, gradients and shadows. Consolidate instead of layering styles.
- Browser connectivity is not proof of successful sync; src/hooks/useSyncStatus.js contains placeholders.

These are source-review cues, not a substitute for inspecting the rendered interface.

## Definition of done
- All routes render and role protection remains intact.
- Business workflows and data contracts are unchanged unless separately authorized.
- Clear hierarchy, consistent visual language, visible focus and designed empty/loading/error/success states.
- Desktop, tablet and phone layouts have actually been inspected.
- Highest-impact screenshot and interaction problems are fixed in a repeat inspection.
- Known issues and unverified capabilities are documented honestly.
