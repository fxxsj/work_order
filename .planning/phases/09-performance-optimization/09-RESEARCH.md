# Phase 09: Performance Optimization - Research

**Researched:** 2026-02-01
**Domain:** Django ORM optimization, Redis caching, database indexing, Vue.js rendering
**Confidence:** HIGH

## Summary

Phase 09 focuses on optimizing database queries, implementing Redis caching, and improving frontend rendering performance for production scale (10,000+ tasks). The codebase already has solid optimization foundations including:

1. **Existing ORM optimizations**: Select_related/prefetch_related in task queries (core.py line 35-54)
2. **Basic caching infrastructure**: `cache_service.py` with decorators and CacheManager
3. **Query optimizer service**: `query_optimizer.py` with QueryOptimizer, QueryCache, and performance monitoring
4. **Database indexes**: Composite indexes already exist on WorkOrder, WorkOrderProcess, and WorkOrderTask models
5. **Redis configuration**: Settings.py includes Redis cache backend configuration (lines 354-401)

However, performance gaps remain for production scale:
- Task list queries may exceed 500ms with 10,000+ tasks
- Statistics endpoints lack caching
- Some N+1 queries remain in dashboard and statistics views
- Missing indexes for multi-column filter combinations
- Frontend rendering optimization needed for 100+ item lists

**Primary recommendation**: Build upon existing optimization services (cache_service.py, query_optimizer.py) to add Redis caching for statistics, create missing composite indexes, optimize remaining N+1 queries, and implement frontend virtual scrolling.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django ORM | 4.2.11 | Database queries with select_related/prefetch_related | Built-in query optimization, industry standard for 10M+ websites |
| django-redis | (latest) | Redis cache backend for Django | Official Redis integration, maintains Django cache API compatibility |
| Redis | 5.0+ | In-memory caching for statistics and dashboard data | Fastest read performance, supports complex data structures, pub/sub |
| django-debug-toolbar | (latest) | Development query profiling | Standard Django profiling tool, shows query counts and execution time |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| django-extensions | (latest) | Shell_plus for interactive query optimization | Development debugging, query experimentation |
| psutil | (latest) | Memory profiling for optimization validation | Measuring memory impact of optimizations |
| pytest-django | (latest) | Performance regression testing | Ensuring optimizations don't break functionality |

### Frontend
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vue-virtual-scroller | (latest) | Virtual scrolling for large lists | Rendering 100+ items without frame drops |
| Intersection Observer API | (native) | Lazy loading images and components | Reducing initial render time |
| requestIdleCallback | (native) | Non-critical updates during browser idle | Maintaining 60 FPS during interactions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Redis | Memcached | Memcached simpler but lacks data structures, persistence, and pub/sub needed for real-time features |
| django-redis | django-cacheops | Cacheops auto-caches queries but requires PostgreSQL, more complex setup for partial caching |
| vue-virtual-scroller | Infinite scroll (custom) | Custom implementation reinvents wheel, harder to maintain, edge cases like variable item heights |

**Installation:**
```bash
# Backend (add to requirements.txt)
django-redis==5.4.0
django-debug-toolbar==4.2.0
psutil==5.9.8

# Frontend (add to package.json)
npm install vue-virtual-scroller
```

## Architecture Patterns

### Recommended Project Structure
```
backend/workorder/
├── models/
│   ├── core.py                    # Add composite indexes here
│   └── __init__.py
├── services/
│   ├── cache_service.py           # ✅ EXISTS - extend for statistics caching
│   ├── query_optimizer.py         # ✅ EXISTS - extend for dashboard optimization
│   └── task_statistics_cache.py   # NEW - dedicated cache for task stats
├── views/
│   └── work_order_tasks/
│       ├── task_main.py           # ✅ EXISTS - already optimized
│       └── task_stats.py          # ⚠️ NEEDS OPTIMIZATION - N+1 queries in collaboration_stats
└── performance/
    ├── __init__.py
    ├── cache_invalidation.py      # NEW - signal handlers for cache invalidation
    └── query_profiling.py         # NEW - context manager for profiling

frontend/src/
├── views/task/
│   ├── TaskList.vue               # ⚠️ NEEDS OPTIMIZATION - add virtual scrolling
│   └── components/
│       └── VirtualTaskList.vue    # NEW - virtual scroll wrapper
└── mixins/
    └── performanceMixin.js        # NEW - debouncing, lazy loading
```

