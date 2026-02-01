---
phase: 08-Real-time-Notifications
plan: 02B
type: execute
wave: 2
depends_on: ["08-02A"]
files_modified:
  - backend/workorder/services/realtime_notification.py
  - backend/workorder/services/notification_triggers.py
  - backend/workorder/views/work_order_tasks/__init__.py
autonomous: true

must_haves:
  truths:
    - "Task assignment triggers notification to assigned operator and department members"
    - "Task completion triggers notification to supervisors and work order creator"
    - "Notifications are saved to database with is_read=False"
    - "Signal handlers automatically invoke notification service on task events"
    - "API endpoints trigger notifications after successful actions"
  artifacts:
    - path: "backend/workorder/services/realtime_notification.py"
      provides: "Notification broadcast service"
      contains: "notify_task_assigned", "notify_task_completed", "_send_websocket_notification"
    - path: "backend/workorder/services/notification_triggers.py"
      provides: "Signal handlers for task events"
      contains: "task_assigned_handler", "task_status_change_handler"
    - path: "backend/workorder/views/work_order_tasks/__init__.py"
      provides: "API endpoints that trigger notifications"
      contains: "notify_task_assigned|notify_task_completed"
  key_links:
    - from: "task assigned signal"
      to: "operator's WebSocket channel"
      via: "notification_service._send_websocket_notification"
      pattern: "task_assigned.*channel_layer.*group_send"
    - from: "task completed signal"
      to: "supervisor's WebSocket channel"
      via: "notification_service.notify_task_completed"
      pattern: "task_completed.*notify_task_completed"
---

<objective>
Implement notification broadcasting service and signal handlers for task events.

Purpose: Build the notification service that broadcasts task events (assigned, completed) to relevant users via WebSocket. Create signal handlers that automatically trigger notifications when tasks are assigned or completed, and ensure API endpoints invoke the service.

Output: Working notification service with task_assigned and task_completed broadcasts, automatic signal handlers, and API endpoint integration.
</objective>

<execution_context>
@/home/chenjiaxing/.claude/get-shit-done/workflows/execute-plan.md
@/home/chenjiaxing/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/08-Real-time-Notifications/08-CONTEXT.md
@.planning/phases/08-Real-time-Notifications/08-02A-PLAN.md
@backend/workorder/services/realtime_notification.py
@backend/workorder/services/notification_triggers.py
@backend/workorder/models/core.py
@backend/workorder/views/work_order_tasks/__init__.py
</context>

<tasks>

