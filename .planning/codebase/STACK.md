# Technology Stack

**Analysis Date:** 2026-01-30

## Languages

**Primary:**
- JavaScript/ES6+ - Frontend (Vue.js)
- Python 3.12 - Backend (Django)

**Secondary:**
- HTML/CSS - Frontend markup and styling
- SASS - CSS preprocessor
- Vue SFC (Single File Component) - Component structure

## Runtime

**Environment:**
- Node.js 16+ - Frontend runtime
- Python 3.12 - Backend runtime

**Package Manager:**
- npm 8+ - Frontend package management
- pip - Python package management

**Lockfiles:**
- package.json - Frontend dependencies lockfile
- requirements.txt - Python dependencies

## Frameworks

**Core:**
- Vue.js 2.7 - Frontend framework
  - Composition API support
  - Component-based architecture
- Django 4.2 - Backend framework
  - MTV (Model-Template-View) architecture
  - Admin interface
- Django REST Framework 3.14 - REST API framework
  - API development
  - Authentication and permissions

**Testing:**
- Jest 27.5.1 - Frontend unit testing
- @vue/test-utils 1.3.6 - Vue testing utilities
- Django test framework - Backend testing

**Build/Dev:**
- Vue CLI 5.0.8 - Frontend build tool
  - Development server
  - Production build
  - Hot module replacement
- ESLint 7.32.0 - JavaScript linting
  - Airbnb style guide
  - Vue plugin support
- Prettier 2.8.8 - Code formatter
- Babel 10.1.0 - JavaScript transpiler
- Husky 8.0.3 + lint-staged 13.3.0 - Git hooks

## Key Dependencies

**Critical:**
- axios 1.6.2 - HTTP client for API calls
  - Request/response interceptors
  - Timeout handling
  - Error handling
- Element UI 2.15.14 - Vue component library
  - UI components
  - Form controls
  - Table components

**Infrastructure:**
- vue-router 3.6.5 - Client-side routing
- vuex 3.6.2 - State management
  - Centralized store
  - Mutations and actions
- vue-lazyload 1.3.3 - Image lazy loading
- xlsx 0.18.5 - Excel file handling

**Frontend Utilities:**
- dompurify 3.3.1 + @types/dompurify 3.2.0 - DOM sanitization
- vue-virtual-scroller 1.0.0-rc.2 - Virtual scrolling for large lists

**Backend Dependencies:**
- django-cors-headers 4.3.1 - CORS support
- django-filter 23.5 - API filtering
- python-dotenv 1.0.0 - Environment variable management
- psycopg2-binary 2.9.9 - PostgreSQL adapter (optional)

## Configuration

**Environment:**
- Environment variables via .env files
  - SECRET_KEY
  - DEBUG mode
  - ALLOWED_HOSTS
  - Database credentials
  - CORS origins
- Environment-specific settings
  - Development: SQLite, debug mode
  - Production: PostgreSQL, security headers

**Build:**
- Vue CLI configuration (.vue.config.js)
- ESLint configuration in package.json
- Browserlist configuration
- SASS/SCSS support

**Development:**
- Hot reload for frontend
- Django development server
- Frontend linting on save
- Pre-commit hooks

## Platform Requirements

**Development:**
- Node.js 16+
- Python 3.12
- Vue CLI
- Django
- SQLite/PostgreSQL
- Web browser with modern JavaScript support

**Production:**
- Node.js 16+
- Python 3.12
- Django with Gunicorn
- PostgreSQL recommended
- Web server (Nginx for static files)
- SSL/TLS for HTTPS

---

*Stack analysis: 2026-01-30*
```