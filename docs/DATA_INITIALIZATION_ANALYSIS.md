# 系统数据初始化分析

本文档分析了当前系统在数据初始化时预设的所有数据。

**最后更新时间：** 2025-01-15

**重要变更：** ProcessCategory（工序类别）已在迁移 0020 中被移除，其功能已被 Department（部门）替代。

## 一、数据初始化方式

系统通过以下方式初始化数据：

1. **Django Fixtures 文件** - JSON格式的预设数据文件
2. **数据库迁移文件** - 在迁移过程中自动加载的数据
3. **管理命令** - 用于初始化权限、用户组和工序数据

## 二、预设数据清单

### 1. 部门（Department）

**迁移文件：** 
- `backend/workorder/migrations/0023_reset_departments.py` - 创建预设部门
- `backend/workorder/migrations/0066_add_department_parent.py` - 添加部门层级关系字段
- `backend/workorder/migrations/0067_update_department_hierarchy.py` - 建立部门层级关系

**说明：** 系统在迁移过程中会自动创建预设部门，并建立部门层级关系。这些部门用于组织和管理工序，替代了原有的工序类别（ProcessCategory）功能。

**部门结构（11个部门，6个根部门 + 5个子部门）：**

#### 管理部门（根部门）

| ID | 名称 | 编码 | 排序 | 父部门 |
|---|---|---|---|---|
| 1 | 业务部 | business | 1 | - |
| 2 | 财务部 | finance | 2 | - |
| 3 | 设计部 | design | 3 | - |
| 4 | 采购部 | purchase | 4 | - |
| 5 | 运输部 | logistics | 10 | - |

#### 生产部（父部门）

| ID | 名称 | 编码 | 排序 | 父部门 |
|---|---|---|---|---|
| 6 | 生产部 | production | 5 | - |

#### 生产车间（生产部的子部门）

| ID | 名称 | 编码 | 排序 | 父部门 |
|---|---|---|---|---|
| 7 | 裁切车间 | cutting | 1 | 生产部 |
| 8 | 印刷车间 | printing | 2 | 生产部 |
| 9 | 外协车间 | outsourcing | 3 | 生产部 |
| 10 | 模切车间 | die_cutting | 4 | 生产部 |
| 11 | 包装车间 | packaging | 5 | 生产部 |

**注意：** 
- 部门支持层级关系（通过 `parent` 字段建立父子关系）
- 生产部下有5个生产车间（裁切、印刷、外协、模切、包装）
- 部门与工序通过多对多关系关联（`Department.processes`）
- 原有的工序类别（ProcessCategory）已在迁移 0020 中被移除并迁移到部门

### 2. 工序（Process）

#### 2.1 当前推荐使用的工序数据

**文件位置：** `backend/workorder/fixtures/preset_processes.json`  
**管理命令：** `python manage.py reset_processes`

系统当前推荐使用 **21个内置工序**，这些工序具有以下特点：
- 所有工序的 `is_builtin` 字段为 `True`，表示是内置工序，不可删除
- 内置工序的 `code` 字段在 Admin 中为只读，不可编辑
- 每个工序都配置了 `task_generation_rule`（任务生成规则），默认为 `general`
- 部分工序配置了 `is_parallel`（可并行执行）属性

预设的 **21个内置工序**：

| ID | 名称 | 编码 | 描述 | 排序 | 可并行执行 |
|---|---|---|---|---|---|
| 1 | 制版 | CTP | CTP制版 | 1 | 是 |
| 2 | 开料 | CUT | 材料开料 | 2 | 否 |
| 3 | 印刷 | PRT | 印刷 | 3 | 否 |
| 4 | 过油 | VAN | 过油 | 4 | 否 |
| 5 | 覆光膜 | LAM_G | 覆光膜 | 5 | 否 |
| 6 | 覆哑膜 | LAM_M | 覆哑膜 | 6 | 否 |
| 7 | UV | UV | UV工艺 | 7 | 否 |
| 8 | 烫金 | FOIL_G | 烫金 | 8 | 否 |
| 9 | 烫银 | FOIL_S | 烫银 | 9 | 否 |
| 10 | 压凸 | EMB | 压凸 | 10 | 否 |
| 11 | 压纹 | TEX | 压纹 | 11 | 否 |
| 12 | 压线 | SCORE | 压线 | 12 | 否 |
| 13 | 模切 | DIE | 模切 | 13 | 是 |
| 14 | 切成品 | TRIM | 切成品 | 14 | 否 |
| 15 | 对裱 | LAM_B | 对裱 | 15 | 否 |
| 16 | 裱坑 | MOUNT | 裱坑 | 16 | 否 |
| 17 | 粘胶 | GLUE | 粘胶 | 17 | 否 |
| 18 | 粘盒 | BOX | 粘盒 | 18 | 否 |
| 19 | 粘窗口 | WINDOW | 粘窗口 | 19 | 否 |
| 20 | 打钉 | STAPLE | 打钉 | 20 | 否 |
| 21 | 包装 | PACK | 包装 | 21 | 否 |

