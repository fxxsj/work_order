# 施工单逻辑重构分析：工序优先 vs 版优先

## 一、当前逻辑（版优先）的问题分析

### 1. 当前实现流程

```
用户选择"是否需要图稿" 
  ↓
系统自动选中/取消选中"制版工序"和"印刷工序"
  ↓
用户可以选择具体图稿（可选）
```

### 2. 存在的问题

#### ❌ 问题1：信息冗余和重复
- **重复表达**：用户选择"需要图稿"和系统自动选中"印刷工序"表达的是同一件事
- **冗余字段**：`artwork_type` 字段和 `selectedProcesses` 中的印刷工序是重复的
- **维护成本**：需要同时维护两个地方的逻辑，容易不一致

#### ❌ 问题2：不符合实际工作流程
- **实际流程**：生产部门先确定要做什么工序（印刷、模切、烫金等），然后确定需要什么版
- **当前流程**：先确定需要什么版，再确定工序
- **用户体验**：用户需要先思考"我需要图稿吗？"，而不是"我要做印刷吗？"

#### ❌ 问题3：逻辑混乱
- **制版工序的特殊情况**：
  - 如果选择"需要图稿"，自动选中制版工序 ✅
  - 如果选择"不需要图稿但需要刀模"，也自动选中制版工序 ✅
  - 但制版工序可能还有其他用途，这个逻辑不够清晰

#### ❌ 问题4：扩展性差
- 每增加一种版（烫金版、压凸版），都需要：
  1. 添加类型选择字段（`foiling_plate_type`）
  2. 添加自动选择工序的逻辑
  3. 添加监听和更新方法
- 如果工序很多，这种模式会变得非常复杂

#### ❌ 问题5：验证逻辑复杂
- 当前验证：`artwork_type === 'need_artwork'` 时，图稿可选
- 如果改为工序优先：勾选"印刷工序"时，图稿必选
- 后者更直观，验证逻辑更简单

---

## 二、建议逻辑（工序优先）的优势

### 1. 建议实现流程

```
用户勾选工序（印刷、模切、烫金、压凸等）
  ↓
系统根据工序要求，强制/提示用户选择对应的版
  ↓
用户选择具体版（必选或可选，根据工序要求）
```

### 2. 优势分析

#### ✅ 优势1：符合实际工作流程
- **实际场景**：
  1. 业务员接到订单："这个订单需要印刷和烫金"
  2. 业务员创建施工单，勾选"印刷工序"和"烫金工序"
  3. 系统提示："印刷工序需要图稿，请选择图稿"
  4. 系统提示："烫金工序需要烫金版，请选择烫金版"
- **更直观**：用户直接表达"我要做什么"，而不是"我需要什么版"

#### ✅ 优势2：消除信息冗余
- **单一数据源**：工序选择是唯一的数据源
- **版的选择**：根据工序自动显示和验证
- **减少字段**：可以移除 `artwork_type`、`die_type`、`foiling_plate_type`、`embossing_plate_type` 等字段

#### ✅ 优势3：验证逻辑更清晰
- **当前验证**：`artwork_type === 'need_artwork'` 时，图稿可选
- **建议验证**：`selectedProcesses` 包含印刷工序时，图稿必选
- **更直观**：用户勾选了印刷，就必须有图稿，逻辑清晰

#### ✅ 优势4：扩展性更好
- **新增工序**：只需要在工序配置中定义该工序需要什么版
- **新增版类型**：只需要在工序配置中关联，不需要修改表单逻辑
- **配置化**：可以通过数据库配置工序与版的关系，而不是硬编码

#### ✅ 优势5：灵活性更高
- **可选版**：某些工序可能需要版，但版是可选的（如未选择则生成设计任务）
- **必选版**：某些工序必须要有版才能进行
- **多版支持**：一个工序可能需要多种版（如制版工序可能需要图稿和刀模）

---

## 三、两种逻辑的对比

### 当前逻辑（版优先）

