# 工序数据对比分析

## 一、数据库实际数据

### 当前数据库中的工序（21个）

| ID | 编码 | 名称 | 排序 | 任务生成规则 | 启用状态 |
|---|---|---|---|---|---|
| 57 | CTP | 制版 | 1 | general | ✅ |
| 58 | CUT | 开料 | 2 | general | ✅ |
| 59 | PRT | 印刷 | 3 | general | ✅ |
| 60 | VAN | 过油 | 4 | general | ✅ |
| 61 | LAM_G | 覆光膜 | 5 | general | ✅ |
| 62 | LAM_M | 覆哑膜 | 6 | general | ✅ |
| 63 | UV | UV | 7 | general | ✅ |
| 64 | FOIL_G | 烫金 | 8 | general | ✅ |
| 65 | FOIL_S | 烫银 | 9 | general | ✅ |
| 66 | EMB | 压凸 | 10 | general | ✅ |
| 67 | TEX | 压纹 | 11 | general | ✅ |
| 68 | SCORE | 压线 | 12 | general | ✅ |
| 69 | DIE | 模切 | 13 | general | ✅ |
| 70 | TRIM | 切成品 | 14 | general | ✅ |
| 71 | LAM_B | 对裱 | 15 | general | ✅ |
| 72 | MOUNT | 裱坑 | 16 | general | ✅ |
| 73 | GLUE | 粘胶 | 17 | general | ✅ |
| 74 | BOX | 粘盒 | 18 | general | ✅ |
| 75 | WINDOW | 粘窗口 | 19 | general | ✅ |
| 76 | STAPLE | 打钉 | 20 | general | ✅ |
| 77 | PACK | 包装 | 21 | general | ✅ |

**特点：**
- 使用英文编码（如 CTP, CUT, PRT 等）
- 所有工序的任务生成规则都是 `general`
- 工序ID从57开始（说明之前可能有其他数据被删除）
- 所有工序都是启用状态

## 二、预设 Fixtures 数据

### 2.1 initial_data.json（8个基础工序）

| ID | 编码 | 名称 | 排序 | 描述 |
|---|---|---|---|---|
| 1 | P001 | 印前制作 | 1 | 设计文件处理、排版、拼版 |
| 2 | P002 | 出版 | 2 | 制作印刷版 |
| 3 | P003 | 印刷 | 3 | 上机印刷 |
| 4 | P004 | 覆膜 | 4 | 覆亮膜或哑膜 |
| 5 | P005 | 裁切 | 5 | 按要求裁切成品 |
| 6 | P006 | 装订 | 6 | 骑马订、胶装、精装等 |
| 7 | P007 | 质检 | 7 | 质量检查 |
| 8 | P008 | 包装 | 8 | 成品包装 |

### 2.2 processes_with_category.json（20个详细工序）

**印前类别（prepress）：**
- PR001 - 设计排版
- PR002 - 出版制版
- PR003 - 打样

**印刷类别（printing）：**
- PT001 - 单色印刷
- PT002 - 双色印刷
- PT003 - 四色印刷
- PT004 - 双面印刷

**表面处理类别（surface）：**
- SF001 - 覆亮膜
- SF002 - 覆哑膜
- SF003 - UV上光
- SF004 - 过油

**后道加工类别（postpress）：**
- PO001 - 烫金
- PO002 - 烫银
- PO003 - 模切
- PO004 - 压痕
- PO005 - 打孔
- PO006 - 裁切

**复合/裱合类别（laminating）：**
- LM001 - 覆膜裱合
- LM002 - 裱瓦楞

**成型/包装类别（forming）：**
- FM001 - 骑马订
- FM002 - 胶装
- FM003 - 精装
- FM004 - 糊盒
- FM005 - 质检
- FM006 - 包装

## 三、对比分析

### 3.1 数据一致性

**结论：❌ 数据库中的工序数据与预设的 fixtures 数据完全不一致**

**差异点：**

1. **编码体系不同**
   - 数据库：使用英文编码（CTP, CUT, PRT 等）
   - Fixtures：使用中文编码（P001, PR001, PT001 等）

