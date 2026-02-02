# Phase 10: Production Hardening - Research

**Researched:** 2026-02-02
**Domain:** Django REST Framework Production Deployment
**Confidence:** HIGH

## Summary

Phase 10 is the final quality gate focusing on integration testing, API documentation, and production deployment preparation. This research covers testing strategies with pytest-django and factory_boy, API documentation generation using drf-spectacular (OpenAPI 3.0), load testing with Locust, and production deployment with Gunicorn + Nginx. The system uses Django 4.2, DRF 3.14, Vue.js 2.7, and requires comprehensive testing (>80% coverage), complete API documentation, and handling 100 concurrent users with <500ms response times.

**Primary recommendation:** Use pytest-django + factory_boy for testing, drf-spectacular for API docs, Locust for load testing, and Gunicorn + Nginx + systemd for production deployment with Prometheus + Grafana monitoring.

## Standard Stack

### Core Testing
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pytest | Latest | Python testing framework | Industry standard, better than unittest |
| pytest-django | 4.8+ | Django integration for pytest | Official Django pytest plugin |
| factory_boy | Stable | Test data generation | Declarative test fixtures, reduces boilerplate |
| coverage | 7.4+ | Code coverage measurement | Already in requirements.txt |

### API Documentation
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drf-spectacular | 0.27+ | OpenAPI 3.0 schema generation | Recommended by DRF docs, modern, OpenAPI 3.x |
| drf-spectacular[sidecar] | Optional | Standalone UI serving | SwaggerUI + ReDoc without Python backend |

### Load Testing
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Locust | 2.43+ | Python-based load testing | Native Python support, perfect for Django |
| locust | 2.43+ | Distributed load generation | Can scale across multiple machines |

### Production Deployment
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Gunicorn | 23.0+ | WSGI HTTP server | Django-recommended production server |
| Daphne | 4.0+ | ASGI server (WebSocket) | Already in requirements.txt for Channels |
| Nginx | Latest | Reverse proxy & static files | Industry standard reverse proxy |
| systemd | Latest | Process management | Modern Linux init system |

### Monitoring & Backup
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| django-prometheus | Latest | Prometheus metrics export | Standard Django monitoring integration |
| prometheus-client | Latest | Python Prometheus client | Official Prometheus Python library |
| Grafana | Latest | Metrics visualization | Standard Prometheus visualization |
| django-dbbackup | Latest | Database backup automation | Automated PostgreSQL backups |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest-xdist | Latest | Parallel test execution | Speed up test suite |
| pytest-factoryboy | Latest | Factory Boy pytest integration | Seamless factory + pytest integration |
| drf-spectacular[yaml] | Optional | YAML schema export | When YAML format needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| drf-spectacular | drf-yasg | drf-yasg only supports OpenAPI 2.0 (legacy), drf-spectacular is modern with OpenAPI 3.x |
| pytest-django | unittest | Less boilerplate, fixtures, parallel execution with pytest |
| Locust | k6 | k6 is JavaScript-based (harder for Django teams), Locust is native Python |
| Gunicorn | uWSGI | Gunicorn is simpler and more commonly used with Django |
| django-dbbackup | Custom pg_dump scripts | Automated, managed, cloud storage support |

**Installation:**
```bash
# Testing (pytest already in frontend, add for backend)
pip install pytest-django factory_boy pytest-factoryboy coverage pytest-xdist

# API Documentation
pip install drf-spectacular

# Load Testing
pip install locust

# Monitoring
pip install django-prometheus prometheus-client

# Backup Automation
pip install django-dbbackup

# Production (already installed)
pip install gunicorn daphne  # Already in requirements.txt
```

## Architecture Patterns

### Recommended Project Structure

```
backend/
├── workorder/
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── factories/           # Factory Boy factories
│   │   │   ├── __init__.py
│   │   │   ├── workorder.py
│   │   │   ├── task.py
│   │   │   └── user.py
│   │   ├── integration/         # Integration tests
│   │   │   ├── __init__.py
│   │   │   ├── test_task_workflows.py
│   │   │   ├── test_workorder_lifecycle.py
│   │   │   └── test_notification.py
│   │   ├── test_models.py       # Existing unit tests
│   │   ├── test_api.py          # Existing API tests
│   │   └── conftest.py          # pytest configuration
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
├── docs/                        # API documentation
│   └── api/
│       ├── openapi.json
│       ├── openapi.yaml
│       └── swagger-ui.html
├── deployment/
│   ├── gunicorn.conf.py         # Gunicorn configuration
│   ├── nginx.conf               # Nginx configuration
│   ├── systemd/
│   │   ├── gunicorn.service
│   │   └── daphne.service
│   └── scripts/
│       ├── backup.sh
│       └── migrate.sh
└── locust/
    ├── locustfile.py            # Load test scenarios
    └── tasks/
        ├── workorder_tasks.py
        └── task_tasks.py
```

### Pattern 1: Integration Testing with pytest-django + factory_boy

**What:** Test entire workflows from API request to database changes

**When to use:**
- Testing core user workflows (workorder creation, approval, task assignment)
- Testing multi-step operations (task generation, dispatch, completion)
- Testing permission boundaries and access control

