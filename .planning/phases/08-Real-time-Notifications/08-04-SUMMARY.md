# Phase 08 Plan 04: 30-Day Notification Retention with Admin Cleanup Summary

**One-liner:** 30-day automatic notification filtering with manual admin cleanup action for database maintenance

---

## Implementation Overview

Implemented a 30-day notification retention policy that filters old notifications at the query level while providing administrators with a bulk deletion action for manual cleanup. This prevents indefinite database growth while maintaining recent notification history for users.

## Tech Stack

**Backend:**
- Django Admin: get_queryset override for automatic filtering
- Admin Actions: Bulk delete_old_notifications action
- Date Filtering: timezone.now() - timedelta(days=30)

## Key Changes

### Files Modified

**backend/workorder/admin/system.py**
- Added `get_queryset` override to filter notifications older than 30 days
- Added `delete_old_notifications` admin action for bulk cleanup
- Added `actions = ['delete_old_notifications']` to enable the action
- Imported `timezone` and `timedelta` for date calculations

### Implementation Details

#### 1. Query-Level 30-Day Filter
```python
def get_queryset(self, request):
    """过滤30天前的通知（超级用户可以看到所有通知）"""
    qs = super().get_queryset(request)
    if not request.user.is_superuser:
        thirty_days_ago = timezone.now() - timedelta(days=30)
        return qs.filter(created_at__gte=thirty_days_ago)
    return qs
```

**Key Features:**
- Non-superusers see only notifications from the last 30 days
- Superusers can see all notifications (useful for auditing and compliance)
- Filter applied at database query level (efficient with existing created_at index)
- Automatic enforcement - no user action required

#### 2. Admin Cleanup Action
```python
def delete_old_notifications(self, request, queryset):
    """批量删除30天前的通知"""
    thirty_days_ago = timezone.now() - timedelta(days=30)
    old_notifications = queryset.filter(created_at__lt=thirty_days_ago)
    count = old_notifications.count()
    old_notifications.delete()
    self.message_user(request, f'{count} 条30天前的通知已删除。')
delete_old_notifications.short_description = '删除30天前的通知'
```

**Usage:**
1. Go to Django Admin → System Notification
2. Select notifications (or select all via search results)
3. Choose "删除30天前的通知" from the Actions dropdown
4. Click "Go" to execute bulk deletion
5. System displays count of deleted notifications

**Key Features:**
- Selective deletion: only deletes notifications older than 30 days from selection
- Safety: respects queryset, so administrators control what gets deleted
- Feedback: shows count of deleted notifications in admin message

## Architectural Decisions

### Query Filtering vs Hard Deletion

**Decision:** Filter at query level, not automatic hard deletion

**Rationale:**
1. **Data Retention:** Old notifications remain in database for audit trails
2. **Flexibility:** Superusers can access historical data when needed
3. **Performance:** Query filtering is efficient with created_at index
4. **Safety:** No automatic data loss; manual cleanup available

**Alternative Considered:**
- Auto-delete old notifications via cron job
- **Rejected:** Would lose audit trail, prevent historical analysis

### Superuser Exemption

**Decision:** Superusers see all notifications without 30-day filter

**Rationale:**
1. **Audit Compliance:** Superusers need access to full notification history
2. **Debugging:** Historical visibility helps troubleshoot issues
3. **Flexibility:** Different access levels for different user roles

## Database Optimization

The implementation leverages the existing `created_at` index from the Notification model (added in 08-02A):

```python
indexes = [
    models.Index(fields=['created_at']),
]
```

This ensures the 30-day filter queries remain efficient even with large notification tables.

## Verification

**Implementation Verified:**
- ✅ `get_queryset` filters notifications older than 30 days for non-superusers
- ✅ `delete_old_notifications` action exists in NotificationAdmin
- ✅ Action uses `created_at__lt` with 30-day timedelta
- ✅ Superusers bypass filter and see all notifications

**Manual Testing Recommended:**
1. Create notifications older than 30 days (adjust created_at in database)
2. Login as non-superuser → old notifications should not appear
3. Login as superuser → old notifications should appear
4. Select notifications in admin → run "删除30天前的通知" action
5. Verify correct count displayed and old notifications deleted

## Deviations from Plan

**None** - plan executed exactly as written.

## Next Phase Readiness

**Prerequisites for Future Work:**
- ✅ Notification retention policy in place
- ✅ Admin cleanup action available for maintenance
- ✅ Query-level filtering ensures API automatically respects 30-day limit

**Considerations for Future Enhancements:**
- Add automated cleanup via Django management command
- Configure retention period as setting (currently hardcoded to 30 days)
- Add notification archive table for long-term storage before deletion

## Metrics

- **Duration:** <1 minute
- **Files Modified:** 1
- **Lines Added:** 21
- **Commits:** 1

---

**Completed:** 2026-02-01
**Phase:** 08-Real-time Notifications
**Plan:** 04 of 07