**注意：** 所有预设工序的 `standard_duration`（标准工时）默认值为 0，需要根据实际情况手动设置。

#### 2.2 其他可用的工序数据文件（历史遗留）

系统还包含以下历史遗留的工序数据文件，**不建议在生产环境使用**：

1. **initial_data.json** - 包含8个基础工序（无类别字段）
2. **processes_with_category.json** - 包含20个详细工序（使用字符串类别，而非外键关联）
3. **current_processes.json** - 包含21个工序（无 is_builtin 标记）

**建议：** 新部署的系统应使用 `reset_processes` 命令加载预设工序，而不是直接加载这些 fixtures 文件。

### 3. 产品（Product）

**文件位置：** `backend/workorder/fixtures/initial_products.json`

预设了 **6个示例产品**：

| ID | 名称 | 编码 | 规格 | 单位 | 单价 | 描述 |
|---|---|---|---|---|---|---|
| 1 | 宣传册 | PR001 | A4 竖版 骑马订 | 本 | ¥15.00 | 标准宣传册，适用于企业宣传 |
| 2 | 名片 | PR002 | 90mm×54mm | 盒 | ¥25.00 | 标准名片尺寸，100张/盒 |
| 3 | 海报 | PR003 | 420mm×594mm (A2) | 张 | ¥8.00 | 室内海报，适用于展示宣传 |
| 4 | 画册 | PR004 | 210mm×285mm 精装 | 本 | ¥45.00 | 高端画册，封面覆哑膜，内页双面印刷 |
| 5 | 包装盒 | PR005 | 自定义尺寸 | 个 | ¥12.00 | 定制包装盒，可覆膜、烫金 |
| 6 | 展示牌 | PR006 | 300mm×400mm | 块 | ¥35.00 | KT板展示牌，适用于展会、门店 |

**产品详细信息：**
- 每个产品包含：纸张类型、纸张克重、纸张品牌、板厚、印刷方式、表面处理、后道加工等属性

### 4. 用户组和权限

**管理命令：** `backend/workorder/management/commands/init_groups.py`

**运行方式：** `python manage.py init_groups`

**当前实现：** 系统目前只预设了一个用户组：

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
- 如果需要添加其他用户组（如生产管理员、操作员等），需要修改 `init_groups.py` 命令添加相应的权限配置

## 三、数据加载方式

### 1. 通过 Fixtures 加载（传统方式）

```bash
# 加载示例产品（可选，仅用于演示）
python manage.py loaddata workorder/fixtures/initial_products.json

# 注意：不推荐直接加载工序数据，应使用 reset_processes 命令
```

**不推荐使用的 fixtures：**
- `process_categories.json` - 已废弃的工序类别数据（ProcessCategory 已被移除）
- `initial_data.json` - 旧版基础工序数据
- `processes_with_category.json` - 旧版详细工序数据（使用字符串类别）
- `current_processes.json` - 无内置标记的工序数据

**推荐方式：** 使用 `reset_processes` 管理命令加载工序数据（见下方）。

### 2. 通过迁移自动加载

- **部门**：在迁移中自动加载11个预设部门（6个根部门 + 5个生产车间），支持层级关系
- **历史说明**：原有的工序类别（ProcessCategory）在迁移 0020 中已被移除并迁移到部门（Department）
- 其他数据需要通过 fixtures 手动加载

### 3. 通过管理命令初始化（推荐方式）

```bash
# 初始化用户组和权限
python manage.py init_groups

# 分配用户权限
python manage.py assign_permissions <username> <group_name>

# 重置并加载预设工序数据（推荐）
python manage.py reset_processes

# 强制重置工序数据（即使有施工单在使用这些工序）
python manage.py reset_processes --force
```

**reset_processes 命令功能：**
1. 检查是否有施工单在使用工序（如存在且未使用 `--force`，则终止）
2. 清除产品的默认工序关联
3. 删除所有现有工序（如使用 `--force`，同时删除施工单工序记录）
4. 从 `preset_processes.json` 加载21个预设内置工序
5. 加载的工序 `is_builtin=True`，`code` 字段在 Admin 中为只读

## 四、数据初始化建议流程

### 首次部署时：

1. **运行数据库迁移**
   ```bash
   python manage.py migrate
   ```
   - 自动创建数据库表结构
   - 自动加载预设部门（通过迁移 `0023_reset_departments.py`）
   - **注意**：原有的工序类别（ProcessCategory）已在迁移 0020 中被移除，数据已迁移到部门（Department）

2. **创建管理员账号**
   ```bash
   python manage.py createsuperuser
   ```

3. **加载预设工序数据（推荐）**
   ```bash
   # 重置并加载21个内置工序
   python manage.py reset_processes
   ```
   **注意：** 如果数据库中已有工序数据，且这些工序正在被施工单使用，命令会提示并终止。需要使用 `--force` 参数强制执行（会删除相关施工单工序记录）。