### Pattern 1: Composite Database Indexes for Multi-Column Filters

**What:** Create indexes spanning multiple columns that are frequently filtered together

**When to use:**
- Queries always filter on columns A and B together
- Column A has low cardinality (few unique values)
- Column B has high cardinality (many unique values)
- Rule: Most selective column first in composite index

**Example:**
```python
# Source: /home/chenjiaxing/文档/work_order/backend/workorder/models/core.py:1265-1274
class WorkOrderTask(models.Model):
    class Meta:
        indexes = [
            # ✅ EXISTS: Good composite index
            models.Index(fields=['assigned_department', 'status']),

            # ⚠️ MISSING: Needed for task list filters
            models.Index(fields=['assigned_department', 'status', 'task_type']),
            models.Index(fields=['assigned_operator', 'status']),
            models.Index(fields=['work_order_process', 'status', 'task_type']),

            # ⚠️ MISSING: Needed for dashboard statistics queries
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['assigned_department', 'created_at']),
        ]
```

**Verification:**
```python
# Check query plan
from django.db import connection
from workorder.models import WorkOrderTask

queryset = WorkOrderTask.objects.filter(
    assigned_department_id=5,
    status='pending',
    task_type='cutting'
)

sql, params = queryset.query.sql_with_params()
print(sql)  # Should show index usage

# Use EXPLAIN (PostgreSQL) or EXPLAIN QUERY PLAN (SQLite)
from django.db import connection
cursor = connection.cursor()
cursor.execute('EXPLAIN ' + sql)
print(cursor.fetchall())
```

### Pattern 2: Redis Caching for Expensive Aggregations

**What:** Cache aggregate query results (statistics, counts) in Redis with TTL

**When to use:**
- Read-heavy, write-light scenarios
- Expensive aggregate queries (COUNT, SUM, AVG with GROUP BY)
- Data that changes infrequently
- Acceptable staleness (1-5 minutes)

**Example:**
```python
# Source: Extended from /home/chenjiaxing/文档/work_order/backend/workorder/services/cache_service.py
from django.core.cache import cache
from django.conf import settings

def get_task_statistics(department_id: int) -> dict:
    """
    Get cached task statistics for a department

    Cache key: task_stats:{department_id}
    TTL: 5 minutes (acceptable for dashboard data)
    """
    cache_key = f'task_stats:{department_id}'

    # Try cache first
    stats = cache.get(cache_key)
    if stats is not None:
        return stats

    # Cache miss - compute statistics
    from workorder.models import WorkOrderTask
    from django.db.models import Count, Q

    stats = WorkOrderTask.objects.filter(
        assigned_department_id=department_id
    ).aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='pending')),
        in_progress=Count('id', filter=Q(status='in_progress')),
        completed=Count('id', filter=Q(status='completed')),
    )

    # Cache with 5-minute TTL
    cache.set(cache_key, stats, timeout=settings.CACHE_TIMEOUTS['MEDIUM'])

    return stats


def invalidate_task_statistics(department_id: int = None):
    """
    Invalidate task statistics cache

    Call this when tasks are created/updated/deleted
    """
    if department_id:
        cache.delete(f'task_stats:{department_id}')
    else:
        # Invalidate all department stats (pattern deletion)
        invalidate_cache_pattern('task_stats:*')
```

**Cache Invalidation via Signals:**
```python
# backend/workorder/performance/cache_invalidation.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from workorder.models import WorkOrderTask

@receiver(post_save, sender=WorkOrderTask)
@receiver(post_delete, sender=WorkOrderTask)
def invalidate_task_stats_cache(sender, instance, **kwargs):
    """Invalidate task statistics cache when tasks change"""
    from workorder.services.cache_service import invalidate_cache_pattern

    # Invalidate department stats
    if instance.assigned_department_id:
        cache.delete(f'task_stats:{instance.assigned_department_id}')

    # Invalidate dashboard stats
    cache.delete_pattern('dashboard:*')
```

