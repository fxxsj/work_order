# 当前施工单逻辑全面分析

**注意**：本文档详细说明了施工单系统的设计理念、数据模型和工作流程。关于最新的问题分析和优化建议，请参考 `WORKORDER_LOGIC_ANALYSIS.md`。

**最后更新时间**：2025-01-28

## 一、核心设计理念

### 1.1 工序优先原则
- **核心理念**：先确定要做什么工序，再确定需要什么版
- **符合实际流程**：业务员接到订单时，首先确定需要哪些工序（印刷、模切、烫金等），然后确定需要哪些版
- **消除信息冗余**：不再需要单独的类型选择字段（`artwork_type`、`die_type` 等）

### 1.2 配置化设计
- **工序配置**：在 `Process` 模型中配置工序与版的关系
- **灵活扩展**：新增工序或版类型时，只需在配置中设置，无需修改代码
- **必选/可选控制**：通过 `*_required` 字段控制版是否必选

---

## 二、数据模型结构

### 2.1 Process 模型（工序）

```python
class Process(models.Model):
    # 基本信息
    name = models.CharField('工序名称', max_length=100)
    code = models.CharField('工序编码', max_length=50, unique=True)
    
    # 工序需要的版（配置化）
    requires_artwork = models.BooleanField('需要图稿', default=False)
    requires_die = models.BooleanField('需要刀模', default=False)
    requires_foiling_plate = models.BooleanField('需要烫金版', default=False)
    requires_embossing_plate = models.BooleanField('需要压凸版', default=False)
    
    # 版是否必选（如果为False，则版可选，未选择时生成设计任务）
    artwork_required = models.BooleanField('图稿必选', default=True)
    die_required = models.BooleanField('刀模必选', default=True)
    foiling_plate_required = models.BooleanField('烫金版必选', default=True)
    embossing_plate_required = models.BooleanField('压凸版必选', default=True)
```

**配置说明**：
- `requires_*`：该工序是否需要该版
- `*_required`：该版是否必选
  - `True`：必选，选择该工序时必须选择对应的版
  - `False`：可选，未选择时将生成设计任务

### 2.2 WorkOrder 模型（施工单）

```python
class WorkOrder(models.Model):
    # 基本信息
    order_number = models.CharField('施工单号', max_length=50, unique=True)
    customer = models.ForeignKey(Customer, ...)
    
    # 版关联（ManyToMany，根据工序选择自动显示和验证）
    artworks = models.ManyToManyField('Artwork', blank=True, ...)
    dies = models.ManyToManyField('Die', blank=True, ...)
    foiling_plates = models.ManyToManyField('FoilingPlate', blank=True, ...)
    embossing_plates = models.ManyToManyField('EmbossingPlate', blank=True, ...)
    
    # 印刷相关（仅在选择了图稿时使用）
    printing_type = models.CharField('印刷形式', ...)
    printing_cmyk_colors = models.JSONField('CMYK颜色', ...)
    printing_other_colors = models.JSONField('其他颜色', ...)
    
    # 产品关联（一个施工单可以包含多个产品）
    products = models.ManyToManyField('Product', through='WorkOrderProduct', ...)
    
    # 工序关联（通过 WorkOrderProcess）
    # 工序不是直接关联，而是通过前端选择后创建 WorkOrderProcess
```

**关键变化**：
- ❌ 移除了 `artwork_type`、`die_type`、`foiling_plate_type`、`embossing_plate_type` 字段
- ✅ 保留了 `artworks`、`dies`、`foiling_plates`、`embossing_plates` ManyToMany 字段
- ✅ 版的选择完全由工序选择驱动

---

## 三、工作流程

### 3.1 创建/编辑施工单流程

```
1. 用户填写基本信息
   ├─ 客户、日期、数量等
   └─ 产品列表

2. 用户选择工序（关键步骤）
   ├─ 勾选需要的工序（印刷、模切、烫金等）
   └─ 系统根据工序配置自动显示对应的版选择项

3. 用户选择版（根据工序要求）
   ├─ 如果工序要求版必选：必须选择版
   ├─ 如果工序要求版可选：可以选择版或留空（留空时生成设计任务）
   └─ 支持多选（如纸卡双面印刷需要面版和底版）

4. 用户填写其他信息
   ├─ 印刷形式、颜色（如果选择了图稿）
   ├─ 物料信息
   └─ 备注

5. 提交验证
   ├─ 前端验证：检查必选的版是否已选择
   ├─ 后端验证：再次检查工序与版的关系
   └─ 创建/更新施工单
```

### 3.2 工序选择与版显示的映射关系