| 步骤 | 用户操作 | 系统响应 |
|------|---------|---------|
| 1 | 选择"需要图稿" | 自动选中"制版工序"和"印刷工序" |
| 2 | 选择具体图稿（可选） | - |
| 3 | 选择"需要刀模" | 自动选中"模切工序" |
| 4 | 选择具体刀模（可选） | - |
| 5 | 勾选其他工序 | - |

**问题**：
- 用户需要先思考"我需要什么版"
- 系统自动选择工序，用户可能不知道为什么会选中这些工序
- 如果用户取消自动选中的工序，系统会再次自动选中（因为版的选择没变）

### 建议逻辑（工序优先）

| 步骤 | 用户操作 | 系统响应 |
|------|---------|---------|
| 1 | 勾选"印刷工序" | 显示"选择图稿"字段，并标记为必选 |
| 2 | 选择具体图稿（必选） | - |
| 3 | 勾选"模切工序" | 显示"选择刀模"字段，并标记为必选 |
| 4 | 选择具体刀模（必选） | - |
| 5 | 勾选"烫金工序" | 显示"选择烫金版"字段，并标记为必选 |
| 6 | 选择具体烫金版（必选） | - |

**优势**：
- 用户直接表达"我要做什么"
- 系统根据工序要求，明确提示需要什么版
- 验证逻辑清晰：有工序就必须有对应的版

---

## 四、工序与版的依赖关系设计

### 1. 工序配置表（建议）

可以在 `Process` 模型中添加字段，定义工序与版的关系：

