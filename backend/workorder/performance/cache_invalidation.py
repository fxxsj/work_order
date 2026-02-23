"""
Cache invalidation service using Django signals

Automatically invalidates task statistics cache when tasks change.
"""

import logging

from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from ..models.base import Department, Process
from ..models.core import WorkOrder, WorkOrderTask

logger = logging.getLogger(__name__)

# Cache key patterns
TASK_STATS_KEY_PATTERN = "task_stats:{dept_id}"
DEPT_WORKLOAD_KEY_PATTERN = "dept_workload:{dept_id}"
OPERATOR_STATS_KEY_PATTERN = "operator_stats:{operator_id}"
DASHBOARD_PATTERN = "dashboard:*"

DEPARTMENT_DICT_KEYS = [
    "dict:departments:tree",
    "dict:departments:all:any",
    "dict:departments:all:true",
    "dict:departments:all:false",
]
PROCESS_DICT_KEYS = [
    "dict:processes:all:any",
    "dict:processes:all:true",
    "dict:processes:all:false",
]


@receiver(post_save, sender=WorkOrderTask)
@receiver(post_delete, sender=WorkOrderTask)
def invalidate_task_cache_on_change(sender, instance, **kwargs):
    """
    Invalidate task-related cache when a task is saved or deleted

    Invalidates:
    - Department statistics cache
    - Operator statistics cache (if task has operator)
    - Dashboard cache pattern
    """
    try:
        # Invalidate department stats
        if instance.assigned_department_id:
            dept_key = TASK_STATS_KEY_PATTERN.format(
                dept_id=instance.assigned_department_id
            )
            cache.delete(dept_key)
            logger.debug(f"Invalidated dept stats cache: {dept_key}")

            dept_workload_key = DEPT_WORKLOAD_KEY_PATTERN.format(
                dept_id=instance.assigned_department_id
            )
            cache.delete(dept_workload_key)
            logger.debug(f"Invalidated dept workload cache: {dept_workload_key}")

        # Invalidate operator stats
        if instance.assigned_operator_id:
            operator_key = OPERATOR_STATS_KEY_PATTERN.format(
                operator_id=instance.assigned_operator_id
            )
            cache.delete(operator_key)
            logger.debug(f"Invalidated operator stats cache: {operator_key}")

        # Invalidate dashboard cache (pattern deletion)
        try:
            # For Redis backend
            cache._cache.get_client().delete_pattern(DASHBOARD_PATTERN)
            logger.debug(f"Invalidated dashboard cache pattern: {DASHBOARD_PATTERN}")
        except AttributeError:
            # Fallback for non-Redis backends
            pass

    except Exception as e:
        logger.error(f"Error invalidating cache for task {instance.id}: {e}")


@receiver(post_save, sender=WorkOrder)
@receiver(post_delete, sender=WorkOrder)
def invalidate_dashboard_cache_on_workorder_change(sender, instance, **kwargs):
    """Invalidate dashboard cache when a work order changes."""
    try:
        try:
            cache._cache.get_client().delete_pattern(DASHBOARD_PATTERN)
        except AttributeError:
            cache.delete("dashboard:metrics:v1")
    except Exception as e:
        logger.error(
            f"Error invalidating dashboard cache for work order {instance.id}: {e}"
        )


@receiver(post_save, sender=Department)
@receiver(post_delete, sender=Department)
def invalidate_department_dict_cache(sender, instance, **kwargs):
    """Invalidate department dictionary caches on changes."""
    try:
        cache.delete_many(DEPARTMENT_DICT_KEYS)
    except Exception as e:
        logger.error(f"Error invalidating department dict cache for {instance.id}: {e}")


@receiver(post_save, sender=Process)
@receiver(post_delete, sender=Process)
def invalidate_process_dict_cache(sender, instance, **kwargs):
    """Invalidate process dictionary caches on changes."""
    try:
        cache.delete_many(PROCESS_DICT_KEYS)
    except Exception as e:
        logger.error(f"Error invalidating process dict cache for {instance.id}: {e}")


def invalidate_department_stats(department_id: int) -> None:
    """Manually invalidate department statistics cache"""
    dept_key = TASK_STATS_KEY_PATTERN.format(dept_id=department_id)
    workload_key = DEPT_WORKLOAD_KEY_PATTERN.format(dept_id=department_id)
    cache.delete_many([dept_key, workload_key])
    logger.info(f"Manually invalidated cache for department {department_id}")


def invalidate_operator_stats(operator_id: int) -> None:
    """Manually invalidate operator statistics cache"""
    operator_key = OPERATOR_STATS_KEY_PATTERN.format(operator_id=operator_id)
    cache.delete(operator_key)
    logger.info(f"Manually invalidated cache for operator {operator_id}")
