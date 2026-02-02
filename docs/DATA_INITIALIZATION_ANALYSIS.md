# 系统数据初始化分析

本文档分析了当前系统在数据初始化时预设的所有数据。

**最后更新时间：** 2026-01-07

## 一、数据初始化方式

系统采用**单一数据源**架构，所有预设数据统一存储在 `backend/workorder/data.py` 中：

1. **数据库迁移文件** - 在迁移过程中自动加载系统必需数据（工序、部门、部门-工序关联、用户组）
2. **Fixtures 文件** - JSON格式的测试/示例数据（产品、用户）
3. **管理命令** - 用于加载测试数据或重置数据

### 数据架构说明

```
workorder/data.py (单一数据源)
    ↓
迁移文件自动执行
    ├── 0002: 加载21个预设工序
    ├── 0003: 加载11个预设部门
    ├── 0004: 配置部门-工序关联
    └── 0005: 加载用户组和权限

Fixtures (测试数据，手动加载)
    ├── initial_products.json - 6个示例产品
    └── initial_users.json - 11个测试用户（通过管理命令加载）
```

## 二、预设数据清单

### 1. 部门（Department）

**迁移文件：** `0003_load_departments.py`  
**数据源：** `workorder/data.py` 中的 `PRESET_MANAGEMENT_DEPARTMENTS`、`PRESET_PRODUCTION_DEPARTMENT`、`PRESET_WORKSHOP_DEPARTMENTS`

**部门结构（11个部门）：**

#### 管理部门（5个顶层部门）

| 名称 | 编码 | 排序 | 父部门 |
|------|------|------|--------|
| 业务部 | business | 1 | - |
| 财务部 | finance | 2 | - |
| 设计部 | design | 3 | - |
| 采购部 | purchase | 4 | - |
| 运输部 | logistics | 11 | - |

#### 生产部（1个父部门）

| 名称 | 编码 | 排序 | 父部门 |
|------|------|------|--------|
| 生产部 | production | 5 | - |

#### 生产车间（5个生产部的子部门）

| 名称 | 编码 | 排序 | 父部门 |
|------|------|------|--------|
| 裁切车间 | cutting | 6 | 生产部 |
| 印刷车间 | printing | 7 | 生产部 |
| 外协车间 | outsourcing | 8 | 生产部 |
| 模切车间 | die_cutting | 9 | 生产部 |
| 包装车间 | packaging | 10 | 生产部 |

**特点：**
- 部门支持层级关系（通过 `parent` 字段建立父子关系）
- 生产部下有5个生产车间
- 部门与工序通过多对多关系关联（`Department.processes`）
- 生产部自动关联所有子部门的工序（20个工序）

### 2. 工序（Process）

**迁移文件：** `0002_load_preset_processes.py`  
**数据源：** `workorder/data.py` 中的 `PRESET_PROCESSES`  
**管理命令：** `python manage.py reset_processes`（用于重置工序数据）

**21个预设内置工序：**

| 编码 | 名称 | 描述 | 排序 | 可并行执行 |
|------|------|------|------|------------|
| CTP | 制版 | CTP制版 | 1 | 是 |
| CUT | 开料 | 材料开料 | 2 | 否 |
| PRT | 印刷 | 印刷 | 3 | 否 |
| VAN | 过油 | 过油 | 4 | 否 |
| LAM_G | 覆光膜 | 覆光膜 | 5 | 否 |
| LAM_M | 覆哑膜 | 覆哑膜 | 6 | 否 |
| UV | UV | UV工艺 | 7 | 否 |
| FOIL_G | 烫金 | 烫金 | 8 | 否 |
| FOIL_S | 烫银 | 烫银 | 9 | 否 |
| EMB | 压凸 | 压凸 | 10 | 否 |
| TEX | 压纹 | 压纹 | 11 | 否 |
| SCORE | 压线 | 压线 | 12 | 否 |
| DIE | 模切 | 模切 | 13 | 是 |
| TRIM | 切成品 | 切成品 | 14 | 否 |
| LAM_B | 对裱 | 对裱 | 15 | 否 |
| MOUNT | 裱坑 | 裱坑 | 16 | 否 |
| GLUE | 粘胶 | 粘胶 | 17 | 否 |
| BOX | 粘盒 | 粘盒 | 18 | 否 |
| WINDOW | 粘窗口 | 粘窗口 | 19 | 否 |
| STAPLE | 打钉 | 打钉 | 20 | 否 |
| PACK | 包装 | 包装 | 21 | 否 |