**Example:**
```python
# Source: pytest-django docs + DRF testing guide
# File: workorder/tests/integration/test_task_workflows.py

import pytest
from rest_framework.test import APIClient
from workorder.tests.factories import WorkOrderFactory, UserFactory
from django.urls import reverse

@pytest.mark.django_db
class TestWorkOrderTaskWorkflow:
    """Test complete workflow: create workorder -> approve -> tasks generated"""

    def test_workorder_approval_creates_formal_tasks(self):
        """Test that approving a workorder converts draft tasks to formal"""
        # Arrange: Create user and workorder with draft tasks
        client = APIClient()
        user = UserFactory(role='maker')
        client.force_authenticate(user=user)
        workorder = WorkOrderFactory(status='draft')

        # Act: Approve workorder
        url = reverse('workorder-approve', kwargs={'pk': workorder.pk})
        response = client.post(url)

        # Assert: Tasks are now formal
        assert response.status_code == 200
        workorder.refresh_from_db()
        assert workorder.status == 'formal'
        tasks = workorder.tasks.all()
        assert tasks.count() > 0
        assert all(task.status == 'pending' for task in tasks)

    def test_workorder_rejection_deletes_draft_tasks(self):
        """Test that rejecting a workorder deletes all draft tasks"""
        client = APIClient()
        user = UserFactory(role='supervisor')
        client.force_authenticate(user=user)
        workorder = WorkOrderFactory(status='submitted')

        url = reverse('workorder-reject', kwargs={'pk': workorder.pk})
        response = client.post(url)

        assert response.status_code == 200
        workorder.refresh_from_db()
        assert workorder.status == 'rejected'
        assert workorder.tasks.count() == 0
```

### Pattern 2: Factory Boy Test Data Generation

**What:** Declarative test data creation with relationships

**When to use:**
- Creating realistic test data without manual setup
- Tests requiring multiple related objects
- Avoiding test data duplication

**Example:**
```python
# Source: factory_boy documentation
# File: workorder/tests/factories/task.py

import factory
from django.contrib.auth import get_user_model
from workorder.models import WorkOrder, WorkOrderTask, Department, Process

User = get_user_model()

class DepartmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Department

    name = factory.Sequence(lambda n: f"Department {n}")
    code = factory.Sequence(lambda n: f"DEPT{n:03d}")

class ProcessFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Process

    name = factory.Sequence(lambda n: f"Process {n}")
    code = factory.Sequence(lambda n: f"PROC{n:03d}")
    department = factory.SubFactory(DepartmentFactory)

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    department = factory.SubFactory(DepartmentFactory)

class WorkOrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WorkOrder

    order_number = factory.Sequence(lambda n: f"WO{n:06d}")
    status = 'draft'
    customer = factory.SubFactory('workorder.tests.factories.CustomerFactory')

    # With post-generation, create tasks after workorder is saved
    @factory.post_generation
    def tasks(obj, create, extracted, **kwargs):
        if create:
            # Create default tasks if not specified
            if extracted is None:
                extracted = 3
            if isinstance(extracted, int):
                WorkOrderTaskFactory.create_batch(extracted, workorder=obj)
            elif isinstance(extracted, (list, tuple)):
                for task_data in extracted:
                    WorkOrderTaskFactory(workorder=obj, **task_data)

class WorkOrderTaskFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WorkOrderTask

    workorder = factory.SubFactory(WorkOrderFactory)
    process = factory.SubFactory(ProcessFactory)
    status = 'draft'
    assigned_operator = factory.Maybe('assign', factory.SubFactory(UserFactory), None)
    assign = False  # Set True to auto-assign tasks
```

### Pattern 3: API Documentation with drf-spectacular

**What:** Auto-generated OpenAPI 3.0 schema with SwaggerUI + ReDoc

**When to use:**
- All DRF ViewSets and APIViews
- Documenting endpoints, parameters, responses
- Generating client SDKs from schema

**Example:**
```python
# Source: drf-spectacular documentation
# File: workorder/views/core.py

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

@extend_schema(
    tags=['Tasks'],
    summary='List all tasks',
    description='Returns a paginated list of tasks with optional filtering by department, status, and assignee.',
    parameters=[
        OpenApiParameter(
            name='department',
            description='Filter by department ID',
            type=OpenApiTypes.INT,
            required=False,
        ),
        OpenApiParameter(
            name='status',
            description='Filter by task status',
            type=OpenApiTypes.STR,
            enum=['draft', 'pending', 'in_progress', 'completed'],
            required=False,
        ),
    ],
    responses={
        200: OpenApiResponse(
            description='Successful response',
            response=WorkOrderTaskSerializer,
        ),
        401: OpenApiResponse(description='Unauthorized'),
        403: OpenApiResponse(description='Forbidden'),
    }
)
def list(self, request, *args, **kwargs):
    return super().list(request, *args, **kwargs)

@extend_schema(
    tags=['Tasks'],
    summary='Assign task to operator',
    description='Supervisor assigns a task to a specific operator from their department.',
    request=WorkOrderTaskSerializer,
    responses={
        200: OpenApiResponse(description='Task assigned successfully'),
        400: OpenApiResponse(description='Bad request'),
        403: OpenApiResponse(description='Permission denied - not a supervisor'),
        404: OpenApiResponse(description='Task not found'),
    }
)
@action(detail=True, methods=['post'])
def assign(self, request, pk=None):
    """Assign this task to an operator"""
    # ... implementation
```