### Pattern 3: ORM Query Optimization with select_related and prefetch_related

**What:** Use Django's `select_related()` for ForeignKey relationships (SQL JOIN) and `prefetch_related()` for M2M/reverse FK (separate queries + Python join)

**When to use:**
- **select_related**: When you'll access related ForeignKey/OneToOne fields (1 query vs N+1)
- **prefetch_related**: When you'll access related ManyToManyField or reverse ForeignKey (2 queries vs N+1)
- Chain both when accessing nested relationships

**Example:**
```python
# Source: /home/chenjiaxing/文档/work_order/backend/workorder/models/core.py:35-54
# ✅ CORRECT: Already optimized in task_main.py

# ⚠️ NEEDS IMPROVEMENT: In task_stats.py collaboration_stats
# Current code (lines 179-246) has N+1 queries in operator loop:

# BAD (N+1 queries):
for operator in operators:
    tasks = WorkOrderTask.objects.filter(assigned_operator=operator)  # Query per operator
    total_tasks = tasks.count()  # Another query per operator
    completed_tasks = tasks.filter(status='completed').count()  # Yet another query

# GOOD (1 query using aggregation):
operators_data = User.objects.filter(
    assigned_tasks__isnull=False,
    is_active=True
).annotate(
    total_tasks=Count('assigned_tasks'),
    completed_tasks=Count('assigned_tasks', filter=Q(assigned_tasks__status='completed')),
    pending_tasks=Count('assigned_tasks', filter=Q(assigned_tasks__status='pending')),
).prefetch_related(
    Prefetch('assigned_tasks', queryset=WorkOrderTask.objects.select_related(
        'work_order_process', 'assigned_department'
    ))
)
```

**Verification:**
```python
from django.test import TestCase
from django.db import connection
from django.test.utils import override_settings

class TestQueryOptimization(TestCase):
    def test_no_n_plus_one(self):
        """Ensure no N+1 queries in statistics"""
        with self.assertNumQueries(2):  # Should be exactly 2 queries
            stats = get_collaboration_stats(department_id=1)

        # Alternative: count queries
        from django.db import reset_queries
        from django.conf import settings

        if settings.DEBUG:
            reset_queries()
            stats = get_collaboration_stats(department_id=1)
            query_count = len(connection.queries)
            self.assertLess(query_count, 5, f"Too many queries: {query_count}")
```

### Pattern 4: Frontend Virtual Scrolling for Large Lists

**What:** Render only visible items in viewport, not entire list

**When to use:**
- Lists with 100+ items
- Variable height items
- Maintaining 60 FPS during scroll
- Avoiding DOM thrashing

**Example:**
```vue
<!-- frontend/src/views/task/components/VirtualTaskList.vue -->
<template>
  <RecycleScroller
    class="scroller"
    :items="tasks"
    :item-size="80"
    key-field="id"
    v-slot="{ item }"
  >
    <TaskCard
      :task="item"
      @click="$emit('task-click', item)"
    />
  </RecycleScroller>
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default {
  components: { RecycleScroller },
  props: {
    tasks: Array
  }
}
</script>
```

**Installation:**
```bash
npm install vue-virtual-scroller
```

**Usage in TaskList.vue:**
```vue
<template>
  <VirtualTaskList
    v-if="shouldUseVirtualScroll"
    :tasks="tableData"
    @task-click="handleTaskClick"
  />
  <el-table
    v-else
    :data="tableData"
  >
    <!-- existing columns -->
  </el-table>
</template>

<script>
export default {
  computed: {
    shouldUseVirtualScroll() {
      // Use virtual scroll for 100+ items
      return this.tableData.length >= 100
    }
  }
}
</script>
```

### Anti-Patterns to Avoid

- **N+1 Query Pattern**: Accessing related objects in a loop without select_related/prefetch_related
  ```python
  # BAD: N+1 queries
  for task in tasks:
      print(task.assigned_operator.username)  # Query per task

  # GOOD: Single query
  tasks = tasks.select_related('assigned_operator')
  for task in tasks:
      print(task.assigned_operator.username)  # No query
  ```