| 工序选择 | 系统响应 |
|---------|---------|
| 勾选"印刷"工序 | 显示"选择图稿"字段，标记为必选 |
| 勾选"模切"工序 | 显示"选择刀模"字段，标记为必选 |
| 勾选"烫金"工序 | 显示"选择烫金版"字段，标记为必选 |
| 勾选"压凸"工序 | 显示"选择压凸版"字段，标记为必选 |
| 勾选"制版"工序 | 显示"选择图稿"和"选择刀模"字段，标记为可选 |
| 勾选"设计"工序 | 显示所有版选择字段，标记为可选 |
| 取消工序选择 | 自动清空对应的版选择（如果不再需要） |

---

## 四、前端逻辑

### 4.1 工序选择监听

```javascript
watch: {
  // 监听工序选择变化，清空不需要的版选择
  selectedProcesses(newVal) {
    // 检查是否有工序需要图稿
    const hasArtworkProcess = newVal.some(processId => {
      const process = this.allProcesses.find(p => p.id === processId)
      return process && process.requires_artwork
    })
    if (!hasArtworkProcess && this.form.artworks && this.form.artworks.length > 0) {
      // 如果没有工序需要图稿，清空图稿选择
      this.form.artworks = []
      this.form.printing_type = 'none'
      this.form.printing_cmyk_colors = []
      this.form.printing_other_colors = []
    }
    
    // 类似地处理刀模、烫金版、压凸版
  }
}
```

### 4.2 动态显示逻辑

```javascript
computed: {
  // 根据工序选择判断是否显示版的选择
  shouldShowArtworkSelect() {
    const selectedProcesses = this.selectedProcesses || []
    return selectedProcesses.some(processId => {
      const process = this.allProcesses.find(p => p.id === processId)
      return process && process.requires_artwork
    })
  },
  
  // 根据工序选择判断版是否必选
  isArtworkRequired() {
    const selectedProcesses = this.selectedProcesses || []
    return selectedProcesses.some(processId => {
      const process = this.allProcesses.find(p => p.id === processId)
      return process && process.requires_artwork && process.artwork_required
    })
  },
  
  // 类似地处理刀模、烫金版、压凸版
}
```

### 4.3 表单验证

```javascript
rules: {
  artworks: [
    {
      validator: (rule, value, callback) => {
        if (this.isArtworkRequired) {
          if (!value || value.length === 0) {
            const processNames = this.getProcessesRequiringArtwork()
              .map(p => p.name).join('、')
            callback(new Error(`选择了需要图稿的工序（${processNames}），请至少选择一个图稿`))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  // 类似地验证刀模、烫金版、压凸版
}
```

### 4.4 数据提交

```javascript
handleSubmit() {
  // 准备提交数据
  const data = {
    // ... 其他字段
    artworks: this.form.artworks || [],
    dies: this.form.dies || [],
    foiling_plates: this.form.foiling_plates || [],
    embossing_plates: this.form.embossing_plates || [],
    processes: this.selectedProcesses || []  // 关键：提交工序ID列表
  }
  
  // 提交到后端
  await workOrderAPI.create(data)
}
```

---

## 五、后端逻辑

### 5.1 序列化器验证

```python
class WorkOrderCreateUpdateSerializer(serializers.ModelSerializer):
    # 接收工序ID列表
    processes = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='选中的工序ID列表，用于验证版的选择'
    )
    
    def validate(self, data):
        """根据工序验证版的选择"""
        process_ids = data.get('processes', [])
        
        if process_ids:
            processes = Process.objects.filter(id__in=process_ids, is_active=True)
            
            # 检查是否有工序需要图稿且要求必选
            processes_requiring_artwork_mandatory = processes.filter(
                requires_artwork=True, 
                artwork_required=True
            )
            if processes_requiring_artwork_mandatory.exists():
                if not artworks or len(artworks) == 0:
                    process_names = ', '.join([p.name for p in processes_requiring_artwork_mandatory])
                    raise serializers.ValidationError({
                        'artworks': f'选择了需要图稿的工序（{process_names}），请至少选择一个图稿'
                    })
            
            # 类似地验证刀模、烫金版、压凸版
        
        return data
```

### 5.2 创建/更新逻辑

```python
def create(self, validated_data):
    """创建施工单并处理多个产品和图稿"""
    products_data = validated_data.pop('products_data', [])
    artworks = validated_data.pop('artworks', [])
    dies = validated_data.pop('dies', [])
    foiling_plates = validated_data.pop('foiling_plates', [])
    embossing_plates = validated_data.pop('embossing_plates', [])
    process_ids = validated_data.pop('processes', [])  # 工序ID列表
    
    work_order = WorkOrder.objects.create(**validated_data)
    
    # 设置版关联（ManyToMany 字段需要在对象创建后设置）
    if artworks:
        work_order.artworks.set(artworks)
    if dies:
        work_order.dies.set(dies)
    if foiling_plates:
        work_order.foiling_plates.set(foiling_plates)
    if embossing_plates:
        work_order.embossing_plates.set(embossing_plates)
    
    # 创建产品关联
    # ...
    
    # 创建工序关联（通过前端选择的工序ID列表）
    # 注意：工序的创建可能在其他地方处理（如 saveSelectedProcesses 方法）
    
    return work_order
```