**工序特性：**
- 所有预设工序的 `is_builtin=True`，表示是内置工序，不可删除
- 内置工序的 `code` 字段在 Admin 中为只读，不可编辑
- 每个工序都配置了 `task_generation_rule`（任务生成规则），默认为 `general`
- 部分工序配置了 `is_parallel`（可并行执行）属性
- 所有预设工序的 `standard_duration`（标准工时）默认值为 0，需要根据实际情况手动设置

### 3. 部门-工序关联

**迁移文件：** `0004_configure_department_processes.py`  
**数据源：** `workorder/data.py` 中的 `DEPARTMENT_PROCESS_MAPPING`

**关联关系：**

| 部门编码 | 部门名称 | 关联工序 |
|---------|---------|---------|
| design | 设计部 | CTP（制版） |
| production | 生产部 | 所有20个生产工序 |
| cutting | 裁切车间 | CUT（开料）、SCORE（压线）、TRIM（切成品） |
| printing | 印刷车间 | PRT（印刷）、VAN（过油） |
| outsourcing | 外协车间 | CUT、PRT、VAN、LAM_G、LAM_M、UV、FOIL_G、FOIL_S、EMB、TEX、DIE、LAM_B、MOUNT、BOX、STAPLE |
| die_cutting | 模切车间 | FOIL_G（烫金）、FOIL_S（烫银）、EMB（压凸）、SCORE（压线）、DIE（模切） |
| packaging | 包装车间 | CUT、TEX（压纹）、LAM_B（对裱）、MOUNT（裱坑）、GLUE（粘胶）、BOX（粘盒）、WINDOW（粘窗口）、STAPLE（打钉）、PACK（包装） |

**说明：**
- 生产部关联所有子部门的工序（共20个工序），符合层级关系
- 管理部门（业务部、财务部、采购部、运输部）不关联工序

### 4. 用户组和权限

**迁移文件：** `0005_load_user_groups.py`

**预设用户组：**

**业务员（Salesperson）**
- 可以创建、查看、编辑施工单（`add`, `view`, `change`）
- 可以创建、查看、编辑客户（`add`, `view`, `change`）
- 可以创建、查看、编辑部门（`add`, `view`, `change`）
- 可以创建、查看、编辑工序（`add`, `view`, `change`）
- 可以创建、查看、编辑产品（`add`, `view`, `change`）
- 可以创建、查看、编辑物料（`add`, `view`, `change`）
- 可以创建、查看、编辑图稿（`add`, `view`, `change`）
- 可以创建、查看、编辑刀模（`add`, `view`, `change`）
- 可以创建、查看、编辑产品组（`add`, `view`, `change`）

**权限分配命令：** `python manage.py assign_permissions <username> <group_name>`

**注意：** 
- 系统代码中预留了添加更多角色的接口，但目前只实现了"业务员"组
- 管理员权限需要手动在 Django Admin 中为超级用户分配，或通过创建超级用户的方式获得

### 5. 产品（Product）- 测试数据

**Fixtures 文件：** `backend/workorder/fixtures/initial_products.json`  
**加载方式：** `python manage.py loaddata workorder/fixtures/initial_products.json`

**说明：** 这些是示例/测试数据，不是系统必需的预设数据。

预设了 **6个示例产品**：

