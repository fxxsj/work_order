# 施工单中图稿、刀模、烫金版和压凸版与工序的逻辑分析

## 一、当前实现的逻辑关系

### 1. 制版工序（CTP版）

**触发条件：**
- `artwork_type === 'need_artwork'` （需要图稿）
- 或 `artwork_type === 'no_artwork' && die_type === 'need_die'` （不需要图稿但需要刀模）

**代码位置：**
```javascript
shouldSelectPlateMakingProcess() {
  // 判断是否需要选中制版工序
  // 制版工序（CTP版）与图稿和刀模都有关联
  // 如果需要图稿，就需要制版工序（无论是否已选择图稿，未选择时会生成设计图稿任务）
  // 如果不需要图稿但需要刀模，也可能需要制版工序
  if (this.form.artwork_type === 'need_artwork') {
    return true
  }
  // 如果不需要图稿但需要刀模，也需要制版工序
  if (this.form.artwork_type === 'no_artwork' && this.form.die_type === 'need_die') {
    return true
  }
  return false
}
```

**逻辑说明：**
- 制版工序用于制作CTP版（印刷版）
- 如果需要图稿，无论是否已选择具体图稿，都需要制版工序（未选择图稿时会生成设计图稿任务）
- 如果不需要图稿但需要刀模，也需要制版工序（因为刀模制作也可能需要制版）

**工序识别：**
- 通过工序名称包含"制版"或"设计"来识别

---

### 2. 印刷工序

**触发条件：**
- `artwork_type !== 'no_artwork'` （不是"不需要图稿"）

**代码位置：**
```javascript
shouldSelectPrintingProcess() {
  // 判断是否需要选中印刷工序
  // 如果不需要图稿，则不需要印刷
  return this.form.artwork_type !== 'no_artwork'
}
```

**逻辑说明：**
- 只有需要图稿时，才需要印刷工序
- 如果选择了"不需要图稿"，则不需要印刷工序

**工序识别：**
- 通过工序名称包含"印刷"来识别

---

### 3. 模切工序

**触发条件：**
- `die_type !== 'no_die'` （需要刀模）

**代码位置：**
```javascript
shouldSelectDieCuttingProcess() {
  // 判断是否需要选中模切工序
  // 如果不需要刀模，则不需要模切
  return this.form.die_type !== 'no_die'
}
```

**逻辑说明：**
- 只有需要刀模时，才需要模切工序
- 如果选择了"不需要刀模"，则不需要模切工序

**工序识别：**
- 通过工序名称包含"模切"来识别

---

### 4. 开料工序

**触发条件：**
- 物料列表中有至少一个物料的 `need_cutting === true`

**代码位置：**
```javascript
shouldSelectCuttingProcess() {
  // 判断是否需要选中开料工序
  // 如果所有物料都不需要开料，则不需要开料工序
  if (!this.materialItems || this.materialItems.length === 0) {
    return false
  }
  // 检查是否至少有一个物料需要开料
  return this.materialItems.some(item => item.need_cutting === true)
}
```

**逻辑说明：**
- 根据物料的 `need_cutting` 字段判断
- 如果所有物料都不需要开料，则不需要开料工序

**工序识别：**
- 通过工序名称包含"开料"或"裁切"来识别

---

### 5. 包装工序

**触发条件：**
- 产品列表不为空且至少有一个产品

**代码位置：**
```javascript
shouldSelectPackagingProcess() {
  // 判断是否需要选中包装工序
  // 如果产品列表不为空，则需要包装工序
  return this.productItems && this.productItems.length > 0 && 
         this.productItems.some(item => item.product !== null)
}
```

**逻辑说明：**
- 只要有产品，就需要包装工序

**工序识别：**
- 通过工序名称包含"包装"来识别

---

## 二、当前缺失的逻辑

### 1. 烫金工序 ❌

**应该的触发条件：**
- `foiling_plate_type === 'need_foiling_plate'` （需要烫金版）

**当前状态：**
- ❌ 没有实现自动选择逻辑
- ❌ 没有 `shouldSelectFoilingProcess()` 方法
- ❌ 没有 `foilingProcessId()` 方法
- ❌ 没有 `updateFoilingProcess()` 方法
- ❌ 没有 `isFoilingProcess()` 方法
- ❌ 没有监听 `form.foiling_plate_type` 的变化

**应该的逻辑：**
```javascript
shouldSelectFoilingProcess() {
  // 判断是否需要选中烫金工序
  // 如果不需要烫金版，则不需要烫金工序
  return this.form.foiling_plate_type !== 'no_foiling_plate'
}
```

---

### 2. 压凸工序 ❌

**应该的触发条件：**
- `embossing_plate_type === 'need_embossing_plate'` （需要压凸版）

**当前状态：**
- ❌ 没有实现自动选择逻辑
- ❌ 没有 `shouldSelectEmbossingProcess()` 方法
- ❌ 没有 `embossingProcessId()` 方法
- ❌ 没有 `updateEmbossingProcess()` 方法
- ❌ 没有 `isEmbossingProcess()` 方法
- ❌ 没有监听 `form.embossing_plate_type` 的变化

**应该的逻辑：**
```javascript
shouldSelectEmbossingProcess() {
  // 判断是否需要选中压凸工序
  // 如果不需要压凸版，则不需要压凸工序
  return this.form.embossing_plate_type !== 'no_embossing_plate'
}
```

---

## 三、工序自动更新的机制

### 1. 监听字段变化

当前代码通过 Vue 的 `watch` 监听字段变化，自动更新工序选择：

```javascript
watch: {
  'form.artwork_type'() {
    this.updatePlateMakingProcess()
    this.updatePrintingProcess()
  },
  'form.die_type'() {
    this.updatePlateMakingProcess()
    this.updateDieCuttingProcess()
  },
  // ❌ 缺少对 foiling_plate_type 和 embossing_plate_type 的监听
}
```

