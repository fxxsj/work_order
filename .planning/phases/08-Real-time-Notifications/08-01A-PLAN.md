---
phase: 08-Real-time-Notifications
plan: 01A
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/requirements.txt
  - backend/config/settings.py
autonomous: true

must_haves:
  truths:
    - "Installing dependencies succeeds without version conflicts"
    - "Channels is registered in Django INSTALLED_APPS"
    - "ASGI_APPLICATION setting points to the ASGI entry point"
    - "Channel layer uses Redis when REDIS_URL is set, otherwise in-memory backend"
  artifacts:
    - path: "backend/requirements.txt"
      provides: "Channels dependencies"
      contains: "channels>=4.0.0", "daphne>=4.0.0", "redis>=5.0.0"
    - path: "backend/config/settings.py"
      provides: "Channels configuration and channel layer settings"
      contains: "INSTALLED_APPS.*channels", "ASGI_APPLICATION", "CHANNEL_LAYERS"
  key_links:
    - from: "backend/config/settings.py"
      to: "channels_redis.core.RedisChannelLayer or channels.layers.InMemoryChannelLayer"
      via: "CHANNEL_LAYERS configuration"
      pattern: "CHANNEL_LAYERS.*BACKEND"
---

<objective>
Install Django Channels packages and configure Django settings for WebSocket support.

Purpose: Set up the foundational dependencies and Django configuration required for WebSocket functionality. This includes installing Channels, Daphne ASGI server, and Redis client, then configuring them in Django settings.

Output: Updated requirements.txt with Channels dependencies and settings.py with proper Channels configuration.
</objective>

<execution_context>
@/home/chenjiaxing/.claude/get-shit-done/workflows/execute-plan.md
@/home/chenjiaxing/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/08-Real-time-Notifications/08-CONTEXT.md
@backend/requirements.txt
@backend/config/settings.py
</context>

<tasks>

<task type="auto">
  <name>Install and configure Django Channels dependencies</name>
  <files>backend/requirements.txt</files>
  <action>
    Update backend/requirements.txt to include:
    1. channels>=4.0.0 (core Channels library)
    2. daphne>=4.0.0 (ASGI server)
    3. redis>=5.0.0 (Redis client for channel layer)

    Check existing entries first - channels and daphne may already be present.
    Verify versions meet minimum requirements (4.0.0+).
    Add redis package for production channel layer support.

    IMPORTANT: Do NOT install packages via Bash. Only update the requirements.txt file.
  </action>
  <verify>grep -E "channels>=|daphne>=|redis>=" backend/requirements.txt</verify>
  <done>requirements.txt contains channels>=4.0.0, daphne>=4.0.0, redis>=5.0.0</done>
</task>

<task type="auto">
  <name>Configure Channels in Django settings</name>
  <files>backend/config/settings.py</files>
  <action>
    Add to backend/config/settings.py:

    1. Add 'channels' to INSTALLED_APPS (after 'corsheaders', before 'workorder')
    2. Add ASGI_APPLICATION setting pointing to 'config.asgi.application'
    3. Add CHANNEL_LAYERS configuration with environment-based backend:
       - Production: Redis backend (when REDIS_URL is set)
       - Development: In-memory backend

    Configuration pattern:
    ```python
    # Channels settings
    ASGI_APPLICATION = 'config.asgi.application'

    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                "hosts": [REDIS_URL] if REDIS_URL else [("127.0.0.1", 6379)],
                "symmetric_encryption_keys": [SECRET_KEY],
            },
        },
    }
    ```

    For development without Redis, fall back to:
    ```python
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
    ```

    Use environment detection: if REDIS_URL exists in environment, use Redis backend,
    otherwise use InMemoryChannelLayer for development.
  </action>
  <verify>grep -E "INSTALLED_APPS.*channels|ASGI_APPLICATION|CHANNEL_LAYERS" backend/config/settings.py</verify>
  <done>settings.py includes channels in INSTALLED_APPS, has ASGI_APPLICATION configured, and has CHANNEL_LAYERS with Redis fallback to InMemoryChannelLayer</done>
</task>

</tasks>

<verification>
After completing all tasks, verify:

1. Run `python manage.py check` to ensure no configuration errors
2. Verify INSTALLED_APPS contains 'channels'
3. Verify ASGI_APPLICATION is set to 'config.asgi.application'
4. Verify CHANNEL_LAYERS configuration exists
5. Check that the configuration would use Redis when REDIS_URL is set
</verification>

<success_criteria>
1. Django Channels dependencies are specified in requirements.txt
2. Channels is registered in INSTALLED_APPS
3. ASGI_APPLICATION points to the ASGI entry point
4. CHANNEL_LAYERS is configured with conditional backend (Redis or in-memory)
5. Django management commands run without errors
</success_criteria>

<output>
After completion, create `.planning/phases/08-Real-time-Notifications/08-01A-SUMMARY.md` with:
- Channels version installed
- Channel layer backend choice (Redis vs in-memory)
- Environment variables needed (REDIS_URL)
- Any configuration issues encountered
</output>
