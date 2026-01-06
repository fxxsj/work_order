# 系统数据初始化分析

本文档分析了当前系统在数据初始化时预设的所有数据。

## 一、数据初始化方式

系统通过以下方式初始化数据：

1. **Django Fixtures 文件** - JSON格式的预设数据文件
2. **数据库迁移文件** - 在迁移过程中自动加载的数据
3. **管理命令** - 用于初始化权限和用户组

## 二、预设数据清单

### 1. 工序类别（ProcessCategory）

**文件位置：** `backend/workorder/fixtures/process_categories.json`  
**迁移文件：** `backend/workorder/migrations/0008_load_categories.py`

预设了 **7个工序类别**：

| ID | 名称 | 编码 | 排序 |
|---|---|---|---|
| 1 | 印前 | prepress | 1 |
| 2 | 印刷 | printing | 2 |
| 3 | 表面处理 | surface | 3 |
| 4 | 后道加工 | postpress | 4 |
| 5 | 复合/裱合 | laminating | 5 |
| 6 | 成型/包装 | forming | 6 |
| 7 | 其他 | other | 99 |

### 2. 工序（Process）

#### 2.1 基础工序数据

**文件位置：** `backend/workorder/fixtures/initial_data.json`

预设了 **8个基础工序**：

| ID | 名称 | 编码 | 描述 | 标准工时(小时) | 排序 |
|---|---|---|---|---|---|
| 1 | 印前制作 | P001 | 设计文件处理、排版、拼版 | 2 | 1 |
| 2 | 出版 | P002 | 制作印刷版 | 1 | 2 |
| 3 | 印刷 | P003 | 上机印刷 | 4 | 3 |
| 4 | 覆膜 | P004 | 覆亮膜或哑膜 | 2 | 4 |
| 5 | 裁切 | P005 | 按要求裁切成品 | 1 | 5 |
| 6 | 装订 | P006 | 骑马订、胶装、精装等 | 3 | 6 |
| 7 | 质检 | P007 | 质量检查 | 1 | 7 |
| 8 | 包装 | P008 | 成品包装 | 1 | 8 |

#### 2.2 详细工序数据（带类别）

**文件位置：** `backend/workorder/fixtures/processes_with_category.json`

预设了 **20个详细工序**，按类别分组：

**印前类别（prepress）：**
- 设计排版（PR001）- 设计文件处理、排版、拼版 - 2小时
- 出版制版（PR002）- 制作印刷版 - 1小时
- 打样（PR003）- 样品打印确认 - 1小时

**印刷类别（printing）：**
- 单色印刷（PT001）- 单色印刷 - 2小时
- 双色印刷（PT002）- 双色印刷 - 3小时
- 四色印刷（PT003）- 四色印刷 - 4小时
- 双面印刷（PT004）- 双面印刷 - 5小时

**表面处理类别（surface）：**
- 覆亮膜（SF001）- 表面覆亮膜 - 2小时
- 覆哑膜（SF002）- 表面覆哑膜 - 2小时
- UV上光（SF003）- UV上光处理 - 1小时
- 过油（SF004）- 过油处理 - 1小时

**后道加工类别（postpress）：**
- 烫金（PO001）- 烫金工艺 - 2小时
- 烫银（PO002）- 烫银工艺 - 2小时
- 模切（PO003）- 模切成型 - 3小时
- 压痕（PO004）- 压痕折叠线 - 1小时
- 打孔（PO005）- 打孔工艺 - 1小时
- 裁切（PO006）- 按要求裁切成品 - 1小时

**复合/裱合类别（laminating）：**
- 覆膜裱合（LM001）- 覆膜裱合 - 2小时
- 裱瓦楞（LM002）- 裱瓦楞纸板 - 2小时

**成型/包装类别（forming）：**
- 骑马订（FM001）- 骑马订装订 - 2小时
- 胶装（FM002）- 无线胶装 - 3小时
- 精装（FM003）- 精装装订 - 4小时
- 糊盒（FM004）- 包装盒糊盒成型 - 2小时
- 质检（FM005）- 质量检查 - 1小时
- 包装（FM006）- 成品包装 - 1小时

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