| ID | 名称 | 编码 | 规格 | 单位 | 单价 |
|---|---|---|---|---|---|
| 1 | 宣传册 | PR001 | A4 竖版 骑马订 | 本 | ¥15.00 |
| 2 | 名片 | PR002 | 90mm×54mm | 盒 | ¥25.00 |
| 3 | 海报 | PR003 | 420mm×594mm (A2) | 张 | ¥8.00 |
| 4 | 画册 | PR004 | 210mm×285mm 精装 | 本 | ¥45.00 |
| 5 | 包装盒 | PR005 | 自定义尺寸 | 个 | ¥12.00 |
| 6 | 展示牌 | PR006 | 300mm×400mm | 块 | ¥35.00 |

### 6. 用户（User）- 测试数据

**Fixtures 文件：** `backend/workorder/fixtures/initial_users.json`  
**管理命令：** `python manage.py load_initial_users`  
**说明：** 这些是测试数据，不是系统必需的预设数据。

预设了 **11个测试用户**，分别对应11个部门：

| 用户名 | 姓名 | 部门 | 邮箱 |
|--------|------|------|------|
| business_user | 业务员 | 业务部 | business@example.com |
| finance_user | 财务员 | 财务部 | finance@example.com |
| design_user | 设计员 | 设计部 | design@example.com |
| purchase_user | 采购员 | 采购部 | purchase@example.com |
| logistics_user | 运输员 | 运输部 | logistics@example.com |
| production_user | 生产主管 | 生产部 | production@example.com |
| cutting_user | 裁切操作员 | 裁切车间 | cutting@example.com |
| printing_user | 印刷操作员 | 印刷车间 | printing@example.com |
| outsourcing_user | 外协操作员 | 外协车间 | outsourcing@example.com |
| die_cutting_user | 模切操作员 | 模切车间 | die_cutting@example.com |
| packaging_user | 包装操作员 | 包装车间 | packaging@example.com |

**注意：**
- 所有测试用户默认密码为：`123456`
- 用户会自动关联对应的部门
- 生产环境请务必修改默认密码

## 三、数据加载方式

### 1. 自动加载（迁移时执行）

以下数据在运行 `python manage.py migrate` 时自动加载：

- ✅ **工序数据**：21个预设工序（迁移 `0002`）
- ✅ **部门数据**：11个预设部门（迁移 `0003`）
- ✅ **部门-工序关联**：部门与工序的多对多关系（迁移 `0004`）
- ✅ **用户组数据**：业务员组及其权限（迁移 `0005`）

### 2. 手动加载（测试数据）

以下测试数据需要手动加载：

**加载产品数据：**
```bash
python manage.py loaddata workorder/fixtures/initial_products.json
```

**加载用户数据：**
```bash
python manage.py load_initial_users
# 或使用 --force 参数强制覆盖现有用户
python manage.py load_initial_users --force
```

### 3. 数据重置命令

**重置工序数据：**
```bash
# 重置并加载21个内置工序
python manage.py reset_processes

# 强制重置（即使有施工单在使用这些工序）
python manage.py reset_processes --force
```

**reset_processes 命令功能：**
1. 检查是否有施工单在使用工序（如存在且未使用 `--force`，则终止）
2. 清除产品的默认工序关联
3. 删除所有现有工序（如使用 `--force`，同时删除施工单工序记录）
4. 从 `workorder/data.py` 加载21个预设内置工序

## 四、数据初始化建议流程

### 首次部署时：

1. **运行数据库迁移**
   ```bash
   python manage.py migrate
   ```
   - 自动创建数据库表结构
   - 自动加载预设工序（迁移 `0002`）
   - 自动加载预设部门（迁移 `0003`）
   - 自动配置部门-工序关联（迁移 `0004`）
   - 自动加载用户组（迁移 `0005`）

2. **创建管理员账号**
   ```bash
   python manage.py createsuperuser
   ```

3. **（可选）加载测试数据**
   ```bash
   # 加载示例产品
   python manage.py loaddata workorder/fixtures/initial_products.json
   
   # 加载测试用户
   python manage.py load_initial_users
   ```