### 2. 工序更新方法

每个工序都有对应的更新方法，用于自动选中或取消选中：

```javascript
updatePlateMakingProcess() {
  // 根据 shouldSelectPlateMakingProcess 自动选中/取消选中
  const shouldSelect = this.shouldSelectPlateMakingProcess
  const isSelected = this.selectedProcesses.includes(this.plateMakingProcessId)
  
  if (shouldSelect && !isSelected) {
    this.selectedProcesses.push(this.plateMakingProcessId)
  } else if (!shouldSelect && isSelected) {
    const index = this.selectedProcesses.indexOf(this.plateMakingProcessId)
    if (index > -1) {
      this.selectedProcesses.splice(index, 1)
    }
  }
}
```

### 3. 工序禁用机制

某些工序在表单中被禁用，用户无法手动取消选择：

```javascript
:disabled="isPlateMakingProcess(process) || isPrintingProcess(process) || 
           isDieCuttingProcess(process) || isCuttingProcess(process) || 
           isPackagingProcess(process)"
```

**当前状态：**
- ✅ 制版、印刷、模切、开料、包装工序已禁用
- ❌ 烫金、压凸工序未禁用（如果实现的话）

---

## 四、后端工序创建逻辑

### 1. 自动创建工序

后端在创建施工单时，会根据产品的默认工序自动创建工序：

```python
def _create_work_order_processes(self, work_order):
    """为施工单自动创建工序"""
    # 收集所有产品的默认工序
    processes = set()
    
    # 从 products 关联中获取
    for product_item in work_order.products.all():
        processes.update(product_item.product.default_processes.all())
    
    # 为每个工序创建 WorkOrderProcess
    for process in sorted(processes, key=lambda p: p.sort_order):
        # 查找负责该工序的部门
        departments = Department.objects.filter(processes=process, is_active=True)
        department = departments.first() if departments.exists() else None
        
        WorkOrderProcess.objects.get_or_create(
            work_order=work_order,
            process=process,
            defaults={
                'department': department,
                'sequence': process.sort_order
            }
        )
```

**说明：**
- 后端只根据产品的默认工序创建工序
- 前端选择的工序（制版、印刷、模切等）是通过前端手动选择的，然后通过 `saveSelectedProcesses` 方法保存

### 2. 工序与版的关系

**当前实现：**
- 后端创建工序时，**不直接**根据图稿、刀模、烫金版、压凸版的选择来创建工序
- 这些版的选择主要用于：
  1. 前端自动选择对应的工序（制版、印刷、模切等）
  2. 后续生成任务时，根据工序的任务生成规则和版的选择来生成具体任务

---

## 五、任务生成规则

根据 `Process` 模型的 `task_generation_rule` 字段，工序可以有不同的任务生成规则：

- `artwork`: 按图稿生成任务（每个图稿一个任务，数量为1）
- `die`: 按刀模生成任务（每个刀模一个任务，数量为1）
- `product`: 按产品生成任务（每个产品一个任务）
- `material`: 按物料生成任务（每个物料一个任务）
- `general`: 生成通用任务（一个工序一个任务）

**说明：**
- 如果工序的任务生成规则是 `artwork`，且施工单关联了图稿，则会为每个图稿生成一个任务
- 如果工序的任务生成规则是 `die`，且施工单关联了刀模，则会为每个刀模生成一个任务
- 类似地，如果将来有 `foiling_plate` 和 `embossing_plate` 的任务生成规则，也会为每个版生成任务

---

## 六、总结

### 当前已实现的逻辑

| 版/类型 | 相关工序 | 触发条件 | 状态 |
|---------|---------|---------|------|
| 图稿 | 制版工序 | `artwork_type === 'need_artwork'` | ✅ 已实现 |
| 图稿 | 印刷工序 | `artwork_type !== 'no_artwork'` | ✅ 已实现 |
| 刀模 | 制版工序 | `artwork_type === 'no_artwork' && die_type === 'need_die'` | ✅ 已实现 |
| 刀模 | 模切工序 | `die_type !== 'no_die'` | ✅ 已实现 |
| 物料 | 开料工序 | 物料 `need_cutting === true` | ✅ 已实现 |
| 产品 | 包装工序 | 有产品 | ✅ 已实现 |

### 当前缺失的逻辑

| 版/类型 | 相关工序 | 触发条件 | 状态 |
|---------|---------|---------|------|
| 烫金版 | 烫金工序 | `foiling_plate_type !== 'no_foiling_plate'` | ❌ 未实现 |
| 压凸版 | 压凸工序 | `embossing_plate_type !== 'no_embossing_plate'` | ❌ 未实现 |

### 建议

1. **添加烫金工序的自动选择逻辑**：
   - 添加 `shouldSelectFoilingProcess()` 方法
   - 添加 `foilingProcessId()` 方法
   - 添加 `updateFoilingProcess()` 方法
   - 添加 `isFoilingProcess()` 方法
   - 监听 `form.foiling_plate_type` 的变化
   - 在工序选择中禁用烫金工序

2. **添加压凸工序的自动选择逻辑**：
   - 添加 `shouldSelectEmbossingProcess()` 方法
   - 添加 `embossingProcessId()` 方法
   - 添加 `updateEmbossingProcess()` 方法
   - 添加 `isEmbossingProcess()` 方法
   - 监听 `form.embossing_plate_type` 的变化
   - 在工序选择中禁用压凸工序

3. **工序识别方式**：
   - 烫金工序：通过工序名称包含"烫金"来识别
   - 压凸工序：通过工序名称包含"压凸"来识别