```python
# File: config/settings/base.py

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'drf_spectacular',  # Add drf-spectacular
    # ...
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # ...
}

# drf-spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': '印刷施工单跟踪系统 API',
    'DESCRIPTION': '施工单任务分派和跟踪管理系统 API 文档',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'WorkOrders', 'description': '施工单管理'},
        {'name': 'Tasks', 'description': '任务管理'},
        {'name': 'Departments', 'description': '部门管理'},
        {'name': 'Processes', 'description': '工序管理'},
        {'name': 'Users', 'description': '用户管理'},
    ],
}
```

```python
# File: config/urls.py

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # API docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # ...
]
```

### Pattern 4: Load Testing with Locust

**What:** Simulate concurrent users and measure performance

**When to use:**
- Testing API performance under load
- Validating system can handle 100 concurrent users
- Finding performance bottlenecks before production

**Example:**
```python
# Source: Locust documentation
# File: locust/locustfile.py

from locust import HttpUser, task, between, events
from locust.runners import MasterRunner

class WorkOrderUser(HttpUser):
    """Simulate a regular user working with work orders and tasks"""

    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks

    def on_start(self):
        """Login before starting tasks"""
        response = self.client.post('/api/auth/login/', json={
            'username': 'test_user',
            'password': 'test_password'
        })
        if response.status_code == 200:
            self.client.headers.update({
                'Authorization': f"Bearer {response.json()['token']}"
            })

    @task(3)
    def view_task_list(self):
        """View task list (common operation - weight 3)"""
        self.client.get('/api/tasks/')

    @task(2)
    def view_workorder_list(self):
        """View workorder list (weight 2)"""
        self.client.get('/api/workorders/')

    @task(1)
    def filter_tasks_by_department(self):
        """Filter tasks by department (weight 1)"""
        departments = [1, 2, 3, 4, 5]  # Department IDs
        for dept_id in departments:
            self.client.get(f'/api/tasks/?department={dept_id}')

    @task(1)
    def view_task_detail(self):
        """View task detail"""
        # First get a task ID from the list
        response = self.client.get('/api/tasks/?page_size=1')
        if response.status_code == 200 and response.json()['results']:
            task_id = response.json()['results'][0]['id']
            self.client.get(f'/api/tasks/{task_id}/')

class SupervisorUser(WorkOrderUser):
    """Simulate a supervisor with additional permissions"""

    @task(2)
    def assign_task(self):
        """Assign a task to an operator"""
        response = self.client.get('/api/tasks/?status=pending&page_size=1')
        if response.status_code == 200 and response.json()['results']:
            task_id = response.json()['results'][0]['id']
            self.client.post(f'/api/tasks/{task_id}/assign/', json={
                'operator_id': 2  # Assign to user ID 2
            })

@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    """Export test statistics to CSV on quit"""
    if isinstance(environment.runner, MasterRunner):
        # Running in distributed mode
        return

    if environment.stats.total.fail_ratio > 0.01:
        # More than 1% failures - this is a problem
        print("\n⚠️  WARNING: Failure rate exceeds 1%!")
        environment.process_exit_code = 1

    if environment.stats.total.avg_response_time > 500:
        # Average response time > 500ms - fails SLA
        print("\n⚠️  WARNING: Average response time exceeds 500ms SLA!")
        environment.process_exit_code = 1
```

### Pattern 5: Production Deployment with Gunicorn + Nginx + systemd

**What:** Production-grade deployment setup

**When to use:**
- All production deployments
- Requires HTTPS, static file serving, process management

**Example:**
```python
# File: deployment/gunicorn.conf.py
# Source: Gunicorn documentation

import multiprocessing

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = (2 * multiprocessing.cpu_count()) + 1  # Formula from Gunicorn docs
worker_class = "sync"  # or "gevent" for async workers
worker_connections = 1000
max_requests = 1000  # Restart workers after 1000 requests (prevent memory leaks)
max_requests_jitter = 100  # Randomize restarts
timeout = 30
keepalive = 2

# Process naming
proc_name = "workorder_backend"

# Logging
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process management
daemon = False  # Let systemd manage daemonization
pidfile = "/var/run/gunicorn/gunicorn.pid"
user = "www-data"
group = "www-data"
umask = "007"

# Server hooks
def post_fork(server, worker):
    server.log.info(f"Worker spawned (pid: {worker.pid})")

def pre_exec(server):
    server.log.info("Forked child, re-executing.")

def when_ready(server):
    server.log.info("Server is ready. Spawning workers")

def worker_int(worker):
    worker.log.info(f"Worker received INT or QUIT signal (pid: {worker.pid})")

def on_exit(server):
    server.log.info("Server is stopping")
```