- **Over-caching**: Caching frequently-changing data leads to cache stampede
  - **Don't cache**: Individual task details, real-time status
  - **Do cache**: Aggregations (statistics, counts), reference data (departments, processes)

- **Index everything**: Indexes slow down writes
  - Index only what's queried in WHERE clauses or JOINs
  - Use EXPLAIN to verify index usage
  - Remove unused indexes

- **Premature optimization**: Optimize after profiling, not before
  - Use django-debug-toolbar to find slow queries
  - Measure before and after optimization
  - Focus on user-facing endpoints first

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cache key generation | Manual string concatenation with hashlib | `cache_service.py` `@cache_result` decorator | Handles key collisions, expiration, error handling |
| Query result caching | Manual cache.get/set in each view | Django's cache framework with `@cache_page` | Built-in invalidation, per-site cache configuration |
| Virtual scrolling | Custom scroll event handlers with DOM manipulation | `vue-virtual-scroller` | Handles variable heights, dynamic items, accessibility |
| Database connection pooling | Custom connection management | Django's default connection pooling (CONN_MAX_AGE) | Thread-safe, handles connection drops, tested at scale |
| Query profiling | Custom timer decorators | `django-debug-toolbar` or `django-silk` | Visual EXPLAIN output, request tracing, duplicate query detection |

**Key insight:** Custom cache implementations inevitably fail on edge cases (cache stampede, thundering herd, race conditions). Django's cache framework handles these correctly. Custom virtual scrolling is notoriously buggy with dynamic content, keyboard navigation, and accessibility.

## Common Pitfalls

### Pitfall 1: Assuming Indexes Improve All Queries

**What goes wrong:**
- Adding indexes doesn't help if query doesn't use indexed columns
- Composite indexes only work for leftmost prefix queries
- Index on (A, B, C) doesn't help queries filtering on B alone or C alone

**Why it happens:**
- Misunderstanding of B-tree index structure
- Not using EXPLAIN to verify index usage

**How to avoid:**
```python
# Always verify index usage with EXPLAIN
from django.db import connection

queryset = WorkOrderTask.objects.filter(assigned_department_id=5, status='pending')
sql, params = queryset.query.sql_with_params()

cursor = connection.cursor()
cursor.execute(f"EXPLAIN {sql}", params)
plan = cursor.fetchall()
print(plan)  # Should show "Index Scan" not "Seq Scan"

# For PostgreSQL, use EXPLAIN ANALYZE to get actual execution time
cursor.execute(f"EXPLAIN ANALYZE {sql}", params)
```

**Warning signs:**
- Query plans show "Seq Scan" (sequential scan) on large tables
- High query times in Django logs despite indexes
- Database shows high disk I/O during queries

### Pitfall 2: Cache Inflation - Caching Too Much

**What goes wrong:**
- Redis memory usage grows unbounded
- Cache contains stale data
- Cache hit rate decreases (too much data in cache)

**Why it happens:**
- Setting TTL too long (or none)
- Caching individual objects instead of aggregates
- Not invalidating cache on updates

**How to avoid:**
```python
# Set appropriate TTL based on data change frequency
cache.set(key, value, timeout=60)      # 1 min - fast-changing data
cache.set(key, value, timeout=300)     # 5 min - moderate (stats)
cache.set(key, value, timeout=3600)    # 1 hour - slow-changing (reference data)

# Monitor cache hit rate
from django.core.cache import cache
from django_redis import get_redis_connection

redis_client = get_redis_connection("default")
info = redis_client.info('stats')
hit_rate = info['keyspace_hits'] / (info['keyspace_hits'] + info['keyspace_misses'])
print(f"Cache hit rate: {hit_rate:.2%}")

# Target: >70% hit rate, <30% miss rate
```

**Warning signs:**
- Redis memory usage growing constantly
- Cache hit rate < 50%
- Users seeing stale data frequently

### Pitfall 3: Optimizing Queries That Aren't Bottlenecks

**What goes wrong:**
- Time spent optimizing rarely-used queries
- Complexity added for minimal performance gain
- Missing the actual bottleneck (e.g., frontend rendering)