```python
class Process(models.Model):
    # ... 现有字段 ...
    
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

### 2. 前端验证逻辑

```javascript
// 根据选中的工序，动态显示和验证版的选择
computed: {
  requiredArtworks() {
    // 检查是否有工序需要图稿
    const processesNeedingArtwork = this.selectedProcesses
      .map(id => this.allProcesses.find(p => p.id === id))
      .filter(p => p && p.requires_artwork)
    
    return processesNeedingArtwork.length > 0
  },
  
  artworkRequired() {
    // 检查是否有工序要求图稿必选
    const processesNeedingArtwork = this.selectedProcesses
      .map(id => this.allProcesses.find(p => p.id === id))
      .filter(p => p && p.requires_artwork && p.artwork_required)
    
    return processesNeedingArtwork.length > 0
  }
}
```

### 3. 表单验证规则

```javascript
rules: {
  artworks: [
    {
      validator: (rule, value, callback) => {
        if (this.requiredArtworks && this.artworkRequired) {
          if (!value || value.length === 0) {
            callback(new Error('选择了需要图稿的工序，请至少选择一个图稿'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}
```

---

## 五、实施建议

### 方案A：完全重构（推荐，但工作量大）

**步骤：**
1. 移除 `artwork_type`、`die_type`、`foiling_plate_type`、`embossing_plate_type` 字段
2. 在 `Process` 模型中添加工序与版的关系配置
3. 重构前端表单，工序选择在前，版选择在后
4. 根据工序选择动态显示和验证版的选择
5. 更新后端验证逻辑

**优点：**
- 逻辑清晰，符合实际工作流程
- 扩展性好，易于维护
- 用户体验更好

**缺点：**
- 工作量大，需要大量重构
- 需要数据迁移（现有数据需要处理）
- 可能影响现有功能

### 方案B：渐进式改进（推荐，风险小）

**步骤：**
1. 保留现有逻辑，但添加工序优先的验证
2. 用户勾选工序时，如果该工序需要版，则：
   - 如果版未选择，显示警告或错误
   - 如果版类型选择为"不需要"，自动改为"需要"
3. 逐步引导用户使用工序优先的方式

**优点：**
- 风险小，不影响现有功能
- 可以逐步迁移
- 向后兼容

**缺点：**
- 仍然保留冗余字段
- 逻辑可能仍然有些混乱

### 方案C：混合模式（折中方案）

**步骤：**
1. 保留版类型选择字段，但改为只读显示
2. 根据工序选择自动设置版类型
3. 用户勾选工序时，自动设置对应的版类型为"需要"
4. 用户取消工序时，自动设置对应的版类型为"不需要"
5. 版的选择根据工序要求进行验证

**优点：**
- 保持现有数据结构
- 逻辑更清晰
- 用户体验改善

**缺点：**
- 仍然有冗余字段
- 需要维护两套逻辑

---

## 六、具体实施建议（方案C：混合模式）

### 1. 工序与版的映射关系

```javascript
// 工序与版的映射关系
const PROCESS_PLATE_MAPPING = {
  // 印刷工序需要图稿
  printing: {
    requires: ['artwork'],
    plateTypes: {
      artwork: 'need_artwork'
    }
  },
  // 模切工序需要刀模
  dieCutting: {
    requires: ['die'],
    plateTypes: {
      die: 'need_die'
    }
  },
  // 烫金工序需要烫金版
  foiling: {
    requires: ['foiling_plate'],
    plateTypes: {
      foiling_plate: 'need_foiling_plate'
    }
  },
  // 压凸工序需要压凸版
  embossing: {
    requires: ['embossing_plate'],
    plateTypes: {
      embossing_plate: 'need_embossing_plate'
    }
  },
  // 制版工序可能需要图稿或刀模
  plateMaking: {
    requires: ['artwork', 'die'], // 至少需要一个
    plateTypes: {
      artwork: 'need_artwork',
      die: 'need_die'
    }
  }
}
```

### 2. 工序选择变化时的处理

```javascript
handleProcessChange() {
  // 检查选中的工序
  const selectedProcessIds = this.selectedProcesses
  
  // 根据工序自动设置版类型
  this.updatePlateTypesFromProcesses(selectedProcessIds)
  
  // 验证版的选择
  this.validatePlatesFromProcesses(selectedProcessIds)
}

updatePlateTypesFromProcesses(processIds) {
  // 检查是否有印刷工序
  const hasPrinting = processIds.some(id => {
    const process = this.allProcesses.find(p => p.id === id)
    return process && this.isPrintingProcess(process)
  })
  
  if (hasPrinting) {
    // 如果有印刷工序，自动设置图稿类型为"需要"
    if (this.form.artwork_type === 'no_artwork') {
      this.form.artwork_type = 'need_artwork'
    }
  } else {
    // 如果没有印刷工序，可以设置为"不需要"（但需要检查是否有其他需要图稿的工序）
    // 例如制版工序也可能需要图稿
  }
  
  // 类似地处理其他工序和版的关系
}
```

### 3. 版选择验证

```javascript
validatePlatesFromProcesses(processIds) {
  // 检查是否有印刷工序
  const hasPrinting = processIds.some(id => {
    const process = this.allProcesses.find(p => p.id === id)
    return process && this.isPrintingProcess(process)
  })
  
  if (hasPrinting) {
    // 如果有印刷工序，图稿必选
    if (!this.form.artworks || this.form.artworks.length === 0) {
      this.$message.warning('选择了印刷工序，请至少选择一个图稿')
      // 或者设置为必填验证
    }
  }
  
  // 类似地验证其他版
}
```

---

## 七、总结

### 当前逻辑的问题

1. ❌ **信息冗余**：版类型选择和工序选择表达同一件事
2. ❌ **不符合实际流程**：先选版再选工序，与实际工作流程相反
3. ❌ **扩展性差**：每增加一种版，都需要大量代码修改
4. ❌ **验证复杂**：需要同时维护版类型和工序的验证逻辑

### 建议逻辑的优势

1. ✅ **符合实际流程**：先选工序，再选版
2. ✅ **消除冗余**：工序是唯一数据源
3. ✅ **验证清晰**：有工序就必须有对应的版
4. ✅ **扩展性好**：通过配置定义工序与版的关系

### 推荐方案

**方案C：混合模式**（折中方案）
- 保留现有数据结构，降低风险
- 根据工序选择自动设置版类型
- 根据工序要求验证版的选择
- 逐步引导用户使用工序优先的方式

这样可以：
1. 保持向后兼容
2. 改善用户体验
3. 逻辑更清晰
4. 风险可控