---

## 六、工序配置示例

### 6.1 已配置的工序

根据迁移文件 `0061_configure_process_plate_relations.py`，以下工序已自动配置：

| 工序名称 | requires_artwork | artwork_required | requires_die | die_required | requires_foiling_plate | foiling_plate_required | requires_embossing_plate | embossing_plate_required |
|---------|-----------------|-----------------|--------------|-------------|----------------------|---------------------|------------------------|------------------------|
| 印刷 | ✅ True | ✅ True | ❌ False | - | ❌ False | - | ❌ False | - |
| 模切 | ❌ False | - | ✅ True | ✅ True | ❌ False | - | ❌ False | - |
| 烫金 | ❌ False | - | ❌ False | - | ✅ True | ✅ True | ❌ False | - |
| 烫银 | ❌ False | - | ❌ False | - | ✅ True | ✅ True | ❌ False | - |
| 压凸 | ❌ False | - | ❌ False | - | ❌ False | - | ✅ True | ✅ True |
| 制版 | ✅ True | ❌ False | ✅ True | ❌ False | ❌ False | - | ❌ False | - |
| 设计 | ✅ True | ❌ False | ✅ True | ❌ False | ✅ True | ❌ False | ✅ True | ❌ False |

**说明**：
- **印刷工序**：需要图稿，图稿必选
- **模切工序**：需要刀模，刀模必选
- **烫金/烫银工序**：需要烫金版，烫金版必选
- **压凸工序**：需要压凸版，压凸版必选
- **制版工序**：可能需要图稿或刀模（可选），因为制版可能用于图稿也可能用于刀模
- **设计工序**：可能需要各种版（可选），因为设计可能生成这些版

### 6.2 配置方式

在 Django Admin 中配置工序：
1. 进入"工序管理"
2. 编辑工序
3. 在"工序与版的关系配置"部分设置：
   - `requires_*`：该工序是否需要该版
   - `*_required`：该版是否必选

---

## 七、验证逻辑总结

### 7.1 前端验证

1. **实时验证**：
   - 工序选择变化时，自动清空不需要的版选择
   - 版选择变化时，实时验证是否满足工序要求

2. **提交前验证**：
   - 检查必选的版是否已选择
   - 显示具体的错误信息（哪些工序需要该版）

### 7.2 后端验证

1. **数据验证**：
   - 根据工序ID列表查询工序配置
   - 检查是否有工序要求版必选
   - 如果必选但未选择，返回详细的错误信息

2. **数据一致性**：
   - 确保版的选择与工序选择一致
   - 如果工序不需要某版，清空该版的选择

---

## 八、优势总结

### 8.1 符合实际工作流程
- ✅ 先确定工序，再确定版
- ✅ 用户直接表达"我要做什么"，而不是"我需要什么版"

### 8.2 消除信息冗余
- ✅ 不再有重复的类型字段
- ✅ 工序选择是唯一数据源

### 8.3 验证逻辑清晰
- ✅ 有工序就必须有对应的版（如果必选）
- ✅ 错误信息明确，指出哪些工序需要该版

### 8.4 扩展性好
- ✅ 通过配置定义工序与版的关系
- ✅ 新增工序或版类型时，只需配置，无需修改代码

### 8.5 灵活性高
- ✅ 支持必选/可选控制
- ✅ 支持一个工序需要多种版
- ✅ 支持多个工序需要同一种版

---

## 九、使用示例

### 9.1 场景1：只需要印刷

**用户操作**：
1. 勾选"印刷"工序
2. 系统自动显示"选择图稿"字段，标记为必选
3. 用户选择图稿
4. 系统显示"印刷形式"和"印刷色数"字段
5. 用户填写印刷相关信息
6. 提交

**数据流程**：
- `selectedProcesses = [印刷工序ID]`
- `artworks = [图稿ID列表]`
- 后端验证：印刷工序需要图稿且图稿必选 → 验证通过

### 9.2 场景2：需要印刷和模切

**用户操作**：
1. 勾选"印刷"和"模切"工序
2. 系统自动显示"选择图稿"和"选择刀模"字段，都标记为必选
3. 用户选择图稿和刀模
4. 用户填写其他信息
5. 提交

**数据流程**：
- `selectedProcesses = [印刷工序ID, 模切工序ID]`
- `artworks = [图稿ID列表]`
- `dies = [刀模ID列表]`
- 后端验证：两个工序都要求版必选 → 验证通过

### 9.3 场景3：需要烫金但版未准备好

