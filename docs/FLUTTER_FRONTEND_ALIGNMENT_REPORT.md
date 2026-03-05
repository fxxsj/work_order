# Flutter vs Web Frontend Alignment Report

Date: 2026-03-05

Scope: Compare Flutter app navigation and implemented pages against the Vue web frontend routes to identify gaps and partial implementations.

Sources:
- Flutter routes: `flutter_frontend/lib/src/core/router/app_router.dart`
- Flutter nav and paths: `flutter_frontend/lib/src/core/presentation/layout/nav_config.dart`
- Flutter page registry and fallback: `flutter_frontend/lib/src/core/presentation/layout/page_registry.dart`, `flutter_frontend/lib/src/core/presentation/layout/content_page.dart`
- Web routes: `frontend/src/router/index.js`

## Flutter Current State (Summary)

Implemented full pages registered in Flutter:
- `/customers` Customer list
- `/suppliers` Supplier list
- `/departments` Department list
- `/processes` Process list
- `/artworks` Artwork list
- `/dies` Die list
- `/foiling-plates` Foiling plate list
- `/embossing-plates` Embossing plate list
- `/profile` Profile page

Implemented content body inside the shared content layout:
- `/notifications` Notification center view

All other Flutter navigation targets render the generic placeholder content from `ContentPage`.

Auth routes:
- `/login` exists in both
- `/register` exists in Flutter only

## Alignment Matrix (Web Route → Flutter Status)

Legend:
- Implemented: Flutter has a real page in `page_registry.dart`
- Partial: Flutter route exists but only placeholder content (or only a small body widget)
- Missing: Flutter route not defined in nav/router

### Core
- `/dashboard` — Partial (placeholder content)
- `/login` — Implemented
- `/profile` — Implemented
- `/notifications` — Partial (content body only)

### Work Orders
- `/workorders` — Partial (placeholder content)
- `/workorders/create` — Missing
- `/workorders/:id` — Missing
- `/workorders/:id/edit` — Missing

### Tasks
- `/tasks` — Partial (placeholder content)
- `/tasks/board` — Partial (placeholder content)
- `/tasks/stats` — Partial (placeholder content)
- `/tasks/assignment-history` — Partial (placeholder content)
- `/tasks/assignment-rules` — Partial (placeholder content)
- `/tasks/operator` — Missing
- `/tasks/supervisor` — Missing

### Basic Data
- `/customers` — Implemented
- `/departments` — Implemented
- `/processes` — Implemented
- `/products` — Partial (placeholder content)
- `/materials` — Partial (placeholder content)
- `/product-groups` — Partial (placeholder content)

### Plate Making
- `/artworks` — Implemented
- `/dies` — Implemented
- `/foiling-plates` — Implemented
- `/embossing-plates` — Implemented

### Suppliers and Purchase
- `/suppliers` — Implemented
- `/purchase-orders` — Partial (placeholder content)

### Sales Orders
- `/sales-orders` — Partial (placeholder content)
- `/sales-orders/create` — Missing
- `/sales-orders/:id` — Missing
- `/sales-orders/:id/edit` — Missing

### Inventory
- `/inventory/stocks` — Partial (placeholder content)
- `/inventory/delivery` — Partial (placeholder content)
- `/inventory/quality` — Partial (placeholder content)

### Finance
- `/finance/invoices` — Partial (placeholder content)
- `/finance/payments` — Partial (placeholder content)
- `/finance/costs` — Partial (placeholder content)
- `/finance/statements` — Partial (placeholder content)

### Audit
- `/audit-logs` — Missing

### Web-Only Views (No Flutter Equivalent)
- `/dashboard-mobile` (DashboardMobile)
- `/search` (used by DashboardMobile)

### Flutter-Only Views (No Web Equivalent)
- `/register`

## Implementation Notes

- Flutter navigation is driven by `nav_config.dart`. All leaf items become routes via `StatefulShellRoute`. If a leaf id is not implemented in `page_registry.dart`, the app renders the generic placeholder layout from `ContentPage`.
- Flutter currently has data/domain layers for some areas (e.g., products) but no presentation pages wired into the router.
- Several Flutter list pages include edit dialogs/pages (e.g., `*EditPage`), but these are not routed paths in Flutter. The web frontend uses explicit routes for create/edit/detail flows, especially for work orders and sales orders.

## Gaps That Block Parity

High-impact missing flows compared to web:
- Work order list/detail/create/edit
- Task operator and supervisor dashboards
- Sales order create/detail/edit
- Audit logs

Large placeholder surface:
- Dashboard
- Tasks (list/board/stats/history/rules)
- Products, materials, product groups
- Purchase orders
- Inventory (stock/delivery/quality)
- Finance (invoices/payments/costs/statements)

## Suggested Next Step

If you want, I can generate a prioritized implementation plan that aligns Flutter pages with web routes, including which Flutter screens to build first and how to map web dialogs to Flutter flows.
