from django.urls import include, path
from rest_framework.routers import DefaultRouter

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

# 财务/库存/基础等视图集
from .views import (
    ArtworkProductViewSet,
    ArtworkViewSet,
    CostCenterViewSet,
    CostItemViewSet,
    CustomerViewSet,
    DeliveryItemViewSet,
    DeliveryOrderViewSet,
    DepartmentViewSet,
    DieProductViewSet,
    DieViewSet,
    DraftTaskViewSet,
    EmbossingPlateProductViewSet,
    EmbossingPlateViewSet,
    FoilingPlateProductViewSet,
    FoilingPlateViewSet,
    InvoiceViewSet,
    MaterialSupplierViewSet,
    MaterialViewSet,
    PaymentPlanViewSet,
    PaymentViewSet,
    ProcessLogViewSet,
    ProcessViewSet,
    ProductGroupItemViewSet,
    ProductGroupViewSet,
    ProductMaterialViewSet,
    ProductStockViewSet,
    ProductViewSet,
    ProductionCostViewSet,
    PurchaseOrderItemViewSet,
    PurchaseOrderViewSet,
    PurchaseReceiveRecordViewSet,
    QualityInspectionViewSet,
    SalesOrderItemViewSet,
    SalesOrderViewSet,
    StatementViewSet,
    StockInViewSet,
    StockOutViewSet,
    SupplierViewSet,
    TaskAssignmentRuleViewSet,
    WorkOrderMaterialViewSet,
    WorkOrderProcessViewSet,
    WorkOrderProductViewSet,
    WorkOrderTaskViewSet,
    WorkOrderViewSet,
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
router.register(r"customers", CustomerViewSet)
router.register(r"departments", DepartmentViewSet)
router.register(r"processes", ProcessViewSet)
router.register(r"products", ProductViewSet)
router.register(r"product-materials", ProductMaterialViewSet)
router.register(r"materials", MaterialViewSet)
router.register(r"suppliers", SupplierViewSet)
router.register(r"material-suppliers", MaterialSupplierViewSet)
router.register(r"purchase-orders", PurchaseOrderViewSet)
router.register(r"purchase-order-items", PurchaseOrderItemViewSet)
router.register(r"purchase-receive-records", PurchaseReceiveRecordViewSet)
router.register(r"sales-orders", SalesOrderViewSet)
router.register(r"sales-order-items", SalesOrderItemViewSet)
router.register(r"workorders", WorkOrderViewSet)
router.register(r"workorder-processes", WorkOrderProcessViewSet)
router.register(r"workorder-products", WorkOrderProductViewSet)
router.register(r"workorder-materials", WorkOrderMaterialViewSet)
router.register(r"workorder-tasks", WorkOrderTaskViewSet)
router.register(r"draft-tasks", DraftTaskViewSet, basename="draft-task")
router.register(r"product-groups", ProductGroupViewSet)
router.register(r"product-group-items", ProductGroupItemViewSet)
router.register(r"process-logs", ProcessLogViewSet)
router.register(r"task-assignment-rules", TaskAssignmentRuleViewSet)
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"artworks", ArtworkViewSet)
router.register(r"artwork-products", ArtworkProductViewSet)
router.register(r"dies", DieViewSet)
router.register(r"die-products", DieProductViewSet)
router.register(r"foiling-plates", FoilingPlateViewSet)
router.register(r"foiling-plate-products", FoilingPlateProductViewSet)
router.register(r"embossing-plates", EmbossingPlateViewSet)
router.register(r"embossing-plate-products", EmbossingPlateProductViewSet)

# 财务路由
router.register(r"cost-centers", CostCenterViewSet, basename="cost-center")
router.register(r"cost-items", CostItemViewSet, basename="cost-item")
router.register(r"production-costs", ProductionCostViewSet, basename="production-cost")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(r"payment-plans", PaymentPlanViewSet, basename="payment-plan")
router.register(r"statements", StatementViewSet, basename="statement")

# 库存路由
router.register(r"product-stocks", ProductStockViewSet, basename="product-stock")
router.register(r"stock-ins", StockInViewSet, basename="stock-in")
router.register(r"stock-outs", StockOutViewSet, basename="stock-out")
router.register(r"delivery-orders", DeliveryOrderViewSet, basename="delivery-order")
router.register(r"delivery-items", DeliveryItemViewSet, basename="delivery-item")
router.register(
    r"quality-inspections", QualityInspectionViewSet, basename="quality-inspection"
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
    path("", include(router.urls)),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/user/", get_current_user, name="current-user"),
    path("auth/register/", register_view, name="register"),
    path("auth/salespersons/", get_salespersons, name="salespersons"),
    path("auth/users/", get_users_by_department, name="users-by-department"),
    path("auth/change-password/", change_password, name="change-password"),
    path("auth/update-profile/", update_profile, name="update-profile"),
]