<task type="auto">
  <name>Update notification service with task event broadcast methods</name>
  <files>backend/workorder/services/realtime_notification.py</files>
  <action>
    Enhance RealtimeNotificationService in backend/workorder/services/realtime_notification.py:

    Add dedicated methods for the two core events per context decisions:

    1. **notify_task_assigned**: Notify operator when task is assigned
    2. **notify_task_completed**: Notify supervisors when task is completed
    3. **_get_department_members**: Helper to get department users
    4. **_send_websocket_notification**: Core broadcast method
    5. **_map_priority**: Map work order priority to notification priority

    Implementation:
    ```python
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    class RealtimeNotificationService:
        # ... existing code ...

        def notify_task_assigned(self, task, assigned_operator, assigned_by=None):
            """通知任务分配 - 发送给操作员和部门成员"""
            recipients = [assigned_operator]

            # 通知分配者所在部门的其他成员（根据上下文：部门成员可见）
            if task.assigned_department:
                dept_members = self._get_department_members(task.assigned_department)
                recipients.extend(dept_members)

            # 去重
            recipients = list(set(recipients))

            self.send_notification(
                event_type=NotificationEvent.TASK_ASSIGNED,
                recipients=recipients,
                data={
                    'title': '新任务分配',
                    'message': f'您有新的任务: {task.work_content}',
                    'task_id': task.id,
                    'workorder_id': task.work_order.id,
                    'workorder_number': task.work_order.order_number,
                    'process_code': task.process_code,
                    'process_name': task.process_code,  # Will be resolved to process name
                    'assigned_by': assigned_by.username if assigned_by else '系统',
                    'quantity': task.quantity,
                    'priority': task.work_order.priority,
                    'deadline': task.deadline.isoformat() if task.deadline else None,
                },
                priority=self._map_priority(task.work_order.priority),
                channels=[NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
            )

            # WebSocket broadcast to connected users
            self._send_websocket_notification(recipients, {
                'type': 'task_assigned',
                'title': '新任务分配',
                'message': f'您有新的任务: {task.work_content}',
                'task_id': task.id,
                'workorder_number': task.work_order.order_number,
                'priority': task.work_order.priority,
            })

        def notify_task_completed(self, task, completed_by):
            """通知任务完成 - 发送给主管和施工单创建者"""
            recipients = []

            # 通知主管
            supervisors = self._get_supervisors()
            recipients.extend(supervisors)

            # 通知施工单创建者
            if task.work_order.created_by:
                recipients.append(task.work_order.created_by)

            recipients = list(set(recipients))

            self.send_notification(
                event_type=NotificationEvent.TASK_COMPLETED,
                recipients=recipients,
                data={
                    'title': '任务完成',
                    'message': f'任务 "{task.work_content}" 已完成',
                    'task_id': task.id,
                    'workorder_id': task.work_order.id,
                    'workorder_number': task.work_order.order_number,
                    'completed_by': completed_by.username if completed_by else '系统',
                    'completed_at': timezone.now().isoformat(),
                    'process_code': task.process_code,
                },
                priority=NotificationPriority.NORMAL,
                channels=[NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
            )

            # WebSocket broadcast
            self._send_websocket_notification(recipients, {
                'type': 'task_completed',
                'title': '任务完成',
                'message': f'任务 "{task.work_content}" 已完成',
                'task_id': task.id,
                'workorder_number': task.work_order.order_number,
                'completed_by': completed_by.username if completed_by else '系统',
            })

        def _get_department_members(self, department):
            """获取部门成员"""
            try:
                from ..models.system import UserProfile
                return User.objects.filter(
                    profile__departments=department,
                    is_active=True
                ).distinct()
            except Exception:
                return []

        def _get_supervisors(self):
            """获取主管用户（具有主管权限的用户）"""
            # 根据实际权限系统实现
            try:
                from ..models.system import UserProfile
                return User.objects.filter(
                    profile__role__in=['supervisor', 'manager'],
                    is_active=True
                ).distinct()
            except Exception:
                return []

        def _send_websocket_notification(self, recipients, notification_data):
            """通过WebSocket发送通知给指定用户"""
            channel_layer = get_channel_layer()

            for user in recipients:
                group_name = f"user_{user.id}_notifications"
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'notification_message',
                        'notification': notification_data
                    }
                )

        def _map_priority(self, workorder_priority):
            """映射施工单优先级到通知优先级"""
            priority_map = {
                'urgent': NotificationPriority.URGENT,
                'high': NotificationPriority.HIGH,
                'normal': NotificationPriority.NORMAL,
                'low': NotificationPriority.LOW,
            }
            return priority_map.get(workorder_priority, NotificationPriority.NORMAL)
    ```

    Note: Update existing notify_task_assignment if it exists to match new signature.
    IMPORTANT: Only implement task_assigned and task_completed - NOT task_claimed
    per phase context decisions.
  </action>
  <verify>grep -E "notify_task_assigned|notify_task_completed|_send_websocket_notification|_get_department_members" backend/workorder/services/realtime_notification.py</verify>
  <done>Service has task_assigned and task_completed notification methods with WebSocket broadcast and department member support</done>
</task>

