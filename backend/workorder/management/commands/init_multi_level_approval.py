from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from workorder.models.core import WorkOrder
from workorder.models.multi_level_approval import (
    ApprovalEscalation,
    ApprovalRule,
    ApprovalStep,
    ApprovalWorkflow,
    MultiLevelApprovalService,
)


class Command(BaseCommand):
    help = "初始化多级审核系统的默认数据"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-existing", action="store_true", help="重置已存在的审核工作流数据"
        )
        parser.add_argument("--force", action="store_true", help="强制执行（跳过确认）")
        parser.add_argument(
            "--username",
            type=str,
            default=None,
            help="以指定用户作为 created_by（默认取第一个 superuser/staff）",
        )

    def handle(self, *args, **options):
        reset_existing = options["reset_existing"]
        force = options["force"]
        username = options["username"]

        self.user = self._resolve_user(username)

        if not force:
            if reset_existing:
                self.stdout.write(
                    "⚠️  这将删除所有现有的多级审核数据并重新创建默认数据。"
                )
            else:
                self.stdout.write(
                    "ℹ️  这将创建/更新默认多级审核数据（不删除现有数据）。"
                )
            response = input("确认继续执行吗？(y/N): ").strip()
            if response.lower() != "y":
                self.stdout.write("操作已取消。")
                return

        self.stdout.write("🚀 开始初始化多级审核系统...")

        with transaction.atomic():
            if reset_existing:
                self._reset_existing_workflows()

            self._create_default_workflows()
            self._create_default_rules()
            self._show_workflows_summary()

        self.stdout.write("✅ 多级审核系统初始化完成")

    def _resolve_user(self, username):
        User = get_user_model()

        if username:
            user = User.objects.filter(username=username, is_active=True).first()
            if not user:
                raise CommandError(f"未找到可用用户: {username}")
            return user

        user = User.objects.filter(is_active=True, is_superuser=True).first()
        if user:
            return user
        user = User.objects.filter(is_active=True, is_staff=True).first()
        if user:
            return user
        raise CommandError(
            "未找到可用的 superuser/staff 用户，请先创建用户或使用 --username 指定。"
        )

    def _reset_existing_workflows(self):
        """重置现有的审核工作流数据"""
        self.stdout.write("🗑️  清理现有审核工作流数据...")

        ApprovalEscalation.objects.all().delete()
        ApprovalStep.objects.all().delete()
        ApprovalWorkflow.objects.all().delete()
        ApprovalRule.objects.all().delete()

        updated_count = WorkOrder.objects.filter(
            multi_level_approval_enabled=True
        ).update(multi_level_approval_enabled=False, current_workflow=None)

        self.stdout.write(f"   - 重置了{updated_count}个施工单的多级审核状态")

    def _create_default_workflows(self):
        """创建默认审核工作流"""
        self.stdout.write("📋 创建默认审核工作流...")

        workflow_types = ["simple", "standard", "complex", "urgent"]
        for workflow_type in workflow_types:
            workflow = MultiLevelApprovalService.create_default_workflow(
                workflow_type, self.user
            )
            self.stdout.write(f"   ✅ upsert 工作流({workflow_type}): {workflow.name}")

        self.stdout.write("   ✅ 默认审核工作流创建完成")

    def _create_default_rules(self):
        """创建默认审核规则"""
        self.stdout.write("📋 创建默认审核规则...")

        rules = [
            {
                "name": "紧急订单 -> urgent 工作流",
                "rule_type": "value_based",
                "workflow_type": "urgent",
                "conditions": {
                    "field": "priority",
                    "operator": "eq",
                    "value": "urgent",
                },
            },
            {
                "name": "金额>=50000 -> complex 工作流",
                "rule_type": "value_based",
                "workflow_type": "complex",
                "conditions": {
                    "field": "total_amount",
                    "operator": "gte",
                    "value": 50000,
                },
            },
            {
                "name": "金额>=10000 -> standard 工作流",
                "rule_type": "value_based",
                "workflow_type": "standard",
                "conditions": {
                    "field": "total_amount",
                    "operator": "gte",
                    "value": 10000,
                },
            },
            {
                "name": "默认 -> simple 工作流",
                "rule_type": "value_based",
                "workflow_type": "simple",
                "conditions": {
                    "field": "total_amount",
                    "operator": "lt",
                    "value": 10000,
                },
            },
        ]

        for rule in rules:
            obj, _ = ApprovalRule.objects.update_or_create(
                name=rule["name"],
                defaults={
                    "rule_type": rule["rule_type"],
                    "workflow_type": rule["workflow_type"],
                    "conditions": rule["conditions"],
                    "is_active": True,
                    "created_by": self.user,
                },
            )
            self.stdout.write(f"   ✅ upsert 规则: {obj.name}")

        self.stdout.write("   ✅ 默认审核规则创建完成")

    def _show_workflows_summary(self):
        """显示工作流摘要"""
        workflows = ApprovalWorkflow.objects.all()
        self.stdout.write("\n📊 审核工作流摘要:")

        for workflow in workflows:
            status = "✅ 激活" if workflow.is_active else "❌ 未激活"
            steps_config = workflow.steps or {}
            if isinstance(steps_config, dict):
                steps = steps_config.get("steps", [])
            else:
                steps = steps_config
            steps_count = len(steps)

            self.stdout.write(f"  {workflow.name} ({workflow.workflow_type})")
            self.stdout.write(f"    状态: {status}")
            self.stdout.write(f"    步骤数量: {steps_count}")

            if steps:
                self.stdout.write("    步骤:")
                for i, step in enumerate(steps, 1):
                    self.stdout.write(f"      {i}. {step.get('step_name', 'N/A')}")
                    self.stdout.write(
                        f"         角色: {step.get('assigned_role', step.get('role_filter', []))}"
                    )

        self.stdout.write("")