**Why it happens:**
- Not profiling before optimizing
- Focusing on backend when frontend is slow
- Optimizing based on assumptions not measurements

**How to avoid:**
```python
# Use django-debug-toolbar to identify slow queries
# Install: pip install django-debug-toolbar

# Add to INSTALLED_APPS and middleware in settings.py
INSTALLED_APPS = ['debug_toolbar', ...]
MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware', ...]

# Check page load:
# - Number of queries (target: <50 per page)
# - Time per query (target: <50ms each)
# - Duplicate queries (target: 0 duplicates)

# Profile specific view:
from django.test import TestCase
from django.db import connection
from django.test.utils import override_settings

class PerformanceTestCase(TestCase):
    @override_settings(DEBUG=True)
    def test_dashboard_performance(self):
        from workorder.views.work_order_tasks import department_workload

        reset_queries()
        response = self.client.get('/api/workorder-tasks/department_workload/?department_id=1')

        query_count = len(connection.queries)
        print(f"Queries: {query_count}")
        for i, query in enumerate(connection.queries, 1):
            print(f"{i}. {query['time']}s - {query['sql'][:100]}...")

        # Assert performance targets
        self.assertLess(query_count, 20, "Too many queries")
        total_time = sum(float(q['time']) for q in connection.queries)
        self.assertLess(total_time, 0.5, f"Query time {total_time}s exceeds 500ms target")
```

**Warning signs:**
- Optimizing queries that take <10ms
- Adding indexes that aren't used
- Frontend rendering takes 5x longer than backend query

### Pitfall 4: Forgetting to Invalidate Cache

**What goes wrong:**
- Users see stale data after updates
- Inconsistency between database and cached values
- Cache invalidation bugs are hard to reproduce

**Why it happens:**
- Manual cache invalidation in views is error-prone
- Forgetting to invalidate on bulk operations
- Not invalidating related object caches

**How to avoid:**
```python
# Use Django signals for automatic invalidation
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=WorkOrderTask)
@receiver(post_delete, sender=WorkOrderTask)
def invalidate_task_cache(sender, instance, **kwargs):
    """Automatically invalidate cache when task changes"""
    from django.core.cache import cache

    # Invalidate department statistics
    if instance.assigned_department_id:
        cache.delete(f'task_stats:{instance.assigned_department_id}')

    # Invalidate operator statistics
    if instance.assigned_operator_id:
        cache.delete(f'operator_stats:{instance.assigned_operator_id}')

    # Invalidate dashboard cache
    cache.delete_pattern('dashboard:*')

# For bulk operations, manually invalidate
def bulk_update_tasks(task_ids, updates):
    WorkOrderTask.objects.filter(id__in=task_ids).update(**updates)

    # Invalidate all affected departments
    dept_ids = WorkOrderTask.objects.filter(
        id__in=task_ids
    ).values_list('assigned_department_id', flat=True).distinct()

    for dept_id in dept_ids:
        cache.delete(f'task_stats:{dept_id}')
```

**Warning signs:**
- User reports data not updating after edits
- Dashboard showing wrong counts
- Hard-refresh (Ctrl+F5) shows different data

## Code Examples

### Verifying Query Performance with django-debug-toolbar

```python
# Source: https://docs.djangoproject.com/en/4.2/topics/db/optimization/

# Install
pip install django-debug-toolbar

# settings.py
INSTALLED_APPS = [
    # ...
    'debug_toolbar',
]

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    # ...
]

INTERNAL_IPS = [
    '127.0.0.1',
]

# Check query count and time in browser panel
# Target: <50 queries, <500ms total time
```

### Creating Composite Indexes via Migration

```python
# Generated migration: workorder/migrations/099_add_composite_indexes.py

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('workorder', '098_add_performance_indexes'),
    ]

    operations = [
        # Composite index for task list filters
        migrations.AddIndex(
            model_name='workordertask',
            index=models.Index(
                fields=['assigned_department', 'status', 'task_type'],
                name='task_dept_status_type_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='workordertask',
            index=models.Index(
                fields=['assigned_operator', 'status'],
                name='task_operator_status_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='workordertask',
            index=models.Index(
                fields=['status', 'created_at'],
                name='task_status_created_idx'
            ),
        ),
        # Dashboard statistics indexes
        migrations.AddIndex(
            model_name='workorderprocess',
            index=models.Index(
                fields=['work_order', 'status', 'sequence'],
                name='process_wo_status_seq_idx'
            ),
        ),
    ]
```

