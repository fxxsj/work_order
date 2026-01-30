# Codebase Structure

**Analysis Date:** 2026-01-30

## Directory Layout

```
work_order/
├── backend/                          # Django backend application
│   ├── config/                      # Django configuration
│   │   ├── __init__.py
│   │   ├── settings.py              # Main settings file
│   │   ├── urls.py                  # Root URL patterns
│   │   └── wsgi.py                  # WSGI application entry
│   ├── workorder/                   # Main Django app
│   │   ├── admin.py                 # Django admin customization
│   │   ├── apps.py                  # Django app configuration
│   │   ├── models/                  # Split model modules
│   │   │   ├── __init__.py         # Model imports
│   │   │   ├── base.py             # Base model with common fields
│   │   │   ├── core.py             # Core business models
│   │   │   ├── products.py         # Product management models
│   │   │   ├── materials.py        # Material & supplier models
│   │   │   ├── assets.py           # Artwork & plate models
│   │   │   ├── finance.py          # Financial models
│   │   │   ├── inventory.py        # Inventory models
│   │   │   ├── sales.py            # Sales order models
│   │   │   └── multi_level_approval.py  # Approval workflow models
│   │   ├── views/                   # API views and ViewSets
│   │   │   ├── __init__.py
│   │   │   ├── work_orders.py      # Work order views
│   │   │   └── work_order_tasks/   # Task-specific views
│   │   ├── serializers/             # DRF serializers
│   │   │   ├── __init__.py
│   │   │   └── serializers.py      # Main serializers
│   │   ├── services/               # Business logic services
│   │   │   ├── __init__.py
│   │   │   └── (service modules)
│   │   ├── management/              # Django management commands
│   │   ├── migrations/              # Database migrations
│   │   ├── fixtures/                # Initial data fixtures
│   │   ├── templates/               # HTML templates
│   │   ├── tests/                   # Backend tests
│   │   └── (other Django files)
│   ├── venv/                        # Python virtual environment
│   └── (backend dependencies)
├── frontend/                        # Vue.js frontend application
│   ├── public/                      # Static public assets
│   ├── src/                         # Source code
│   │   ├── api/                     # API layer
│   │   │   ├── index.js             # Axios configuration
│   │   │   ├── base/               # Base classes
│   │   │   │   └── BaseAPI.js       # Base API class
│   │   │   └── modules/             # 27 API modules
│   │   │       ├── auth.js          # Authentication API
│   │   │       ├── customer.js      # Customer API
│   │   │       ├── workOrder.js     # Work order API
│   │   │       ├── product.js       # Product API
│   │   │       ├── material.js      # Material API
│   │   │       └── ...              # Other API modules
│   │   ├── assets/                  # Static assets (CSS, images, fonts)
│   │   ├── components/              # Reusable Vue components
│   │   ├── views/                   # Page components
│   │   │   ├── Layout.vue          # Main layout component
│   │   │   ├── Login.vue            # Login page
│   │   │   ├── Dashboard.vue        # Dashboard page
│   │   │   ├── workorder/          # Work order pages
│   │   │   ├── customer/           # Customer pages
│   │   │   └── ...                  # Other page modules
│   │   ├── router/                  # Vue Router configuration
│   │   │   └── index.js            # Main router file
│   │   ├── store/                   # Vuex state management
│   │   │   └── index.js            # Store configuration
│   │   ├── mixins/                  # Vue mixins
│   │   │   ├── listPageMixin.js     # List page functionality
│   │   │   ├── crudPermissionMixin.js  # Permission handling
│   │   │   └── ...                  # Other mixins
│   │   ├── services/                # Business logic services
│   │   ├── utils/                   # Utility functions
│   │   ├── config/                  # Configuration files
│   │   ├── App.vue                  # Root component
│   │   └── main.js                  # Application entry point
│   ├── dist/                        # Build output
│   ├── node_modules/                # Frontend dependencies
│   └── (frontend config files)
├── .planning/                      # Planning documents
│   └── codebase/                   # Generated architecture documents
├── docs/                           # Project documentation
│   ├── README.md                   # Main documentation
│   ├── QUICKSTART.md              # Quick start guide
│   └── DEPLOYMENT.md              # Deployment guide
├── scripts/                        # Utility scripts
├── .venv/                          # Virtual environment
├── venv/                           # Virtual environment
├── Dockerfile                      # Docker configuration
├── docker-compose.yml              # Docker compose
└── .gitignore                      # Git ignore rules
```

## Directory Purposes

### Backend Directories

**`backend/config/`**:
- Purpose: Django application configuration
- Contains: Settings, URLs, WSGI configuration
- Key files: `settings.py`, `urls.py`

**`backend/workorder/`**:
- Purpose: Main application with business logic
- Contains: Models, views, serializers, services
- Key files: Models in `models/` subdirectory

**`backend/workorder/models/`**:
- Purpose: Data model definitions organized by domain
- Contains: Split model modules for maintainability
- Key files: `base.py`, `core.py`, `products.py`, `materials.py`

**`backend/workorder/views/`**:
- Purpose: API endpoint implementations
- Contains: Django REST Framework ViewSets
- Key files: `work_orders.py` for main work order endpoints

