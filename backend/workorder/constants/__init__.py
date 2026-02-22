"""
统一常量模块

此模块提供系统中所有常量的统一访问入口。

使用示例:
    from workorder.constants import WorkOrderStatus, TaskStatus, Priority

    if work_order.status == WorkOrderStatus.PENDING:
        print("施工单待开始")

    task.status = TaskStatus.IN_PROGRESS

    if order.priority == Priority.URGENT:
        print("紧急订单")
"""

# 审核常量
from .approval import DecisionType, RuleType, StepType, WorkflowType
# 权限常量
from .permissions import (CUSTOMER, MATERIAL, PROCESS, PRODUCT, SUPPLIER, TASK,
                          WORKORDER, PermissionAction, PermissionGroups,
                          UserRole)
# 优先级常量
from .priority import Priority, WorkflowPriority
# 状态常量
from .status import (ApprovalEscalationStatus, ApprovalStepStatus,
                     DeliveryOrderStatus, MaterialPurchaseStatus,
                     NotificationStatus, ProcessStatus,
                     QualityInspectionStatus, StockTransactionStatus,
                     TaskStatus, WorkOrderApprovalStatus, WorkOrderStatus)

__all__ = [
    # 状态常量
    "WorkOrderStatus",
    "WorkOrderApprovalStatus",
    "TaskStatus",
    "ProcessStatus",
    "MaterialPurchaseStatus",
    "ApprovalStepStatus",
    "ApprovalEscalationStatus",
    "NotificationStatus",
    "DeliveryOrderStatus",
    "QualityInspectionStatus",
    "StockTransactionStatus",
    # 优先级常量
    "Priority",
    "WorkflowPriority",
    # 审核常量
    "WorkflowType",
    "StepType",
    "DecisionType",
    "RuleType",
    # 权限常量
    "UserRole",
    "PermissionAction",
    "PermissionGroups",
    "WORKORDER",
    "TASK",
    "PROCESS",
    "CUSTOMER",
    "PRODUCT",
    "MATERIAL",
    "SUPPLIER",
]
