# 数据库迁移指南

## 迁移说明

由于Django未安装在系统Python环境中，请在项目虚拟环境中执行迁移。

## 步骤

### 1. 激活虚拟环境

```bash
# 如果项目使用虚拟环境
cd /home/chenjiaxing/文档/work_order/backend
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows
```

### 2. 执行迁移

```bash
# 查看待执行的迁移
python manage.py showmigrations workorder

# 执行迁移
python manage.py migrate workorder

# 验证迁移结果
python manage.py showmigrations workorder
```

### 3. 验证新模型

```bash
# 进入Django Shell
python manage.py shell

# 验证模型是否正确导入
from workorder.models import CostCenter, CostItem, ProductionCost
from workorder.models import Invoice, Payment, PaymentPlan, Statement
from workorder.models import ProductStock, StockIn, StockOut
from workorder.models import DeliveryOrder, DeliveryItem, QualityInspection

# 输出成功信息
print("✅ 所有模型导入成功！")
```

### 4. 创建初始数据 (可选)

```python
# 在Django Shell中执行

# 创建成本中心示例
from workorder.models import CostCenter
production = CostCenter.objects.create(
    name='生产车间',
    code='CC001',
    type='production'
)

# 创建成本项目示例
from workorder.models import CostItem
material = CostItem.objects.create(
    name='纸张材料',
    code='CI001',
    type='material',
    allocation_method='direct'
)

print("✅ 初始数据创建成功！")
```

## 迁移文件说明

**文件**: `backend/workorder/migrations/0022_add_finance_and_inventory_models.py`

**新增模型**: 13个

### 财务模型 (7个)
1. CostCenter - 成本中心
2. CostItem - 成本项目
3. ProductionCost - 生产成本
4. Invoice - 发票
5. Payment - 收款记录
6. PaymentPlan - 收款计划
7. Statement - 对账单

### 库存模型 (6个)
1. ProductStock - 成品库存
2. StockIn - 入库单
3. StockOut - 出库单
4. DeliveryOrder - 发货单
5. DeliveryItem - 发货明细
6. QualityInspection - 质量检验

## 注意事项

1. **备份数据库**: 迁移前请备份数据库
2. **测试环境**: 建议先在测试环境验证
3. **依赖检查**: 确保所有依赖包已安装
4. **权限检查**: 确保数据库用户有创建表的权限

## 回滚迁移 (如果需要)

```bash
# 回滚到迁移前
python manage.py migrate workorder 0021
```

## 故障排查

### 问题1: 模块导入错误
```
ModuleNotFoundError: No module named 'workorder.models.inventory'
```
**解决方案**: 确保 `workorder/models/inventory.py` 和 `finance.py` 文件存在

### 问题2: 外键错误
```
django.db.utils.IntegrityError: foreign key constraint failed
```
**解决方案**: 确保关联的表已存在

### 问题3: 字段冲突
```
django.db.utils.ProgrammingError: column already exists
```
**解决方案**: 检查是否有重复的字段定义

---

**文档版本**: v1.0.0
**最后更新**: 2026-01-18