```nginx
# File: deployment/nginx.conf
# Source: Nginx + Django best practices

upstream django_backend {
    least_conn;
    server 127.0.0.1:8000 max_fails=3 fail_timeout=30s;
    # Add more workers if using multiple Gunicorn instances
    # server 127.0.0.1:8001 max_fails=3 fail_timeout=30s;
}

upstream daphne_websocket {
    server 127.0.0.1:8001;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL configuration (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size
    client_max_body_size 100M;

    # Static files
    location /static/ {
        alias /path/to/static/files/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Media files
    location /media/ {
        alias /path/to/media/files/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket endpoints (Daphne)
    location /ws/ {
        proxy_pass http://daphne_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Frontend (Vue.js SPA)
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

```ini
# File: deployment/systemd/gunicorn.service
# Source: systemd service unit best practices

[Unit]
Description=Workorder Gunicorn Daemon
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
RuntimeDirectory=gunicorn
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn --config deployment/gunicorn.conf.py config.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=30
PrivateTmp=true
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```ini
# File: deployment/systemd/daphne.service
# Source: systemd service unit for ASGI/WebSocket server

[Unit]
Description=Workorder Daphne WebSocket Daemon
After=network.target gunicorn.service

[Service]
Type=notify
User=www-data
Group=www-data
RuntimeDirectory=daphne
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/daphne -b 127.0.0.1 -p 8001 config.asgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=30
PrivateTmp=true
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Pattern 6: Monitoring with Prometheus + Grafana

**What:** Metrics collection and visualization

**When to use:**
- All production deployments
- Performance monitoring and alerting
- Capacity planning

**Example:**
```python
# File: config/settings/production.py

