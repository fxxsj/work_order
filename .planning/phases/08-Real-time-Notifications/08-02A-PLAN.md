---
phase: 08-Real-time-Notifications
plan: 02A
type: execute
wave: 2
depends_on: ["08-01B"]
files_modified:
  - backend/workorder/models/system.py
  - backend/workorder/services/realtime_notification.py
autonomous: true

must_haves:
  truths:
    - "Notifications persist to database when created"
    - "WebSocket connections require authenticated users"
    - "Connected users join their personal notification channel"
    - "Disconnections properly clean up channel membership"
    - "Heartbeat messages keep connections alive"
  artifacts:
    - path: "backend/workorder/models/system.py"
      provides: "Notification model for persistence"
      contains: "class Notification", "is_sent", "data"
    - path: "backend/workorder/services/realtime_notification.py"
      provides: "WebSocket consumer"
      contains: "class NotificationConsumer", "async def connect", "async def disconnect"
  key_links:
    - from: "NotificationConsumer.connect"
      to: "channel_layer.group_add"
      via: "WebSocket connection handshake"
      pattern: "group_add.*user_.*_notifications"
    - from: "WebSocket client"
      to: "user's notification group"
      via: "authenticated WebSocket connection"
      pattern: "ws://.*/ws/notifications/"
---

<objective>
Implement Notification model fields and WebSocket consumer with authentication.

Purpose: Create the data model for storing notifications and build the WebSocket consumer that handles authenticated connections, channel management, and heartbeat messages. This provides the foundation for real-time notification delivery.

Output: Updated Notification model with WebSocket delivery tracking and working NotificationConsumer with authentication and connection management.
</objective>

<execution_context>
@/home/chenjiaxing/.claude/get-shit-done/workflows/execute-plan.md
@/home/chenjiaxing/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/08-Real-time-Notifications/08-CONTEXT.md
@.planning/phases/08-Real-time-Notifications/08-01B-PLAN.md
@backend/workorder/models/system.py
@backend/workorder/services/realtime_notification.py
@backend/workorder/models/core.py
</context>

<tasks>

<task type="auto">
  <name>Update Notification model with WebSocket delivery fields</name>
  <files>backend/workorder/models/system.py</files>
  <action>
    Review and update the Notification model in backend/workorder/models/system.py:

    The Notification model already exists with basic fields.
    Add/verify these fields if missing:

    1. `is_sent = models.BooleanField('已发送', default=False)` - tracks if notification was delivered via WebSocket
    2. `data = models.JSONField('扩展数据', null=True, blank=True)` - stores additional notification data for frontend

    These fields are needed for:
    - Tracking WebSocket delivery status (is_sent)
    - Storing structured data for frontend consumption (data)

    Also verify indexes include:
    - (recipient, is_read, -created_at) for querying user's unread notifications
    - (notification_type, -created_at) for filtering by type
    - Add index on created_at for 30-day retention queries

    DO NOT create migrations in this task - just update the model definition.
  </action>
  <verify>grep -E "is_sent|data.*JSONField" backend/workorder/models/system.py</verify>
  <done>Notification model has is_sent field and data JSONField for structured notification payload</done>
</task>

<task type="auto">
  <name>Implement NotificationConsumer with authentication and heartbeat</name>
  <files>backend/workorder/services/realtime_notification.py</files>
  <action>
    Update or create the NotificationConsumer class in backend/workorder/services/realtime_notification.py:

    Create an AsyncWebsocketConsumer with:

    1. **Authentication check**: Reject unauthenticated users (close code 4001)
    2. **User-specific channel naming**: Use `user_{user_id}_notifications`
    3. **Heartbeat mechanism**: Handle periodic ping messages
    4. **Disconnect handler**: Clean up channel membership
    5. **Connection confirmation**: Send success message after connection

    Consumer structure:
    ```python
    import json
    from django.utils import timezone
    from channels.generic.websocket import AsyncWebsocketConsumer
    import logging

    logger = logging.getLogger(__name__)

    class NotificationConsumer(AsyncWebsocketConsumer):
        """WebSocket通知消费者 - 处理实时通知推送"""

        async def connect(self):
            """建立WebSocket连接"""
            user = self.scope.get("user")

            # 拒绝未认证用户
            if user is None or not user.is_authenticated:
                await self.close(code=4001)
                return

            self.user_id = user.id
            self.group_name = f"user_{self.user_id}_notifications"

            # 加入用户通知组
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )

            await self.accept()

            # 发送连接成功确认
            await self.send(json.dumps({
                'type': 'connection_established',
                'user_id': self.user_id,
                'timestamp': timezone.now().isoformat()
            }))

            logger.info(f"WebSocket连接建立: user_id={self.user_id}")

        async def disconnect(self, close_code):
            """断开WebSocket连接"""
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
                logger.info(f"WebSocket连接断开: user_id={self.user_id}, code={close_code}")

        async def notification_message(self, event):
            """处理通知消息 - 从channel layer接收并转发给客户端"""
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'data': event.get('notification', {})
            }))

        async def heartbeat_message(self, event):
            """处理心跳消息"""
            await self.send(text_data=json.dumps({
                'type': 'heartbeat',
                'timestamp': timezone.now().isoformat()
            }))
    ```

    Key points:
    - Authentication check with explicit rejection (code 4001)
    - User-specific group names for multi-user support
    - Proper cleanup on disconnect
    - Logging for monitoring
    - Message handlers for notification and heartbeat events
  </action>
  <verify>grep -E "async def connect|is_authenticated|async def disconnect|heartbeat" backend/workorder/services/realtime_notification.py</verify>
  <done>NotificationConsumer has authentication check, proper connection handling with user-specific channels, heartbeat support, and logging</done>
</task>

</tasks>

<verification>
After completing all tasks, verify:

1. Check that Notification model has is_sent and data fields
2. Verify NotificationConsumer rejects unauthenticated connections
3. Verify channel naming pattern is user_{user_id}_notifications
4. Verify disconnect handler calls group_discard
5. Confirm notification_message handler exists for forwarding notifications

Test WebSocket handshake will be verified in later plans when full service is implemented.
</verification>

<success_criteria>
1. Notification model has is_sent and data fields
2. NotificationConsumer extends AsyncWebsocketConsumer
3. Unauthenticated connections are rejected with code 4001
4. Authenticated users join their personal notification channel
5. Disconnect properly cleans up channel membership
6. Heartbeat message handler exists
</success_criteria>

<output>
After completion, create `.planning/phases/08-Real-time-Notifications/08-02A-SUMMARY.md` with:
- Notification model fields added
- WebSocket consumer authentication mechanism
- Channel naming convention used
- Any issues with existing code structure
</output>