### Caching Statistics Endpoints

```python
# backend/workorder/views/work_order_tasks/task_stats.py (modified)

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.cache import cache
from django.conf import settings
from django.db.models import Count, Q, Sum, Avg
import logging

logger = logging.getLogger(__name__)

class TaskStatsMixin:
    """Statistics mixin with Redis caching"""

    def _get_department_stats_cache_key(self, department_id: int) -> str:
        return f'dept_stats:{department_id}'

    @action(detail=False, methods=['get'])
    def department_workload(self, request):
        """Department workload statistics (cached)"""
        from workorder.models.base import Department

        department_id = request.query_params.get('department_id')

        # Get department (with permission check)
        if not department_id:
            # ... existing validation ...

        try:
            department_id = int(department_id)
            department = Department.objects.get(id=department_id)
        except (ValueError, Department.DoesNotExist):
            # ... existing error handling ...

        # Check cache first
        cache_key = self._get_department_stats_cache_key(department_id)
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            logger.info(f"Cache hit for department {department_id} stats")
            return Response(cached_data)

        # Cache miss - compute statistics
        # Use single optimized query instead of multiple queries
        tasks = WorkOrderTask.objects.filter(
            assigned_department_id=department_id
        ).select_related(
            'assigned_operator', 'assigned_department'
        )

        # Single aggregation query
        stats = tasks.aggregate(
            total_tasks=Count('id'),
            pending_tasks=Count('id', filter=Q(status='pending')),
            in_progress_tasks=Count('id', filter=Q(status='in_progress')),
            completed_tasks=Count('id', filter=Q(status='completed')),
            cancelled_tasks=Count('id', filter=Q(status='cancelled')),
        )

        # Operator statistics with annotation (not N+1)
        operators_data = User.objects.filter(
            assigned_tasks__assigned_department_id=department_id,
            is_active=True
        ).exclude(
            is_superuser=True
        ).annotate(
            operator_id=F('id'),
            operator_name=F('username'),
            pending_count=Count('assigned_tasks', filter=Q(assigned_tasks__status='pending')),
            in_progress_count=Count('assigned_tasks', filter=Q(assigned_tasks__status='in_progress')),
            completed_count=Count('assigned_tasks', filter=Q(assigned_tasks__status='completed')),
            cancelled_count=Count('assigned_tasks', filter=Q(assigned_tasks__status='cancelled')),
            total_count=Count('assigned_tasks')
        ).values(
            'operator_id', 'operator_name',
            'pending_count', 'in_progress_count', 'completed_count',
            'cancelled_count', 'total_count'
        )

        operators_list = list(operators_data)
        for op_data in operators_list:
            total = op_data['total_count']
            completed = op_data['completed_count']
            op_data['completion_rate'] = round((completed / total * 100) if total > 0 else 0, 2)

        operators_list.sort(key=lambda x: x['total_count'], reverse=True)

        # Priority distribution
        priority_distribution = {
            'urgent': tasks.filter(priority='urgent').count(),
            'high': tasks.filter(priority='high').count(),
            'normal': tasks.filter(priority='normal').count(),
            'low': tasks.filter(priority='low').count()
        }

        response_data = {
            'department_id': department.id,
            'department_name': department.name,
            'summary': {
                'total_tasks': stats['total_tasks'],
                'pending_tasks': stats['pending_tasks'],
                'in_progress_tasks': stats['in_progress_tasks'],
                'completed_tasks': stats['completed_tasks'],
                'cancelled_tasks': stats['cancelled_tasks'],
                'completion_rate': round(
                    (stats['completed_tasks'] / stats['total_tasks'] * 100)
                    if stats['total_tasks'] > 0 else 0, 2
                )
            },
            'operators': operators_list,
            'priority_distribution': priority_distribution
        }

        # Cache for 5 minutes
        cache.set(cache_key, response_data, timeout=settings.CACHE_TIMEOUTS['MEDIUM'])
        logger.info(f"Computed and cached department {department_id} stats")

        return Response(response_data)
```