预设了以下用户组：

1. **管理员（Administrator）**
   - 拥有所有权限

2. **业务员（Salesperson）**
   - 可以创建、查看、编辑施工单
   - 可以管理客户信息
   - 可以查看产品、物料、工序等信息

3. **生产管理员（Production Manager）**
   - 可以管理施工单的所有操作
   - 可以管理工序、任务
   - 可以更新物料状态

4. **操作员（Operator）**
   - 可以查看施工单
   - 可以更新任务状态
   - 可以查看物料信息

**权限分配命令：** `python manage.py assign_permissions <username> <group_name>`

## 三、数据加载方式

### 1. 通过 Fixtures 加载

```bash
# 加载基础工序数据
python manage.py loaddata workorder/fixtures/initial_data.json

# 加载工序类别
python manage.py loaddata workorder/fixtures/process_categories.json

# 加载详细工序数据（带类别）
python manage.py loaddata workorder/fixtures/processes_with_category.json

# 加载示例产品
python manage.py loaddata workorder/fixtures/initial_products.json
```

### 2. 通过迁移自动加载

- **工序类别**：在迁移 `0008_load_categories.py` 中自动加载
- 其他数据需要通过 fixtures 手动加载

### 3. 通过管理命令初始化

```bash
# 初始化用户组和权限
python manage.py init_groups

# 分配用户权限
python manage.py assign_permissions <username> <group_name>
```

## 四、数据初始化建议流程

### 首次部署时：

1. **运行数据库迁移**
   ```bash
   python manage.py migrate
   ```
   - 自动创建数据库表结构
   - 自动加载工序类别（通过迁移）

2. **创建管理员账号**
   ```bash
   python manage.py createsuperuser
   ```

3. **加载基础数据（可选）**
   ```bash
   # 加载基础工序
   python manage.py loaddata workorder/fixtures/initial_data.json
   
   # 或加载详细工序（带类别）
   python manage.py loaddata workorder/fixtures/processes_with_category.json
   
   # 加载示例产品（可选，仅用于演示）
   python manage.py loaddata workorder/fixtures/initial_products.json
   ```

4. **初始化用户组和权限**
   ```bash
   python manage.py init_groups
   ```

5. **分配用户权限**
   ```bash
   python manage.py assign_permissions <username> <group_name>
   ```

## 五、数据说明

### 工序数据说明

- **基础工序数据**（`initial_data.json`）：包含8个通用工序，适合快速开始
- **详细工序数据**（`processes_with_category.json`）：包含20个详细工序，按类别分组，适合完整业务流程

**注意：** 两个文件都包含工序数据，建议只加载其中一个，避免重复。

### 产品数据说明

- 预设的产品数据仅用于演示和测试
- 实际使用时，建议根据实际业务需求创建产品
- 产品数据包含了一些已废弃的字段（如 `paper_type`, `paper_brand` 等），这些字段在后续版本中可能已被移除

## 六、注意事项

1. **数据冲突**：如果数据库中已存在相同ID的数据，加载fixtures可能会失败
2. **字段兼容性**：部分fixtures文件可能包含已废弃的字段，需要根据当前模型结构调整
3. **权限初始化**：用户组和权限需要手动运行管理命令初始化
4. **测试账号**：系统文档中提到有测试账号（admin/admin123），但这不是通过fixtures创建的，需要手动创建

## 七、总结

系统预设了以下类型的数据：

✅ **工序类别**：7个类别（通过迁移自动加载）  
✅ **工序**：8个基础工序 或 20个详细工序（通过fixtures手动加载）  
✅ **产品**：6个示例产品（通过fixtures手动加载，可选）  
✅ **用户组和权限**：4个用户组（通过管理命令初始化）  

这些预设数据可以帮助系统快速启动，但实际使用时建议根据业务需求进行调整和扩展。

