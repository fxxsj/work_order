from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .auth_views import (
    LoginView,
    change_password,
    get_current_user,
    get_salespersons,
    get_users_by_department,
    logout_view,
    register_view,
    update_profile,
)
from .views.monitoring import (
    BusinessMetricsViewSet,
    DashboardMonitoringViewSet,
    PerformanceMonitoringViewSet,
)
from .views.multi_level_approval import (
    ApprovalReportViewSet,
    ApprovalStepViewSet,
    ApprovalWorkflowViewSet,
    MultiLevelApprovalViewSet,
    UrgentOrderViewSet,
)
from .views.notification import (
    NotificationTemplateViewSet,
    NotificationViewSet,
    SystemNotificationViewSet,
    UserNotificationSettingsViewSet,
)

router = DefaultRouter()
router.register(r"customers", views.CustomerViewSet)
router.register(r"departments", views.DepartmentViewSet)
router.register(r"processes", views.ProcessViewSet)
router.register(r"products", views.ProductViewSet)
router.register(r"product-materials", views.ProductMaterialViewSet)
router.register(r"materials", views.MaterialViewSet)
router.register(r"suppliers", views.SupplierViewSet)
router.register(r"material-suppliers", views.MaterialSupplierViewSet)
router.register(r"purchase-orders", views.PurchaseOrderViewSet)
router.register(r"purchase-order-items", views.PurchaseOrderItemViewSet)
router.register(r"purchase-receive-records", views.PurchaseReceiveRecordViewSet)
router.register(r"sales-orders", views.SalesOrderViewSet)
router.register(r"sales-order-items", views.SalesOrderItemViewSet)
router.register(r"workorders", views.WorkOrderViewSet)
router.register(r"workorder-processes", views.WorkOrderProcessViewSet)
router.register(r"workorder-products", views.WorkOrderProductViewSet)
router.register(r"workorder-materials", views.WorkOrderMaterialViewSet)
router.register(r"workorder-tasks", views.WorkOrderTaskViewSet)
router.register(r"draft-tasks", views.DraftTaskViewSet, basename="draft-task")
router.register(r"product-groups", views.ProductGroupViewSet)
router.register(r"product-group-items", views.ProductGroupItemViewSet)
router.register(r"process-logs", views.ProcessLogViewSet)
router.register(r"task-assignment-rules", views.TaskAssignmentRuleViewSet)
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"artworks", views.ArtworkViewSet)
router.register(r"artwork-products", views.ArtworkProductViewSet)
router.register(r"dies", views.DieViewSet)
router.register(r"die-products", views.DieProductViewSet)
router.register(r"foiling-plates", views.FoilingPlateViewSet)
router.register(r"foiling-plate-products", views.FoilingPlateProductViewSet)
router.register(r"embossing-plates", views.EmbossingPlateViewSet)
router.register(r"embossing-plate-products", views.EmbossingPlateProductViewSet)

# 财务路由
router.register(r"cost-centers", views.CostCenterViewSet, basename="cost-center")
router.register(r"cost-items", views.CostItemViewSet, basename="cost-item")
router.register(
    r"production-costs", views.ProductionCostViewSet, basename="production-cost"
)
router.register(r"invoices", views.InvoiceViewSet, basename="invoice")
router.register(r"payments", views.PaymentViewSet, basename="payment")
router.register(r"payment-plans", views.PaymentPlanViewSet, basename="payment-plan")
router.register(r"statements", views.StatementViewSet, basename="statement")

# 库存路由
router.register(r"product-stocks", views.ProductStockViewSet, basename="product-stock")
router.register(r"stock-ins", views.StockInViewSet, basename="stock-in")
router.register(r"stock-outs", views.StockOutViewSet, basename="stock-out")
router.register(
    r"delivery-orders", views.DeliveryOrderViewSet, basename="delivery-order"
)
router.register(r"delivery-items", views.DeliveryItemViewSet, basename="delivery-item")
router.register(
    r"quality-inspections",
    views.QualityInspectionViewSet,
    basename="quality-inspection",
)

# 多级审批端点已启用。
# 确保已执行数据库迁移，并可运行 `python manage.py init_multi_level_approval --force`
# 生成默认工作流/规则数据。
router.register(r"approval-workflows", ApprovalWorkflowViewSet)
router.register(r"approval-steps", ApprovalStepViewSet)
router.register(
    r"multi-level-approval", MultiLevelApprovalViewSet, basename="multi-level-approval"
)
router.register(r"urgent-orders", UrgentOrderViewSet, basename="urgent-orders")
router.register(r"approval-reports", ApprovalReportViewSet, basename="approval-reports")
router.register(
    r"system-notifications", SystemNotificationViewSet, basename="system-notifications"
)
router.register(
    r"user-notification-settings",
    UserNotificationSettingsViewSet,
    basename="user-notification-settings",
)
router.register(
    r"notification-templates",
    NotificationTemplateViewSet,
    basename="notification-templates",
)
router.register(
    r"monitoring-performance",
    PerformanceMonitoringViewSet,
    basename="monitoring-performance",
)
router.register(
    r"monitoring-business",
    BusinessMetricsViewSet,
    basename="monitoring-business",
)
router.register(
    r"monitoring-dashboard",
    DashboardMonitoringViewSet,
    basename="monitoring-dashboard",
)

urlpatterns = [
    # Auth endpoints should be defined before router include; otherwise the empty-prefix
    # router include may capture the path and return a DRF 404.
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/user/", get_current_user, name="current-user"),
    path("auth/register/", register_view, name="register"),
    path("auth/salespersons/", get_salespersons, name="salespersons"),
    path("auth/users/", get_users_by_department, name="users-by-department"),
    path("auth/change-password/", change_password, name="change-password"),
    path("auth/update-profile/", update_profile, name="update-profile"),
    path("", include(router.urls)),
]
