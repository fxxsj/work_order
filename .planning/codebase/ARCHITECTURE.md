# Architecture

**Analysis Date:** 2026-01-30

## Pattern Overview

**Overall:** Full-stack MVC with modular API design

**Key Characteristics:**
- Frontend: Vue.js 2.7 with Component-based SPA architecture
- Backend: Django REST Framework with Model-View-Template pattern
- API: RESTful API with JWT/Token authentication
- Modular design with clear separation of concerns
- Service layer for business logic abstraction

## Layers

### Frontend Layer

**Presentation Layer (`frontend/src/`)**:
- Purpose: User interface and interaction handling
- Location: `frontend/src/views/`
- Contains: Vue components, pages, layouts
- Depends on: Vuex store, router, API modules
- Used by: End users through browser

**API Layer (`frontend/src/api/`)**:
- Purpose: API communication and data fetching
- Location: `frontend/src/api/`
  - `api/base/BaseAPI.js` - Base API class providing standard CRUD operations
  - `api/modules/` - 27 business API modules (customers, products, work orders, etc.)
- Contains: API client classes, HTTP configuration
- Depends on: Axios HTTP client
- Used by: Presentation layer components

**State Management (`frontend/src/store/`)**:
- Purpose: Centralized application state
- Location: `frontend/src/store/`
- Contains: Vuex modules for different domains
- Pattern: Module-based Vuex state management

**Routing Layer (`frontend/src/router/`)**:
- Purpose: Client-side routing and navigation
- Location: `frontend/src/router/`
- Contains: Vue Router configuration with lazy loading
- Pattern: Webpack code splitting for performance

### Backend Layer

**API Views Layer (`backend/workorder/views/`)**:
- Purpose: HTTP request handling and response formatting
- Location: `backend/workorder/views/`
- Contains: Django REST Framework ViewSets and API views
- Depends on: Models, Serializers, Services
- Pattern: ModelViewSet for standard CRUD operations

**Business Logic Layer (`backend/workorder/services/`)**:
- Purpose: Core business logic implementation
- Location: `backend/workorder/services/`
- Contains: Service classes for complex operations
- Depends on: Models, Data access layer
- Pattern: Service layer pattern for business logic encapsulation

**Data Access Layer (`backend/workorder/models/`)**:
- Purpose: Data modeling and database access
- Location: `backend/workorder/models/`
  - `models/base.py` - Base model with common fields
  - `models/core.py` - Core business models (WorkOrder, Customer, etc.)
  - `models/products.py` - Product-related models
  - `materials.py` - Material and supplier models
  - `assets.py` - Artwork, die, plate models
  - `finance.py` - Financial models
  - `inventory.py` - Inventory management models
  - `sales.py` - Sales order models
- Contains: Django ORM models with relationships
- Pattern: Django ORM with abstract base classes

**Configuration Layer (`backend/config/`)**:
- Purpose: Application configuration and settings
- Location: `backend/config/`
- Contains: Django settings, middleware, URL patterns
- Pattern: Django settings pattern with environment variables

## Data Flow

### Client-Server Communication Flow:

1. **User Action**: User interacts with Vue component in browser
2. **API Call**: Component calls API module method (e.g., `customerAPI.getList()`)
3. **HTTP Request**: Axios sends request to Django backend
4. **View Processing**: Django REST ViewSet receives request
5. **Service Logic**: Service layer processes business logic if needed
6. **Data Access**: ORM queries database through models
7. **Serialization**: Serializers format data as JSON
8. **HTTP Response**: JSON response sent back to frontend
9. **State Update**: Vuex state updated with new data
10. **UI Update**: Component re-renders with updated data

### Authentication Flow:

1. **Login**: User credentials sent to `/auth/login/`
2. **Validation**: Django auth system validates credentials
3. **Token Generation**: JWT/Token created for authenticated user
4. **Token Storage**: Token stored in localStorage and Vuex
5. **Authorization**: Token included in Authorization header for subsequent requests
6. **Permission Check**: Django permissions validated for each request

## Key Abstractions

### BaseAPI Class
- Purpose: Eliminates API code duplication across modules
- Examples: `frontend/src/api/modules/customer.js`, `product.js`, `workOrder.js`
- Pattern: Base class inheritance with standard CRUD methods

### Mixin Pattern
- Purpose: Reusable component logic for list pages
- Examples: `frontend/src/mixins/listPageMixin.js`, `crudPermissionMixin.js`
- Pattern: Vue.js mixins for cross-component functionality

### Service Layer
- Purpose: Encapsulates complex business logic
- Examples: `backend/workorder/services/` directory
- Pattern: Service classes that orchestrate model operations

### Base Model
- Purpose: Common fields and behaviors across all models
- Examples: `backend/workorder/models/base.py`
- Pattern: Abstract base class with shared fields (created_at, updated_at, created_by)

## Entry Points

### Frontend Entry Point
- **Location**: `frontend/src/main.js`
- **Triggers**: Vue app initialization
- **Responsibilities**:
  - Register global plugins (Element UI, VueVirtualScroller, VueLazyload)
  - Setup global filters for date formatting
  - Initialize Vue instance with router and store

### Backend Entry Point
- **Location**: `backend/config/settings.py`
- **Triggers**: Django application startup
- **Responsibilities**:
  - Django settings configuration
  - Database connection setup
  - Security middleware configuration
  - Application registration

### API Entry Points
- **Authentication**: `/api/auth/` - Login, logout, user profile
- **Work Orders**: `/api/workorders/` - CRUD operations for work orders
- **Customers**: `/api/customers/` - Customer management
- **Products**: `/api/products/` - Product catalog management
- **Materials**: `/api/materials/` - Material and supplier management
- **Inventory**: `/api/inventory/` - Stock management
- **Finance**: `/api/finance/` - Invoices and payments

## Error Handling

### Frontend Strategy:
- **Global Error Handler**: Centralized error handling in axios interceptors
- **User-Friendly Messages**: Localized error messages for end users
- **Error Boundaries**: Component-level error catching
- **Validation**: Form validation with visual feedback

### Backend Strategy:
- **DRF Exception Handling**: Custom exception handlers for API errors
- **Validation**: Model and serializer validation with detailed error messages
- **Logging**: Structured logging for debugging
- **Security**: Sanitized error messages for production

## Cross-Cutting Concerns

**Authentication**: JWT/Token-based with Django auth system
**Authorization**: Django permissions with user group system
**CORS**: Configured for cross-origin requests between frontend and backend
**Caching**: DRF caching for frequently accessed data
**Throttling**: API rate limiting to prevent abuse
**Internationalization**: Chinese language support with i18n ready pattern

---

*Architecture analysis: 2026-01-30*