**`backend/workorder/serializers/`**:
- Purpose: Data serialization for API responses
- Contains: DRF serializers for models
- Key files: `serializers.py`

**`backend/workorder/services/`**:
- Purpose: Business logic layer
- Contains: Service classes for complex operations
- Pattern: Encapsulates business rules beyond simple CRUD

**`backend/workorder/management/`**:
- Purpose: Django management commands
- Contains: Custom commands for data initialization
- Key commands: `reset_processes`, `load_initial_users`

**`backend/workorder/fixtures/`**:
- Purpose: Initial data loading
- Contains: JSON files for test data
- Key files: `initial_products.json`

### Frontend Directories

**`frontend/src/api/`**:
- Purpose: API communication layer
- Contains: HTTP client configuration and business API modules
- Structure:
  - `api/index.js` - Axios configuration and interceptors
  - `api/base/BaseAPI.js` - Base class for all API modules
  - `api/modules/` - 27 business API modules following consistent pattern

**`frontend/src/views/`**:
- Purpose: Page components and UI layouts
- Contains: Main application pages organized by feature
- Structure:
  - `views/Layout.vue` - Main layout with sidebar and header
  - `views/Login.vue` - Authentication page
  - `views/Dashboard.vue` - Home dashboard
  - `views/workorder/` - Work order related pages
  - `views/customer/` - Customer management pages
  - `views/product/` - Product catalog pages

**`frontend/src/components/`**:
- Purpose: Reusable UI components
- Contains: Small, focused components for reuse
- Examples: Form components, table components, modal dialogs

**`frontend/src/mixins/`**:
- Purpose: Reusable component logic
- Contains: Mixins for common functionality
- Key files: `listPageMixin.js`, `crudPermissionMixin.js`

**`frontend/src/store/`**:
- Purpose: Centralized state management
- Contains: Vuex store modules
- Pattern: Module-based state organization

**`frontend/src/router/`**:
- Purpose: Client-side routing
- Contains: Vue Router configuration with lazy loading
- Pattern: Webpack code splitting for performance optimization

## Key File Locations

### Entry Points
- **Frontend**: `frontend/src/main.js` - Vue app initialization
- **Backend**: `backend/config/settings.py` - Django settings
- **API Root**: `backend/workorder/urls.py` - API endpoint definitions

### Configuration
- **Frontend Config**: `frontend/vue.config.js` - Vue CLI configuration
- **Backend Config**: `backend/config/settings.py` - Django configuration
- **Environment**: `.env` files for environment variables

### Core Logic
- **Models**: `backend/workorder/models/` - Django ORM models
- **API Views**: `backend/workorder/views/` - DRF view implementations
- **Frontend APIs**: `frontend/src/api/modules/` - API client classes

### Testing
- **Frontend Tests**: `tests/unit/` - Jest unit tests
- **Backend Tests**: `backend/workorder/tests/` - Django test cases

## Naming Conventions

### Files
- **Models**: `snake_case.py` (e.g., `work_order.py`)
- **Views**: `snake_case.py` (e.g., `work_orders.py`)
- **Components**: `PascalCase.vue` (e.g., `WorkOrderList.vue`)
- **API Modules**: `kebab-case.js` (e.g., `work-order.js`)
- **Mixins**: `camelCase.js` (e.g., `listPageMixin.js`)

### Directories
- **Frontend**: `kebab-case/` (e.g., `work-order/`)
- **Backend**: `snake_case/` (e.g., `work_order/`)
- **Models**: Organized by domain in subdirectories

### Database Tables
- **Convention**: `appname_modelname` (e.g., `workorder_workorder`)
- **Indexes**: Based on frequent query patterns

## Where to Add New Code

### New Frontend Feature
- **API Module**: Create in `frontend/src/api/modules/[feature].js`
- **Component**: Create in `frontend/src/views/[feature]/[Feature]Component.vue`
- **Test**: Add in `tests/unit/[feature]/[Feature]Component.spec.js`

### New Backend API Endpoint
- **Model**: Add in `backend/workorder/models/[domain].py`
- **View**: Add in `backend/workorder/views/[module].py`
- **Serializer**: Add in `backend/workorder/serializers/serializers.py`
- **URL**: Add in `backend/workorder/urls.py`

### New Business Logic
- **Service**: Add in `backend/workorder/services/[service].py`
- **Validation**: Add in `backend/workorder/models/validation.py`
- **Management Command**: Add in `backend/workorder/management/commands/[command].py`

## Special Directories

**`docs/`**:
- Purpose: Project documentation and guides
- Generated: Yes
- Committed: Yes
- Contains: README, quick start, deployment guides

**`.planning/codebase/`**:
- Purpose: Generated architecture and planning documents
- Generated: Yes (by GSD tools)
- Committed: Yes
- Contains: ARCHITECTURE.md, STRUCTURE.md, etc.

**`venv/` and `.venv/`**:
- Purpose: Python virtual environments
- Generated: Yes
- Committed: No (in .gitignore)
- Contains: Python dependencies for development

---

*Structure analysis: 2026-01-30*
