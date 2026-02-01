---
phase: 08-Real-time-Notifications
plan: 01B
type: execute
wave: 1
depends_on: ["08-01A"]
files_modified:
  - backend/config/asgi.py
  - backend/config/wsgi.py
  - backend/workorder/routing.py
autonomous: true

must_haves:
  truths:
    - "ASGI application routes WebSocket connections to notification consumer"
    - "WebSocket connections are authenticated via AuthMiddlewareStack"
    - "WebSocket URL pattern routes ws/notifications/ to NotificationConsumer"
    - "WSGI application remains functional for HTTP requests"
  artifacts:
    - path: "backend/config/asgi.py"
      provides: "ASGI application entry point for Channels"
      contains: "ProtocolTypeRouter", "get_asgi_application"
    - path: "backend/config/wsgi.py"
      provides: "WSGI application for development server"
      contains: "get_wsgi_application"
    - path: "backend/workorder/routing.py"
      provides: "WebSocket URL routing"
      contains: "websocket_urlpatterns", "ws/notifications/"
  key_links:
    - from: "backend/config/asgi.py"
      to: "workorder.routing.websocket_urlpatterns"
      via: "ProtocolTypeRouter websocket route"
      pattern: "ProtocolTypeRouter.*websocket.*URLRouter"
    - from: "ws://localhost:8000/ws/notifications/"
      to: "NotificationConsumer"
      via: "URLRouter pattern matching"
      pattern: "re_path.*ws/notifications"
---

<objective>
Create ASGI application with WebSocket routing and verify WSGI compatibility.

Purpose: Build the ASGI entry point that Channels uses to handle both HTTP and WebSocket protocols, with authenticated WebSocket connections routed to the notification consumer. Also ensure WSGI application remains for development compatibility.

Output: Working ASGI application with ProtocolTypeRouter, authenticated WebSocket routing, and compatible WSGI application.
</objective>

<execution_context>
@/home/chenjiaxing/.claude/get-shit-done/workflows/execute-plan.md
@/home/chenjiaxing/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/08-Real-time-Notifications/08-CONTEXT.md
@.planning/phases/08-Real-time-Notifications/08-01A-PLAN.md
@backend/config/asgi.py
@backend/config/wsgi.py
@backend/workorder/routing.py
@backend/workorder/services/realtime_notification.py
</context>

<tasks>

<task type="auto">
  <name>Create ASGI application entry point</name>
  <files>backend/config/asgi.py</files>
  <action>
    Create or update backend/config/asgi.py with the following structure:

    1. Import necessary modules (os, django, channels)
    2. Setup Django settings module
    3. Get default ASGI application
    4. Create ProtocolTypeRouter that routes:
       - http -> Django's default ASGI handler
       - websocket -> AllowedHostsOriginValidator -> AuthMiddlewareStack -> URLRouter

    The file should look like:
    ```python
    import os
    from django.core.asgi import get_asgi_application
    from channels.routing import ProtocolTypeRouter, URLRouter
    from channels.auth import AuthMiddlewareStack
    from channels.security.websocket import AllowedHostsOriginValidator
    from workorder.routing import websocket_urlpatterns

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    application = ProtocolTypeRouter({
        "http": get_asgi_application(),
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(websocket_urlpatterns)
            )
        ),
    })
    ```

    Key points:
    - AuthMiddlewareStack provides access to request.user in consumers via scope["user"]
    - AllowedHostsOriginValidator validates WebSocket origin against ALLOWED_HOSTS
    - URLRouter imports from workorder.routing.websocket_urlpatterns
    - HTTP requests continue to work via get_asgi_application()

    If asgi.py already exists, update it to include the WebSocket routing.
  </action>
  <verify>test -f backend/config/asgi.py && grep -q "ProtocolTypeRouter\|AuthMiddlewareStack\|URLRouter" backend/config/asgi.py</verify>
  <done>asgi.py exists with ProtocolTypeRouter routing http and websocket protocols, using AuthMiddlewareStack for authentication</done>
</task>

<task type="auto">
  <name>Configure WebSocket routing</name>
  <files>backend/workorder/routing.py</files>
  <action>
    Create or update backend/workorder/routing.py with WebSocket URL patterns:

    1. Import re_path from django.urls
    2. Import NotificationConsumer from services.realtime_notification
    3. Define websocket_urlpatterns list with notification endpoint

    Implementation:
    ```python
    from django.urls import re_path
    from .services.realtime_notification import NotificationConsumer

    websocket_urlpatterns = [
        re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    ]
    ```

    The NotificationConsumer is already defined in services/realtime_notification.py.
    Just ensure the import path is correct.

    Note: If routing.py has existing imports from views.notification, update them
    to import from services.realtime_notification instead.
  </action>
  <verify>grep -q "from .services.realtime_notification import NotificationConsumer" backend/workorder/routing.py && grep -q "websocket_urlpatterns" backend/workorder/routing.py && grep -q "ws/notifications" backend/workorder/routing.py</verify>
  <done>routing.py has correct import from services.realtime_notification and websocket_urlpatterns with ws/notifications/ route pointing to NotificationConsumer</done>
</task>

<task type="auto">
  <name>Verify WSGI application for compatibility</name>
  <files>backend/config/wsgi.py</files>
  <action>
    Verify backend/config/wsgi.py exists and is valid for development server.

    The WSGI application should continue to work for Django's runserver command
    in development (Channels automatically uses WSGI for HTTP requests).

    If wsgi.py doesn't exist, create it:
    ```python
    import os
    from django.core.wsgi import get_wsgi_application

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    application = get_wsgi_application()
    ```

    This file is standard Django and should already exist. Just verify it exists
    and has correct content. No changes should be needed.
  </action>
  <verify>test -f backend/config/wsgi.py && grep -q "get_wsgi_application" backend/config/wsgi.py</verify>
  <done>wsgi.py exists and is configured correctly for HTTP requests</done>
</task>

</tasks>

<verification>
After completing all tasks, verify the ASGI setup:

1. Verify asgi.py exists with ProtocolTypeRouter
2. Verify routing.py has websocket_urlpatterns
3. Verify wsgi.py exists and is valid
4. Test that Django can import the ASGI application: `python -c "from config.asgi import application; print('OK')"`
5. Verify the WebSocket URL pattern would match ws://localhost:8000/ws/notifications/

The server should be able to start with `daphne config.asgi:application` or
`python manage.py runserver` (which uses Channels dev server when installed).
</verification>

<success_criteria>
1. ASGI application entry point exists at config/asgi.py
2. WebSocket routing is registered and points to NotificationConsumer
3. AuthMiddlewareStack wraps WebSocket connections for authentication
4. WSGI application remains functional for HTTP requests
5. Python can import the ASGI application without errors
</success_criteria>

<output>
After completion, create `.planning/phases/08-Real-time-Notifications/08-01B-SUMMARY.md` with:
- ASGI application structure details
- WebSocket URL pattern confirmed
- Authentication middleware configured
- WSGI compatibility verified
- Any import or configuration issues encountered
</output>