### Frontend Virtual Scrolling Implementation

```vue
<!-- frontend/src/views/task/components/VirtualTaskList.vue -->
<template>
  <div class="virtual-task-list">
    <RecycleScroller
      class="scroller"
      :items="tasks"
      :item-size="80"
      key-field="id"
      v-slot="{ item }"
      :buffer="300"
    >
      <div
        class="task-item"
        :class="`task-status-${item.status}`"
        @click="$emit('task-click', item)"
      >
        <div class="task-header">
          <span class="task-id">#{{ item.id }}</span>
          <el-tag :type="getStatusType(item.status)" size="mini">
            {{ getStatusLabel(item.status) }}
          </el-tag>
        </div>
        <div class="task-content">{{ item.work_content }}</div>
        <div class="task-meta">
          <span>{{ item.assigned_department_name }}</span>
          <span>{{ item.assigned_operator_name || '未分配' }}</span>
        </div>
      </div>
    </RecycleScroller>
  </div>
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default {
  name: 'VirtualTaskList',
  components: { RecycleScroller },
  props: {
    tasks: {
      type: Array,
      required: true
    }
  },
  methods: {
    getStatusType(status) {
      const map = {
        pending: 'info',
        in_progress: 'warning',
        completed: 'success',
        cancelled: 'danger'
      }
      return map[status] || 'info'
    },
    getStatusLabel(status) {
      const map = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return map[status] || status
    }
  }
}
</script>

<style scoped>
.scroller {
  height: calc(100vh - 300px);
}

.task-item {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-item:hover {
  background-color: #f5f7fa;
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-id {
  font-weight: bold;
  color: #606266;
}

.task-content {
  margin-bottom: 8px;
  color: #303133;
}

.task-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}
</style>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual cache invalidation | Signal-based automatic invalidation | Django 1.3+ | Eliminates stale data bugs, reduces code complexity |
| Sequential query execution | Bulk operations with bulk_create/bulk_update | Django 2.2+ | 10-100x faster for bulk operations |
| Simple indexes only | Composite indexes for multi-column filters | PostgreSQL 8+, SQLite 3.8+ | Dramatically improves filter query performance |
| No query profiling | django-debug-toolbar, django-silk | Django 1.10+ | Makes performance issues visible during development |
| Full list rendering | Virtual scrolling | Frontend 2020+ | Maintains 60 FPS with 10,000+ items |

**Deprecated/outdated:**
- **Manual N+1 query optimization**: Modern Django (4.2+) has better prefetch_related with Prefetch objects
- **QuerySet.count() in loops**: Use QuerySet.aggregate() with Count() for better performance
- **File-based caching**: Redis is now standard for production (faster, supports clustering)
- **Manual frontend virtualization**: Use vue-virtual-scroller or react-window (battle-tested)

## Open Questions

1. **Redis vs Memcached for this specific workload**
   - **What we know**: Redis supports data structures (hashes, lists) and pub/sub; Memcached is simpler but limited
   - **What's unclear**: Whether Redis pub/sub will be used for real-time notifications (Phase 08 already uses channels)
   - **Recommendation**: Use Redis (already configured in settings.py) - needed for WebSocket channel layer anyway

2. **Optimal composite index configuration for 10,000+ tasks**
   - **What we know**: Basic single-column indexes exist; composite indexes needed for multi-column filters
   - **What's unclear**: Exact filter combinations users will use most frequently
   - **Recommendation**: Start with indexes on (assigned_department, status, task_type) and monitor usage with django-debug-toolbar; add more as needed based on actual query patterns

3. **Virtual scrolling vs pagination for task lists**
   - **What we know**: Pagination already implemented; virtual scrolling improves UX for large lists
   - **What's unclear**: User preference - some prefer pagination for known position, others prefer infinite scroll
   - **Recommendation**: Support both modes with user preference setting; default to pagination for <100 items, virtual scroll for 100+

4. **Cache invalidation strategy for statistics**
   - **What we know**: Signals can invalidate on save/delete; but bulk updates may bypass signals
   - **What's unclear**: How many bulk operations happen in practice
   - **Recommendation**: Implement signal-based invalidation + manual invalidation in bulk operations; add cache version numbers to detect stale data

5. **Frontend rendering performance measurement**
   - **What we know**: Can use Chrome DevTools Performance tab and Lighthouse
   - **What's unclear**: What "60 FPS" metric means for this specific UI (complex task cards with sub-components)
   - **Recommendation**: Measure actual frame rate during scroll with Chrome DevTools Performance profiler; target <16ms per frame (60 FPS)

## Sources

### Primary (HIGH confidence)
- [Django Official Documentation - Database Access Optimization](https://docs.djangoproject.com/en/4.2/topics/db/optimization/) - ORM query patterns, select_related/prefetch_related
- [Django Official Documentation - Cache Framework](https://docs.djangoproject.com/en/4.2/topics/cache/) - Built-in caching with Redis backend
- [jazzband/django-redis GitHub Repository](https://github.com/jazzband/django-redis) - Official Redis cache backend for Django

### Secondary (MEDIUM confidence)
- [Django + Redis: Optimize Your Web App](https://medium.com/@monilsaraswat/django-redis-optimize-your-web-app-with-caching-and-real-time-features-8a1f0987ec8e) - Sept 2025, practical Redis implementation guide
- [Speed Up Your Django App: Redis Caching](https://dev.to/ajitkumar/speed-up-your-django-app-a-beginners-guide-to-redis-caching-23p7) - Jan 2026, beginner-friendly Redis setup
- [Database Indexing in Django](https://testdriven.io/blog/django-db-indexing/) - Jan 2025, comprehensive index guide
- [Django + PostgreSQL Performance: 100k TPS](https://medium.com/@yogeshkrishnanseeniraj/django-postgresql-performance-indexing-query-plans-and-100k-tps-optimizations-271e16536a45) - Production scaling case study

### Tertiary (LOW confidence)
- [Advanced PostgreSQL Indexing Tips](https://idego-group.com/blog/2022/10/20/advanced-postgresql-indexing-tips-in-django/) - Advanced techniques, older (2022) but still relevant
- [Scaling Django with PostgreSQL Partitioning](https://dev.to/devaaai/scaling-django-with-postgresql-partitioning-a-deep-dive-1pdm) - Oct 2025, beyond scope for Phase 09 but useful reference

### Codebase Analysis (HIGH confidence)
- `/home/chenjiaxing/文档/work_order/backend/workorder/models/core.py` - Existing indexes (lines 183-195, 456-463, 1265-1273)
- `/home/chenjiaxing/文档/work_order/backend/workorder/services/cache_service.py` - Cache infrastructure (281 lines)
- `/home/chenjiaxing/文档/work_order/backend/workorder/services/query_optimizer.py` - Query optimization patterns (465 lines)
- `/home/chenjiaxing/文档/work_order/backend/workorder/views/work_order_tasks/task_main.py` - Optimized queryset example (lines 35-54)
- `/home/chenjiaxing/文档/work_order/backend/workorder/views/work_order_tasks/task_stats.py` - Statistics views needing optimization (N+1 queries at lines 179-246)
- `/home/chenjiaxing/文档/work_order/backend/config/settings.py` - Cache configuration (lines 350-417)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Django 4.2 + Redis + django-redis is industry standard, verified with official docs
- Architecture: HIGH - Existing codebase shows solid optimization patterns, documented in official Django docs
- Pitfalls: HIGH - Common Django performance issues well-documented, verified against codebase analysis

**Research date:** 2026-02-01
**Valid until:** 2026-05-01 (3 months - Django/Redis ecosystem stable)

**Key findings summary:**
1. Codebase already has strong optimization foundation (cache_service.py, query_optimizer.py, basic indexes)
2. Main gaps: missing composite indexes for multi-column filters, uncached statistics endpoints, N+1 queries in collaboration_stats
3. Redis already configured but underutilized (only for channels, not query caching)
4. Frontend needs virtual scrolling for 100+ item lists
5. Build upon existing services rather than creating new infrastructure