<task type="auto">
  <name>Create signal handlers for task event notifications</name>
  <files>backend/workorder/services/notification_triggers.py</files>
  <action>
    Create or update signal handlers in backend/workorder/services/notification_triggers.py:

    Implement handlers that trigger notifications on task events:

    1. **task_assigned_handler**: Triggers when task is assigned to operator
    2. **task_status_change_handler**: Triggers when task status changes to completed

    Implementation:
    ```python
    from django.db.models.signals import post_save, pre_save
    from django.dispatch import receiver
    from .models.core import WorkOrderTask
    from .services.realtime_notification import notification_service

    @receiver(post_save, sender=WorkOrderTask)
    def task_assigned_handler(sender, instance, created, **kwargs):
        """任务分配时触发通知"""
        # Check if operator was assigned (not just department)
        if instance.assigned_operator:
            notification_service.notify_task_assigned(
                task=instance,
                assigned_operator=instance.assigned_operator,
                assigned_by=instance.updated_by or instance.created_by
            )

    @receiver(pre_save, sender=WorkOrderTask)
    def task_status_change_handler(sender, instance, **kwargs):
        """任务状态变更时触发通知"""
        if instance.pk:
            try:
                old_instance = WorkOrderTask.objects.get(pk=instance.pk)
                old_status = old_instance.status
                new_status = instance.status

                if old_status != new_status and new_status == 'completed':
                    # 任务完成 - 通知主管和创建者
                    notification_service.notify_task_completed(
                        task=instance,
                        completed_by=instance.assigned_operator or instance.updated_by
                    )
            except WorkOrderTask.DoesNotExist:
                pass
    ```

    IMPORTANT: Only implement task_assigned and task_completed handlers.
    DO NOT implement task_claimed_handler per phase context decisions.

    Ensure imports at top of file include:
    - WorkOrderTask from models.core
    - notification_service from realtime_notification
  </action>
  <verify>grep -E "task_assigned_handler|task_status_change_handler|assigned_operator" backend/workorder/services/notification_triggers.py</verify>
  <done>Signal handlers trigger notifications for task assignment (assigned_operator) and completion (status='completed')</done>
</task>

<task type="auto">
  <name>Integrate notification triggers in API endpoints</name>
  <files>backend/workorder/views/work_order_tasks/__init__.py</files>
  <action>
    Check backend/workorder/views/work_order_tasks/__init__.py for task action endpoints.

    The task assignment and completion actions should trigger notifications:
    ```python
    from ..services.realtime_notification import notification_service

    # In assign action:
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        # ... assignment logic ...
        # After successful assignment:
        notification_service.notify_task_assigned(
            task=task,
            assigned_operator=operator,
            assigned_by=request.user
        )

    # In complete action:
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        # ... completion logic ...
        # After successful completion:
        notification_service.notify_task_completed(
            task=task,
            completed_by=request.user
        )
    ```

    Find the WorkOrderTask viewset and add notification service calls after
    successful operations.

    If endpoints don't exist, note this in summary for future implementation.
    If endpoints exist but don't trigger notifications, add the calls.

    Only add notification calls - don't modify existing endpoint logic.
  </action>
  <verify>grep -r "notify_task_assigned\|notify_task_completed" backend/workorder/views/</verify>
  <done>Task assign and complete endpoints trigger notifications via notification_service (or documented if endpoints don't exist)</done>
</task>

</tasks>

<verification>
After completing all tasks, verify:

1. Check that signal handlers are registered
2. Verify notify_task_assigned method exists and calls _send_websocket_notification
3. Verify notify_task_completed method exists and calls _send_websocket_notification
4. Verify task_assigned_handler uses assigned_operator field
5. Verify task_status_change_handler detects status change to 'completed'
6. Confirm no task_claimed handler exists (per context decisions)
7. Check API endpoints call notification methods

Run with Django Channels test server:
```bash
python manage.py runserver
```
And verify WebSocket handshake succeeds at ws://localhost:8000/ws/notifications/
</verification>

<success_criteria>
1. Task assignment broadcasts to assigned operator and department members
2. Task completion broadcasts to supervisors and work order creator
3. Notifications are saved to database with is_read=False
4. Signal handlers automatically trigger on model changes
5. API endpoints invoke notification service after successful actions
6. Only task_assigned and task_completed events are implemented
</success_criteria>

<output>
After completion, create `.planning/phases/08-Real-time-Notifications/08-02B-SUMMARY.md` with:
- Notification service implementation details
- Signal handler configuration
- WebSocket broadcast mechanism
- API endpoint integration status
- Testing notes for WebSocket notification delivery
- Any issues encountered with existing code structure
</output>