**用户操作**：
1. 勾选"烫金"工序
2. 系统自动显示"选择烫金版"字段，标记为必选
3. 用户未选择烫金版（因为版还未设计）
4. 提交时验证失败，提示"选择了需要烫金版的工序（烫金），请至少选择一个烫金版"

**解决方案**：
- 方案1：先创建设计烫金版任务，等版准备好后再创建施工单
- 方案2：如果工序配置允许，可以将 `foiling_plate_required` 设置为 `False`，这样版可选，未选择时将生成设计任务

### 9.4 场景4：制版工序（版可选）

**用户操作**：
1. 勾选"制版"工序
2. 系统自动显示"选择图稿"和"选择刀模"字段，都标记为可选
3. 用户可以选择图稿或刀模，也可以都不选
4. 如果未选择，将生成设计任务

**数据流程**：
- `selectedProcesses = [制版工序ID]`
- `artworks = []` 或 `[图稿ID列表]`（可选）
- `dies = []` 或 `[刀模ID列表]`（可选）
- 后端验证：制版工序的版可选 → 验证通过

---

## 十、与之前逻辑的对比

### 10.1 之前逻辑（版优先）

```
用户选择"需要图稿" 
  ↓
系统自动选中"制版工序"和"印刷工序"
  ↓
用户可以选择具体图稿（可选）
```

**问题**：
- ❌ 信息冗余：版类型选择和工序选择表达同一件事
- ❌ 不符合实际流程：先选版再选工序
- ❌ 扩展性差：每增加一种版，都需要大量代码修改

### 10.2 当前逻辑（工序优先）

```
用户勾选"印刷工序"
  ↓
系统自动显示"选择图稿"字段，标记为必选
  ↓
用户选择具体图稿（必选）
```

**优势**：
- ✅ 符合实际流程：先选工序，再选版
- ✅ 消除冗余：工序是唯一数据源
- ✅ 扩展性好：通过配置定义关系

---

## 十一、待完善的功能

### 11.1 工序自动创建
- 当前：前端选择工序后，需要单独保存工序
- 建议：在创建/更新施工单时，自动创建对应的 `WorkOrderProcess` 记录

### 11.2 设计任务自动生成
- 当前：如果版可选且未选择，理论上应该生成设计任务
- 建议：实现自动生成设计任务的逻辑

### 11.3 工序配置的批量设置
- 当前：需要在 Django Admin 中逐个配置工序
- 建议：提供批量配置功能，或通过数据迁移预设常用工序的配置

### 11.4 工序依赖关系
- 当前：工序之间没有依赖关系
- 建议：可以添加工序依赖关系（如：印刷必须在制版之后）

---

## 十二、总结

当前施工单逻辑采用**工序优先**的设计理念，通过**配置化**的方式定义工序与版的关系，实现了：

1. **符合实际工作流程**：先确定工序，再确定版
2. **消除信息冗余**：不再有重复的类型字段
3. **验证逻辑清晰**：有工序就必须有对应的版（如果必选）
4. **扩展性好**：通过配置定义关系，易于维护
5. **灵活性高**：支持必选/可选控制，支持多种组合

整体设计合理，逻辑清晰，易于维护和扩展。

---

## 十三、最新优化说明（2025-01-28）

### 13.1 前端逻辑优化 ✅

1. **统一自动选择逻辑**：
   - 创建了 `updateAutoSelectedProcesses()` 方法，统一处理所有自动选择逻辑
   - 包括：制版工序、开料工序、包装工序的自动选择

2. **统一版选择清理逻辑**：
   - 创建了 `handleProcessChangeWithPlateCleanup()` 方法
   - 在清空版选择时显示提示信息，说明原因

3. **优化 watcher 逻辑**：
   - 所有版选择变化统一调用 `updateAutoSelectedProcesses()`
   - 减少了重复调用，提高了代码可维护性

### 13.2 后端验证优化 ✅

1. **完善验证逻辑**：
   - 在更新时，如果字段未被发送，会检查数据库中已有的版选择
   - 确保验证逻辑完整，不会遗漏数据不一致的情况

### 13.3 用户体验改进 ✅

1. **提示信息优化**：
   - 在清空版选择时显示提示信息
   - 在制版、开料、包装工序旁显示"（自动选择）"标签
   - 改进提示信息，让用户更清楚地理解规则

### 13.4 性能和代码优化（2025-01-28） ✅

1. **性能优化**：
   - 添加防抖机制（300ms），避免频繁调用自动选择逻辑
   - 所有 watcher 统一使用防抖方法，减少不必要的计算
   - 在组件销毁时清理定时器，避免内存泄漏

2. **代码优化**：
   - 提取公共方法 `hasProcessRequiringPlate()`，减少代码重复
   - 统一所有自动选择逻辑的调用方式
   - 代码更简洁，可维护性提高

更多详细信息，请参考 `WORKORDER_LOGIC_ANALYSIS.md`。

