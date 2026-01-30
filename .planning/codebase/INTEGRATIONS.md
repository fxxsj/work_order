# External Integrations

**Analysis Date:** 2026-01-30

## APIs & External Services

**Internal APIs:**
- REST API - Internal backend services
  - Location: `/api/` endpoints
  - Authentication: Token-based authentication
  - Features: CRUD operations for all business entities

**External Services:**
- **Currently none detected**
  - No external payment gateways (Stripe, PayPal)
  - No external authentication providers (OAuth, SAML)
  - No third-party email services (SendGrid, Mailgun)
  - No external storage (AWS S3, Google Cloud Storage)

## Data Storage

**Databases:**
- **SQLite** - Development database
  - Location: `/backend/db.sqlite3`
  - Usage: Default development database
  - Configuration: Automatically configured
- **PostgreSQL** - Production database (optional)
  - Connection: Environment variables (POSTGRES_*)
  - Client: psycopg2-binary
  - Fallback: Falls back to SQLite if not configured
  - Migration support: Built-in Django migration system

**File Storage:**
- **Local filesystem** - Primary storage
  - Media files: `/backend/media/`
  - Static files: `/backend/static/`
  - Upload handling: Django FileSystemStorage

**Caching:**
- **Redis** - Production caching (optional)
  - Connection: REDIS_URL environment variable
  - Client: django-redis (if installed)
  - Fallback: Local memory cache
  - Usage: Session storage, API response caching

## Authentication & Identity

**Auth Provider:**
- **Django built-in** - Custom authentication system
  - Implementation: Token authentication
  - Password hashing: Django PBKDF2
  - User management: Django User model
  - Groups and permissions: Custom permission system

**API Security:**
- Token authentication via REST Framework
- CSRF protection enabled
- CORS configured for frontend domains
- Rate limiting configured:
  - Anonymous: 100 requests/hour
  - Authenticated: 1000 requests/hour
  - Approval operations: 10 requests/hour
  - Export operations: 20 requests/hour

## Monitoring & Observability

**Error Tracking:**
- **Django built-in** - Custom error handling
  - Logging: Rotating file handlers
  - Error levels: INFO, ERROR, DEBUG
  - File locations: `/backend/logs/django.log`, `/backend/logs/django_error.log`
  - Custom error messages for user-friendly feedback

**Logs:**
- Django logging framework
  - Multiple handlers: console, file, file_error
  - Formatters: simple, verbose, detailed
  - Rotating file handlers (10MB max, 10 backups)
  - Context-aware logging for different modules

**Performance:**
- Optional performance monitoring middleware
- Database query logging (debug mode)
- Request/response timing
- Caching layer for improved performance

## CI/CD & Deployment

**Hosting:**
- **Local development** - Direct server execution
  - Frontend: Vue CLI serve
  - Backend: Django runserver
- **Production** - Web server setup (manual deployment)
  - Recommended: Nginx + Gunicorn
  - Static file collection: Django collectstatic
  - Environment-specific configuration

**CI Pipeline:**
- **Currently none detected**
  - No automated CI/CD pipeline
  - Manual deployment process
  - No automated testing integration

## Environment Configuration

**Required env vars:**
- SECRET_KEY - Django secret key
- DEBUG - Debug mode (True/False)
- ALLOWED_HOSTS - Comma-separated allowed hosts
- POSTGRES_* - PostgreSQL configuration (optional)
- REDIS_URL - Redis connection string (optional)
- CORS_ALLOWED_ORIGINS - Comma-separated CORS origins
- CSRF_TRUSTED_ORIGINS - Comma-separated CSRF origins

**Secrets location:**
- Backend: `.env` file in `/backend/`
- Git ignored: Actual secrets stored outside repository
- Example template: `.env.example` provided

## Webhooks & Callbacks

**Incoming:**
- **None detected**
  - No webhook endpoints configured
  - No external service callbacks

**Outgoing:**
- **None detected**
  - No outgoing webhooks
  - No external service notifications

## File Processing

**Excel Processing:**
- xlsx library - Excel file reading/writing
  - Usage: Data import/export functionality
  - Location: Frontend implementation
  - Features: Workbook and worksheet manipulation

**PDF Processing:**
- **Currently none detected**
  - No PDF generation or processing
  - PDF viewing relies on browser

## Security Integrations

**Security Features:**
- Django security middleware
- XSS protection enabled
- Clickjacking protection
- Content-Type sniffing protection
- HSTS support (production)
- SSL redirect support (production)
- Session security:
  - HttpOnly cookies
  - SameSite=Lax policy
  - Secure cookies (HTTPS)

---

*Integration audit: 2026-01-30*
```