INSTALLED_APPS = [
    # ...
    'django_prometheus',
    # ...
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    # ... other middleware ...
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

# Prometheus metrics endpoint
```

```python
# File: config/urls.py

from django.urls import path

urlpatterns = [
    # Metrics endpoint (protect with authentication in production!)
    path('metrics/', include('django_prometheus.urls')),
    # ...
]
```

```yaml
# File: deployment/prometheus.yml
# Prometheus configuration

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'django'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics/'
```

### Pattern 7: Automated Database Backups

**What:** Daily automated PostgreSQL backups with 30-day retention

**When to use:**
- All production deployments with PostgreSQL
- Compliance and data recovery requirements

**Example:**
```python
# File: config/settings/production.py

INSTALLED_APPS = [
    # ...
    'dbbackup',
    # ...
]

# Backup settings
DBBACKUP_STORAGE = 'django.core.files.storage.FileSystemStorage'
DBBACKUP_PATH = '/var/backups/postgresql'
DBBACKUP_MEDIA_PATH = '/var/backups/media'

# Backup retention (30 days)
DBBACKUP_DAYS_TO_KEEP = 30

# Compression
DBBACKUP_COMPRESSION = 'gz'

# Email notifications on backup failure
EMAIL_HOST = 'smtp.example.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'backups@example.com'
EMAIL_HOST_PASSWORD = 'your_password'
SERVER_EMAIL = 'workorder@example.com'
DBBACKUP_SEND_EMAIL = True
DBBACKUP_FAILURE_RECIPIENTS = ['admin@example.com']
```

```bash
#!/bin/bash
# File: deployment/scripts/backup.sh
# Automated backup script

set -e

# Virtual environment path
VENV="/path/to/venv"
PROJECT_DIR="/path/to/backend"

# Activate virtual environment
source $VENV/bin/activate

# Change to project directory
cd $PROJECT_DIR

# Create database backup
python manage.py dbbackup --compress

# Create media backup
python manage.py mediabackup --compress

# Upload to cloud storage (optional)
# aws s3 sync /var/backups/ s3://workorder-backups/

echo "Backup completed successfully"
```

```cron
# Add to crontab: crontab -e
# File: deployment/crontab/backup
# Run backup daily at 2 AM

0 2 * * * /path/to/backend/deployment/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Anti-Patterns to Avoid

- **Using unittest instead of pytest**: More boilerplate, harder to maintain, no fixtures
- **Testing with hardcoded test data**: Use factories instead for flexibility and maintainability
- **Not testing error paths**: Only testing happy paths leaves production vulnerabilities
- **Running load tests in production**: Can crash your production system, always use staging
- **Not automating backups**: Manual backups are unreliable, automate with cron + django-dbbackup
- **Using SQLite in production**: SQLite doesn't handle concurrent writes well, use PostgreSQL
- **Running Django with DEBUG=True in production**: Exposes sensitive information, use environment variables
- **Not setting up monitoring**: You can't fix what you don't measure, use Prometheus + Grafana

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test data generation | Manual fixture creation | factory_boy | Complex relationships, sequence generation, post-generation hooks |
| API documentation | Manual Markdown docs | drf-spectacular | Auto-generated, always up-to-date, OpenAPI 3.0 compatible, client SDK generation |
| Load testing | Custom concurrency scripts | Locust | Distributed testing, web UI, realistic user simulation, stats export |
| Process management | Custom init scripts | systemd | Automatic restarts, logging, dependency management, standard Linux tool |
| Database backups | Custom pg_dump scripts | django-dbbackup | Automated, managed, cloud storage support, email notifications |
| Monitoring | Custom metrics endpoints | django-prometheus | Standard Prometheus format, Grafana integration, ecosystem support |
| Reverse proxy configuration | Manual trial-and-error | Nginx best practices | SSL/TLS, static files, WebSocket support, rate limiting, caching |

**Key insight:** Production deployment has many edge cases (memory leaks, process crashes, database corruption, SSL certificates, etc.) that existing tools have already solved. Custom solutions will miss these edge cases and fail in production.

## Common Pitfalls

### Pitfall 1: Testing Without Database Isolation

**What goes wrong:** Tests share database state, causing flaky tests that pass/fail randomly depending on execution order

**Why it happens:** Django's default test behavior doesn't isolate transactions between tests

**How to avoid:**
```python
# Use pytest-django's db fixture properly
@pytest.mark.django_db
def test_something():
    # This test gets a clean database
    pass

# For transaction-specific tests
@pytest.mark.django_db(transaction=True)
def test_transaction_behavior():
    # Use when you need to test transaction commit/rollback
    pass
```

**Warning signs:** Tests pass when run individually but fail when run together

### Pitfall 2: Insufficient Test Data Variety

**What goes wrong:** Tests only work with ideal data, failing with edge cases (empty lists, null values, large datasets)

**Why it happens:** Using only one set of test fixtures without variation

**How to avoid:**
```python
# Test with various data scenarios
@pytest.mark.parametrize('status,expected_count', [
    ('draft', 0),
    ('pending', 5),
    ('in_progress', 3),
    ('completed', 10),
])
def test_task_counts_by_status(status, expected_count):
    """Test task filtering works for all status values"""
    # Create varied test data
    # ...
```

### Pitfall 3: Load Testing Against Production

**What goes wrong:** Accidentally DoS-ing your production system, crashing it for real users

**Why it happens:** Forgetting to change the URL in locustfile from production to staging

**How to avoid:**
```python
# Use environment variables
import os

class WorkOrderUser(HttpUser):
    def on_start(self):
        self.host = os.environ.get('LOCUST_TARGET_HOST', 'http://localhost:8000')
        if 'prod' in self.host.lower():
            raise ValueError("⛔️  CANNOT LOAD TEST PRODUCTION! Use staging environment.")
```

**Warning signs:** Seeing production server alerts during load test runs

### Pitfall 4: Missing Production Configuration Checks

**What goes wrong:** Deploying with DEBUG=True, wrong ALLOWED_HOSTS, or missing security settings

**Why it happens:** Copying development settings to production without validation

**How to avoid:**
```bash
# Run Django's deployment checker before starting
python manage.py check --deploy

# This will warn about:
# - DEBUG=True
# - Missing ALLOWED_HOSTS
# - Insecure SECRET_KEY
# - Missing HTTPS settings
# - etc.
```

**Warning signs:** Seeing Django debug pages in production with stack traces

### Pitfall 5: Not Testing Backup Restoration

**What goes wrong:** Backups run successfully but can't be restored when needed

**Why it happens:** Only testing backup creation, never testing restoration

**How to avoid:**
```bash
# Monthly restoration drill (documented in runbook)
# 1. Take backup
python manage.py dbbackup

# 2. Restore to test database
python manage.py dbrestore --database=test_backup --backup-file=/var/backups/latest.json

# 3. Verify data integrity
python manage.py check --database=test_backup
python manage.py test --database=test_backup
```

**Warning signs:** Never having practiced a database restoration

### Pitfall 6: Gunicorn Worker Memory Leaks

**What goes wrong:** Gunicorn workers grow in memory until OOM killer kills them

**Why it happens:** Long-running workers accumulate memory (ORM query cache, global variables, etc.)

**How to avoid:**
```python
# In gunicorn.conf.py
max_requests = 1000  # Restart worker after 1000 requests
max_requests_jitter = 100  # Randomize to prevent all restarting at once
```

**Warning signs:** Seeing "Out of memory" errors in logs after several days of uptime

### Pitfall 7: Not Monitoring WebSocket Connections

**What goes wrong:** WebSocket connections pile up, exhausting server resources

**Why it happens:** Not monitoring Daphne connection counts, not cleaning up dead connections

**How to avoid:**
```python
# Add Prometheus metrics for Daphne
# Monitor: daphne_active_connections, daphne_messages_sent, daphne_messages_received

# Set connection limits in Channels configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
            'capacity': 1500,  # Max messages in channel
            'expiry': 10,  # Message TTL in seconds
        },
    },
}
```

**Warning signs:** Seeing "Too many open files" errors or slow WebSocket performance

## Code Examples

Verified patterns from official sources:

### Integration Test Example

```python
# Source: DRF testing documentation + pytest-django
# File: workorder/tests/integration/test_task_dispatch.py

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from workorder.tests.factories import (
    WorkOrderFactory, UserFactory, DepartmentFactory, ProcessFactory
)

@pytest.mark.django_db
class TestTaskDispatchWorkflow:
    """Test the complete task dispatch workflow"""

    def test_auto_dispatch_on_approval(self):
        """
        GIVEN: A workorder with draft tasks and dispatch rules configured
        WHEN: Supervisor approves the workorder
        THEN: Tasks are automatically dispatched to highest-priority department
        """
        # Arrange: Create department, process, workorder
        dept = DepartmentFactory(name='Printing')
        process = ProcessFactory(name='Offset Printing', department=dept)

        client = APIClient()
        supervisor = UserFactory(role='supervisor', department=dept)
        client.force_authenticate(user=supervisor)

        workorder = WorkOrderFactory(status='submitted')

        # Act: Approve workorder
        response = client.post(f'/api/workorders/{workorder.id}/approve/')

        # Assert: Tasks dispatched to department
        assert response.status_code == status.HTTP_200_OK
        workorder.refresh_from_db()
        assert workorder.status == 'formal'

        tasks = workorder.tasks.filter(process=process)
        assert tasks.count() > 0
        assert all(task.department == dept for task in tasks)

    def test_manual_task_assignment(self):
        """
        GIVEN: A pending task and an operator
        WHEN: Supervisor assigns the task
        THEN: Task is assigned and operator is notified
        """
        dept = DepartmentFactory()
        supervisor = UserFactory(role='supervisor', department=dept)
        operator = UserFactory(role='operator', department=dept)
        task = WorkOrderTaskFactory(status='pending', department=dept)

        client = APIClient()
        client.force_authenticate(user=supervisor)

        response = client.post(f'/api/tasks/{task.id}/assign/', json={
            'operator_id': operator.id
        })

        assert response.status_code == status.HTTP_200_OK
        task.refresh_from_db()
        assert task.assigned_operator == operator
        assert task.status == 'assigned'

    def test_concurrent_task_claiming(self):
        """
        GIVEN: An unassigned task
        WHEN: Two operators try to claim it simultaneously
        THEN: Only one succeeds, the other gets an error
        """
        dept = DepartmentFactory()
        operator1 = UserFactory(role='operator', department=dept)
        operator2 = UserFactory(role='operator', department=dept)
        task = WorkOrderTaskFactory(status='pending', department=dept)

        # Simulate concurrent requests using threading
        import threading

        results = {'success': 0, 'failed': 0}

        def claim_task(user):
            client = APIClient()
            client.force_authenticate(user=user)
            try:
                response = client.post(f'/api/tasks/{task.id}/claim/')
                if response.status_code == status.HTTP_200_OK:
                    results['success'] += 1
                else:
                    results['failed'] += 1
            except Exception:
                results['failed'] += 1

        # Start threads
        thread1 = threading.Thread(target=claim_task, args=(operator1,))
        thread2 = threading.Thread(target=claim_task, args=(operator2,))
        thread1.start()
        thread2.start()
        thread1.join()
        thread2.join()

        # Assert: Only one claim succeeded
        assert results['success'] == 1
        assert results['failed'] == 1

        task.refresh_from_db()
        assert task.assigned_operator in [operator1, operator2]
```

### API Documentation Example

```python
# Source: drf-spectacular official documentation
# File: workorder/views/core.py

from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiExample,
    OpenApiResponse,
    OpenApiParameter,
    inline_serializer,
)
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers

@extend_schema_view(
    list=extend_schema(
        tags=['Tasks'],
        summary='List tasks',
        description='Retrieve paginated list of tasks with filtering and search',
        parameters=[
            OpenApiParameter(
                name='department',
                type=OpenApiTypes.INT,
                description='Filter by department ID',
                location=OpenApiParameter.QUERY,
                required=False,
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                description='Filter by task status',
                location=OpenApiParameter.QUERY,
                enum=['draft', 'pending', 'in_progress', 'completed'],
                required=False,
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                description='Search by task number or content',
                location=OpenApiParameter.QUERY,
                required=False,
            ),
        ],
        responses={
            200: WorkOrderTaskSerializer,
            401: OpenApiResponse(description='Authentication required'),
        },
        examples=[
            OpenApiExample(
                'Pending tasks in Printing Department',
                value={'department': 1, 'status': 'pending'},
                description_only=True,
            ),
        ],
    ),
    retrieve=extend_schema(
        tags=['Tasks'],
        summary='Get task details',
        description='Retrieve full details of a specific task',
        responses={
            200: WorkOrderTaskSerializer,
            404: OpenApiResponse(description='Task not found'),
        },
    ),
)
class WorkOrderTaskViewSet(viewsets.ModelViewSet):
    """API endpoint for managing work order tasks"""

    queryset = WorkOrderTask.objects.select_related(
        'workorder', 'process', 'department', 'assigned_operator'
    ).all()
    serializer_class = WorkOrderTaskSerializer
    filterset_class = TaskFilter

    @extend_schema(
        tags=['Tasks'],
        summary='Assign task to operator',
        description='Supervisor assigns a task to a specific operator from their department',
        request=inline_serializer(
            name='TaskAssignRequest',
            fields={
                'operator_id': serializers.IntegerField(),
                'notes': serializers.CharField(required=False, allow_blank=True),
            }
        ),
        responses={
            200: OpenApiResponse(description='Task assigned successfully'),
            400: OpenApiResponse(description='Invalid request data'),
            403: OpenApiResponse(description='Permission denied - not a supervisor'),
            404: OpenApiResponse(description='Task or operator not found'),
        },
        examples=[
            OpenApiExample(
                'Assign task',
                value={'operator_id': 123, 'notes': 'Urgent job'},
            ),
        ],
    )
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign this task to an operator"""
        task = self.get_object()
        operator_id = request.data.get('operator_id')

        # ... implementation
        return Response({'status': 'assigned'})
```

### Locust Load Test Example

```python
# Source: Locust official documentation
# File: locust/locustfile.py

from locust import HttpUser, task, between, events
from locust.runners import MasterRunner
import random

class WorkOrderUser(HttpUser):
    """Simulate regular user interactions with the work order system"""

    wait_time = between(1, 5)  # Realistic user wait time

    def on_start(self):
        """Login when user starts"""
        response = self.client.post('/api/auth/login/', json={
            'username': f'user{random.randint(1, 100)}',
            'password': 'testpass123'
        })
        if response.status_code == 200:
            token = response.json().get('token')
            if token:
                self.client.headers.update({
                    'Authorization': f'Bearer {token}'
                })

    @task(5)
    def view_task_list(self):
        """Most common operation: view task list"""
        filters = {}
        if random.random() < 0.3:  # 30% of users apply filters
            filters['status'] = random.choice(['pending', 'in_progress', 'completed'])
            if random.random() < 0.5:
                filters['department'] = random.randint(1, 10)

        self.client.get('/api/tasks/', params=filters)

    @task(3)
    def view_workorder_list(self):
        """View work order list"""
        self.client.get('/api/workorders/', params={
            'page': random.randint(1, 5),
            'page_size': 20
        })

    @task(1)
    def view_dashboard(self):
        """View dashboard with statistics"""
        self.client.get('/api/dashboard/statistics/')

class SupervisorUser(WorkOrderUser):
    """Simulate supervisor with additional permissions"""

    @task(3)
    def view_department_tasks(self):
        """View all department tasks"""
        self.client.get('/api/tasks/', params={
            'department': random.randint(1, 10),
            'status': 'pending'
        })

    @task(2)
    def assign_task(self):
        """Assign pending task to operator"""
        # Get a pending task
        response = self.client.get('/api/tasks/', params={
            'status': 'pending',
            'page_size': 1
        })

        if response.status_code == 200:
            tasks = response.json().get('results', [])
            if tasks:
                task_id = tasks[0]['id']
                # Assign to random operator
                self.client.post(f'/api/tasks/{task_id}/assign/', json={
                    'operator_id': random.randint(1, 50)
                })

@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    """
    Validate SLA compliance on quit.
    Exit with error code if SLAs are not met.
    """
    if isinstance(environment.runner, MasterRunner):
        return

    stats = environment.stats

    # SLA 1: Response time < 500ms
    avg_response_time = stats.total.avg_response_time
    if avg_response_time > 500:
        environment.process_exit_code = 1
        print(f"\n❌ SLA FAILED: Average response time {avg_response_time:.0f}ms exceeds 500ms limit")

    # SLA 2: Error rate < 0.1%
    if stats.total.fail_ratio > 0.001:
        environment.process_exit_code = 1
        print(f"\n❌ SLA FAILED: Error rate {stats.total.fail_ratio*100:.2f}% exceeds 0.1% limit")

    # SLA 3: 95th percentile < 1000ms
    p95 = stats.total.get_response_time_percentile(0.95)
    if p95 > 1000:
        environment.process_exit_code = 1
        print(f"\n❌ SLA FAILED: 95th percentile {p95:.0f}ms exceeds 1000ms limit")
```

### Production Settings Example

```python
# Source: Django deployment checklist + Gunicorn best practices
# File: config/settings/production.py

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Allowed hosts
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS proxy settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Database (PostgreSQL in production)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        'OPTIONS': {
            'connect_timeout': 10,
            'sslmode': 'require',  # Force SSL
        },
        'CONN_MAX_AGE': 600,  # Connection pooling
    }
}

# Cache (Redis)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'workorder',
        'TIMEOUT': 300,
    }
}

# Channels (Redis for WebSocket)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.environ.get('REDIS_URL')],
            "symmetric_encryption_keys": [SECRET_KEY],
        },
    }
}

# Static files (WhiteNoise for serving)
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/django/workorder.log',
            'maxBytes': 1024*1024*50,  # 50 MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'workorder': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Email (for error notifications)
EMAIL_HOST = os.environ.get('EMAIL_HOST')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = True
ADMINS = [('Admin', os.environ.get('ADMIN_EMAIL'))]
MANAGERS = ADMINS

# Performance monitoring
ENABLE_PERFORMANCE_MONITORING = True
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| unittest classes | pytest functions with fixtures | 2019+ | Less boilerplate, better readability |
| Manual test data | factory_boy factories | 2018+ | Flexible, maintainable test data |
| drf-yasg (OpenAPI 2.0) | drf-spectacular (OpenAPI 3.0) | 2020+ | Modern spec, client SDK generation |
| Apache + mod_wsgi | Gunicorn + Nginx | 2015+ | Better performance, simpler setup |
| Manual backups | django-dbbackup automation | 2017+ | Reliable, automated backups |
| No monitoring | Prometheus + Grafana | 2018+ | Observability, alerting |
| SQLite in production | PostgreSQL | Always | Better concurrency, reliability |
| sync Gunicorn workers | gevent/gthread workers | As needed | Higher concurrency for I/O bound |

**Deprecated/outdated:**
- **unittest.TestCase**: Still works but verbose, pytest is preferred
- **OpenAPI 2.0 (Swagger)**: Legacy spec, use OpenAPI 3.0 with drf-spectacular
- **SQLite in production**: Doesn't handle concurrent writes, use PostgreSQL
- **Running manage.py runserver in production**: Not secure/performant, use Gunicorn
- **Manual database dumps**: Prone to errors, use django-dbbackup
- **Testing without fixtures**: Brittle tests, use factory_boy

## Open Questions

Things that couldn't be fully resolved:

1. **Vue.js E2E Testing Framework Choice**
   - What we know: Frontend uses Vue 2.7 with Jest for unit tests
   - What's unclear: Whether to use Cypress or Playwright for E2E testing
   - Recommendation: Use **Cypress** for Vue 2.7 (better Vue integration, simpler setup)
   - Research needed: E2E test coverage scope (critical workflows only vs. comprehensive)

2. **WebSocket Load Testing Strategy**
   - What we know: Daphne serves WebSocket connections for real-time notifications
   - What's unclear: How to load test WebSocket connections with Locust
   - Recommendation: Use Locust's built-in SocketIO support or custom WebSocket user class
   - Research needed: Maximum concurrent WebSocket connections Daphne can handle

3. **Prometheus Metrics Granularity**
   - What we know: django-prometheus provides basic Django/Rails metrics
   - What's unclear: What custom business metrics to track (task completion rate, dispatch time, etc.)
   - Recommendation: Start with django-prometheus defaults, add custom metrics for business KPIs
   - Research needed: Define business-critical metrics and alert thresholds

4. **CI/CD Pipeline Integration**
   - What we know: Tests should run automatically on every commit
   - What's unclear: Which CI/CD platform (GitHub Actions, GitLab CI, Jenkins)
   - Recommendation: Use **GitHub Actions** (already using GitHub, free for public repos)
   - Research needed: Pipeline structure (test → build → deploy stages)

## Sources

### Primary (HIGH confidence)
- [Django REST Framework Testing - Official Docs](https://www.django-rest-framework.org/api-guide/testing/) - DRF testing helpers (APIClient, APIRequestFactory)
- [pytest-django Documentation](https://pytest-django.readthedocs.io/en/latest/) - pytest plugin for Django, fixtures, database access
- [drf-spectacular Documentation](https://drf-spectacular.readthedocs.io/en/latest/) - OpenAPI 3.0 schema generation for DRF
- [Locust Documentation](https://docs.locust.io/en/stable/) - Python-based load testing framework
- [Gunicorn Settings Documentation](https://docs.gunicorn.org/en/stable/settings.html) - Gunicorn configuration reference
- [Django Deployment Documentation](https://docs.djangoproject.com/en/4.2/howto/deployment/) - Official Django deployment guide (WSGI/ASGI, checklist)

### Secondary (MEDIUM confidence)
- [How to Write Integration Tests for Django REST Framework APIs](https://python.plainenglish.io/how-to-write-integration-tests-for-django-rest-framework-apis-b3627f35a75d) (Oct 2024) - Integration testing patterns for DRF
- [Django Testing Complete Guide: Unit Tests vs Integration Tests](https://medium.com/@sizanmahmud08/django-testing-complete-guide-unit-tests-vs-integration-tests-vs-functional-tests-which-should-865664227836) (Jan 2026) - Comprehensive Django testing guide
- [How to Test Your Django App With Pytest](https://djangostars.com/blog/django-pytest-testing/) (Sep 2025) - Modern pytest approaches for Django
- [Django integration testing - Honeybadger](https://www.honeybadger.io/blog/django-integration-testing/) (Nov 2025) - Latest Django integration testing practices
- [pytest-factoryboy GitHub Repository](https://github.com/pytest-dev/pytest-factoryboy) - Official pytest-factoryboy integration
- [Factory Boy Documentation](https://factoryboy.readthedocs.io/) - Test data factory library
- [PostgreSQL Backup Strategies for Enterprise-Grade Environments - Percona](https://www.percona.com/blog/postgresql-backup-strategies-enterprise-grade-environment/) - Enterprise backup best practices

### Tertiary (LOW confidence)
- [Django testing like a pro: pytest-django, Factory Boy, and Mocking Made Simple](https://medium.com/devmap/django-testing-like-a-pro-pytest-django-factory-boy-and-mocking-made-simple-d1e157e5ab21) - Testing pyramid and pytest integration (unverified)
- [Automating your Daily Database Backups using Django and Celery](https://blog.stackademic.com/never-lose-data-again-automating-your-daily-database-backups-using-django-and-celery-e8dc3f29abb1) - Celery-based backup automation (unverified)
- [How to backup and restore large Django data on PostgreSQL](https://tushortz.medium.com/how-to-backup-and-restore-large-django-data-on-postgresql-faster-and-more-efficiently-baead078969) - Large dataset backup strategies (unverified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools verified through official documentation
- Architecture: HIGH - Patterns sourced from official docs and established best practices
- Pitfalls: MEDIUM - Common deployment issues documented, but some edge cases project-specific

**Research date:** 2026-02-02

**Valid until:** 2026-03-02 (30 days - stable domain but verify specific tool versions before implementing)