2. **工序数量不同**
   - 数据库：21个工序
   - Fixtures：8个（initial_data.json）或 20个（processes_with_category.json）

3. **工序名称不同**
   - 数据库：使用简洁的中文名称（制版、开料、印刷等）
   - Fixtures：使用更详细的中文名称（印前制作、出版制版、设计排版等）

4. **任务生成规则**
   - 数据库：所有工序都是 `general`
   - Fixtures：未指定（使用默认值 `general`）

5. **工序ID范围**
   - 数据库：ID从57开始
   - Fixtures：ID从1开始（initial_data.json）或使用特定ID（processes_with_category.json）

### 3.2 功能对应关系

虽然编码和名称不同，但可以从功能上找到一些对应关系：

| 数据库工序 | 可能对应的 Fixtures 工序 |
|---|---|
| CTP - 制版 | PR002 - 出版制版 |
| CUT - 开料 | （无直接对应，可能是新增） |
| PRT - 印刷 | PT003 - 四色印刷 或 P003 - 印刷 |
| VAN - 过油 | SF004 - 过油 |
| LAM_G - 覆光膜 | SF001 - 覆亮膜 |
| LAM_M - 覆哑膜 | SF002 - 覆哑膜 |
| UV - UV | SF003 - UV上光 |
| FOIL_G - 烫金 | PO001 - 烫金 |
| FOIL_S - 烫银 | PO002 - 烫银 |
| DIE - 模切 | PO003 - 模切 |
| TRIM - 切成品 | PO006 - 裁切 或 P005 - 裁切 |
| PACK - 包装 | FM006 - 包装 或 P008 - 包装 |

**数据库独有工序：**
- EMB - 压凸
- TEX - 压纹
- SCORE - 压线
- LAM_B - 对裱
- MOUNT - 裱坑
- GLUE - 粘胶
- BOX - 粘盒
- WINDOW - 粘窗口
- STAPLE - 打钉

## 四、原因分析

### 可能的原因：

1. **手动创建**：数据库中的工序可能是通过 Django Admin 或 API 手动创建的
2. **业务定制**：根据实际业务需求，使用了不同的编码体系和工序名称
3. **数据迁移**：可能从其他系统迁移过来，使用了不同的编码规范
4. **未加载 Fixtures**：系统部署时可能没有加载预设的 fixtures 数据

## 五、建议

### 5.1 如果希望使用预设数据

如果需要使用 fixtures 中的预设数据，可以：

1. **备份当前数据**
   ```bash
   python manage.py dumpdata workorder.Process > current_processes.json
   ```

2. **清空现有工序**（谨慎操作）
   ```python
   # 在 Django shell 中
   from workorder.models import Process
   Process.objects.all().delete()
   ```

3. **加载预设数据**
   ```bash
   # 选择加载其中一个
   python manage.py loaddata workorder/fixtures/initial_data.json
   # 或
   python manage.py loaddata workorder/fixtures/processes_with_category.json
   ```

### 5.2 如果保留当前数据

如果当前数据是业务实际使用的，建议：

1. **更新 Fixtures 文件**：将当前数据库中的工序导出为 fixtures，作为新的预设数据
2. **文档化**：记录当前工序的编码规范和业务含义
3. **统一规范**：确保后续新增工序遵循相同的编码规范

### 5.3 导出当前数据为 Fixtures

```bash
# 导出当前工序数据
python manage.py dumpdata workorder.Process --indent 2 > workorder/fixtures/current_processes.json
```

## 六、总结

- ✅ **数据库有数据**：当前数据库包含21个工序
- ❌ **与预设不一致**：数据库中的工序与 fixtures 文件中的预设数据完全不同
- 📝 **编码体系不同**：数据库使用英文编码，fixtures 使用中文编码
- 🔄 **建议**：根据实际业务需求决定是使用预设数据还是保留当前数据

**当前状态**：数据库中的工序数据是实际业务数据，不是从 fixtures 加载的预设数据。

