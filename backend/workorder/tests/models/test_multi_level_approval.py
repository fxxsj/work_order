"""
多级审批服务测试

覆盖：
- work_order -> workflow_type 的判定
- 启动审核流程时首步分配人（按 role group）
- 完成步骤后分配下一步
"""

import pytest
from django.contrib.auth.models import Group

from workorder.models.multi_level_approval import MultiLevelApprovalService
from workorder.tests.factories import UserFactory, WorkOrderFactory


def _create_group(name: str) -> Group:
    group, _ = Group.objects.get_or_create(name=name)
    return group


def _create_role_user(username: str, role: str):
    user = UserFactory(username=username)
    user.groups.add(_create_group(role))
    return user


@pytest.mark.django_db
class TestMultiLevelApprovalService:
    def test_start_process_assigns_first_step_by_role(self):
        supervisor = _create_role_user("supervisor_user", "supervisor")

        work_order = WorkOrderFactory(
            created_by=supervisor,
            manager=supervisor,
            total_amount=0,
            priority="normal",
        )

        steps = MultiLevelApprovalService.start_approval_process(work_order, supervisor)
        assert len(steps) == 1
        assert steps[0].assigned_to == supervisor

    def test_complete_step_assigns_next_step(self):
        supervisor = _create_role_user("supervisor_user_2", "supervisor")
        manager = _create_role_user("manager_user", "manager")

        work_order = WorkOrderFactory(
            created_by=supervisor,
            manager=supervisor,
            total_amount=10000,
            priority="normal",
        )

        steps = MultiLevelApprovalService.start_approval_process(work_order, supervisor)
        assert len(steps) == 2

        first_step, second_step = steps
        assert first_step.assigned_to == supervisor
        assert second_step.assigned_to is None

        first_step.status = "in_progress"
        first_step.save(update_fields=["status"])

        ok = MultiLevelApprovalService.complete_approval_step(
            first_step, "approve", "", supervisor
        )
        assert ok is True

        second_step.refresh_from_db()
        assert second_step.assigned_to == manager
        assert second_step.status == "pending"

    def test_urgent_priority_uses_urgent_workflow(self):
        urgent_handler = _create_role_user("urgent_handler_user", "urgent_handler")

        work_order = WorkOrderFactory(
            created_by=urgent_handler,
            manager=urgent_handler,
            total_amount=0,
            priority="urgent",
        )

        steps = MultiLevelApprovalService.start_approval_process(
            work_order, urgent_handler
        )
        assert len(steps) == 1
        assert steps[0].assigned_to == urgent_handler