4. **加载示例产品（可选，仅用于演示）**
   ```bash
   python manage.py loaddata workorder/fixtures/initial_products.json
   ```
   **注意：** 产品数据包含已废弃的字段（如 `paper_type`, `paper_brand` 等），建议根据实际需求手动创建产品。

5. **初始化用户组和权限**
   ```bash
   python manage.py init_groups
   ```
   这将创建"业务员"用户组并分配相应权限。

6. **分配用户权限**
   ```bash
   python manage.py assign_permissions <username> <group_name>
   ```
   例如：`python manage.py assign_permissions 张三 业务员`

## 五、数据说明

### 工序数据说明

**当前推荐使用的工序数据：**
- **预设工序数据**（`preset_processes.json`）：包含21个内置工序，通过 `reset_processes` 命令加载
- 所有预设工序的 `is_builtin=True`，在系统中不可删除，`code` 字段为只读
- 工序支持配置任务生成规则（`task_generation_rule`）和并行执行（`is_parallel`）等高级特性

**历史遗留数据（不推荐使用）：**
- **基础工序数据**（`initial_data.json`）：包含8个通用工序，无类别字段，缺少新特性
- **详细工序数据**（`processes_with_category.json`）：包含20个详细工序，使用字符串类别而非外键关联
- **当前工序数据**（`current_processes.json`）：包含21个工序，但缺少 `is_builtin` 标记

**注意：** 不同的 fixtures 文件可能包含相同 ID 的工序，混用会导致数据冲突。建议只使用 `reset_processes` 命令加载工序数据。

### 产品数据说明

- 预设的产品数据仅用于演示和测试
- 实际使用时，建议根据实际业务需求创建产品
- 产品数据包含了一些已废弃的字段（如 `paper_type`, `paper_brand`, `board_thickness`, `printing_method`, `surface_treatment`, `post_processing` 等），这些字段在当前模型中可能已被移除或不再使用
- 建议通过系统界面手动创建产品，配置产品的默认工序和默认物料

## 六、注意事项

1. **数据冲突**：如果数据库中已存在相同ID的数据，加载fixtures可能会失败。使用 `reset_processes` 命令可以自动处理冲突（会先删除现有工序）。

2. **字段兼容性**：
   - 产品 fixtures 包含已废弃的字段，可能导致加载失败或字段被忽略
   - 工序 fixtures 中部分文件使用字符串类别而非外键关联，可能导致类别关联失效（已废弃）
   - **ProcessCategory 已移除**：原有的工序类别功能已被部门（Department）替代，相关 fixtures 文件不再使用
   - 建议使用 `reset_processes` 命令加载工序，使用系统界面手动创建产品

3. **权限初始化**：用户组和权限需要手动运行 `init_groups` 命令初始化。目前只创建"业务员"组，如需其他角色需要修改命令代码。

4. **测试账号**：测试账号（如 admin/admin123）需要通过 `createsuperuser` 命令手动创建，不是通过 fixtures 创建的。

5. **工序重置风险**：
   - `reset_processes` 命令会删除所有现有工序和产品默认工序关联
   - 如果使用 `--force` 参数，还会删除施工单工序记录
   - 在生产环境执行前请备份数据库

6. **内置工序特性**：
   - 内置工序（`is_builtin=True`）的 `code` 字段在 Admin 中为只读，不可编辑
   - 内置工序不可删除，但可以禁用（`is_active=False`）
   - 系统允许创建自定义工序（`is_builtin=False`），这些工序可以正常编辑和删除

## 七、总结

系统预设了以下类型的数据：

✅ **部门**：11个预设部门（6个根部门 + 5个生产车间），支持层级关系（通过迁移 `0023_reset_departments.py`、`0066_add_department_parent.py`、`0067_update_department_hierarchy.py` 自动加载）  
✅ **工序**：21个内置工序（通过 `reset_processes` 命令加载，推荐方式）  
✅ **产品**：6个示例产品（通过 fixtures 手动加载，可选，仅用于演示）  
✅ **用户组和权限**：1个用户组"业务员"（通过 `init_groups` 命令初始化）  

**历史变更说明：**
- 原有的工序类别（ProcessCategory）已在迁移 0020 中被移除，其功能已被部门（Department）替代
- 部门支持层级关系（通过 `parent` 字段），生产部下有5个生产车间（裁切、印刷、外协、模切、包装）
- 部门与工序通过多对多关系关联，可以更灵活地组织和管理工序

**推荐的数据初始化流程：**

1. 运行 `migrate` 自动创建表结构和加载预设部门
2. 创建超级用户账号
3. 运行 `reset_processes` 加载21个内置工序
4. 运行 `init_groups` 初始化用户组和权限
5. 根据业务需求手动创建产品、客户等业务数据
6. 在部门管理中配置部门与工序的关联关系

这些预设数据可以帮助系统快速启动，但实际使用时建议根据业务需求进行调整和扩展。特别是产品数据，建议通过系统界面手动创建，以确保数据完整性和准确性。