4. **根据业务需求手动创建**
   - 客户信息
   - 自定义产品
   - 物料信息
   - 其他业务数据

### 重置数据（开发环境）

如果需要重置预设数据：

```bash
# 重置工序数据
python manage.py reset_processes --force

# 重新加载测试用户（会删除现有测试用户）
python manage.py load_initial_users --force
```

**注意：** 部门数据通过迁移文件管理，不能单独重置。如需重置部门数据，需要重置整个数据库并重新运行迁移。

## 五、数据源架构

### 单一数据源设计

所有系统必需的预设数据统一存储在 `backend/workorder/data.py` 中：

```python
# 工序数据
PRESET_PROCESSES = [...]  # 21个标准工序

# 部门数据
PRESET_MANAGEMENT_DEPARTMENTS = [...]  # 5个管理部门
PRESET_PRODUCTION_DEPARTMENT = {...}  # 1个生产部
PRESET_WORKSHOP_DEPARTMENTS = [...]  # 5个生产车间

# 部门-工序映射
DEPARTMENT_PROCESS_MAPPING = {...}  # 部门与工序的关联关系
```

**优势：**
- ✅ 数据一致性：单一数据源，避免冗余
- ✅ 自动加载：迁移时自动执行
- ✅ 版本控制：迁移文件记录数据变更历史
- ✅ 可回滚：支持迁移回滚操作
- ✅ 易于维护：修改数据只需更新一个文件

### 使用此数据源的代码

- `workorder/migrations/0002_load_preset_processes.py`
- `workorder/migrations/0003_load_departments.py`
- `workorder/migrations/0004_configure_department_processes.py`
- `workorder/management/commands/reset_processes.py`

## 六、注意事项

1. **数据冲突**：
   - 迁移文件会自动检查数据是否存在，如果已存在则跳过（通过迁移的幂等性保证）
   - `reset_processes` 命令会删除现有工序，需要谨慎使用

2. **内置工序特性**：
   - 内置工序（`is_builtin=True`）的 `code` 字段在 Admin 中为只读，不可编辑
   - 内置工序不可删除，但可以禁用（`is_active=False`）
   - 系统允许创建自定义工序（`is_builtin=False`），这些工序可以正常编辑和删除

3. **测试数据**：
   - 产品数据和用户数据是测试数据，生产环境可以不加载
   - 所有测试用户默认密码为 `123456`，生产环境请务必修改

4. **工序重置风险**：
   - `reset_processes` 命令会删除所有现有工序和产品默认工序关联
   - 如果使用 `--force` 参数，还会删除施工单工序记录
   - 在生产环境执行前请备份数据库

5. **数据一致性**：
   - 修改预设数据时，只需更新 `workorder/data.py` 文件
   - 迁移文件和管理命令会自动使用更新后的数据
   - 无需修改多个文件，确保数据一致性

## 七、总结

系统预设了以下类型的数据：

✅ **部门**：11个预设部门（5个管理部门 + 1个生产部 + 5个生产车间），支持层级关系（通过迁移 `0003` 自动加载）  
✅ **工序**：21个内置工序（通过迁移 `0002` 自动加载）  
✅ **部门-工序关联**：部门与工序的关联关系（通过迁移 `0004` 自动加载）  
✅ **用户组**：1个用户组"业务员"（通过迁移 `0005` 自动加载）  
⚠️ **产品**：6个示例产品（通过 fixtures 手动加载，可选，仅用于演示）  
⚠️ **用户**：11个测试用户（通过管理命令手动加载，可选，仅用于测试）

**推荐的数据初始化流程：**

1. 运行 `migrate` 自动创建表结构和加载预设数据（工序、部门、用户组）
2. 创建超级用户账号
3. （可选）加载测试数据（产品、用户）
4. 根据业务需求手动创建客户、自定义产品等业务数据

这些预设数据可以帮助系统快速启动，但实际使用时建议根据业务需求进行调整和扩展。特别是产品数据，建议通过系统界面手动创建，以确保数据完整性和准确性。
