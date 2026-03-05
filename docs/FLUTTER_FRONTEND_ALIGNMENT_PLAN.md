# Flutter Frontend Alignment Implementation Plan (Prioritized)

Date: 2026-03-05

Goal: Align Flutter pages with web frontend routes, using the Customer feature as the standard for code/doc structure.

Reference structure (Customer feature standard):
- `src/features/<feature>/domain/` entity + repository interface
- `src/features/<feature>/data/` dto + api_service + repository_impl
- `src/features/<feature>/application/` view_model
- `src/features/<feature>/presentation/` entry page + list page + edit page + widgets
- `page_registry.dart` registers full pages
- `nav_config.dart` declares routes + sidebar items

## Priority 0: Foundation for Parity

1. Work Orders (most business-critical)
- Web routes: `/workorders`, `/workorders/create`, `/workorders/:id`, `/workorders/:id/edit`
- Flutter status: placeholder or missing
- Implement following the Customer structure:
  - domain: `work_order.dart`, `work_order_repository.dart`
  - data: `work_order_dto.dart`, `work_order_api_service.dart`, `work_order_repository_impl.dart`
  - application: `work_order_view_model.dart`
  - presentation:
    - `work_order_list_page.dart` + entry wrapper
    - `work_order_form_page.dart` (create/edit)
    - `work_order_detail_page.dart`
    - widgets folder for list rows, form sections, status chips
- Router: add explicit go_router paths for create/detail/edit (not just leaf content)
- Page registry: map list/detail/form to full pages (not placeholder)

2. Task Operator + Supervisor
- Web routes: `/tasks/operator`, `/tasks/supervisor`
- Flutter status: missing
- Implement minimal dashboards using the Customer structure + task data domain
- Ensure main task list pages move off placeholder

## Priority 1: High-Use Business Operations

3. Tasks Core Set
- Web routes: `/tasks`, `/tasks/board`, `/tasks/stats`, `/tasks/assignment-history`, `/tasks/assignment-rules`
- Flutter status: placeholder
- Implement list + board first, then stats/history, then rules
- Follow customer structure and create shared task widgets (card/list row/status)

4. Sales Orders
- Web routes: `/sales-orders`, `/sales-orders/create`, `/sales-orders/:id`, `/sales-orders/:id/edit`
- Flutter status: placeholder/missing
- Implement list + form + detail
- Reuse Work Order patterns for create/edit/detail routing

5. Audit Logs
- Web route: `/audit-logs`
- Flutter status: missing
- Implement list + filters only (no edit)

## Priority 2: Data Maintenance and Operations

6. Products / Materials / Product Groups
- Web routes: `/products`, `/materials`, `/product-groups`
- Flutter status: placeholder
- Implement list + create/edit dialogs
- Ensure structure mirrors Customer (entry wrapper + list page + edit page)

7. Purchase Orders
- Web route: `/purchase-orders`
- Flutter status: placeholder
- Implement list + detail, create/edit if required by backend

8. Inventory
- Web routes: `/inventory/stocks`, `/inventory/delivery`, `/inventory/quality`
- Flutter status: placeholder
- Implement list + key dialogs (delivery receive, quality stats)

## Priority 3: Finance and Secondary Features

9. Finance
- Web routes: `/finance/invoices`, `/finance/payments`, `/finance/costs`, `/finance/statements`
- Flutter status: placeholder
- Implement list + summary stats, defer advanced dialogs

10. Notifications
- Web route: `/notifications`
- Flutter status: content body only
- Lift into full page with list + filters + detail drawer

## Implementation Rules (Use Customer Feature as Standard)

1. Each feature must have:
- domain/data/application/presentation separation
- entry widget that wires ApiService → Repository → ViewModel (as in `CustomerListEntry`)
- list page as primary UI entry point
- edit/create page or dialog under `presentation/`

2. Routing
- Leaf items remain for list pages
- Explicit routes for create/edit/detail are required for Work Orders and Sales Orders
- Update `app_router.dart` and `nav_config.dart` consistently

3. Page Registry
- If a feature has a real page, register it in `page_registry.dart`
- No business page should rely on the placeholder `ContentPage` once implemented

4. Documentation
- For each feature implementation, add a short section to `docs/FRONTEND_CODE_ANALYSIS.md` or a new doc that records the Flutter module layout

## Suggested Build Sequence (Sprint-Friendly)

1. Work Order list + detail + create/edit + routing
2. Task list + board + operator center + supervisor dashboard
3. Sales order list + create/edit + detail
4. Audit logs list
5. Products + materials + product groups
6. Purchase orders
7. Inventory (stocks, delivery, quality)
8. Finance modules
9. Notifications full page

If you want, I can turn this into a checklist with concrete file scaffolds and a per-feature TODO list.
